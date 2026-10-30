#!/usr/bin/env python3
"""A stand-in for the party room Worker (cloud/src/worker.js) for test harnesses: stdlib only, in memory, seeded
from a JSON file. Never the real room. Usage:

    python3 -I tools/fake-room.py <port> [seed.json]

Routes, as the Worker answers them (GET / is the health line):
    POST /everyone/fights            one summary -> {v, id}
    GET  /everyone/fights?since=<id>&after=<ms>&who=<name>  -> {v, last, more, fights: [{id, at, summary}], members, live, now}
    POST /everyone/tick              one tick -> {v, ok, live}
    GET  /everyone/live              -> {v, live}
    the same four under /room/<code>/ (code = gn- and 12 letters or digits)

Seed file: {"fights": [summary, ...], "live": [tick, ...], "members": [{"who", "app", "lastSeen"?}, ...]} seeds the
everyone feed; "rooms": {"gn-...": {the same three keys}} seeds a code's room. A seeded fight may carry "at" (ms
since the epoch; default now), a seeded tick "keep": true to never age (its `at` is stamped now on every read,
the harness's standing fighter). Every request is printed to stdout, one line each, so a test can count them.
"""
import json
import re
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlsplit

V = 2
CODE_RE = re.compile(r"^gn-[a-z0-9]{12}$")
LIVE_MS = 20 * 1000
PAGE = 500
BODY_MAX = 8 * 1024
LOCK = threading.Lock()
ROOMS = {}   # name -> {"fights": [{id, who, start, at, summary}], "members": {who: {who, lastSeen, app}}, "live": {who: tick}, "next": int}


def room(name):
    return ROOMS.setdefault(name, {"fights": [], "members": {}, "live": {}, "next": 1})


def now_ms():
    return int(time.time() * 1000)


def touch(r, who, at, app=None):
    m = r["members"].setdefault(who, {"who": who, "lastSeen": at, "app": None})
    m["lastSeen"] = at
    if app:
        m["app"] = app


def post_fight(r, s, at):
    if not (isinstance(s.get("who"), str) and s["who"].strip() and isinstance(s.get("start"), str)
            and isinstance(s.get("end"), str) and isinstance(s.get("dmg"), (int, float))):
        raise ValueError("a fight summary needs who, start, end and dmg")
    who, start = s["who"].strip()[:40], s["start"][:40]
    s = dict(s, who=who)
    r["fights"] = [f for f in r["fights"] if not (f["who"] == who and f["start"] == start)]
    fid = r["next"]; r["next"] += 1
    r["fights"].append({"id": fid, "who": who, "start": start, "at": at, "summary": s})
    touch(r, who, at, s.get("app") if isinstance(s.get("app"), str) else None)
    return fid


def post_tick(r, t, at):
    if not (isinstance(t.get("who"), str) and t["who"].strip()):
        raise ValueError("a tick needs who")
    who = t["who"].strip()[:40]
    num = lambda x: x if isinstance(x, (int, float)) else 0
    tick = {"who": who, "at": at, "dps": num(t.get("dps")), "recent": num(t.get("recent")), "me": num(t.get("me")),
            "pet": num(t.get("pet")), "sec": num(t.get("sec")), "inFight": bool(t.get("inFight")),
            "fightStart": t.get("fightStart") if isinstance(t.get("fightStart"), str) else None,
            "area": t.get("area") if isinstance(t.get("area"), str) else None}
    if t.get("keep"):
        tick["keep"] = True
    r["live"][who] = tick
    touch(r, who, at, t.get("app") if isinstance(t.get("app"), str) else None)


def live_rows(r, at):
    out = []
    for who, t in list(r["live"].items()):
        if t.get("keep"):
            t["at"] = at
        if at - t["at"] > LIVE_MS:
            del r["live"][who]
        else:
            out.append({k: v for k, v in t.items() if k != "keep"})
    return out


