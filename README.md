# TINTA

TINTA is a tattoo booking and artist-management platform for customers, artists, and studio admins.

## Status

- Product name: **TINTA** (not Emergent)
- Backend API: `https://tinta-backend.onrender.com/api`
- Frontend: Expo / React Native web, served from the same Render image or Vercel
- Latest fix: artist self-registration no longer depends on outbound email verification

## Artist registration

1. Open Sign up with `?role=artist` or use **Are you an artist? Apply here**
2. Create the account with a real email and a password of at least 6 characters
3. Complete the artist application (ID + finished work)
4. Wait for TINTA admin approval before the public profile goes live

Artist accounts are approved by admin review. They are not blocked if TINTA cannot send mail on the free host.

## Free hosting

The live stack is already on free tiers:

- Backend + web app image: [Render](https://render.com) (`tinta-backend`)
- Optional frontend rewrite: [Vercel](https://vercel.com) using `vercel.json`
- Android APK builds: GitHub Actions in `.github/workflows/`

Pushing to `main` rebuilds the Render image via `.github/workflows/build-render-image.yml`.

To rename this GitHub repository from `TINTA-Emergent` to `TINTA`:

1. GitHub → repo Settings → General → Repository name → `TINTA`
2. Update any Render / Vercel repo connection if it does not follow the rename automatically

## Local development

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload --port 8000

cd ../frontend
yarn install
npx expo start --web
```

Set `MONGO_URL`, `JWT_SECRET`, and `EXPO_PUBLIC_BACKEND_URL` before running.

Admin seed (if enabled): `admin@inked.dev` / `admin123`
