# TINTA Cloud Run migration

TINTA already has a production Dockerfile that builds the Expo web app and FastAPI backend into one container. Cloud Run can deploy that container and expose the customer web app and API from one service.

## Target

- Service: `tinta`
- Region: choose a nearby region available to the Google Cloud account
- Minimum instances: 0
- Maximum instances: 2
- Container port: 8000
- Health endpoint: `/api/health`
- Mock payments: disabled

## Important billing note

Cloud Run has an always-free tier, but Google Cloud requires an active billing account for the Free Tier. The free allowance is subject to monthly limits; usage above those limits can be billed.

## Recommended migration sequence

1. Create/select a Google Cloud project.
2. Enable Cloud Run, Cloud Build and Artifact Registry APIs.
3. Connect GitHub repository `annamabanlag-wq/TINTA` to Cloud Run continuous deployment.
4. Deploy the existing `Dockerfile` from `main`.
5. Set the production environment variables currently used by TINTA (database/auth/storage/payment configuration) in Cloud Run. Do not commit secrets to GitHub.
6. Verify `/api/health`, customer registration/login, artist registration, booking and manual GCash submission.
7. Point the customer domain to the new Cloud Run URL only after those checks pass.
8. Keep the existing Render/Vercel deployment available until the Cloud Run service is verified.

## Deployment source

Use Cloud Run's Git repository continuous deployment or source deployment. The existing Dockerfile listens on the Cloud Run `PORT` environment variable.

## Database

Do not migrate the database blindly with the web container. TINTA's existing database/storage credentials should remain the source of truth during the first cutover. Once Cloud Run is verified, database migration can be handled separately if desired.

## Rollback

Keep the existing Vercel/Render services running during validation. If the Cloud Run revision fails health checks or application tests, do not change DNS/domain routing; fix the revision first.
