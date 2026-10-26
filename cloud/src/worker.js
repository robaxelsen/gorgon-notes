// Gorgon Notes party room. Each party code (gn- + 12 letters/digits, made by one member and pasted into party
// chat) names one Durable Object. Members' apps POST fight summaries and live ticks and GET what the others
// posted. The code is the only key: anyone who has it can read and write the room, which is the same model as
// party chat itself. No accounts, no secrets, no personal data beyond character names and fight numbers.
//
//   GET  /                               health: { ok, service, v }
//   POST /room/<code>/fights             body: one summary (JSON object, <= 8 KB) -> { id }
//   GET  /room/<code>/fights?since=<id>&who=<name>
//                                        -> { v, last, fights: [{ id, at, summary }], members: [...], live: [...] }
//   POST /room/<code>/tick               body: { who, dps, recent, fightStart, inFight } -> { ok }
//   GET  /room/<code>/live               -> { live: [{ who, dps, recent, fightStart, at }] }
//
// Discord "Connect a channel" broker (docs/DISCORD.md option B). The app makes an unguessable `state`, opens
// /discord/start in the player's browser, Discord shows its own server + channel picker and sends the player
// back to /discord/callback with a code; this Worker swaps the code for the webhook (that needs the app's
// client secret, which lives only here: `npx wrangler secret put DISCORD_CLIENT_SECRET`), parks the webhook
// under the state for 10 minutes, and hands it out exactly once to /discord/claim. The access token Discord
// sends along is dropped: the webhook is the whole point. Vars: DISCORD_CLIENT_ID (wrangler.toml).
//
//   GET  /discord/start?state=<s>        -> 302 to Discord's authorize page (scope webhook.incoming)
//   GET  /discord/callback?code&state    (Discord sends the player here) -> an HTML page: connected / failed
//   GET  /discord/claim?state=<s>        -> { v, ready: false } until the callback ran, then once
//                                           { v, ready: true, webhook: { id, url, channelId, guildId, name } }
//
// Rows are kept 30 days and at most 5,000 per room; a summary re-posted by the same player for the same fight
// replaces the old row under a new id, so a poller with `since` sees the update.

import { DurableObject } from "cloudflare:workers";

