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
// Rows are kept 30 days and at most 5,000 per room; a summary re-posted by the same player for the same fight
// replaces the old row under a new id, so a poller with `since` sees the update.

import { DurableObject } from "cloudflare:workers";

const V = 1;
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
    if (url.pathname === "/") return json({ ok: true, service: "gorgon-notes-room", v: V });
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
