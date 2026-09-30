"""Fix CORS for authenticated browser requests from TINTA frontends."""


def install(module):
    app = getattr(module, "app", None)
    if app is None:
        return

    # The original server used allow_origins=["*"] together with
    # allow_credentials=True. Browsers reject authenticated requests in that
    # configuration, which surfaces to the Expo web client as "Failed to fetch".
    for middleware in getattr(app, "user_middleware", []):
        cls = getattr(middleware, "cls", None)
        if getattr(cls, "__name__", "") != "CORSMiddleware":
            continue
        kwargs = getattr(middleware, "kwargs", {})
        kwargs["allow_credentials"] = True
        kwargs["allow_origins"] = [
            "https://t-1.onrender.com",
            "https://tinta-artist.onrender.com",
            "https://tinta-admin.onrender.com",
            "https://tinta-backend.onrender.com",
            "https://tinta-live.vercel.app",
            "https://tinta-artist-live.vercel.app",
            "https://tinta-admin-live.vercel.app",
            "https://annamabanlag-wq.github.io",
            "http://localhost:8081",
            "http://localhost:19006",
            "http://127.0.0.1:8081",
            "http://127.0.0.1:19006",
        ]
        kwargs["allow_origin_regex"] = (
            r"^https://(?:[A-Za-z0-9-]+\.)?"
            r"(?:tinta(?:-[A-Za-z0-9-]+)*\.(?:onrender\.com|vercel\.app|netlify\.app)|"
            r"annamabanlag-wq\.github\.io)$"
            r"|^http://localhost(?::\d+)?$"
            r"|^http://127\.0\.0\.1(?::\d+)?$"
        )
        kwargs["allow_methods"] = ["*"]
        kwargs["allow_headers"] = ["*"]
        middleware.kwargs = kwargs
        return
