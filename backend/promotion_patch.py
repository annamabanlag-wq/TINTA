"""TINTA artist promotion / paid visibility workflow.

Artists can purchase a time-limited Spotlight placement using the existing manual
GCash verification flow. Promotions are never activated until an admin approves
the payment proof.
"""

from datetime import datetime, timedelta, timezone
import uuid

from fastapi import Depends, HTTPException
from pydantic import BaseModel, Field


PACKAGES = {
    "spotlight_7d": {
        "id": "spotlight_7d",
        "name": "TINTA SPOTLIGHT · 7 DAYS",
        "price": 499,
        "days": 7,
        "description": "Priority featured placement in the customer Discover feed for 7 days.",
    },
    "spotlight_30d": {
        "id": "spotlight_30d",
        "name": "TINTA SPOTLIGHT · 30 DAYS",
        "price": 1499,
        "days": 30,
        "description": "Priority featured placement in the customer Discover feed for 30 days.",
    },
}


def install(server):
    app, db = server.app, server.db
    current_user = server.current_user
    require_admin = server.require_admin
    now_iso = server.now_iso
    get_object = server.get_object
    public_url = getattr(server, "PUBLIC_URL", "").rstrip("/")

    gcash_name = __import__("os").environ.get("TINTA_GCASH_NAME", "TINTA").strip() or "TINTA"
    gcash_number = __import__("os").environ.get("TINTA_GCASH_NUMBER", "09381447214").strip() or "09381447214"

    class PromotionIn(BaseModel):
        package_id: str = Field(min_length=1, max_length=50)
        gcash_reference: str = Field(min_length=3, max_length=100)
        receipt_path: str = Field(min_length=1, max_length=500)

    class PromotionReviewIn(BaseModel):
        approved: bool
        admin_note: str | None = Field(default=None, max_length=500)

    async def get_artist(user):
        artist = await db.artists.find_one(
            {"artist_user_id": user["id"]},
            {"_id": 0},
        )
        if not artist or artist.get("active") is False:
            raise HTTPException(403, "Artist account is not active")
        return artist

    async def packages(user=Depends(current_user)):
        await get_artist(user)
        return {
            "gcash_name": gcash_name,
            "gcash_number": gcash_number,
            "packages": list(PACKAGES.values()),
        }

    async def create_promotion(body: PromotionIn, user=Depends(current_user)):
        artist = await get_artist(user)
        package = PACKAGES.get(body.package_id)
        if not package:
            raise HTTPException(400, "Invalid promotion package")

        active = await db.artist_promotions.find_one(
            {
                "artist_id": artist["id"],
                "status": "approved",
                "promotion_until": {"$gt": now_iso()},
            },
            {"_id": 0, "id": 1},
        )
        if active:
            raise HTTPException(409, "Your artist profile is already promoted")

        pending = await db.artist_promotions.find_one(
            {
                "artist_id": artist["id"],
                "status": "pending",
            },
            {"_id": 0, "id": 1},
        )
        if pending:
            raise HTTPException(409, "You already have a promotion payment pending review")

        receipt = body.receipt_path.strip()
        meta = await db.uploads.find_one(
            {"path": receipt},
            {"_id": 0, "owner_id": 1, "content_type": 1},
        )
        if not meta or meta.get("owner_id") != user["id"]:
            raise HTTPException(403, "Receipt upload does not belong to your account")
        if not (meta.get("content_type") or "").startswith("image/"):
            raise HTTPException(422, "Promotion receipt must be an image")

        promotion = {
            "id": str(uuid.uuid4()),
            "artist_id": artist["id"],
            "artist_user_id": user["id"],
            "artist_name": artist["name"],
            "artist_handle": artist["handle"],
            "package_id": package["id"],
            "package_name": package["name"],
            "amount": package["price"],
            "days": package["days"],
            "gcash_reference": body.gcash_reference.strip(),
            "receipt_path": receipt,
            "status": "pending",
            "admin_note": None,
            "submitted_at": now_iso(),
            "reviewed_at": None,
            "promotion_started_at": None,
            "promotion_until": None,
        }
        await db.artist_promotions.insert_one(promotion)
        return {
            "submitted": True,
            "promotion_id": promotion["id"],
            "status": "pending",
            "package": package,
            "amount": package["price"],
            "message": "Promotion payment submitted for admin verification.",
        }

    async def my_promotions(user=Depends(current_user)):
        artist = await get_artist(user)
        docs = await db.artist_promotions.find(
            {"artist_id": artist["id"]},
            {"_id": 0},
        ).sort("submitted_at", -1).to_list(50)
        return docs

    async def admin_promotions(_=Depends(require_admin)):
        docs = await db.artist_promotions.find(
            {},
            {"_id": 0},
        ).sort([("status", 1), ("submitted_at", -1)]).to_list(500)

        for doc in docs:
            path = str(doc.get("receipt_path") or "").strip()
            if path and public_url:
                doc["receipt_url"] = f"{public_url}/api/files/{path}"
            elif path:
                doc["receipt_url"] = f"/api/files/{path}"
        return docs

    async def review_promotion(
        promotion_id: str,
        body: PromotionReviewIn,
        _=Depends(require_admin),
    ):
        promotion = await db.artist_promotions.find_one(
            {"id": promotion_id},
            {"_id": 0},
        )
        if not promotion:
            raise HTTPException(404, "Promotion payment not found")

        if promotion.get("status") == "approved":
            return {
                "reviewed": True,
                "approved": True,
                "promotion_id": promotion_id,
                "promotion_until": promotion.get("promotion_until"),
            }

        if not body.approved:
            await db.artist_promotions.update_one(
                {"id": promotion_id},
                {
                    "$set": {
                        "status": "rejected",
                        "admin_note": body.admin_note,
                        "reviewed_at": now_iso(),
                    }
                },
            )
            return {
                "reviewed": True,
                "approved": False,
                "promotion_id": promotion_id,
            }

        package = PACKAGES.get(str(promotion.get("package_id")))
        if not package:
            raise HTTPException(400, "Promotion package is no longer available")

        artist = await db.artists.find_one(
            {"id": promotion["artist_id"]},
            {"_id": 0, "id": 1, "artist_user_id": 1},
        )
        if not artist:
            raise HTTPException(404, "Artist not found")

        now = datetime.now(timezone.utc)
        until = now + timedelta(days=package["days"])
        started = now.isoformat()
        until_iso = until.isoformat()

        await db.artist_promotions.update_one(
            {"id": promotion_id},
            {
                "$set": {
                    "status": "approved",
                    "admin_note": body.admin_note,
                    "reviewed_at": started,
                    "promotion_started_at": started,
                    "promotion_until": until_iso,
                }
            },
        )
        await db.artists.update_one(
            {"id": artist["id"]},
            {
                "$set": {
                    "promotion_until": until_iso,
                    "promotion_package": package["id"],
                    "promotion_status": "active",
                    "updated_at": started,
                }
            },
        )

        return {
            "reviewed": True,
            "approved": True,
            "promotion_id": promotion_id,
            "artist_id": artist["id"],
            "promotion_until": until_iso,
            "message": "Promotion approved and activated.",
        }

    app.add_api_route("/api/artist/promotions/packages", packages, methods=["GET"])
    app.add_api_route("/api/artist/promotions", create_promotion, methods=["POST"])
    app.add_api_route("/api/artist/promotions", my_promotions, methods=["GET"])
    app.add_api_route("/api/admin/promotions", admin_promotions, methods=["GET"])
    app.add_api_route("/api/admin/promotions/{promotion_id}/review", review_promotion, methods=["POST"])
