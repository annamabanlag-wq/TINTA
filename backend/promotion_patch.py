"""Legacy artist promotion endpoints retained as read-only history for the free launch.

TINTA no longer charges artists for Spotlight, Studio Pro, or any other artist
subscription/promotion package. Artist and customer signup remain free.
"""

from fastapi import Depends, HTTPException


def install(server):
    app = server.app
    db = server.db
    current_user = server.current_user
    require_admin = server.require_admin

    async def packages(user=Depends(current_user)):
        artist = await db.artists.find_one(
            {"artist_user_id": user["id"]},
            {"_id": 0, "active": 1},
        )
        if not artist or artist.get("active") is False:
            raise HTTPException(403, "Artist account is not active")
        return {
            "packages": [],
            "message": "Artist promotion is free at launch. TINTA does not charge artists for visibility.",
        }

    async def create_promotion(*args, **kwargs):
        raise HTTPException(
            410,
            "Paid artist promotion is disabled. Artist visibility is free during the TINTA launch.",
        )

    async def my_promotions(user=Depends(current_user)):
        artist = await db.artists.find_one(
            {"artist_user_id": user["id"]},
            {"_id": 0, "id": 1},
        )
        if not artist:
            raise HTTPException(403, "Artist account is not active")
        return await db.artist_promotions.find(
            {"artist_id": artist["id"]},
            {"_id": 0},
        ).sort("submitted_at", -1).to_list(50)

    async def admin_promotions(_=Depends(require_admin)):
        return await db.artist_promotions.find(
            {},
            {"_id": 0},
        ).sort([("status", 1), ("submitted_at", -1)]).to_list(500)

    async def review_promotion(*args, **kwargs):
        raise HTTPException(
            410,
            "Paid artist promotion is disabled in the free-launch model.",
        )

    app.add_api_route("/api/artist/promotions/packages", packages, methods=["GET"])
    app.add_api_route("/api/artist/promotions", create_promotion, methods=["POST"])
    app.add_api_route("/api/artist/promotions", my_promotions, methods=["GET"])
    app.add_api_route("/api/admin/promotions", admin_promotions, methods=["GET"])
    app.add_api_route("/api/admin/promotions/{promotion_id}/review", review_promotion, methods=["POST"])
