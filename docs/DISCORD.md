# Discord: from one pasted webhook to "Connect a channel"

Research 2026-10-26 (user: "This Discord webhook functionality is cool, but not scalable as it only goes to my server's channel now. Research a scalable solution that lets a user set up this from their app to send notifications to a chosen server and channel."). Facts below were read from Discord's developer docs on 26 Oct unless marked *not verified*.

**Status 26 Oct 14:00: option B is built and harness-tested, not yet deployed or released.** `cloud/src/worker.js` (`/discord/start`, `/discord/callback`, `/discord/claim`, `Broker` DO, `DISCORD_API` override for a fake), `cloud/wrangler.toml` (`[vars] DISCORD_CLIENT_ID`, `BROKER` binding, migration v2), `server.py` (`discord_connect`, `discord_claim_tick` in the party thread, `discord_connected`, `POST /api/discord/connect`, a 404 webhook is forgotten), `static/` (Connect Discord / Cancel / Change channel / Remove row, 2 s poll while pending; the paste field was removed at 16:50 at the user's request, `POST /api/settings {discordWebhook}` still accepts a URL for scripts). Waiting on the user: Client ID into `wrangler.toml`, redirect URL registered, `npx wrangler secret put DISCORD_CLIENT_SECRET`, `npx wrangler deploy`, then one real Connect.

**Post format (26 Oct 17:00, user: "This is not easy to digest. Ideally I want a markdown table in discord, maybe also option to post a screenshot").** Discord has no markdown tables, so a post is now an embed: a code-block table (one row per player and pet: health, armor, damage, per second, share, kills), facts as fields, the source note as footer, and a PNG of the same table drawn by the page on a canvas and attached (`attachment://fight.png`). The `json` block is gone (the room shares fights now; the paste box only shows off the room). Contract in DESIGN.md → Server contract → `POST /api/discord`.

## What exists today (v0.6.0)

Combat → Party window → a webhook field. The URL is saved in `settings.json` (`POST /api/settings`), checked with `GET /webhooks/{id}/{token}` (no auth needed), and "Post to Discord" on the Breakdown or a party fight sends `{ content, username: "Gorgon Notes", allowed_mentions: { parse: [] } }` to it with `?wait=true` (`server.py` `discord_text`, `discord_party_text`, `discord_content`). First real post 26 Oct 12:54: ok, 1,220 chars.

Why it does not scale: every player has to open Discord's channel settings → Integrations → Webhooks → New Webhook → Copy URL (which needs the **Manage Webhooks** permission in that server) and paste a secret URL into the app. Four party members doing this against one channel get four webhooks and, for a merged party fight, four near-identical posts.

## The Discord mechanisms, verified

1. **Incoming webhooks** (what we use). `POST /webhooks/{id}/{token}`: no bot, no auth beyond the token in the URL; `content` ≤ 2,000 chars, `username` / `avatar_url` overrides, up to 10 `embeds`, `thread_id`; `wait=true` returns the message. Creating one by hand or by API needs Manage Webhooks. Rate limits are per route and per top-level resource (`webhook_id` or `webhook_id + token`), announced in `X-RateLimit-*` headers; on 429 wait `retry_after`. **A webhook that answers 404 must not be used again** (repeated attempts get the IP restricted). Sources: webhook resource, rate-limits topic.
2. **OAuth2 `webhook.incoming` scope.** The authorize URL (`https://discord.com/oauth2/authorize?response_type=code&client_id=…&scope=webhook.incoming&state=…&redirect_uri=…`) sends the user to Discord's own page where they **pick a server and a channel** and press Authorize; Discord creates a webhook owned by the application in that channel and sends the user back to the registered `redirect_uri` with a `code`. Exchanging the code at `POST /api/oauth2/token` (form body: `grant_type=authorization_code`, `code`, `redirect_uri`, plus `client_id` + `client_secret`) returns the usual access/refresh tokens **and a `webhook` object with `id`, `token`, `url`, `channel_id`, `guild_id`, `name`, `application_id`**. "A new webhook is created each time, so you will need to save the token and id." Only available through the authorization-code grant. `state` is optional but strongly recommended. Source: OAuth2 topic → "Webhooks".
   - The webhook is the deliverable; the access token is not needed for anything and can be dropped (or revoked at once).
   - Which servers appear in the picker is not stated in the docs; the user can only create webhooks where they have Manage Webhooks, so expect the picker to be limited to those (*not verified*; try it once).
   - The response carries ids, **not names**: the channel and server names are not returned (a webhook-only app has no bot to look them up; the `guilds` scope would add the server name, not the channel's). The app can only show the webhook's own name and the ids, so the Worker's "Connected" page is where the user sees which channel they picked.
3. **Public client + PKCE (no client secret).** Discord supports PKCE (`code_challenge_method=S256`), and an app with the `PUBLIC_OAUTH2_CLIENT` flag can exchange a code with `code_verifier` instead of `client_secret`; such apps may also use custom-scheme redirect URIs, and Discord's Social SDK registers `http://127.0.0.1/callback` as a desktop redirect. *Not verified:* whether `webhook.incoming` is honoured for a public client, how the flag is set (portal toggle vs. API), and whether a loopback redirect may carry a port. This is the only route that would let the local Python server finish the flow with no backend at all. Sources: community API docs (docs.discord.food, OAuth2), Discord Social SDK account-linking guide.
4. **A bot** (`scope=bot`, `permissions`, `guild_id`): the user adds the bot to a server; posts then go through `POST /channels/{id}/messages` with the **bot token**, which must live on a server we run (the Worker), so every post is proxied and shares the bot's global 50 req/s. Gives slash commands (`/dps`), reading replies, editing one message in place. Overkill for "post a fight summary to a channel of my choice".

## Options

| | A. Paste a webhook (today) | **B. Connect a channel (OAuth2 `webhook.incoming`, exchange on the Worker)** | C. Room-level channel (B + the party room posts) | D. Bot |
|---|---|---|---|---|
| User steps | Discord channel settings → Integrations → Webhooks → copy → paste | Press **Connect Discord** → pick server + channel on Discord → done | One member connects; the party code owns the channel | Add the bot to the server, pick a channel in the app |
| Needs Manage Webhooks | yes | yes (to create the webhook; Discord enforces it) | one member | server admin to add the bot |
| Backend | none | Cloudflare Worker: 2 routes, holds the client secret | Worker: the room stores the webhook, posts merged fights once | Worker proxies every post with the bot token |
| Secret custody | webhook URL in each user's `settings.json` | same, plus the client secret as a Worker secret | webhook in the room's DO | bot token on the Worker |
| Duplicate party posts | 4 members → 4 posts | same, unless members agree who posts | **one post per party fight** | one |
| Names shown in app | webhook name | webhook name + ids | same | channel names (bot can read) |
| Effort | done | ~1 session (Worker ~80 lines, `server.py` ~60, client ~40, Discord app setup 5 min, release) | +1 session (needs the room-side merge, which today lives in each app) | 2+ sessions |

## Recommendation: B now, C after the first real party evening

B is the standard "Add to Discord" experience, scales to any number of players and servers with one Discord application, keeps posting exactly as it is (straight from the app to Discord, `?wait=true`, the 2,000-char trim), and the paste field stays as the fallback for people who prefer it. The room (`cloud/`) is already deployed, so the broker is two more routes in the same Worker.

### Flow

1. **Once, by the user (owner of the Discord application):** Developer Portal → New Application "Gorgon Notes" → OAuth2 page: note the **Client ID**, reset and copy the **Client Secret**, add the redirect `https://gorgon-notes-room.rob-30c.workers.dev/discord/callback`. No bot user is created. Put the secret in the Worker with `npx wrangler secret put DISCORD_CLIENT_SECRET`; the client id is public and can be a `[vars]` entry in `cloud/wrangler.toml` and a constant in `server.py`. (A bot-less OAuth app has no "verified / 100 servers" threshold to worry about; that applies to bot installs. *From memory, not re-checked.*)
2. **In the app:** Party window → Discord row gets a **Connect Discord** button next to the paste field. Click → `POST /api/discord/connect` → `server.py` makes a 128-bit `state` nonce, remembers `{state, startedAt}` in `settings.json` (10 min), and returns the authorize URL; the client opens it with `window.open` (both shells already hand http links to the system browser: `main.swift` `createWebViewWith`, `ui_windows.go` `ShellExecuteW`).
3. **On Discord:** the user logs in if needed, picks the server and channel, Authorize. Discord redirects to the Worker with `code` + `state`.
4. **Worker `GET /discord/callback`:** exchanges the code (client id + secret, `redirect_uri`), takes `webhook.url`, `id`, `channel_id`, `guild_id`, `name` from the response, ignores the tokens, stores `{url, id, channel_id, guild_id, name}` under the `state` with a **10-minute TTL** (Workers KV with `expirationTtl`, or a tiny "Broker" DO), and answers a plain page: "Connected. Fights will post to that channel. Go back to Gorgon Notes" (with a link to `http://127.0.0.1:8787/#combat`, which works because the browser is on the same machine). No webhook URL ever appears in a browser URL.
5. **Back in the app:** while a `state` is pending, the existing 2 s party loop (`server.py` `party_live_tick` thread) also calls `GET /discord/claim?state=…` on the Worker; the Worker returns the record **once** and deletes it. `server.py` saves the webhook exactly like a pasted one (`discord_set`, then the existing `GET /webhooks/{id}/{token}` check gives the name) and the Discord row flips to "Connected: *Gorgon Notes* in channel …id… · Change channel · Disconnect". The pending state expires after 10 min with "Nothing came back from Discord. Try Connect again."
6. **Afterwards:** a 404 from the webhook (deleted in the channel's Integrations tab) marks it dead: "Discord removed this connection. Connect again." and stops posting, as the rate-limit guidance requires. Posting code is unchanged.

### Security notes
- The Worker never keeps a webhook longer than 10 min and only returns it to whoever presents the unguessable `state`, which only the originating app knows. `state` is single-use.
- The client secret lives only in the Worker's secret store; the repo gets the client id and the redirect URL. Rotating the secret affects nothing stored in apps.
- Each connected app holds its own webhook URL in `settings.json` (already in `.gitignore`), as today.
- Worker cost: KV free tier (100k reads/day) or one DO; the claim poll runs only while a connect is pending.

### C, later: let the room post once
When a party fight is merged, every member's app could post it. With the room: the member who connects can tick "Post party fights from the room" → the app sends the webhook record to `POST /room/<code>/discord` (stored in the Room DO) and the Worker posts each merged party fight once. This needs the merge to run in the Worker (today `party_merge` runs in each app) and is the natural next step after the first real party evening shows what the friends want in the channel.

## Open questions for the user
1. Go with B? It needs you to create the Discord application once (5 minutes) and run one `wrangler secret put`.
2. Should the paste field stay visible, or move behind "Paste a webhook instead"? (Proposal: keep it, secondary.)
3. One connected channel per app (Change channel re-runs the flow), or a list of targets? (Proposal: one, for now.)
4. Try the public-client route (no Worker involvement at all) first as a 15-minute experiment, or go straight to the Worker broker? (Proposal: straight to the Worker; it is deployed, the secret stays off every player's machine, and the public-client behaviour for `webhook.incoming` is undocumented.)

## Sources (read 26 Oct 2026)
- Discord OAuth2 topic (webhook.incoming flow, token response, state, bot flow): https://docs.discord.com/developers/topics/oauth2
- Webhook resource (execute, wait, limits, Manage Webhooks, get-with-token): https://docs.discord.com/developers/resources/webhook
- Rate limits (headers, 429, 404 rule, 50/s global): https://docs.discord.com/developers/topics/rate-limits
- Community API docs on PKCE / `PUBLIC_OAUTH2_CLIENT` (not official): https://docs.discord.food/topics/oauth2
- Social SDK account linking (desktop `http://127.0.0.1/callback`, public client): https://docs.discord.com/developers/discord-social-sdk/development-guides/account-linking-with-discord
- A write-up of the webhook.incoming flow with the token response shape: https://dchua.com/posts/2024-05-27-oauth2_to_webhooks/
