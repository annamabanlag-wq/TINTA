"""Move the public preview roster onto Philippine cities.

Keeps the same artist IDs so existing bookings and tests still resolve, but the
Discover feed no longer looks like a Berlin/Tokyo demo to a Manila user.
"""

PH_OVERLAY = {
    "Kai Nakamura": {
        "city": "Quezon City, PH",
        "studio": "TINTA Tomas Morato",
        "address": "Tomas Morato Ave, Diliman, Quezon City",
        "lat": 14.6364,
        "lon": 121.0345,
        "bio": "Blackwork and Japanese-inspired pieces in Quezon City. Preview artist on TINTA while local applications are reviewed.",
        "bio_tl": "Blackwork at Japanese-inspired na gawa sa Quezon City. Preview artist ng TINTA habang sinusuri ang mga lokal na aplikasyon.",
    },
    "Diego Ruiz": {
        "city": "Makati, PH",
        "studio": "TINTA Poblacion",
        "address": "Poblacion, Makati City",
        "lat": 14.5654,
        "lon": 121.0292,
        "bio": "Bold color and traditional work in Makati. Preview artist on the public TINTA roster.",
        "bio_tl": "Bold color at traditional na gawa sa Makati. Preview artist sa public roster ng TINTA.",
    },
    "Ash Rowe": {
        "city": "Cebu City, PH",
        "studio": "TINTA Cebu",
        "address": "IT Park / Banilad, Cebu City",
        "lat": 10.3392,
        "lon": 123.9115,
        "bio": "Fine-line and blackwork in Cebu City. Preview artist on TINTA.",
        "bio_tl": "Fine-line at blackwork sa Cebu City. Preview artist ng TINTA.",
    },
    "Nova Blake": {
        "city": "Manila, PH",
        "studio": "TINTA Sampaloc",
        "address": "Sampaloc, Manila",
        "lat": 14.6100,
        "lon": 120.9893,
        "bio": "Neo-traditional and color work in Manila. Preview artist on TINTA.",
        "bio_tl": "Neo-traditional at color work sa Maynila. Preview artist ng TINTA.",
    },
    "Mara Voss": {
        "city": "Pasig, PH",
        "studio": "TINTA Kapitolyo",
        "address": "Kapitolyo, Pasig City",
        "lat": 14.5706,
        "lon": 121.0573,
        "bio": "Delicate fineline work in Pasig. Preview artist on TINTA.",
        "bio_tl": "Pinong fineline na gawa sa Pasig. Preview artist ng TINTA.",
    },
    "Yuki Sato": {
        "city": "San Juan, La Union, PH",
        "studio": "TINTA North",
        "address": "Urbiztondo, San Juan, La Union",
        "lat": 16.6661,
        "lon": 120.3372,
        "bio": "Japanese and realism sessions in La Union. Preview artist on TINTA.",
        "bio_tl": "Japanese at realism sessions sa La Union. Preview artist ng TINTA.",
    },
}


def install(module):
    db = module.db

    async def _apply():
        updated = 0
        for name, fields in PH_OVERLAY.items():
            result = await db.artists.update_many({"name": name}, {"$set": fields})
            updated += result.modified_count
        print(f"TINTA Philippine catalog overlay applied ({updated} artist rows)")

    try:
        loop = getattr(module, "asyncio", None)
        import asyncio

        try:
            running = asyncio.get_running_loop()
        except RuntimeError:
            running = None
        if running and running.is_running():
            running.create_task(_apply())
        else:
            asyncio.get_event_loop().create_task(_apply())
    except Exception as exc:
        print(f"TINTA Philippine catalog overlay deferred: {exc}")
        module.app.add_event_handler("startup", _apply)
