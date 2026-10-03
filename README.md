# TINTA

Tattoo booking and artist-management platform. Product name is **TINTA**.

Repo: https://github.com/annamabanlag-wq/TINTA

The old `TINTA-Emergent` GitHub URL redirects here.

### Public Android APK

Download the latest published Android APK from the [TINTA GitHub Releases](https://github.com/annamabanlag-wq/TINTA/releases).

## Live now (free hosting)

These are the stable public URLs. Use them.

| Layer | URL | Status |
| --- | --- | --- |
| Customer app | https://tinta-live.vercel.app | Live on Vercel |
| Artist portal | https://tinta-artist-live.vercel.app | Live on Vercel |
| API | https://tinta-backend.onrender.com | Live on Render free tier |
| Health | https://tinta-backend.onrender.com/api/health | `{"ok":true,"service":"tinta","product":"TINTA"}` |
| Marketplace | https://tinta-backend.onrender.com/api/artists | Preview artists are loaded |

The Render free instance sleeps after about 15 minutes. The first request can take about 30 seconds, then health returns ok. A GitHub Actions keep-alive pings `/api/health` every 10 minutes so cold starts are rare. Free monthly hours are limited, so if Render suspends the service at the end of the month, open the Render dashboard and resume it.

Do not use https://tinta-artist.onrender.com as the artist entry point. The artist app that actually loads is the Vercel URL above.

## GitHub Pages error

`Deploy TINTA to GitHub Pages` builds, then fails with:

`Failed to create deployment (status: 404) ... Ensure GitHub Pages has been enabled`

That is a repo setting, not an app crash. Enable it once:

Settings → Pages → Build and deployment → Source = GitHub Actions.

After that, the site is https://annamabanlag-wq.github.io/TINTA/

The customer and artist apps do not depend on Pages. They are already on Vercel.

## How it makes money

TINTA's launch pricing is deliberately free to maximize artist and customer acquisition.

- Artist signup: FREE
- Customer signup: FREE
- Booking fee: ₱0
- Platform commission: 15% on the completed paid booking amount used for the commission split
- Advertising: paid ad inventory for businesses; artists are not charged to join

Payments are manual GCash verification. Card/Maya/mock checkout paths are disabled in production.

`/api/pricing` publishes the free-launch pricing and revenue sources. Artist signup is `POST /api/auth/register` with `role: "artist"`.

Backend still needs Mongo + Python, so the API stays on Render unless you connect another host with the same `MONGO_URL` and `JWT_SECRET`.