const V = 2;
const CODE_RE = /^gn-[a-z0-9]{12}$/;
const BODY_MAX = 8 * 1024;
const KEEP_MS = 30 * 24 * 3600 * 1000;
const KEEP_ROWS = 5000;
const LIVE_MS = 20 * 1000;
const PAGE = 500;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/") return json({ ok: true, service: "gorgon-notes-room", v: V, discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET) });
    if (url.pathname.startsWith("/discord/")) return discord(request, url, env);
    const m = url.pathname.match(/^\/room\/([^/]+)\/(fights|tick|live)$/);
    if (!m) return json({ error: "not found" }, 404);
    const code = m[1].toLowerCase();
    if (!CODE_RE.test(code)) return json({ error: "a party code looks like gn- and 12 letters or digits" }, 400);
    const id = env.ROOM.idFromName(code);
    return env.ROOM.get(id).fetch(request);
  },
};

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS fights (
      id INTEGER PRIMARY KEY AUTOINCREMENT, who TEXT NOT NULL, start TEXT NOT NULL, at INTEGER NOT NULL, json TEXT NOT NULL,
      UNIQUE (who, start))`);
    this.sql.exec(`CREATE TABLE IF NOT EXISTS members (who TEXT PRIMARY KEY, lastSeen INTEGER NOT NULL, app TEXT)`);
    this.live = new Map(); // who -> tick (in memory only: a tick is worth nothing after 20 s)
  }

  async fetch(request) {
    const url = new URL(request.url);
    const kind = url.pathname.split("/").pop();
    const now = Date.now();
    try {
      if (request.method === "POST" && kind === "fights") return this.postFight(await this.body(request), now);
      if (request.method === "POST" && kind === "tick") return this.postTick(await this.body(request), now);
      if (request.method === "GET" && kind === "fights") return this.getFights(url, now);
      if (request.method === "GET" && kind === "live") return json({ v: V, live: this.liveRows(now) });
    } catch (e) {
      if (e instanceof BadRequest) return json({ error: e.message }, 400);
      return json({ error: "room error: " + (e && e.message ? e.message : String(e)) }, 500);
    }
    return json({ error: "method not allowed" }, 405);
  }

  async body(request) {
    const text = await request.text();
    if (text.length > BODY_MAX) throw new BadRequest(`body over ${BODY_MAX} bytes`);
    let obj;
    try { obj = JSON.parse(text); } catch { throw new BadRequest("body must be JSON"); }
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) throw new BadRequest("body must be a JSON object");
    return obj;
  }

  touch(who, now, app) {
    this.sql.exec(`INSERT INTO members (who, lastSeen, app) VALUES (?, ?, ?)
                   ON CONFLICT (who) DO UPDATE SET lastSeen = excluded.lastSeen, app = COALESCE(excluded.app, members.app)`, who, now, app ?? null);
  }

  postFight(s, now) {
    if (typeof s.who !== "string" || !s.who.trim() || typeof s.start !== "string" || typeof s.end !== "string" || typeof s.dmg !== "number")
      throw new BadRequest("a fight summary needs who, start, end and dmg");
    const who = s.who.trim().slice(0, 40), start = s.start.slice(0, 40);
    s.who = who;
    this.sql.exec(`DELETE FROM fights WHERE who = ? AND start = ?`, who, start);
    this.sql.exec(`INSERT INTO fights (who, start, at, json) VALUES (?, ?, ?, ?)`, who, start, now, JSON.stringify(s));
    const id = this.sql.exec(`SELECT last_insert_rowid() AS id`).one().id;
    this.touch(who, now, typeof s.app === "string" ? s.app.slice(0, 60) : null);
    this.prune(now);
    return json({ v: V, id });
  }

  postTick(t, now) {
    if (typeof t.who !== "string" || !t.who.trim()) throw new BadRequest("a tick needs who");
    const who = t.who.trim().slice(0, 40);
    const tick = {
      who, at: now,
      dps: num(t.dps), recent: num(t.recent), me: num(t.me), pet: num(t.pet), sec: num(t.sec),
      inFight: !!t.inFight, fightStart: typeof t.fightStart === "string" ? t.fightStart.slice(0, 40) : null,
      area: typeof t.area === "string" ? t.area.slice(0, 60) : null,
    };
    this.live.set(who, tick);
    this.touch(who, now, typeof t.app === "string" ? t.app.slice(0, 60) : null);
    return json({ v: V, ok: true, live: this.liveRows(now) });
  }

  getFights(url, now) {
    const since = Math.max(0, parseInt(url.searchParams.get("since") || "0", 10) || 0);
    const who = (url.searchParams.get("who") || "").trim().slice(0, 40);
    if (who) this.touch(who, now, null);
    const rows = this.sql.exec(`SELECT id, who, start, at, json FROM fights WHERE id > ? ORDER BY id LIMIT ?`, since, PAGE).toArray();
    const fights = rows.map(r => ({ id: r.id, at: r.at, summary: JSON.parse(r.json) }));
    const last = rows.length ? rows[rows.length - 1].id : since;
    const more = rows.length === PAGE;
    const members = this.sql.exec(`SELECT who, lastSeen, app FROM members ORDER BY who`).toArray();
    return json({ v: V, last, more, fights, members, live: this.liveRows(now), now });
  }

  liveRows(now) {
    const out = [];
    for (const [who, t] of this.live) {
      if (now - t.at > LIVE_MS) this.live.delete(who);
      else out.push(t);
    }
    return out;
  }

  prune(now) {
    this.sql.exec(`DELETE FROM fights WHERE at < ?`, now - KEEP_MS);
    const n = this.sql.exec(`SELECT COUNT(*) AS n FROM fights`).one().n;
    if (n > KEEP_ROWS) this.sql.exec(`DELETE FROM fights WHERE id IN (SELECT id FROM fights ORDER BY id LIMIT ?)`, n - KEEP_ROWS);
    this.sql.exec(`DELETE FROM members WHERE lastSeen < ?`, now - KEEP_MS);
  }
}

const num = x => (typeof x === "number" && Number.isFinite(x) ? x : 0);
class BadRequest extends Error {}

// ---------------------------------------------------------------------------------------------------------
// Discord broker
// ---------------------------------------------------------------------------------------------------------
const STATE_RE = /^[A-Za-z0-9_-]{16,64}$/;
const PENDING_MS = 10 * 60 * 1000;

async function discord(request, url, env) {
  if (request.method !== "GET") return json({ error: "method not allowed" }, 405);
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) return json({ error: "Discord connect is not set up on this room" }, 503);
  const api = (env.DISCORD_API || "https://discord.com/api").replace(/\/$/, "");
  const state = url.searchParams.get("state") || "";
  const redirect = `${url.origin}/discord/callback`;
  const broker = env.BROKER.get(env.BROKER.idFromName("discord"));

  if (url.pathname === "/discord/start") {
    if (!STATE_RE.test(state)) return json({ error: "bad state" }, 400);
    const q = new URLSearchParams({ response_type: "code", client_id: env.DISCORD_CLIENT_ID, scope: "webhook.incoming", state, redirect_uri: redirect });
    return Response.redirect(`${api.replace(/\/api$/, "")}/oauth2/authorize?${q}`, 302);
  }

  if (url.pathname === "/discord/claim") {
    if (!STATE_RE.test(state)) return json({ error: "bad state" }, 400);
    const r = await broker.fetch(new Request(`https://broker/claim?state=${state}`));
    return r;
  }

  if (url.pathname === "/discord/callback") {
    if (!STATE_RE.test(state)) return page("That link is not from Gorgon Notes", "Nothing was connected. Press Connect Discord in Gorgon Notes to start again.", 400);
    if (url.searchParams.get("error")) return page("Nothing connected", "You left Discord's page without picking a channel. Gorgon Notes posts nowhere until you connect it; press Connect Discord there to try again.");
    const code = url.searchParams.get("code") || "";
    if (!code) return page("Nothing connected", "Discord sent no code. Press Connect Discord in Gorgon Notes to try again.", 400);
    let tok, status;
    try {
      const body = new URLSearchParams({ client_id: env.DISCORD_CLIENT_ID, client_secret: env.DISCORD_CLIENT_SECRET, grant_type: "authorization_code", code, redirect_uri: redirect });
      const r = await fetch(`${api}/oauth2/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", "user-agent": "gorgon-notes-room/" + V }, body });
      status = r.status;
      tok = await r.json().catch(() => null);
    } catch (e) {
      return page("Discord didn't answer", "The room couldn't reach Discord to finish the connection. Press Connect Discord in Gorgon Notes to try again.", 502);
    }
    const w = tok && tok.webhook;
    const okUrl = typeof (w && w.url) === "string" && (w.url.startsWith("https://") || (!!env.DISCORD_API && w.url.startsWith("http://")));  // http: a harness's fake Discord only
    if (!w || !okUrl) {
      const why = tok && (tok.error_description || tok.error) ? ` Discord said: ${String(tok.error_description || tok.error).slice(0, 120)}.` : "";
      return page("Discord didn't accept the connection", `Discord answered ${status || "nothing"} and gave no webhook.${why} Press Connect Discord in Gorgon Notes to try again.`, 502);
    }
    const rec = { id: String(w.id || ""), url: w.url, channelId: String(w.channel_id || ""), guildId: String(w.guild_id || ""), name: typeof w.name === "string" ? w.name.slice(0, 80) : null };
    const r = await broker.fetch(new Request(`https://broker/put?state=${state}`, { method: "POST", body: JSON.stringify(rec) }));
    if (!r.ok) return page("Couldn't keep the connection", "The room failed to store the webhook. Press Connect Discord in Gorgon Notes to try again.", 500);
    return page("Connected to Discord", `Gorgon Notes will post fights to the channel you picked${rec.name ? ` (webhook "${esc(rec.name)}")` : ""}. Go back to Gorgon Notes: the Party window says Connected within a few seconds. You can close this tab.`);
  }
  return json({ error: "not found" }, 404);
}

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function page(title, text, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Gorgon Notes</title>
<style>body{margin:0;background:#161111;color:#e8ded2;font:16px/1.5 ui-sans-serif,system-ui,sans-serif}main{max-width:36rem;margin:14vh auto;padding:0 16px}h1{font-size:1.4rem;margin:0 0 .5rem}p{margin:0 0 1rem;color:#c8bdb0}a{color:#e0b05c}</style></head>
<body><main><p style="color:#9a8f82;font-size:.85rem;margin:0">Gorgon Notes</p><h1>${esc(title)}</h1><p>${text}</p><p><a href="http://127.0.0.1:8787/#combat">Open Gorgon Notes</a></p></main></body></html>`;
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

/** One object for every pending connection: state -> webhook record, 10 minutes, handed out once. */
export class Broker extends DurableObject {
  async fetch(request) {
    const url = new URL(request.url);
    const state = url.searchParams.get("state") || "";
    const now = Date.now();
    await this.prune(now);
    if (url.pathname === "/put" && request.method === "POST") {
      const rec = await request.json();
      await this.ctx.storage.put(state, { ...rec, at: now });
      return json({ v: V, ok: true });
    }
    if (url.pathname === "/claim") {
      const rec = await this.ctx.storage.get(state);
      if (!rec) return json({ v: V, ready: false });
      await this.ctx.storage.delete(state);
      const { at, ...webhook } = rec;
      return json({ v: V, ready: true, webhook });
    }
    return json({ error: "not found" }, 404);
  }

  async prune(now) {
    const all = await this.ctx.storage.list();
    const old = [];
    for (const [k, v] of all) if (!v || typeof v.at !== "number" || now - v.at > PENDING_MS) old.push(k);
    if (old.length) await this.ctx.storage.delete(old);
  }
}
