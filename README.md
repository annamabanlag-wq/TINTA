# TINTA

Tattoo booking and artist-management platform. Product name is **TINTA**.

## Live artist signup check (2026-09-30)

`POST https://tinta-backend.onrender.com/api/auth/register` with `role: "artist"` returns **200**, an access token, and:

```json
{
  "role": "artist",
  "artist_portal": true,
  "artist_identity_verified": false
}
```

`GET /api/auth/me` keeps those flags. `GET /api/artist-applications/me` returns `{ "status": "not_started" }` so the new artist can open `/artist/apply`.

Use a real mailbox domain (Gmail, etc.). Fake domains like `example.com` are rejected on purpose.

## Free hosts

| Layer | Host | URL |
| --- | --- | --- |
| API + current web image | Render (existing) | https://tinta-backend.onrender.com |
| Artist portal | Render / Vercel | https://tinta-artist.onrender.com and https://tinta-artist-live.vercel.app |
| Customer web | Vercel | https://tinta-live.vercel.app |
| New static web | GitHub Pages | https://annamabanlag-wq.github.io/TINTA-Emergent/ |
| Optional static web | Netlify | import repo and use `netlify.toml` |

The GitHub Pages workflow builds the Expo web app on every `main` push. Enable Pages if GitHub asks: Settings → Pages → Source = GitHub Actions.

Backend still needs Mongo + Python, so the API stays on Render unless you connect Railway/Koyeb/Fly with the same `MONGO_URL` and `JWT_SECRET`.

## Rename away from Emergent

GitHub → Settings → General → Repository name → `TINTA`.
After that, update `experiments.baseUrl` in `.github/workflows/pages.yml` to `/TINTA`.
