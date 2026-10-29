# Gorgon Notes party room (Cloudflare Worker + Durable Object)

The shared backend for party fights (`docs/SHARING.md` option 2). One Durable Object with SQLite storage per party code; the app (`server.py` `room_*`) posts fight summaries and live ticks to it and reads the others'. The code is the only key, the same model as party chat: anyone with it reads and writes that room. No accounts, nothing stored beyond character names and fight numbers, rows kept 30 days (at most 5,000 per room).

Discord "Connect a channel" (`docs/DISCORD.md`): `GET /discord/start?state=` sends the browser to Discord's authorize page (scope `webhook.incoming`); Discord returns the player to `GET /discord/callback?code&state`, which swaps the code for the webhook (client id from `[vars]` in `wrangler.toml`, secret from `npx wrangler secret put DISCORD_CLIENT_SECRET`), parks it in the `Broker` Durable Object for 10 minutes and shows a "Connected" page; the app's server fetches it once with `GET /discord/claim?state=` → `{ ready, webhook: { id, url, channelId, guildId, name } }`. Setup once in the Discord Developer Portal: an application, its OAuth2 page → copy the Client ID into `wrangler.toml`, add the redirect `https://<worker>/discord/callback`, reset the secret and put it with wrangler. `GET /` reports `discord: true` when both are set. Local test: `npx wrangler dev --port 8793 --var DISCORD_CLIENT_ID:x --var DISCORD_CLIENT_SECRET:y --var DISCORD_API:http://127.0.0.1:8799/api` against a fake Discord.

The everyone feed (29 Oct): the same `Room` class named `everyone`, which every app posts every closed fight to (party code or not, `server.py` `everyone_publish`), and `GET /everyone`, the page (`src/everyone.html`, imported as text through the `[[rules]]` in `wrangler.toml`) that reads the last 6 h to 7 days (`GET /everyone/fights?after=<ms>&since=<id>`, paged) and groups the summaries into runs the way the app's Party window does. 20,000 rows kept there.

Routes (`src/worker.js`): `GET /` health; `GET /everyone` the page; `/everyone/fights|tick|live` as a room; `POST /room/<code>/fights` one summary (JSON, 8 KB max; a re-post by the same player for the same fight replaces the row under a new id); `GET /room/<code>/fights?since=<id>&who=<name>` → `{ last, more, fights[{id, at, summary}], members[{who, lastSeen, app}], live[] }`; `POST /room/<code>/tick` a live figure (kept 20 s in memory) → `{ live[] }`; `GET /room/<code>/live`.

Run and deploy (the Cloudflare account is the project owner's; the login token lives in `~/Library/Preferences/.wrangler`, never in the repo):

```
cd cloud
npm install                      # wrangler, dev dependency only
npx wrangler dev --port 8793     # local copy (miniflare, SQLite in .wrangler/)
npx wrangler login               # once, opens the browser
npx wrangler deploy              # prints the URL; put it in server.py ROOM_DEFAULT (today: https://gorgon-notes-room.rob-30c.workers.dev)
```

The app side: `PG_ROOM=http://127.0.0.1:8793` points a test copy at the local Worker, `PG_ROOM=` (empty) turns the room off (ntfy.sh only). Free plan limits (read 25 Oct 2026): 100,000 requests a day, SQLite-backed Durable Objects included. A party evening of four people polling every 2 to 10 s stays far under that.
