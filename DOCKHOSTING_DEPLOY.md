# TINTA — DockHosting deployment and cutover

This repository contains a full-stack Dockerfile at the repository root. It builds the Expo web app and serves it from the FastAPI backend in one container.

## Deployment target

1. Create a **separate staging project** in DockHosting (for example, `tinta-staging`); do not attach the live TINTA domain or replace any production project.
2. Connect the GitHub repository `annamabanlag-wq/TINTA` and select the `dockhosting-stability` branch. Do **not** select `main` for this first test deployment.
3. Use the repository root as the application root and the root `Dockerfile` as the build file.
4. Configure the application to listen on the platform-provided `PORT`. The Dockerfile already exposes port 8000 and starts Uvicorn on `0.0.0.0:$PORT`.
5. Set the platform health/readiness path to `/api/ready`. This endpoint returns success only after MongoDB answers a ping. `/api/health` remains a lightweight liveness endpoint for existing uptime checks.
6. Use the generated HTTPS DockHosting staging URL only for private testing. Keep the staging project separate from all Vercel production domains.

## Required environment variables

Set these in the **staging project's** DockHosting secret/environment settings, not in GitHub files. For the first test deployment, use isolated staging credentials and a separate staging database/storage namespace:

| Variable | Required | Guidance |
| --- | --- | --- |
| `MONGO_URL` | Yes | Use a dedicated staging MongoDB database/cluster or an isolated, access-restricted copy of production data. Never point staging tests at the live production database. |
| `DB_NAME` | Yes | Use the staging database name, distinct from production. |
| `JWT_SECRET` | Yes | Generate a separate staging secret. Never copy it into GitHub or paste it into chat. |
| `APP_URL` | Recommended | Set to the generated HTTPS DockHosting staging URL so uploaded-file URLs are correct. |
| `EMERGENT_LLM_KEY` | Needed for existing uploads | The current implementation stores portfolios, reference images and GCash receipts in Emergent object storage. Use a staging-safe storage namespace/key if supported. Do not run test uploads against live customer/artist receipts unless the provider supports safe isolated test objects. Confirm old production URLs remain untouched. |
| `INTEGRATION_PROXY_URL` | Optional | Preserve the current value if the existing object-storage integration uses a custom proxy. If unset, the app uses its existing default. |
| `INKED_COMMISSION_PERCENT` | Optional | Defaults to 15. Keep at 15 for the configured launch commission. |
| `INKED_ADMIN_EMAIL` / `INKED_ADMIN_PASSWORD` | Optional | Only use these when intentionally provisioning/promoting the owner admin at startup. Store the password as a secret and use a strong unique value. |

Do not set an empty database URL/name. Also, do not point staging at production just to make the test screens look populated. If historical records need to be checked, restore a recent backup into an isolated staging database and use test accounts there.

## Same-origin frontend/API behavior

For web builds with no `EXPO_PUBLIC_BACKEND_URL`, TINTA now calls relative `/api` endpoints. That is required for the combined root Dockerfile: the web UI and API share the DockHosting origin. Vercel's current `/api` rewrite remains in place for the existing fallback deployment. Native Android builds retain the existing Render API fallback by default. After staging passes, production cutover will be a separate approved step. Only then should the **TINTA Native Android APK** workflow be run from the production-ready branch with its `backend_url` input set to the DockHosting production HTTPS origin (without an `/api` suffix). Do not publish or distribute a DockHosting APK during staging.

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

- [ ] Deploy staging from `dockhosting-stability` into a separate DockHosting staging project.
- [ ] Configure isolated staging secrets, a separate staging database and safe test storage; never use live production credentials for test writes.
- [ ] Restore a backup into staging only if historical-data compatibility needs to be tested.
- [ ] Wait for `/api/ready` to return HTTP 200 and `database: connected`.
- [ ] Verify the customer home screen, artist application, artist login and artist portal.
- [ ] Verify sign-up/login using a new test account.
- [ ] Verify creating a test booking and viewing it in both customer and admin views. Do not create a real payment.
- [ ] Verify image upload and file retrieval, including an artist portfolio image and a test receipt.
- [ ] Verify manual GCash submission/review only with a clearly marked test booking and do not mark a real payment as paid.
- [ ] Confirm the staging database behaves correctly with its restored test copy, including users, artists, bookings and historical GCash submission records.
- [ ] Before production cutover, take and verify a fresh production backup, then separately configure the production database/storage credentials in the DockHosting production project.
- [ ] Only after all checks pass and the production project is separately verified, change public links/DNS and mobile build configuration to the DockHosting URL.
- [ ] Keep Render and Vercel deployments available as rollback until the new deployment has passed real production verification.

## Plan sizing

A free/sleeping service is not suitable for consistently responsive booking and payment flows. Start with an always-on plan that satisfies the app's measured memory needs; upgrade if container restarts or out-of-memory events appear. Monitor actual memory use after the first deployment rather than guessing from build size.