def seed(path):
    d = json.loads(open(path, encoding="utf-8").read())
    at = now_ms()
    def fill(r, part):
        for s in part.get("fights") or []:
            post_fight(r, s, int(s.get("at") or at))
        for t in part.get("live") or []:
            post_tick(r, t, at)
        for m in part.get("members") or []:
            if isinstance(m, dict) and isinstance(m.get("who"), str):
                touch(r, m["who"], int(m.get("lastSeen") or at), m.get("app"))
    fill(room("everyone"), d)
    for code, part in (d.get("rooms") or {}).items():
        fill(room(code.lower()), part)
    for name, r in ROOMS.items():
        print(f"seeded {name}: {len(r['fights'])} fights, {len(r['live'])} live, {len(r['members'])} members", flush=True)


class H(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):   # one line per request, our own format
        pass

    def send(self, obj, status=200):
        body = json.dumps(obj, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def handle_one(self):
        u = urlsplit(self.path)
        q = {k: v[-1] for k, v in parse_qs(u.query).items()}
        at = now_ms()
        print(f"{time.strftime('%H:%M:%S')} {self.method} {self.path}", flush=True)
        if u.path == "/":
            return self.send({"ok": True, "service": "fake-room", "v": V, "discord": False, "everyone": "/everyone"})
        m = re.match(r"^/(?:room/([^/]+)|(everyone))/(fights|tick|live)$", u.path)
        if not m:
            return self.send({"error": "not found"}, 404)
        name = "everyone" if m.group(2) else m.group(1).lower()
        if not m.group(2) and not CODE_RE.match(name):
            return self.send({"error": "a party code looks like gn- and 12 letters or digits"}, 400)
        kind = m.group(3)
        body = None
        if self.method == "POST":
            n = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(n) if n else b""
            if len(raw) > BODY_MAX:
                return self.send({"error": f"body over {BODY_MAX} bytes"}, 400)
            try:
                body = json.loads(raw.decode("utf-8") or "null")
            except ValueError:
                return self.send({"error": "body must be JSON"}, 400)
            if not isinstance(body, dict):
                return self.send({"error": "body must be a JSON object"}, 400)
        with LOCK:
            r = room(name)
            try:
                if self.method == "POST" and kind == "fights":
                    return self.send({"v": V, "id": post_fight(r, body, at)})
                if self.method == "POST" and kind == "tick":
                    post_tick(r, body, at)
                    return self.send({"v": V, "ok": True, "live": live_rows(r, at)})
                if self.method == "GET" and kind == "fights":
                    since = max(0, int(q.get("since") or 0))
                    after = max(0, int(q.get("after") or 0))
                    who = (q.get("who") or "").strip()[:40]
                    if who:
                        touch(r, who, at)
                    rows = [f for f in r["fights"] if f["id"] > since and f["at"] > after][:PAGE]
                    fights = [{"id": f["id"], "at": f["at"], "summary": f["summary"]} for f in rows]
                    members = sorted(r["members"].values(), key=lambda x: x["who"])
                    return self.send({"v": V, "last": rows[-1]["id"] if rows else since, "more": len(rows) == PAGE,
                                      "fights": fights, "members": members, "live": live_rows(r, at), "now": at})
                if self.method == "GET" and kind == "live":
                    return self.send({"v": V, "live": live_rows(r, at)})
            except ValueError as e:
                return self.send({"error": str(e)}, 400)
        return self.send({"error": "method not allowed"}, 405)

    def do_GET(self):
        self.method = "GET"; self.handle_one()

    def do_POST(self):
        self.method = "POST"; self.handle_one()


def main():
    if len(sys.argv) < 2:
        print(__doc__); return 2
    port = int(sys.argv[1])
    if len(sys.argv) > 2:
        seed(sys.argv[2])
    srv = ThreadingHTTPServer(("127.0.0.1", port), H)
    print(f"fake room on http://127.0.0.1:{port} (everyone feed and /room/<code>/)", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
