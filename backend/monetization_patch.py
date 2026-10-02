"""Adds TINTA's zero-infrastructure booking monetization around the existing launch flow.

New bookings carry a transparent platform coordination fee (default ₱199) while
the artist deposit + any home-service fee remain the artist-facing amount used
for the existing 15% commission split.

This patch intentionally targets the current manual GCash launch. Card/Maya stay
disabled unless separately configured, so no mock or fake payment path is added.
"""
import os
from functools import wraps


def install(module):
    router = getattr(module, "api_router", None)
    db = getattr(module, "db", None)
    app = getattr(module, "app", None)
    fee = max(0, int(os.environ.get("TINTA_BOOKING_FEE", "199")))

    if app is not None:
        async def public_pricing():
            return {
                "currency": "PHP",
                "booking_fee": fee,
                "commission_pct": 15,
                "payments": "GCash manual verification",
                "packages": [
                    {"id": "spotlight_7d", "name": "TINTA SPOTLIGHT · 7 DAYS", "price": 499, "days": 7},
                    {"id": "spotlight_30d", "name": "TINTA SPOTLIGHT · 30 DAYS", "price": 1499, "days": 30},
                    {"id": "studio_pro_30d", "name": "TINTA STUDIO PRO · 30 DAYS", "price": 999, "days": 30},
                ],
                "note": "Customers pay a booking fee plus the artist deposit. Artists keep the session rate minus the 15% platform commission after a verified GCash payment.",
            }

        already = any(getattr(route, "path", None) == "/api/pricing" for route in getattr(app, "routes", []))
        if not already:
            app.add_api_route("/api/pricing", public_pricing, methods=["GET"])

    if router is None or db is None:
        return

    compute_split = getattr(module, "compute_split", None)
    now_iso = getattr(module, "now_iso", None)
    if not compute_split or not now_iso:
        return

    def replace_route(path, method, factory, marker):
        for route in list(getattr(router, "routes", [])):
            if getattr(route, "path", None) != path or method not in getattr(route, "methods", set()):
                continue
            original = getattr(route, "endpoint", None)
            if not original or getattr(original, marker, False):
                continue
            wrapped = factory(original)
            setattr(wrapped, marker, True)
            route.endpoint = wrapped
            try:
                route.dependant.call = wrapped
            except Exception:
                pass
            return

    def booking_factory(original):
        @wraps(original)
        async def wrapped(body, user, _original=original):
            result = await _original(body, user)
            booking_id = getattr(result, "id", None) or (result.get("id") if isinstance(result, dict) else None)
            if booking_id:
                await db.bookings.update_one(
                    {"id": booking_id, "user_id": user["id"]},
                    {"$set": {"platform_fee": fee}},
                )
                if isinstance(result, dict):
                    result["platform_fee"] = fee
            return result
        return wrapped

    replace_route("/bookings", "POST", booking_factory, "_tinta_booking_monetized")

    def gcash_submit_factory(original):
        @wraps(original)
        async def wrapped(body, user, _original=original):
            result = await _original(body, user)
            booking = await db.bookings.find_one(
                {"id": body.booking_id, "user_id": user["id"]},
                {"_id": 0},
            )
            if booking:
                base_total = int(booking.get("deposit", 0)) + int(booking.get("service_fee", 0) or 0)
                booking_fee = int(booking.get("platform_fee", fee) or 0)
                total = base_total + booking_fee
                await db.bookings.update_one(
                    {"id": booking["id"]},
                    {"$set": {"platform_fee": booking_fee, "amount_submitted": total}},
                )
                if isinstance(result, dict):
                    result["amount"] = total
                    result["platform_fee"] = booking_fee
            return result
        return wrapped

    replace_route("/payments/gcash/submit", "POST", gcash_submit_factory, "_tinta_gcash_monetized")

    def gcash_review_factory(original):
        @wraps(original)
        async def wrapped(booking_id, body, _original=original):
            result = await _original(booking_id, body)
            if not isinstance(result, dict) or not result.get("approved"):
                return result

            booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
            if not booking:
                return result

            total = int(booking.get("amount_paid", 0) or booking.get("amount_submitted", 0) or booking.get("deposit", 0))
            booking_fee = int(booking.get("platform_fee", fee) or 0)
            base_total = max(0, total - booking_fee)
            split = compute_split(base_total)
            platform_revenue = split["commission"] + booking_fee

            await db.bookings.update_one(
                {"id": booking_id},
                {"$set": {
                    "amount_paid": total,
                    "platform_fee": booking_fee,
                    "commission_amount": split["commission"],
                    "artist_earnings": split["artist_net"],
                    "platform_revenue": platform_revenue,
                    "commission_pct": split["commission_pct"],
                }},
            )
            await db.earnings_ledger.update_one(
                {"booking_id": booking_id},
                {"$set": {
                    "gross": base_total,
                    "platform_fee": booking_fee,
                    "platform_revenue": platform_revenue,
                    "commission_pct": split["commission_pct"],
                    "commission": split["commission"],
                    "artist_net": split["artist_net"],
                }},
            )
            result["amount"] = total
            result["platform_fee"] = booking_fee
            result["commission"] = split["commission"]
            result["artist_net"] = split["artist_net"]
            result["platform_revenue"] = platform_revenue
            return result
        return wrapped

    replace_route("/admin/gcash-payments/{booking_id}/review", "POST", gcash_review_factory, "_tinta_gcash_review_monetized")

    def admin_stats_factory(original):
        @wraps(original)
        async def wrapped(*args, **kwargs):
            result = await original(*args, **kwargs)
            if not isinstance(result, dict):
                return result
            paid = await db.bookings.aggregate([
                {"$match": {"payment_status": "paid"}},
                {"$group": {"_id": None, "booking_fee_revenue": {"$sum": {"$ifNull": ["$platform_fee", 0]}}}},
            ]).to_list(1)
            booking_fee_revenue = paid[0].get("booking_fee_revenue", 0) if paid else 0
            revenue = result.setdefault("revenue", {})
            booking_commission = revenue.get("booking_commission_earned", revenue.get("commission_earned", 0))
            promotion_revenue = revenue.get("promotion_revenue", 0)
            revenue["booking_fee_revenue"] = booking_fee_revenue
            revenue["commission_earned"] = booking_commission + booking_fee_revenue + promotion_revenue
            revenue["platform_revenue"] = revenue["commission_earned"]
            return result
        return wrapped

    replace_route("/admin/stats", "GET", admin_stats_factory, "_tinta_admin_stats_monetized")
