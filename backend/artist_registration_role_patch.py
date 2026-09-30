"""Zero-budget artist onboarding.

Artist accounts may register without mailbox verification while TINTA has no
verified sending domain. They are NOT public/approved artists: the artist
must complete the application and an admin must verify/approve it before the
artist record is published.

Customer registration keeps the existing real email-verification flow.
"""

from email_validator import EmailNotValidError, validate_email
from fastapi import Request
from fastapi.routing import APIRoute, request_response
from fastapi.dependencies.utils import get_dependant
import uuid


def _payload_from_request(request: Request):
    cached = getattr(request.state, "tinta_payload", None)
    if isinstance(cached, dict):
        return cached
    return None


def _normalize_email(raw_email: str) -> str:
    try:
        return validate_email(raw_email, check_deliverability=True).normalized
    except EmailNotValidError:
        try:
            return validate_email(raw_email, check_deliverability=False).normalized
        except EmailNotValidError:
            raise


def install(module):
    for route in list(module.app.routes):
        if not isinstance(route, APIRoute):
            continue
        if route.path != "/api/auth/register" or route.methods != {"POST"}:
            continue
        if getattr(route.endpoint, "_tinta_artist_registration_role", False):
            return

        original_register = route.endpoint

        async def artist_aware_register(request: Request):
            payload = _payload_from_request(request)
            if payload is None:
                try:
                    payload = await request.json()
                except Exception:
                    payload = {}
                request.state.tinta_payload = payload

            role = str(payload.get("role", "customer")).strip().lower()
            if role not in {"customer", "artist"}:
                role = "customer"

            try:
                body = module.RegisterIn(
                    email=payload.get("email", ""),
                    password=payload.get("password", ""),
                    name=payload.get("name", ""),
                )
            except Exception as exc:
                raise module.HTTPException(422, str(getattr(exc, "errors", lambda: exc)() if hasattr(exc, "errors") else exc))

            if role != "artist":
                return await original_register(body)

            try:
                email = _normalize_email(body.email)
            except EmailNotValidError:
                raise module.HTTPException(422, "Please enter a real, reachable email address.")

            if not body.name or not str(body.name).strip():
                raise module.HTTPException(422, "Please enter your artist name.")
            if not body.password or len(str(body.password)) < 6:
                raise module.HTTPException(422, "Password must be at least 6 characters.")

            existing = await module.db.users.find_one({"email": email})
            if existing:
                raise module.HTTPException(409, "Email already registered")

            uid = str(uuid.uuid4())
            name = body.name.strip()
            doc = {
                "id": uid,
                "email": email,
                "name": name,
                "password_hash": module.hash_password(body.password),
                "is_admin": False,
                "role": "artist",
                "artist_portal": True,
                "artist_identity_verified": False,
                "email_verified": False,
                "created_at": module.now_iso(),
            }
            await module.db.users.insert_one(doc)
            module.logger.info("TINTA SIGNUP role=artist user_id=%s email=%s name=%s", uid, email, name)

            from auth_session_patch import _new_session
            _sid, token = await _new_session(module, uid)

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": uid,
                    "email": email,
                    "name": name,
                    "is_admin": False,
                    "role": "artist",
                    "artist_portal": True,
                    "artist_identity_verified": False,
                    "email_verified": False,
                },
            }

        artist_aware_register._tinta_artist_registration_role = True
        route.endpoint = artist_aware_register
        route.dependant = get_dependant(path=route.path_format, call=artist_aware_register)
        route.response_model = None
        route.response_field = None
        route.secure_cloned_response_field = None
        route.app = request_response(route.get_route_handler())
        return
