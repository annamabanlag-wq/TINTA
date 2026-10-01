# TINTA

Tattoo booking and artist-management platform. Product name is **TINTA**.

Repo: https://github.com/annamabanlag-wq/TINTA

The old `TINTA-Emergent` GitHub URL redirects here.

## Live

| Layer | URL |
| --- | --- |
| Customer app | https://tinta-live.vercel.app |
| Artist portal | https://tinta-artist-live.vercel.app |
| Artist portal (Render) | https://tinta-artist.onrender.com |
| API + web image | https://tinta-backend.onrender.com |
| Health | https://tinta-backend.onrender.com/api/health |

Artist signup: `POST /api/auth/register` with `role: "artist"` returns 200, an access token, `artist_portal: true`, and `artist_identity_verified: false`. Use a real mailbox domain. Fake domains like `example.com` are rejected on purpose.

Render free instances sleep. The first request can take about 30 seconds, then health returns `{"ok":true,"service":"tinta","product":"TINTA"}`.

## GitHub Pages

Workflow base path is `/TINTA`. Pages is not on until you enable it once:

Settings → Pages → Build and deployment → Source = GitHub Actions.

After that, the site is https://annamabanlag-wq.github.io/TINTA/

Backend still needs Mongo + Python, so the API stays on Render unless you connect another host with the same `MONGO_URL` and `JWT_SECRET`.
