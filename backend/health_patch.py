"""Public health endpoint for free-host uptime checks."""


def install(module):
    app = getattr(module, "app", None)
    if app is None:
        return
    if any(getattr(route, "path", None) in {"/api/health", "/health"} for route in app.routes):
        return

    @app.get("/api/health")
    @app.get("/health")
    async def tinta_health():
        return {"ok": True, "service": "tinta", "product": "TINTA"}
