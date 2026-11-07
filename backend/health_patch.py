"""Separate liveness from readiness so hosts can verify MongoDB before routing traffic."""

import asyncio

from fastapi import HTTPException


def install(module):
    app = getattr(module, "app", None)
    if app is None:
        return

    # Preserve the existing lightweight /api/health endpoint used by uptime pings.
    if not any(getattr(route, "path", None) == "/api/health" for route in app.routes):
        @app.get("/api/health")
        async def tinta_health():
            return {"ok": True, "service": "tinta", "product": "TINTA"}

    # Readiness is deliberately separate: it verifies the same MongoDB connection
    # used by sign-in, bookings, payments and admin operations.
    if any(getattr(route, "path", None) == "/api/ready" for route in app.routes):
        return

    mongo_client = getattr(module, "client", None)

    @app.get("/api/ready", include_in_schema=False)
    async def tinta_ready():
        if mongo_client is None:
            raise HTTPException(status_code=503, detail="Database client unavailable")
        try:
            await asyncio.wait_for(mongo_client.admin.command("ping"), timeout=5)
        except Exception as exc:
            raise HTTPException(status_code=503, detail="Database not ready") from exc
        return {
            "ok": True,
            "service": "tinta",
            "product": "TINTA",
            "database": "connected",
        }
