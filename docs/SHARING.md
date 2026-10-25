# Sharing fight data with party members (research, 2026-10-25)

Question from the user: is there a better way than Discord to share damage data with the party, ideally with no backend, else a free service with very little overhead?

What has to move: one fight summary per player (a few hundred bytes to a few KB: start, end, damage, per-ability rows, enemy ids), posted by each member's own Gorgon Notes, read by the others' copies and merged into one party table. Live per-second streaming is a stretch goal; the fight summary is the must-have. The data is game damage numbers, not secrets, so a service that is public-by-topic is acceptable as long as the topic name is unguessable.

## Options, ranked

| # | Option | Backend to run | Fits the stdlib / vanilla-JS rule | Live or after the fight | Verdict |
|---|---|---|---|---|---|
| 1 | **ntfy.sh** public pub/sub topics over plain HTTP | none | yes: `urlopen` POST to publish, `GET /<topic>/json?poll=1&since=<id>` to read, no account | after the fight (polling every few seconds is within limits; per-second streams are not) | **Recommended first step** |
| 2 | **Cloudflare Worker + Durable Object** room | one ~60-line Worker the user deploys once; free plan | the client side is plain `fetch` / WebSocket; the Worker is JS on Cloudflare | both (WebSocket rooms) | **Recommended when live party DPS is wanted** |
| 3 | WebRTC peer-to-peer via Trystero (signalling over public Nostr / MQTT / BitTorrent) | none | no: a 30 KB JS library in the page; both wrappers (WKWebView, WebView2) support WebRTC | live | good later, when the dependency rule is relaxed |
| 4 | Public MQTT brokers (broker.emqx.io, broker.hivemq.com, test.mosquitto.org) over WebSocket | none | needs an MQTT client (library, or ~150 lines hand-rolled) | live | not recommended: public brokers are shared, overloaded, and have no uptime promise |
| 5 | Discord webhook (post) + paste to merge | none | yes | after the fight, by hand | fallback; a webhook cannot read, so merging stays a paste |
| 6 | Discord bot token shared by the group (post and read via the REST API) | none, but a shared secret in every install | yes (urllib) | after the fight | a leaked token lets anyone post in the channel; rotate on leak; workable but clumsy |
| 7 | Supabase / Firebase / Ably / Pusher free tiers | hosted, free | REST from urllib works; realtime needs their SDK or a WebSocket | both | more account setup than 2 for the same result |

## 1. ntfy.sh (no backend)

- Publish: `POST https://ntfy.sh/<topic>` with the body; no sign-up; "the topic is essentially a password" (ntfy docs). Read: `GET https://ntfy.sh/<topic>/json?poll=1&since=<last id>` returns cached messages and closes; `since=` takes a duration, a timestamp, a message id, `all` or `latest`; several topics in one request with commas.
- Limits on the public server (docs and FAQ): **250 messages a day per IP**, **4,096 bytes per message** (larger ones become attachments), **12 h cache**, a burst of 60 requests then one per 5 to 10 s. One user hit "daily quota reached" early, probably through a shared IP (issue 1711).
- Fit: a fight summary is one message; a party evening is tens of messages per player, well under 250. Reads are polls every 5 s while the Combat view is open (a 60-request burst, then 1 per 5 s, so poll every 10 s to be safe). 4 KB fits a summary with the top abilities; the full per-second timeline does not, so it stays local.
- Topic: `gorgon-notes-<party key>` where the party key is random, made by one member and shared once (a "Party code" in the Combat view; the game's hunting-party lines name no shared id, see `docs/DATA-SOURCES.md`). Everyone's app publishes its fight summaries to the topic and reads the others'.
- Privacy: anyone who knows the topic can read it; the key is 12+ random characters; the data is fight numbers and character names.
- Risks: the public server may change limits or go down; self-hosting ntfy is a one-binary Docker on any free VPS if that happens, with the same API.
- Effort: about one day (publish on fight close, poll, merge by fight window overlap + shared enemy ids, party table, data-awareness footer naming the topic and the last message time).

## 2. Cloudflare Worker + Durable Object (free plan)

- Durable Objects are on the Workers Free plan (SQLite backend only): 100,000 requests a day, 13,000 GB-s, 5 GB storage, WebSocket messages billed 20:1 (Cloudflare pricing page, read 25 Oct). One room per party key, held in a Durable Object with the WebSocket hibernation API: members connect, every message fans out to the room, the object keeps the last N summaries.
- The user deploys it once (`wrangler deploy`, a free Cloudflare account); friends never see it, the app carries the Worker's URL.
- Gives live party DPS (each client streams its per-second figure) and reliable after-the-fight merging. Costs nothing at this scale; a thousand party evenings a month would still be under the free limits.
- Effort: about two days (Worker ~60 lines, a WebSocket client in the page, the same merge and party table as option 1, reconnect handling).

## Not viable from the game itself

The chat log has no shared party id and no party members' damage (`docs/DPS-FEASIBILITY.md`). Any sharing path is the app sending its own numbers somewhere the others can read.

## Recommendation

Start with **ntfy.sh** (option 1): zero accounts, zero hosting, stdlib-only, and it delivers the thing the friends asked for (one party table after a fight). Keep the message format the same as the planned Discord JSON block, so the Discord webhook (option 5) becomes a one-line extra. Move to the **Cloudflare room** (option 2) if live party DPS is wanted or ntfy's limits bite. Prototype first: two copies on two machines, one topic, one evening.

Sources: ntfy docs (publish, subscribe API, config limits), ntfy issue 1711, Cloudflare Durable Objects pricing and limits pages, Trystero README, Gough Lui's 2022 public-broker benchmark and HiveMQ community thread on overloads, Discord developer docs on rate limits.
