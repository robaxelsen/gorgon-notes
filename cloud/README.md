# Gorgon Notes party room (Cloudflare Worker + Durable Object)

The shared backend for party fights (`docs/SHARING.md` option 2). One Durable Object with SQLite storage per party code; the app (`server.py` `room_*`) posts fight summaries and live ticks to it and reads the others'. The code is the only key, the same model as party chat: anyone with it reads and writes that room. No accounts, nothing stored beyond character names and fight numbers, rows kept 30 days (at most 5,000 per room).

Routes (`src/worker.js`): `GET /` health; `POST /room/<code>/fights` one summary (JSON, 8 KB max; a re-post by the same player for the same fight replaces the row under a new id); `GET /room/<code>/fights?since=<id>&who=<name>` → `{ last, more, fights[{id, at, summary}], members[{who, lastSeen, app}], live[] }`; `POST /room/<code>/tick` a live figure (kept 20 s in memory) → `{ live[] }`; `GET /room/<code>/live`.

Run and deploy (the Cloudflare account is the project owner's; the login token lives in `~/Library/Preferences/.wrangler`, never in the repo):

```
cd cloud
npm install                      # wrangler, dev dependency only
npx wrangler dev --port 8793     # local copy (miniflare, SQLite in .wrangler/)
npx wrangler login               # once, opens the browser
npx wrangler deploy              # prints the URL; put it in server.py ROOM_DEFAULT (today: https://gorgon-notes-room.rob-30c.workers.dev)
```

The app side: `PG_ROOM=http://127.0.0.1:8793` points a test copy at the local Worker, `PG_ROOM=` (empty) turns the room off (ntfy.sh only). Free plan limits (read 25 Oct 2026): 100,000 requests a day, SQLite-backed Durable Objects included. A party evening of four people polling every 2 to 10 s stays far under that.
