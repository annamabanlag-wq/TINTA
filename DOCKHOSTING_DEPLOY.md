# TINTA — DockHosting deployment and cutover

This repository contains a full-stack Dockerfile at the repository root. It builds the Expo web app and serves it from the FastAPI backend in one container.

## Deployment target

1. In DockHosting, connect the GitHub repository `annamabanlag-wq/TINTA`.
2. Select the `main` branch after the readiness changes are merged.
3. Use the repository root as the application root and the root `Dockerfile` as the build file.
4. Configure the application to listen on the platform-provided `PORT`. The Dockerfile already exposes port 8000 and starts Uvicorn on `0.0.0.0:$PORT`.
5. Set the platform health/readiness path to `/api/ready`. This endpoint returns success only after MongoDB answers a ping. `/api/health` remains a lightweight liveness endpoint for existing uptime checks.
6. Use the generated HTTPS DockHosting URL as the application URL while testing.

## Required environment variables

Set these in DockHosting's secret/environment settings, not in GitHub files:

| Variable | Required | Guidance |
| --- | --- | --- |
| `MONGO_URL` | Yes | Keep the exact existing production MongoDB connection string. Do not create a fresh database for cutover. |
| `DB_NAME` | Yes | Keep the exact existing production database name. |
| `JWT_SECRET` | Yes | Keep the current production secret so existing signed sessions remain valid. Never commit or paste it into chat. |
| `APP_URL` | Recommended | Set to the final HTTPS DockHosting application URL so uploaded-file URLs are absolute and correct. |
| `EMERGENT_LLM_KEY` | Needed for existing uploads | The current implementation stores portfolios, reference images and GCash receipts in Emergent object storage. Preserve the existing key if that service/key remains active; otherwise migrate the objects before cutover. |
| `INTEGRATION_PROXY_URL` | Optional | Preserve the current value if the existing object-storage integration uses a custom proxy. If unset, the app uses its existing default. |
| `INKED_COMMISSION_PERCENT` | Optional | Defaults to 15. Keep at 15 for the configured launch commission. |
| `INKED_ADMIN_EMAIL` / `INKED_ADMIN_PASSWORD` | Optional | Only use these when intentionally provisioning/promoting the owner admin at startup. Store the password as a secret and use a strong unique value. |

Do not set a new empty `MONGO_URL` or `DB_NAME`; doing so would make the app appear empty and separate it from existing bookings, artists, users and payment-review records.

## Same-origin frontend/API behavior

For web builds with no `EXPO_PUBLIC_BACKEND_URL`, TINTA now calls relative `/api` endpoints. That is required for the combined root Dockerfile: the web UI and API share the DockHosting origin. Vercel's current `/api` rewrite remains in place for the existing fallback deployment. Native Android builds retain the existing Render API fallback by default. Once DockHosting passes the cutover checks, run the **TINTA Native Android APK** workflow manually from `main` and set its `backend_url` input to the DockHosting HTTPS origin (without an `/api` suffix). The value is embedded in the APK. A successful main-branch push or owner-triggered main build can then publish the release APK.

On the single DockHosting URL:
- Customer marketplace: `/`
- Artist application: `/artist/apply`
- Artist portal: `/artist/portal`
- Artist sign-in: `/(auth)/artist-sign-in` (the router resolves this to the artist sign-in screen)
- Admin payments/dashboard: `/admin/payments`

Artist role checks recognize the `/artist/*` route as well as the legacy `tinta-artist` hostname, so the dedicated artist portal does not depend on a separate hostname.

## Object storage and records

The app does not store uploaded image bytes on the container filesystem. It uses an external object-storage API and stores upload metadata in MongoDB. Verify the current storage key/service before switching traffic. Test new artist portfolio uploads and a GCash receipt upload plus admin preview; old stored receipt URLs must continue to resolve. Do not remove the old hosting environment until this passes.

## Safe cutover checklist

- [ ] Back up the existing MongoDB database before cutover.
- [ ] Configure all existing production environment variables on DockHosting without exposing their values.
- [ ] Wait for `/api/ready` to return HTTP 200 and `database: connected`.
- [ ] Verify the customer home screen, artist application, artist login and artist portal.
- [ ] Verify sign-up/login using a new test account.
- [ ] Verify creating a test booking and viewing it in both customer and admin views. Do not create a real payment.
- [ ] Verify image upload and file retrieval, including an artist portfolio image and a test receipt.
- [ ] Verify manual GCash submission/review only with a clearly marked test booking and do not mark a real payment as paid.
- [ ] Confirm existing users, artists, bookings and historical GCash submissions are visible from the same MongoDB database.
- [ ] Only after all checks pass, change public links/DNS and mobile build configuration to the DockHosting URL.
- [ ] Keep Render and Vercel deployments available as rollback until the new deployment has passed real production verification.

## Plan sizing

A free/sleeping service is not suitable for consistently responsive booking and payment flows. Start with an always-on plan that satisfies the app's measured memory needs; upgrade if container restarts or out-of-memory events appear. Monitor actual memory use after the first deployment rather than guessing from build size.
