#!/usr/bin/env python3
"""Project Gorgon dashboard POC — stdlib only.

Reads VIP exports (Reports/*.json) and live chat logs from the game's
Application Support folder and serves a small JSON API + static UI.
"""
import bisect
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
from array import array
from collections import Counter, OrderedDict, defaultdict
from datetime import datetime, timedelta, timezone
from urllib.request import Request, urlopen
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

WINDOWS = sys.platform == "win32"
HERE = Path(__file__).resolve().parent
# Game user data folder (Unity "persistent data"). Mac verified 2026-10-22; Windows from a friend's
# in-game "Reports will be stored here:" line, 2026-10-24: C:/Users/<name>/AppData/LocalLow/Elder Game/Project Gorgon/Reports/
if WINDOWS:
    DEFAULT_GAME_DIR = Path.home() / "AppData/LocalLow/Elder Game/Project Gorgon"
    DEFAULT_PLAYER_LOG = DEFAULT_GAME_DIR / "Player.log"  # Unity's default on Windows; not yet verified on a friend's PC
else:
    DEFAULT_GAME_DIR = Path.home() / "Library/Application Support/unity.Elder Game.Project Gorgon"
    DEFAULT_PLAYER_LOG = Path.home() / "Library/Logs/Elder Game/Project Gorgon/Player.log"
GAME_DIR = Path(os.environ.get("PG_DIR") or DEFAULT_GAME_DIR)
REPORTS = GAME_DIR / "Reports"
CHATLOGS = GAME_DIR / "ChatLogs"
STATIC = HERE / "static"
PORT = int(os.environ.get("PG_PORT", "8787"))
CACHE = HERE / "cache"
CAPACITY_FILE = HERE / "capacity.json"
CAPACITY_LOCK = threading.Lock()
CDN = "https://cdn.projectgorgon.com"
SETTINGS_FILE = GAME_DIR / "GorgonSettings.txt"
PLAYER_LOG = Path(os.environ.get("PG_PLAYER_LOG") or DEFAULT_PLAYER_LOG)
TYPE_ICONS_FILE = HERE / "item-type-icons.json"

FAVOR_ORDER = ["Despised", "Hated", "Disliked", "Tolerated", "Neutral", "Comfortable",
               "Friends", "CloseFriends", "BestFriends", "LikeFamily", "SoulMates"]
FAVOR_RANK = {f: i for i, f in enumerate(FAVOR_ORDER)}

LINE_RE = re.compile(r"^(\d\d-\d\d-\d\d \d\d:\d\d:\d\d)\t(.*)$")
XP_RE = re.compile(r"^\[Status\] You earned (\d+) XP(?: and reached level (\d+))? in (.+?)[.!]$")
LOOT_RE = re.compile(r"^\[Status\] (.+?)(?: x(\d+))? added to inventory\.$")
AREA_RE = re.compile(r"^\*+ Entering Area: (.+)$")
LOGIN_RE = re.compile(r"^\*+ Logged In As (\S+)\. Server (\S+)\.")
LOGOUT_RE = re.compile(r"^\*+ Logged Out")
# Councils lines (docs/DATA-SOURCES.md): every shape the game writes; player chat says "councils" in lowercase.
COUNCILS_RECEIVED_RE = re.compile(r"^\[Status\] You received ([\d,]+) Councils\.$")
COUNCILS_STOLEN_RE = re.compile(r"^\[Status\] (.+?) stole ([\d,]+) Councils!$")
COUNCILS_RECOVERED_RE = re.compile(r"^\[Status\] You recovered ([\d,]+) Councils stolen by (.+?)\.$")
COUNCILS_OVERBURDENED_RE = re.compile(r"^\[Error\] Error: Corpse is overburdened with ([\d,]+) Councils taken from (.+?)\.$")
# "coins" lines are councils too (user, 26 Oct): looted from corpses, handed over by the game, given by a player.
COINS_CORPSE_RE = re.compile(r"^\[Status\] You searched the corpse and found ([\d,]+) coins\.$")
COINS_RECEIVE_RE = re.compile(r"^\[Status\] You receive ([\d,]+) coins\.$")
COINS_GIVEN_RE = re.compile(r"^\[Status\] You were given ([\d,]+) coins by (.+?)!$")
GAMING_XP_RE = re.compile(r"^\[Status\] You earned \d+ XP(?: and reached level \d+)? in Gaming[.!]$")
SALE_RE = COUNCILS_RECEIVED_RE  # health "sales" = non-zero receipts not next to Gaming XP (see gaming_receipt)
GAMING_NEAR_SEC = 3    # a receipt within 3 s of a Gaming XP line is a casino win
GAMING_ZERO_SEC = 120  # a small win in a run of slot pulls lands within this of the last Gaming XP line (0 receipts are always gaming)
GAMING_RUN_SEC = 15    # slot pulls land this close together: a small win beside a 0 receipt or another win is a win too
FAVOR_GAIN_RE = re.compile(r"^\[Status\] You gained ([\d.,]+) favor with (.+?)[.!]?$")
SEARCH_RE = re.compile(r"^\[Status\] Searching your storage for")
SAVED_RE = re.compile(r"Saved report to (.+?)\s*$")
CHANNEL_RE = re.compile(r"^\[([^\]:]+)\] ")
# Death tracker (docs/DATA-SOURCES.md). Any attack/ability line:
# "[Combat] <att>[ #id]: <ability> on <vic>[ #id]<! | (CRIT!) >[Dmg: <dmg>][. (FATALITY!)]"
# <ability> may be empty, "(CRIT!)" replaces the "!", Dmg is absent on buff lines and " none" on misses.
ATK_RE = re.compile(r"^\[Combat\] (?P<att>.+?)(?: #(?P<aid>\d+))?: (?P<abil>.*?) on (?P<vic>.+?)(?: #(?P<vid>\d+))?"
                    r"(?:!| \(CRIT!\))(?: Dmg: (?P<dmg>.*?))?(?P<fatal>\. \(FATALITY!\))?$")
DYING_RE = re.compile(r"^\[Status\] You earned (\d+) XP(?: and reached level \d+)? in Dying[.!]$")
EVADE_LINE = "[Status] You evaded death!"
EVADE_DYING_SEC = 10   # the game awards Dying XP on an evaded death too (16 of 35 evades, 0 to 5 s later): not a death
DEATH_MERGE_SEC = 120  # FATALITY lines keep coming while the corpse is hit; fold them into one death
DEATH_ACT_SEC = 1      # the character's own attack this close to a death is a queued one, not a revival
FEED_CHANNELS =("[Status]", "[Combat]", "[Error]", "[Guild]", "[Nearby]", "[Trade]", "[Global]", "[Help]", "[NPC Chatter]")


def list_reports():
    out = []
    for p in sorted(REPORTS.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            head = _head(p)  # parsed once per (size, mtime); shared with /api/files
        except Exception:
            continue
        if not head["valid"] or head["keys"] is None:  # as before: a file that isn't a JSON object is dropped
            continue
        out.append({
            "file": p.name,
            "report": head.get("Report"),
            "character": head.get("Character"),
            "server": head.get("ServerName"),
            "timestamp": head.get("Timestamp"),
        })
    return out


def load_report(name):
    p = (REPORTS / name).resolve()
    if p.parent != REPORTS.resolve() or not p.exists():
        raise FileNotFoundError(name)
    with p.open(encoding="utf-8") as f:  # explicit: Windows would otherwise use the ANSI code page
        return json.load(f)


def latest_chatlog():
    logs = sorted(CHATLOGS.glob("Chat-*.log"), key=lambda p: p.stat().st_mtime)
    return logs[-1] if logs else None


_cdn = {}
_ver = {"v": None, "at": 0.0, "reachable": None, "changedAt": None}


def fetch(url, timeout=30):
    return urlopen(Request(url, headers={"User-Agent": "pg-dashboard/0.1"}), timeout=timeout).read()


def cdn_data(name):
    """Fetch a game data file from the CDN, cached on disk per client version."""
    if name in _cdn:
        return _cdn[name]
    CACHE.mkdir(exist_ok=True)
    ver = cdn_version()
    if ver is None or (not (CACHE / f"v{ver}" / f"{name}.json").exists() and not _ver["reachable"]):
        cached = sorted(CACHE.glob(f"v*/{name}.json"), key=lambda p: int(p.parent.name[1:]))
        if not cached:
            raise RuntimeError(f"game data {name} unavailable")
        ver = cached[-1].parent.name[1:]
    path = CACHE / f"v{ver}" / f"{name}.json"
    if not path.exists():
        path.parent.mkdir(exist_ok=True)
        path.write_bytes(fetch(f"{CDN}/v{ver}/data/{name}.json"))
    _cdn[name] = json.loads(path.read_text(encoding="utf-8"))
    return _cdn[name]


def cached_versions():
    return sorted((p.name[1:] for p in CACHE.glob("v*") if p.name[1:].isdigit()), key=int)


def cdn_version():
    """Current game data version: fileversion.txt (re-checked every 10 min), else newest cached."""
    if _ver["v"] is None or time.time() - _ver["at"] > 600:
        try:
            v = fetch("https://client.projectgorgon.com/fileversion.txt", 5).decode().strip()
            if not re.fullmatch(r"\d{1,6}", v):  # builds cache paths and CDN URLs and reaches the page: digits only
                raise ValueError(f"unexpected fileversion.txt: {v[:40]!r}")
            if _ver["v"] and v != _ver["v"]:
                _ver["changedAt"] = local_iso(datetime.now())
                _cdn.clear()
            _ver.update(v=v, reachable=True)
        except Exception:
            cached = cached_versions() if CACHE.exists() else []
            _ver.update(v=_ver["v"] or (cached[-1] if cached else None), reachable=False)
        _ver["at"] = time.time()
    return _ver["v"]


def local_iso(dt):
    """ISO 8601 with the local offset. Naive datetimes are taken as local time."""
    return dt.astimezone().isoformat(timespec="seconds") if dt else None


def chat_dt(ts):
    return datetime.strptime(ts, "%y-%m-%d %H:%M:%S")


def chat_iso(ts):
    return local_iso(chat_dt(ts)) if ts else None


def report_dt(ts):
    try:
        return datetime.strptime(ts, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc)
    except Exception:
        return None


def area_name(code):
    if code == "*":
        return "Anywhere"
    a = cdn_data("areas").get(code) or cdn_data("areas").get("Area" + code) or {}
    return a.get("ShortFriendlyName") or a.get("FriendlyName") or code.removeprefix("Area")


def last_login_before(path):
    """Character/server from the most recent login line in older chat logs."""
    logs = sorted(CHATLOGS.glob("Chat-*.log"), key=lambda p: p.stat().st_mtime)
    for p in reversed(logs[:logs.index(path)] if path in logs else logs):
        found = None
        with p.open(encoding="utf-8", errors="replace") as f:
            for raw in f:
                m = LINE_RE.match(raw.rstrip("\n"))
                if m and (lm := LOGIN_RE.match(m.group(2))):
                    found = lm.groups()
        if found:
            return found
    return None, None


def latest_report(kind, character=None):
    for r in list_reports():
        if r["report"] == kind and r["character"] != "???" and (character is None or r["character"] == character):
            return r
    return None


def best_for_favor(levels, favor):
    """Pick the value for the highest favor tier the player has reached."""
    rank = FAVOR_RANK.get(favor, -1)
    best = None
    for lvl, val in sorted(levels.items(), key=lambda kv: FAVOR_RANK.get(kv[0], 99)):
        if FAVOR_RANK.get(lvl, 99) <= rank:
            best = val
    return best


def vendors(character=None):
    head = latest_report("CharacterSheet", character)
    if not head:
        return {"error": "no character export"}
    sheet = load_report(head["file"])
    npcs = cdn_data("npcs")
    now = datetime.now(timezone.utc)
    rows = []
    for key, mine in sheet.get("NPCs", {}).items():
        info = npcs.get(key)
        if not info:
            continue
        store = next((sv for sv in info.get("Services", []) if sv["Type"] == "Store" and sv.get("CapIncreases")), None)
        if not store:
            continue
        favor = mine.get("FavorLevel")
        tiers = {}
        for c in store["CapIncreases"]:
            lvl, cap, types = (c.split(":") + [""])[:3]
            tiers[lvl] = {"cap": int(cap), "types": types}
        tier = best_for_favor(tiers, favor)
        if FAVOR_RANK.get(favor, -1) < FAVOR_RANK.get(store.get("Favor", "Despised"), 0):
            tier = None
        reset = mine.get("VendorResetTime")
        reset_dt = datetime.strptime(reset, "%Y-%m-%d %H:%M:%SZ").replace(tzinfo=timezone.utc) if reset else None
        spent = mine.get("CouncilsSpent", 0) if reset_dt and reset_dt > now else 0
        spent_at_export = mine.get("CouncilsSpent", 0) or 0
        cap = tier["cap"] if tier else 0
        reset_since = bool(reset_dt and reset_dt <= now and spent_at_export > 0)
        nxt = next((dict(level=l, **t) for l, t in sorted(tiers.items(), key=lambda kv: FAVOR_RANK.get(kv[0], 99))
                    if FAVOR_RANK.get(l, 99) > FAVOR_RANK.get(favor, -1)), None)
        rows.append({
            "npc": key, "name": info.get("Name", key), "area": info.get("AreaFriendlyName", ""),
            "favor": favor, "cap": cap, "buys": (tier or {}).get("types", ""),
            "spent": spent, "remaining": max(cap - spent, 0),
            "resetsAt": reset if spent else None, "next": nxt,
            "exportResetAt": local_iso(reset_dt), "spentAtExport": spent_at_export,
            "resetSinceExport": reset_since, "restored": min(spent_at_export, cap) if reset_since else 0,
        })
    rows.sort(key=lambda r: -r["remaining"])
    reset_rows = [r for r in rows if r["resetSinceExport"]]
    return {"source": head, "vendors": rows, "cdnVersion": cdn_version(),
            "resetSummary": {"count": len(reset_rows), "restored": sum(r["restored"] for r in reset_rows)}}


def load_capacity():
    try:
        return json.loads(CAPACITY_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


class BadRequest(ValueError):
    pass


def save_capacity(vault, slots):
    if not isinstance(vault, str) or not vault.strip():
        raise BadRequest("vault must be a non-empty string")
    if slots in (None, ""):
        slots = None
    else:
        try:
            if isinstance(slots, bool) or (isinstance(slots, float) and not slots.is_integer()):
                raise ValueError
            n = int(str(slots).strip())
            if str(slots).strip() not in (str(n), f"{n}.0") or not 1 <= n <= 999:
                raise ValueError
        except (ValueError, TypeError):
            raise BadRequest("slots must be a whole number from 1 to 999")
        slots = n
    with CAPACITY_LOCK:
        if CAPACITY_FILE.exists():
            try:
                caps = json.loads(CAPACITY_FILE.read_text(encoding="utf-8"))
            except Exception:
                # Never rewrite an unreadable file: that would silently drop every size the player typed.
                raise BadRequest("capacity.json could not be read; fix or remove it, then try again")
        else:
            caps = {}
        if slots is None:
            caps.pop(vault, None)
        else:
            caps[vault] = slots
        tmp = CAPACITY_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(caps, indent=2, sort_keys=True), encoding="utf-8")
        os.replace(tmp, CAPACITY_FILE)  # atomic: a reader never sees a half-written file
    return slots


def storage(character=None):
    head = latest_report("CharacterSheet", character)
    items_head = latest_report("Storage", character or (head or {}).get("character"))
    if not items_head:
        return {"error": "no items export"}
    items = load_report(items_head["file"])["Items"]
    sheet = load_report(head["file"]) if head else {}
    npcs = sheet.get("NPCs", {})
    vaults = cdn_data("storagevaults")
    overrides = load_capacity()

    used, value = Counter(), Counter()
    for it in items:
        v = it.get("StorageVault") or ("Inventory" if it.get("IsInInventory") else "Unknown")
        used[v] += 1
        value[v] += (it.get("Value") or 0) * (it.get("StackSize") or 1)

    rows = {}

    def row(key):
        info = vaults.get(key, {})
        favor = npcs.get(key, {}).get("FavorLevel")
        cap, how = None, None
        if key == "Inventory":
            cap, how = sheet.get("CurrentStats", {}).get("MAX_INVENTORY_SIZE"), "stat"
        elif info.get("Levels"):
            cap, how = best_for_favor(info["Levels"], favor), "favor"
        elif info.get("NumSlots"):
            cap, how = info["NumSlots"], "fixed"
        if key in overrides:
            cap, how = overrides[key], "manual"
        return {
            "vault": key, "name": info.get("NpcFriendlyName", key), "area": area_name(info.get("Area", "")),
            "favor": favor, "used": used.get(key, 0), "value": value.get(key, 0),
            "capacity": cap, "capacitySource": how,
            "free": None if cap is None else cap - used.get(key, 0),
            "accepts": info.get("RequirementDescription", ""),
            "nextLevel": next(({"level": l, "capacity": c} for l, c in sorted(info.get("Levels", {}).items(), key=lambda kv: FAVOR_RANK.get(kv[0], 99))
                               if FAVOR_RANK.get(l, 99) > FAVOR_RANK.get(favor, -1)), None),
        }

    for key in used:
        rows[key] = row(key)
    # vaults you've unlocked through favor but have nothing in yet
    for key, info in vaults.items():
        if key not in rows and ((info.get("Levels") and key in npcs) or key in overrides):
            r = row(key)
            if r["capacity"]:
                rows[key] = r
    out = sorted(rows.values(), key=lambda r: (r["free"] is None, -(r["free"] or 0)))
    return {"source": items_head, "sheet": head, "vaults": out, "cdnVersion": cdn_version()}


# Export fields that make a stack unique to its item (gear, attuned or crafted things); such stacks never merge.
PER_ITEM_FIELDS = ("TSysPowers", "AttunedTo", "Durability", "Crafter", "TSysImbuePower", "TSysImbuePowerTier",
                   "UsesRemaining", "CraftPoints", "IsAugmented", "TransmuteCount", "Slot", "Level", "Rarity", "IsCrafted")
SKIP_KINDS = ("unstackable", "noGain", "perItem", "carryLimit", "unknownType", "unknownLocation")


def consolidation(character=None):
    """Split stacks (GET /api/consolidation): one TypeID held in more than one place, the slots a merge gives back,
    a destination per item and a pickup plan by area. Export-only: the newest storage export, MaxStackSize from
    items.json and the vault rows of storage(). Account transfer chests count as ordinary destinations."""
    st = storage(character)
    if st.get("error"):
        return {"error": "no items export"}
    head = st["source"]
    items = load_report(head["file"]).get("Items") or []
    vmap = {v["vault"]: v for v in st["vaults"]}
    cdn = cdn_data("items")

    def loc_of(it):
        return it.get("StorageVault") or ("Inventory" if it.get("IsInInventory") else "Unknown")

    def carried(loc):  # with the player wherever they stand: inventory and the saddlebag only. Other vaults with
        # CDN Area "*" (Council Storage Machine, Home Storage, Boxes of Space...) are unverified; they stop in "Anywhere".
        return loc in ("Inventory", "Saddlebag")

    def vname(loc):
        return "Inventory" if loc == "Inventory" else (vmap.get(loc, {}).get("name") or loc)

    def varea(loc):
        return vmap.get(loc, {}).get("area") or ""

    def vfree(loc):
        return vmap.get(loc, {}).get("free")

    groups, name_locs = defaultdict(list), defaultdict(set)
    for it in items:
        groups[it.get("TypeID")].append(it)
        name_locs[it.get("Name")].add(loc_of(it))
    skipped = {k: 0 for k in SKIP_KINDS}
    split_types, out, vault_back = 0, [], Counter()
    room = {}  # free slots per vault as the plan runs: the export's free, plus stacks taken out, minus extras put in

    def rfree(loc):
        return room[loc] if loc in room else vfree(loc)
    for tid, its in groups.items():
        locs = {loc_of(i) for i in its}
        if len(locs) < 2:
            continue
        split_types += 1
        entry = cdn.get(f"item_{tid}") if tid is not None else None
        if not entry:
            skipped["unknownType"] += 1
            continue
        if "Unknown" in locs:
            skipped["unknownLocation"] += 1
            continue
        max_stack = entry.get("MaxStackSize") or 1
        if max_stack <= 1:
            skipped["unstackable"] += 1
            continue
        if any(f in i for i in its for f in PER_ITEM_FIELDS):
            skipped["perItem"] += 1
            continue
        total = sum(i.get("StackSize") or 1 for i in its)
        stacks_now, stacks_after = len(its), -(-total // max_stack)
        slots_back = stacks_now - stacks_after
        if slots_back <= 0:
            skipped["noGain"] += 1
            continue
        by, ns = Counter(), Counter()
        for i in its:
            by[loc_of(i)] += i.get("StackSize") or 1
            ns[loc_of(i)] += 1
        cands = [l for l in by if l != "Inventory" and not is_transfer_chest(l)]  # inventory and transfer chests are only ever sources
        if not cands:
            skipped["unknownLocation"] += 1
            continue

        def rank(l):  # fits (with the room the items before it leave) first, then the largest holder, then the most room
            extra, free = stacks_after - ns[l], rfree(l)
            return (free is None or extra <= free, by[l], free if free is not None else -1)
        dest = max(cands, key=rank)
        extra, free = stacks_after - ns[dest], rfree(dest)
        dest_area = varea(dest)
        moves = []
        for l in by:
            if l == dest:
                continue
            c = carried(l)
            moves.append({"from": l, "name": vname(l), "area": varea(l), "qty": by[l], "stacks": ns[l],
                          "carried": c, "stop": dest_area if c else varea(l)})
        carry = entry.get("MaxCarryable")
        if carry and any(m["qty"] > carry for m in moves):
            skipped["carryLimit"] += 1
            continue
        for m in moves:
            vault_back[m["from"]] += m["stacks"]
            if rfree(m["from"]) is not None:
                room[m["from"]] = rfree(m["from"]) + m["stacks"]
        vault_back[dest] -= extra
        if free is not None:
            room[dest] = free - extra
        out.append({
            "typeId": tid, "name": Counter(i.get("Name") for i in its).most_common(1)[0][0],
            "names": sorted({i.get("Name") or "" for i in its}), "maxStack": max_stack, "total": total,
            "stacksNow": stacks_now, "stacksAfter": stacks_after, "slotsBack": slots_back,
            # `free` is the room left when this item's turn comes; `needsRoom` counts earlier shortfalls in that vault too
            "to": {"vault": dest, "name": vname(dest), "area": dest_area, "free": max(0, free) if free is not None else None,
                   "extraSlots": extra, "needsRoom": max(0, extra - free) if free is not None else 0, "roomUnknown": free is None},
            "moves": moves,
        })
    out.sort(key=lambda r: (-r["slotsBack"], r["name"]))

    # `after` never goes below 0: deposits that found no room are counted in `short` instead (the items carry `needsRoom`).
    vaults = [{"vault": k, "name": vname(k), "area": varea(k), "free": vfree(k), "back": b,
               "after": None if vfree(k) is None else max(0, vfree(k) + b),
               "short": 0 if vfree(k) is None else max(0, -(vfree(k) + b))} for k, b in vault_back.items()]
    vaults.sort(key=lambda r: (-r["back"], r["name"]))
    after = {r["vault"]: r for r in vaults}
    # Pickup plan: every move under the area the player must stand in, grouped by the vault to take from;
    # what they carry (inventory, saddlebag) goes last, under the destination's area.
    stops = defaultdict(lambda: defaultdict(list))
    for r in out:
        for m in r["moves"]:
            key = "carried" if m["carried"] else m["from"]
            stops[m["stop"]][key].append({
                "typeId": r["typeId"], "name": r["name"], "qty": m["qty"], "from": m["from"], "fromName": m["name"],
                "carried": m["carried"], "to": r["to"]["vault"], "toName": r["to"]["name"], "toArea": r["to"]["area"],
                "sameArea": r["to"]["area"] == m["stop"]})
    stop_rows = []
    for area, groups_ in stops.items():
        rows = []
        for key, lines in groups_.items():
            if key == "carried":
                rows.append({"vault": "carried", "name": "Carried", "free": None, "after": None, "short": 0, "lines": lines})
            else:
                rows.append({"vault": key, "name": vname(key), "free": vfree(key), "after": after.get(key, {}).get("after"),
                             "short": after.get(key, {}).get("short", 0), "lines": lines})
        rows.sort(key=lambda g: (g["vault"] == "carried", -len(g["lines"]), g["name"]))
        stop_rows.append({"area": area, "moves": sum(len(g["lines"]) for g in rows), "vaults": rows})
    stop_rows.sort(key=lambda s: (-s["moves"], s["area"]))

    bag_back = max(0, vault_back.get("Inventory", 0))
    total_back = sum(r["slotsBack"] for r in out)
    return {
        "character": head.get("character"),
        "source": {"file": head["file"], "timestamp": head.get("timestamp"), "at": local_iso(report_dt(head.get("timestamp") or ""))},
        "cdnVersion": st.get("cdnVersion"),
        "summary": {
            "slotsBack": total_back, "vaultSlotsBack": total_back - bag_back, "bagSlotsBack": bag_back,
            "itemsToMerge": len(out), "moves": sum(len(r["moves"]) for r in out), "stops": len(stop_rows),
            "splitNames": sum(1 for s in name_locs.values() if len(s) > 1), "splitTypes": split_types,
            "skipped": skipped,
        },
        "items": out, "vaults": vaults, "stops": stop_rows,
    }


SERVICE_LABEL = {"Store": "Buys", "Storage": "Storage", "Training": "Training", "Consignment": "Consignment",
                 "Barter": "Barter", "InstallAugments": "Augments", "Stables": "Stables", "AnimalHusbandry": "Animal husbandry",
                 "GuildQuests": "Guild quests"}


def area_keys(name):
    """Chat area names ("Casino", "Underneath Serbule") -> CDN area keys. Some names cover two keys."""
    areas = cdn_data("areas")
    return [k for k, a in areas.items() if name in (k, "Area" + name, a.get("FriendlyName"), a.get("ShortFriendlyName"))]


def zone(character=None, area=None):
    """Current zone panel (GET /api/zone): NPCs here with favor, vendor councils left, storage, services."""
    if not area:
        log = latest_chatlog()
        area = parse_session(log).get("currentArea") if log else None
    if not area:
        return {"error": "no area"}
    keys = area_keys(area)
    npcs = cdn_data("npcs")
    vaults_cdn = cdn_data("storagevaults")
    areas = cdn_data("areas")
    if not keys:
        # A chat name areas.json doesn't know (e.g. "Khyrulek's Crypt"): try the NPCs' own area label.
        keys = sorted({i["AreaName"] for i in npcs.values() if i.get("AreaFriendlyName") == area and i.get("AreaName")})
    matched = bool(keys)
    # "Caves", "Dungeon" and "Home" are shared short names; the chat log alone can't say which one.
    guessed = matched and area in ("Caves", "Dungeon", "Home")
    head = latest_report("CharacterSheet", character)
    sheet = load_report(head["file"]) if head else {}
    met = sheet.get("NPCs", {})
    v = vendors(character)
    vrows = {r["npc"]: r for r in v.get("vendors", [])}
    st = storage(character or (head or {}).get("character"))
    srows = {r["vault"]: r for r in st.get("vaults", [])}

    def vault_area(key):
        return vaults_cdn.get(key, {}).get("Area") or npcs.get(key, {}).get("AreaName")

    def summary(area_set):
        vend = [r for k, r in vrows.items() if npcs.get(k, {}).get("AreaName") in area_set]
        vlt = [r for k, r in srows.items() if vault_area(k) in area_set and r.get("free") is not None]
        return {"councils": sum(r["remaining"] for r in vend), "vendors": len(vend),
                "free": sum(max(r["free"], 0) for r in vlt), "vaults": len(vlt)}

    rows, unmet = [], 0
    for key, info in npcs.items():
        if info.get("AreaName") not in keys:
            continue
        services = [sv["Type"] for sv in info.get("Services", [])]
        mine = met.get(key)
        vendor, vault = vrows.get(key), srows.get(key)
        if not mine and not vault:
            if any(t != "Storage" for t in services):  # storage objects (altars, chests) aren't NPCs to meet
                unmet += 1
            continue
        favor = (mine or {}).get("FavorLevel")
        loves = [p["Name"] for p in sorted(info.get("Preferences", []), key=lambda p: -(p.get("Pref") or 0)) if p.get("Desire") == "Love" and p.get("Name")][:3]
        rows.append({
            "npc": key, "name": info.get("Name", key), "favor": favor,
            "services": [SERVICE_LABEL.get(t, t) for t in services if t not in ("Store", "Storage")],
            "vendor": vendor, "vault": vault, "loves": loves, "notes": (mine or {}).get("PlayerNotes") or "",
        })
    # Chests and account storage that aren't NPCs (e.g. the casino transfer chest).
    for key, r in srows.items():
        if key not in npcs and vault_area(key) in keys:
            rows.append({"npc": key, "name": r["name"], "favor": None, "services": [], "vendor": None, "vault": r, "loves": [], "notes": ""})
    rows.sort(key=lambda r: (-(r["vendor"] or {}).get("remaining", -1), -((r["vault"] or {}).get("free") or -1), r["name"]))

    # Next door, grouped by name (two keys can share one, e.g. Underneath Serbule); vague short names use the full one.
    by_name = {}
    for k in dict.fromkeys(a for key in keys for a in areas.get(key, {}).get("AdjacentAreas", [])):
        if k in keys:
            continue
        a = areas.get(k, {})
        name = a.get("FriendlyName") if a.get("ShortFriendlyName") in ("Dungeon", "Caves", "Home") else area_name(k)
        by_name.setdefault(name, set()).add(k)
    adj = []
    for name, ks in by_name.items():
        sm = summary(ks)
        if sm["vendors"] or sm["vaults"]:
            adj.append({"keys": sorted(ks), "name": name, **sm})
    adj.sort(key=lambda a: -(a["councils"] + a["free"]))
    friendly = next((areas[k].get("FriendlyName") for k in keys if k in areas), area)
    return {"area": area, "friendly": friendly, "keys": keys, "matched": matched, "guessed": guessed,
            "npcs": rows, "unmet": unmet, "summary": summary(set(keys)), "adjacent": adj,
            "sources": {"character": head, "storage": st.get("source")}, "cdnVersion": cdn_version()}


def report_info(path_text):
    """Classify a 'Saved report to' path: report kind, file, character, partial."""
    name = Path(path_text.strip()).name
    if not name.endswith(".json"):
        return None
    if name.startswith("Character_"):
        m = re.match(r"^Character_(.*)_([^_]+)\.json$", name)
        who = m.group(1) if m else None
        return {"report": "Character", "file": name, "character": who or None, "partial": not who}
    m = re.match(r"^(.+?)_([^_]+)_items_", name)
    return {"report": "Storage", "file": name, "character": m.group(1) if m else None, "partial": False}


def login_state(path, lines):
    """(loggedIn, loggedInAt, loggedOutAt) from the last login/logout lines, falling back to older logs."""
    last_in = last_out = None
    for ts, msg in lines:
        if LOGIN_RE.match(msg):
            last_in = ts
        elif LOGOUT_RE.match(msg):
            last_out = ts
    if last_in is None or last_out is None:
        for older in reversed(chat_logs_before(path)):
            sm = log_summary(older)
            if last_in is None and sm["logins"]:
                last_in = sm["logins"][-1][0]
            if last_out is None and sm["logouts"]:
                last_out = sm["logouts"][-1]
            if last_in is not None and last_out is not None:
                break
    logged_in = bool(last_in and (last_out is None or chat_dt(last_in) > chat_dt(last_out)))
    return logged_in, chat_iso(last_in), chat_iso(last_out)


class CombatTracker:
    """Deaths, kills and pet kills of the logged-in character, fed one chat line at a time.

    A death is the union of two signals, merged: a "(FATALITY!)" line on the character and the
    "XP in Dying" line (indirect damage prints no FATALITY line; some FATALITY deaths print no Dying
    line). Mobs keep hitting the corpse, so FATALITY lines within DEATH_MERGE_SEC of a death count as
    hits on it (`hits` counts FATALITY lines only; the Dying line never adds one) until the character
    acts more than DEATH_ACT_SEC after the death, enters an area, logs in or logs out. A Dying line
    within EVADE_DYING_SEC of "You evaded death!" is the evade's own XP, not a death. Pets are the attackers in
    "#id vs #id" FATALITY lines that never traded real damage with the character (about 0.2% wrong).
    `resolve` is called once, if ever, to name the character when a line comes before any login line.
    """

    def __init__(self, char=None, resolve=None):
        self.char = None
        self.resolve = resolve
        self.area = None
        self.alive = True
        self.evaded_at = None
        self.dmg_by_me = set()
        self.dmg_me = set()
        self.fatal = []
        self.deaths = []
        self.close = 0
        self._set_char(char)

    def _set_char(self, char):
        self.char = char
        self._mine = f"[Combat] {char}: " if char else None
        self._hit = f" on {char}! " if char else None
        self._crit = f" on {char} (CRIT!) " if char else None
        self._end = f" on {char}!" if char else None

    def feed(self, ts, msg):
        if m := LOGIN_RE.match(msg):
            self._set_char(m.group(1))
            self.alive = True
            return
        if m := AREA_RE.match(msg):
            self.area = m.group(1)
            self.alive = True
            return
        if LOGOUT_RE.match(msg):
            self.alive = True
            return
        combat = msg.startswith("[Combat] ")
        if not combat and msg != EVADE_LINE and not (msg.startswith("[Status] You earned ") and DYING_RE.match(msg)):
            return
        if self.char is None:
            if self.resolve:
                self._set_char(self.resolve())
                self.resolve = None
            if self.char is None:
                return
        if not combat:
            if msg == EVADE_LINE:
                self.close += 1
                self.evaded_at = ts
            elif self.evaded_at and (chat_dt(ts) - chat_dt(self.evaded_at)).total_seconds() <= EVADE_DYING_SEC:
                pass  # Dying XP for the evade itself; a real death right after an evade prints its own FATALITY line
            else:
                self._death(ts, None, None)
            return
        mine = msg.startswith(self._mine)
        onme = self._hit in msg or self._crit in msg or msg.endswith(self._end)
        fat = msg.endswith("(FATALITY!)")
        if not (mine or onme or fat):
            return
        g = ATK_RE.match(msg)
        if not g:
            return
        real = g["dmg"] is not None and g["dmg"].strip() != "none"
        if mine:
            # The character acted, so any earlier death is over, unless the line sits in the same second as the
            # death: the game writes a queued attack between the Dying line and its FATALITY line.
            if self.alive or (chat_dt(ts) - chat_dt(self.deaths[-1]["ts"])).total_seconds() > DEATH_ACT_SEC:
                self.alive = True
            if g["vid"] and real:
                self.dmg_by_me.add(g["vic"])
        if g["vic"] == self.char and g["aid"] and real:
            self.dmg_me.add(g["att"])
        if g["fatal"]:
            if g["att"] == self.char:
                self.fatal.append(("kill", g["vic"]))
            elif g["vic"] == self.char:
                self._death(ts, g["att"], g["abil"] or None)
            elif g["aid"] and g["vid"]:
                self.fatal.append(("pp", g["att"], g["vic"]))

    def _death(self, ts, killer, ability):
        last = self.deaths[-1] if self.deaths else None
        if (last and not self.alive and last["character"] == self.char
                and (chat_dt(ts) - chat_dt(last["ts"])).total_seconds() <= DEATH_MERGE_SEC):
            # Only a FATALITY line is a hit; the Dying line folds in without counting.
            if killer and last["killer"] is None:  # the Dying line came first; the FATALITY line names the killer
                last["killer"], last["ability"] = killer, ability
            elif killer:
                last["hits"] += 1
        else:
            self.deaths.append({"ts": ts, "at": chat_iso(ts), "kind": "death", "character": self.char,
                                "killer": killer, "ability": ability if killer else None, "area": self.area, "hits": 1})
        self.alive = False

    def result(self):
        """{deaths: [event dicts], kills, petKills, petDeaths, closeCalls, pets}."""
        enemies = self.dmg_by_me | self.dmg_me
        kills = pet_kills = pet_deaths = 0
        pets = set()
        for f in self.fatal:
            if f[0] == "kill":
                kills += 1
            elif f[1] not in enemies:
                pets.add(f[1])
                pet_kills += 1
            elif f[2] not in enemies:
                pet_deaths += 1
        return {"deaths": self.deaths, "kills": kills, "petKills": pet_kills, "petDeaths": pet_deaths,
                "closeCalls": self.close, "pets": sorted(pets)}


def combat_31d():
    """Deaths, kills and pet kills summed over whole chat logs written in the last 31 days (cached per log)."""
    now = datetime.now().timestamp()
    recent = [p for p in chat_logs() if now - p.stat().st_mtime < 31 * 86400]
    out = {"days": len(recent), "since": None, "deaths": 0, "kills": 0, "petKills": 0, "petDeaths": 0, "closeCalls": 0}
    for p in recent:
        c = log_summary(p)["combat"]
        out["deaths"] += len(c["deaths"])
        for k in ("kills", "petKills", "petDeaths", "closeCalls"):
            out[k] += c[k]
    if recent:
        d = min(p.name for p in recent)[5:13]  # Chat-26-10-10.log -> 2026-10-10
        out["since"] = f"20{d}"
    return out


# ---------------------------------------------------------------------------
# Personal DPS (GET /api/combat). docs/DPS-FEASIBILITY.md. The newest chat log is read incrementally (by byte
# offset, so a 2 s poll re-reads only new lines) into one DpsTracker, which splits [Combat] lines into fights.
# ---------------------------------------------------------------------------
DPS_GAP_SEC = 15          # a fight ends after this long with no direct damage dealt or taken (PGCombatTracker's default)
DPS_NOW_SEC = 10          # the rolling "last 10 s" figure beside the fight's DPS
DPS_MINOR = {"sec": 5, "dmg": 500}  # shorter AND smaller than this: a skirmish, folded in the UI
DPS_BEST_SEC = 15         # "best fight" needs at least this long, so a one-hit burst does not win
DPS_TIMELINE_POINTS = 240 # a fight's per-second timeline is bucketed so it never exceeds this many points
INSTAKILL_DMG = 100000    # one hit at or above this is a kill mechanic (Face of Death: FaceOfDeathKill, 999,451 health), not damage
EVADE_RE = re.compile(r"^\[Combat\] (?P<att>.+?)(?: #(?P<aid>\d+))?: (?P<abil>.*?) on (?P<vic>.+?)(?: #(?P<vid>\d+))? \(EVADED!\)$")
INDIRECT_RE = re.compile(r"^\[Combat\] (?P<who>.+?)(?: #(?P<id>\d+))?: Suffered indirect dmg: (?P<rest>.*)$")
RECOVERED_RE = re.compile(r"^\[Combat\] (?P<who>.+?)(?: #(?P<id>\d+))?: Recovered: ")
DMG_PART_RE = re.compile(r"-?(\d+) (health|armor|power)")
ABIL_LEVEL_RE = re.compile(r" \d+$")
# Names the player's logs and PGCombatTracker's default list know as summons; a fallback only, the behaviour
# heuristic (hit what you hit, never traded damage with you) places pets without it.
KNOWN_PETS = {"Cardi Bee", "Doomstorm", "Tornado", "Unliving Ratkin Blaster", "Summoned Golem Minion", "Fire Wall"}


def dmg_parts(text):
    """'72 health, 71 armor' / '-156 health' / ' none' -> (health, armor, power)."""
    h = a = p = 0
    for n, kind in DMG_PART_RE.findall(text or ""):
        if kind == "health":
            h += int(n)
        elif kind == "armor":
            a += int(n)
        else:
            p += int(n)
    return h, a, p


def abil_key(abil):
    """'Dampen 8' -> 'Dampen'; the game prints the ability's level after its name. Empty -> 'Unnamed attack'."""
    abil = (abil or "").strip()
    return ABIL_LEVEL_RE.sub("", abil) if abil else "Unnamed attack"


def _stat():
    return {"hits": 0, "dmg": 0, "health": 0, "armor": 0, "crit": 0, "evaded": 0, "none": 0, "max": 0, "fatal": 0, "levels": set()}


class Fight:
    """One stretch of direct damage with gaps under DPS_GAP_SEC. Attackers and victims are kept by name
    (ids change per summon and per mob) and sorted into you / pets / enemies only when the report is built."""

    def __init__(self, ts, area):
        self.start = ts
        self.start_dt = chat_dt(ts)
        self.end = ts
        self.end_dt = self.start_dt
        self.area = area
        self.dealt = defaultdict(lambda: defaultdict(_stat))     # attacker -> ability -> stats (any attacker with real damage)
        self.targets = defaultdict(Counter)                      # attacker -> victim name -> dmg
        self.target_ids = defaultdict(set)                       # attacker -> victim ids
        self.taken = defaultdict(lambda: defaultdict(lambda: defaultdict(_stat)))  # victim -> attacker -> ability -> stats
        self.indirect = Counter()                                # name -> health+armor of "Suffered indirect dmg" lines
        self.recent = []                                         # (dt, attacker, dmg) for the rolling figure; trimmed as it goes
        self.per_sec = defaultdict(Counter)                      # second offset -> attacker -> dmg (the timeline)
        self.kills = []                                          # (attacker, victim)
        self.deaths = 0
        self.dead = False
        self.death_dt = None
        self.party = False                                       # a [Party] line fell inside the fight
        self.others = set()                                      # #id names seen only in Recovered / indirect lines
        self.ids = set()                                         # every entity id seen


class DpsTracker:
    """Fights, per-ability damage, damage taken and kills of the logged-in character and its pets, fed one chat
    line at a time (streaming, so the live log can be followed). Any attack line that carries a `Dmg:` field is
    combat involving you or a pet (the game logs no other attacks), so it opens or extends a fight; buff lines,
    evades and `Dmg:  none` lines are counted into an open fight but never open one."""

    def __init__(self, resolve=None):
        self.char = None
        self.resolve = resolve
        self.area = None
        self.fights = []
        self.cur = None
        self.logins = []            # (ts, character)
        self.my_targets = set()     # names you dealt real damage to (whole log)
        self.hit_me = set()         # names that dealt real damage to you
        self.pet_hint = set()       # #id attackers with "(Pet)" in an ability name
        self.lines = 0              # [Combat] lines seen
        self.last_combat = None     # ts of the last [Combat] line
        self.last_damage = None     # ts of the last direct-damage line
        self.first_ts = self.last_ts = None

    def _open(self, ts, dt):
        f = self.cur
        if f is not None and (dt - f.end_dt).total_seconds() > DPS_GAP_SEC:
            f = None
        if f is None:
            f = Fight(ts, self.area)
            self.fights.append(f)
            self.cur = f
        return f

    def _extend(self, f, ts, dt):
        if dt > f.end_dt:
            f.end, f.end_dt = ts, dt
        self.last_damage = ts

    def feed(self, ts, msg):
        self.first_ts = self.first_ts or ts
        self.last_ts = ts
        if msg.startswith("*"):
            if m := LOGIN_RE.match(msg):
                self.char = m.group(1)
                self.logins.append((ts, self.char))
                self.cur = None
            elif m := AREA_RE.match(msg):
                self.area = m.group(1)
            elif LOGOUT_RE.match(msg):
                self.cur = None
            return
        if msg.startswith("[Party] "):
            if self.cur is not None and (chat_dt(ts) - self.cur.end_dt).total_seconds() <= DPS_GAP_SEC:
                self.cur.party = True
            return
        if not msg.startswith("[Combat] "):
            return
        self.lines += 1
        self.last_combat = ts
        if self.char is None and self.resolve:
            self.char = self.resolve()
            self.resolve = None
        if "Suffered indirect dmg: " in msg:
            if (m := INDIRECT_RE.match(msg)) and self.cur is not None:
                dt = chat_dt(ts)
                if (dt - self.cur.end_dt).total_seconds() <= DPS_GAP_SEC:
                    h, a, _ = dmg_parts(m["rest"])
                    self.cur.indirect[m["who"]] += h + a
                    if m["id"]:
                        self.cur.others.add(m["who"])
            return
        if ": Recovered: " in msg:
            if (m := RECOVERED_RE.match(msg)) and m["id"] and self.cur is not None:
                self.cur.others.add(m["who"])
            return
        if msg.endswith("(EVADED!)"):
            if (m := EVADE_RE.match(msg)) and self.cur is not None and (chat_dt(ts) - self.cur.end_dt).total_seconds() <= DPS_GAP_SEC:
                st = self.cur.dealt[m["att"]][abil_key(m["abil"])]
                st["evaded"] += 1
            return
        g = ATK_RE.match(msg)
        if not g:
            return
        att, vic, aid, vid = g["att"], g["vic"], g["aid"], g["vid"]
        if "(Pet)" in (g["abil"] or "") and aid:
            self.pet_hint.add(att)
        if g["dmg"] is None:
            return  # a buff or a pet command: no damage field
        dt = chat_dt(ts)
        h, a, _ = dmg_parts(g["dmg"])
        none = g["dmg"].strip() == "none"
        dmg = h + a
        if none and (self.cur is None or (dt - self.cur.end_dt).total_seconds() > DPS_GAP_SEC):
            return  # an absorbed hit does not start a fight
        f = self._open(ts, dt)
        if not none:
            self._extend(f, ts, dt)
        key = abil_key(g["abil"])
        st = f.dealt[att][key]
        st["hits"] += 1
        st["dmg"] += dmg
        st["health"] += h
        st["armor"] += a
        st["max"] = max(st["max"], dmg)
        if none:
            st["none"] += 1
        if " (CRIT!)" in msg:
            st["crit"] += 1
        if g["abil"] and g["abil"] != key:
            st["levels"].add(g["abil"])
        f.targets[att][vic] += dmg
        if vid:
            f.target_ids[att].add(vid)
            f.ids.add(vid)
        if aid:
            f.ids.add(aid)
        tk = f.taken[vic][att][key]
        if dmg >= INSTAKILL_DMG:
            tk["instakill"] = tk.get("instakill", 0) + 1  # listed, never summed into damage taken
        else:
            tk["hits"] += 1
            tk["dmg"] += dmg
            tk["health"] += h
            tk["armor"] += a
        if dmg:
            f.recent.append((dt, att, dmg))
            f.per_sec[int((dt - f.start_dt).total_seconds())][att] += dmg
            if len(f.recent) > 400:
                del f.recent[:200]
        if att == self.char:
            if not none and vid:
                self.my_targets.add(vic)
            if f.dead and f.death_dt and (dt - f.death_dt).total_seconds() > DEATH_ACT_SEC:
                f.dead = False
        elif vic == self.char and aid and not none:
            self.hit_me.add(att)
        if g["fatal"]:
            if vic == self.char:
                if not f.dead:
                    f.deaths += 1
                    f.dead = True
                    f.death_dt = dt
            else:
                st["fatal"] += 1
                f.kills.append((att, vic))

    # ---- report ----
    def classify(self):
        """(pets, enemies) by name over the whole log. Pets: #id attackers that hit what you hit, or that a known
        enemy hit, or named in KNOWN_PETS / with a (Pet) ability, and never traded real damage with you."""
        enemies = set(self.my_targets) | set(self.hit_me)
        attackers = set()
        victims_of = defaultdict(set)  # attacker -> victims
        hit_by = defaultdict(set)      # victim -> attackers
        for f in self.fights:
            for att, tg in f.targets.items():
                attackers.add(att)
                for v in tg:
                    victims_of[att].add(v)
                    hit_by[v].add(att)
        pets = set()
        for att in attackers:
            if att == self.char or att in enemies:
                continue
            if victims_of[att] & enemies or att in self.pet_hint or att in KNOWN_PETS or hit_by[att] & enemies:
                pets.add(att)
        changed = True
        while changed:  # enemies that only ever hit a pet, and mobs only a pet ever hit
            changed = False
            for p in pets:
                new = (hit_by[p] | victims_of[p]) - pets - {self.char}
                if new - enemies:
                    enemies |= new
                    changed = True
        return pets, enemies

    def result(self, scope, path, st):
        now = datetime.now()
        live = (now.timestamp() - st.st_mtime) < 15 * 60
        me = self.char
        pets, enemies = self.classify()
        # Scope: the day starts at the day's first login (like /api/session); "login" at the last one.
        boundary = None
        if self.logins:
            boundary = chat_dt(self.logins[-1][0] if scope == "login" else self.logins[0][0])
        fights = [f for f in self.fights if boundary is None or f.start_dt >= boundary]
        last = fights[-1] if fights else None
        open_fight = bool(live and last is not None and (now - last.end_dt).total_seconds() <= DPS_GAP_SEC)
        rows = [self.fight_json(f, me, pets, enemies, now if (open_fight and f is last) else None) for f in fights]
        unclassified = sorted({att for f in fights for att in f.targets if att != me and att not in pets and att not in enemies})
        totals = self.totals(rows, fights, me, pets, enemies)
        nowfig = {"inFight": open_fight, "dps": 0, "me": 0, "pet": 0, "recent": 0, "sec": 0, "fight": None}
        if last is not None:
            nowfig["fight"] = last.start
            if open_fight:
                r = rows[-1]
                nowfig.update(dps=r["dps"], me=r["dpsMe"], pet=r["dpsPet"], sec=r["dur"])
                cut = now - timedelta(seconds=DPS_NOW_SEC)
                mine = {me} | pets
                nowfig["recent"] = round(sum(d for dt, att, d in last.recent if dt >= cut and att in mine) / DPS_NOW_SEC, 1)
        return {
            "log": path.name, "scope": scope, "character": me, "live": live,
            "lastLineAt": chat_iso(self.last_ts), "lastCombatAt": chat_iso(self.last_combat),
            "combatLines": self.lines, "gapSec": DPS_GAP_SEC, "nowSec": DPS_NOW_SEC, "minor": DPS_MINOR,
            "pets": sorted(pets), "unclassified": unclassified,
            "now": nowfig, "totals": totals, "fights": rows,
        }

    @staticmethod
    def _sum(stats):
        out = {"hits": 0, "dmg": 0, "health": 0, "armor": 0, "crit": 0, "evaded": 0, "none": 0, "max": 0, "fatal": 0}
        for s in stats:
            for k in out:
                out[k] = max(out[k], s[k]) if k == "max" else out[k] + s[k]
        return out

    def fight_json(self, f, me, pets, enemies, now=None):
        end_dt = max(f.end_dt, now) if now else f.end_dt
        dur = max(1, int((end_dt - f.start_dt).total_seconds()) + (0 if now else 1))
        mine = {me} | pets
        abilities = []
        for att in sorted(f.dealt, key=lambda a: (a != me, a)):
            if att not in mine:
                continue
            for key, s in f.dealt[att].items():
                abilities.append({"name": key, "who": "you" if att == me else att, "hits": s["hits"], "dmg": s["dmg"],
                                  "health": s["health"], "armor": s["armor"], "crit": s["crit"], "evaded": s["evaded"],
                                  "none": s["none"], "max": s["max"], "fatal": s["fatal"], "levels": sorted(s["levels"])})
        abilities.sort(key=lambda r: -r["dmg"])
        me_s = self._sum(f.dealt[me].values()) if me in f.dealt else self._sum([])
        pet_s = self._sum(s for att in pets if att in f.dealt for s in f.dealt[att].values())
        dmg = me_s["dmg"] + pet_s["dmg"]
        taken_me = self._sum(s for att in f.taken.get(me, {}).values() for s in att.values()) if me else self._sum([])
        taken_pet = self._sum(s for p in pets if p in f.taken for att in f.taken[p].values() for s in att.values())
        taken_by = []
        instakills = 0
        for att, abils in f.taken.get(me, {}).items():
            for key, s in abils.items():
                ik = s.get("instakill", 0)
                instakills += ik
                taken_by.append({"name": att, "ability": key, "hits": s["hits"], "dmg": s["dmg"], "instakill": ik})
        taken_by.sort(key=lambda r: (-r["instakill"], -r["dmg"]))
        targets = Counter()
        tids = set()
        for att in mine:
            targets.update(f.targets.get(att, {}))
            tids |= f.target_ids.get(att, set())
        tg = [{"name": n, "dmg": d} for n, d in targets.most_common()]
        kills = sum(1 for att, vic in f.kills if att == me and vic not in mine)
        pet_kills = sum(1 for att, vic in f.kills if att in pets and vic not in mine)
        indirect_me = f.indirect.get(me, 0) if me else 0
        indirect_pet = sum(f.indirect.get(p, 0) for p in pets)
        indirect_other = sum(d for n, d in f.indirect.items() if n != me and n not in pets)
        others = sorted(n for n in f.others if n not in enemies and n not in pets and n != me)
        # Timeline: [[second offset, you, pets]] per bucket of `step` seconds, dense from 0 to the fight's end.
        step = max(1, -(-dur // DPS_TIMELINE_POINTS))
        n_b = -(-dur // step)
        tl = [[i * step, 0, 0] for i in range(n_b)]
        for sec, by in f.per_sec.items():
            i = min(sec // step, n_b - 1)
            for att, d in by.items():
                if att == me:
                    tl[i][1] += d
                elif att in pets:
                    tl[i][2] += d
        return {
            "id": f.start, "start": f.start, "at": chat_iso(f.start), "end": f.end, "endAt": chat_iso(f.end), "dur": dur,
            "open": bool(now), "minor": dur < DPS_MINOR["sec"] and dmg < DPS_MINOR["dmg"], "area": f.area,
            "dmg": dmg, "me": me_s["dmg"], "pet": pet_s["dmg"], "health": me_s["health"] + pet_s["health"], "armor": me_s["armor"] + pet_s["armor"],
            "dps": round(dmg / dur, 1), "dpsMe": round(me_s["dmg"] / dur, 1), "dpsPet": round(pet_s["dmg"] / dur, 1),
            "hits": me_s["hits"] + pet_s["hits"], "crit": me_s["crit"] + pet_s["crit"], "evaded": me_s["evaded"] + pet_s["evaded"],
            "hitsMe": me_s["hits"], "critMe": me_s["crit"], "maxHit": max(me_s["max"], pet_s["max"]),
            "taken": taken_me["dmg"] + indirect_me, "takenMe": taken_me["dmg"], "takenHits": taken_me["hits"], "indirectMe": indirect_me,
            "takenPet": taken_pet["dmg"] + indirect_pet,
            "kills": kills, "petKills": pet_kills, "deaths": f.deaths, "instakills": instakills,
            "targets": tg[:6], "targetCount": len(tg), "mobs": len(tids), "mobIds": sorted(tids)[:40], "top": tg[0]["name"] if tg else None,
            "abilities": abilities, "takenBy": taken_by[:8],
            "indirectUnattributed": indirect_other, "shared": f.party or bool(others), "others": others[:5],
            "timeline": tl, "timelineStep": step,
        }

    def totals(self, rows, fights, me, pets, enemies):
        t = {"fights": len(rows), "dmg": 0, "me": 0, "pet": 0, "health": 0, "armor": 0, "hits": 0, "crit": 0,
             "taken": 0, "takenMe": 0, "indirectMe": 0, "takenPet": 0, "kills": 0, "petKills": 0, "deaths": 0, "instakills": 0,
             "activeSec": 0, "indirectUnattributed": 0, "best": None, "minor": 0}
        merged = {}
        for r in rows:
            for k in ("dmg", "me", "pet", "health", "armor", "hits", "crit", "taken", "takenMe", "indirectMe", "takenPet",
                      "kills", "petKills", "deaths", "instakills", "indirectUnattributed"):
                t[k] += r[k]
            t["activeSec"] += r["dur"]
            t["minor"] += 1 if r["minor"] else 0
            if r["dur"] >= DPS_BEST_SEC and not r["open"] and (t["best"] is None or r["dps"] > t["best"]["dps"]):
                t["best"] = {"id": r["id"], "start": r["start"], "dps": r["dps"], "dmg": r["dmg"], "dur": r["dur"]}
            for a in r["abilities"]:
                m = merged.setdefault((a["who"], a["name"]), {"name": a["name"], "who": a["who"], "hits": 0, "dmg": 0, "health": 0,
                                                              "armor": 0, "crit": 0, "evaded": 0, "none": 0, "max": 0, "fatal": 0})
                for k in ("hits", "dmg", "health", "armor", "crit", "evaded", "none", "fatal"):
                    m[k] += a[k]
                m["max"] = max(m["max"], a["max"])
        t["dps"] = round(t["dmg"] / t["activeSec"], 1) if t["activeSec"] else 0
        t["abilities"] = sorted(merged.values(), key=lambda r: -r["dmg"])
        return t


_dps = {}
_dps_lock = threading.Lock()


def dps_tracker(path):
    """The DpsTracker for a chat log, fed only the bytes written since the last call (the game appends; a shrink
    means a rewrite, so the tracker starts over). The offset stops after the last complete line."""
    st = path.stat()
    key = (st.st_size, st.st_mtime)
    with _dps_lock:
        ent = _dps.get(path)
        if ent and ent["key"] == key:
            return ent["tracker"], st
        if not ent or st.st_size < ent["offset"]:
            ent = {"offset": 0, "key": None, "tracker": DpsTracker(resolve=lambda: last_login_before(path)[0])}
            _dps.clear()  # one tracker: the newest log only
            _dps[path] = ent
        with path.open("rb") as f:
            f.seek(ent["offset"])
            data = f.read()
        nl = data.rfind(b"\n")
        if nl >= 0:
            tracker = ent["tracker"]
            for raw in data[:nl].decode("utf-8", errors="replace").split("\n"):
                m = LINE_RE.match(raw.rstrip("\r"))
                if m:
                    tracker.feed(m.group(1), m.group(2))
            ent["offset"] += nl + 1
        ent["key"] = key
        return ent["tracker"], st


def combat_report(scope="day"):
    log = latest_chatlog()
    if not log:
        return {}
    tracker, st = dps_tracker(log)
    return tracker.result("login" if scope == "login" else "day", log, st)


# ---------------------------------------------------------------------------
# Sell and store plan (GET /api/plan): what to do with every stack in the inventory, from the newest storage
# export, the newest character export (vendor caps, sale multiplier) and the CDN (item keywords, vendor types).
# Export-only: nothing live. Decisions recorded in DESIGN.md → Views → Storage → Sell and store.
# ---------------------------------------------------------------------------
PLAN_TRASH = "VendorTrash"
MARKS_FILE = HERE / "marks.json"   # the keep list: {"<TypeID>": "sell" | "store"}; absent = the plan's default
MARKS_LOCK = threading.Lock()
MARK_VALUES = ("sell", "store")


def is_transfer_chest(vault_key):
    """Account transfer chests are shared by all the player's characters and kept for moving things: a source,
    never a destination (user decision 26 Oct)."""
    return str(vault_key).startswith("*AccountStorage_")


def load_marks():
    try:
        d = json.loads(MARKS_FILE.read_text(encoding="utf-8"))
        return {str(k): v for k, v in d.items() if v in MARK_VALUES} if isinstance(d, dict) else {}
    except Exception:
        return {}


def save_mark(type_id, mark):
    if type_id in (None, "") or not str(type_id).strip().isdigit():
        raise BadRequest("typeId must be a number")
    if mark not in MARK_VALUES and mark is not None:
        raise BadRequest("mark must be sell, store or null")
    with MARKS_LOCK:
        marks = load_marks()
        key = str(int(str(type_id).strip()))
        if mark is None:
            marks.pop(key, None)
        else:
            marks[key] = mark
        tmp = MARKS_FILE.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(marks, indent=1, sort_keys=True), encoding="utf-8")
        os.replace(tmp, MARKS_FILE)
        return marks


def item_keywords(entry):
    return {k.split("=")[0] for k in (entry or {}).get("Keywords") or []}


def plan(character=None):
    st = storage(character)
    if st.get("error"):
        return {"error": "no items export"}
    head = st["source"]
    sheet_head = st.get("sheet")
    sheet = load_report(sheet_head["file"]) if sheet_head else {}
    mult = float((sheet.get("CurrentStats") or {}).get("NPC_MOD_MAXSALESVALUE") or 1.0)
    items = load_report(head["file"]).get("Items") or []
    cdn = cdn_data("items")
    vend = vendors(character) if sheet_head else {"vendors": []}
    # Vendors with councils left, their types as sets; remaining is spent down as stacks are assigned.
    vrows = [dict(v, typeset=set((v.get("buys") or "").split(",")) - {""}, left=v["remaining"]) for v in vend.get("vendors", []) if v.get("remaining")]
    # Vaults with room; the saddlebag travels with you (Anywhere). Free is spent down as stacks are assigned.
    vaults = {v["vault"]: dict(v, left=v["free"]) for v in st["vaults"]
              if v["vault"] != "Inventory" and not is_transfer_chest(v["vault"]) and (v.get("free") or 0) > 0}
    marks = load_marks()
    held = defaultdict(set)   # TypeID -> vaults that already hold it
    for it in items:
        if it.get("StorageVault"):
            held[it.get("TypeID")].add(it["StorageVault"])
    inv = [it for it in items if it.get("IsInInventory")]
    out, areas_used = [], Counter()

    def best_vendor(kws, price, prefer_areas):
        cands = [v for v in vrows if v["typeset"] & kws]
        if not cands:
            return None, False
        whole = [v for v in cands if v["left"] >= price]
        pool = whole or cands
        # a vendor in an area the route already visits first, then the most councils left
        v = max(pool, key=lambda v: (v["area"] in prefer_areas, v["left"]))
        return v, bool(whole)

    def best_vault(tid, prefer_areas):
        cands = [v for v in vaults.values() if v["left"] > 0]
        if not cands:
            return None
        return max(cands, key=lambda v: (v["vault"] in held.get(tid, ()), v["area"] in prefer_areas, v["left"]))

    # Two passes: trash and gear first (they fix the vendor stops), then everything else leaning on those areas.
    def classify(it):
        e = cdn.get(f"item_{it.get('TypeID')}") or {}
        kws = item_keywords(e)
        sellable = bool(kws & buy_words()) and (it.get("Value") or 0) > 0
        mark = marks.get(str(it.get("TypeID")))
        if mark == "sell" and sellable:
            return "sell", kws, sellable       # the keep list wins, gear included
        if it.get("Slot") or it.get("TSysPowers"):
            return "gear", kws, sellable
        if mark == "store":
            return "store", kws, sellable
        if PLAN_TRASH in kws:
            return "sell", kws, sellable
        return "store", kws, sellable
    rows = [(it, *classify(it)) for it in inv]
    rows.sort(key=lambda r: {"sell": 0, "gear": 1, "store": 2}[r[1]])
    for it, kind, kws, sellable in rows:
        qty = it.get("StackSize") or 1
        unit = int(round((it.get("Value") or 0) * mult))
        row = {"typeId": it.get("TypeID"), "name": it.get("Name"), "qty": qty, "value": it.get("Value") or 0, "unit": unit,
               "price": unit * qty, "kind": kind, "action": None, "sellTo": None, "storeAt": None, "note": None,
               "mark": marks.get(str(it.get("TypeID"))), "sellable": sellable}
        prefer = {a for a, n in areas_used.items() if n}
        if sellable:
            v, whole = best_vendor(kws, unit * qty, prefer)
            if v is not None:
                n = qty if whole else max(0, v["left"] // unit) if unit else 0
                row["sellTo"] = {"npc": v["npc"], "name": v["name"], "area": v["area"], "qty": n, "councils": unit * n, "left": v["left"], "whole": whole}
        if kind in ("sell", "gear") and row["sellTo"] and row["sellTo"]["qty"] > 0:
            if kind == "sell":
                row["action"] = "sell"
                v = next(x for x in vrows if x["npc"] == row["sellTo"]["npc"])
                v["left"] -= row["sellTo"]["councils"]
                areas_used[v["area"]] += 1
                if not row["sellTo"]["whole"]:
                    row["note"] = f"{v['name']} can take {row['sellTo']['qty']} of {qty}; the rest stays"
            else:
                row["action"] = "gear"
        if row["action"] is None:
            vt = best_vault(it.get("TypeID"), prefer)
            if vt is not None:
                row["storeAt"] = {"vault": vt["vault"], "name": vt["name"], "area": vt["area"], "free": vt["left"], "holdsSome": vt["vault"] in held.get(it.get("TypeID"), ())}
                row["action"] = "gear" if kind == "gear" else "store"
                if kind != "gear":
                    vt["left"] -= 1
                    areas_used[vt["area"]] += 1
            else:
                row["action"] = "gear" if kind == "gear" else "stays"
                row["note"] = "no vault with room"
            if kind == "store" and not sellable:
                row["why"] = "no vendor buys it" if (it.get("Value") or 0) > 0 else "worth nothing to a vendor"
        out.append(row)
    # Stops: one per area, selling and storing grouped by vendor / vault; the carried saddlebag stop is "Anywhere".
    stops = {}
    for r in out:
        if r["action"] == "sell":
            t, key = r["sellTo"], ("sell", r["sellTo"]["npc"])
        elif r["action"] == "store":
            t, key = r["storeAt"], ("store", r["storeAt"]["vault"])
        else:
            continue
        stop = stops.setdefault(t["area"] or "Elsewhere", {"area": t["area"] or "Elsewhere", "sell": {}, "store": {}, "stacks": 0, "councils": 0})
        g = stop[key[0]].setdefault(key[1], {"id": key[1], "name": t["name"], "items": [], "councils": 0, "stacks": 0,
                                             **({"left": t["left"]} if key[0] == "sell" else {"free": t["free"]})})
        g["items"].append({"typeId": r["typeId"], "name": r["name"], "qty": t.get("qty", r["qty"]), "councils": t.get("councils", 0)})
        g["stacks"] += 1
        g["councils"] += t.get("councils", 0)
        stop["stacks"] += 1
        stop["councils"] += t.get("councils", 0)
    stop_rows = []
    for stp in stops.values():
        sells = sorted(stp["sell"].values(), key=lambda g: -g["councils"])
        stores = sorted(stp["store"].values(), key=lambda g: -g["stacks"])
        for g in sells:
            g["after"] = g["left"] - g["councils"]
        for g in stores:
            g["after"] = g["free"] - g["stacks"]
        stop_rows.append({"area": stp["area"], "stacks": stp["stacks"], "councils": stp["councils"], "sell": sells, "store": stores})
    stop_rows.sort(key=lambda s: (s["area"] in ("Anywhere", "Elsewhere"), -s["stacks"]))  # carried storage last: it can be done any time
    sell_rows = [r for r in out if r["action"] == "sell"]
    gear_rows = [r for r in out if r["action"] == "gear"]
    summary = {
        "stacks": len(inv), "inventoryFree": next((v.get("free") for v in st["vaults"] if v["vault"] == "Inventory"), None),
        "sell": {"stacks": len(sell_rows), "councils": sum(r["sellTo"]["councils"] for r in sell_rows), "vendors": len({r["sellTo"]["npc"] for r in sell_rows})},
        "store": {"stacks": sum(1 for r in out if r["action"] == "store"), "vaults": len({r["storeAt"]["vault"] for r in out if r["action"] == "store"})},
        "gear": {"stacks": len(gear_rows), "councils": sum(r["sellTo"]["councils"] for r in gear_rows if r["sellTo"])},
        "stays": sum(1 for r in out if r["action"] == "stays"),
        "unsellable": sum(1 for r in out if r["action"] == "store" and r.get("why")),
        "stops": len(stop_rows),
    }
    summary["marked"] = sum(1 for r in out if r["mark"])
    return {"character": st["vaults"] and (head.get("character")), "source": head, "sheet": sheet_head, "cdnVersion": cdn_version(),
            "multiplier": mult, "summary": summary, "stops": stop_rows, "items": out, "marks": marks}


# ---------------------------------------------------------------------------
# Party sharing (GET/POST /api/party), docs/SHARING.md. Each copy of the app posts its own closed fights as small
# JSON summaries to an ntfy.sh topic named by a party code, reads the others' from the same topic, and merges
# them into party fights by time overlap. No server of ours: the topic name is the only key.
# ---------------------------------------------------------------------------
PARTY_FILE = HERE / "party.json"
PARTY_LOCK = threading.RLock()
NTFY_BASE = os.environ.get("PG_NTFY", "https://ntfy.sh").rstrip("/")
PARTY_CODE_RE = re.compile(r"^gn-[a-z0-9]{12}$")
PARTY_CODE_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"  # no 0/o, 1/l/i: the code is read out loud or retyped
PARTY_TICK_SEC = 10          # publish and poll cadence
PARTY_IDLE_SEC = 90          # polling stops this long after the last /api/party request; publishing never stops
PARTY_HTTP_SEC = 6
PARTY_MSG_MAX = 4000         # ntfy turns bigger messages into attachments
PARTY_KEEP_SEC = 14 * 3600   # remote summaries kept in memory (ntfy's own cache is 12 h)
PARTY_VERSION = 1
_party = {"code": None, "since": None, "posted": {}, "remote": {}, "sinceId": None, "lastPoll": 0.0, "lastReq": 0.0,
          "lastOkAt": None, "lastErrAt": None, "lastErr": None, "lastPostAt": None, "lastMsgAt": None, "thread": None}


def party_load():
    try:
        d = json.loads(PARTY_FILE.read_text(encoding="utf-8"))
        if PARTY_CODE_RE.match(d.get("code") or ""):
            _party.update(code=d["code"], since=d.get("since"), posted=dict(d.get("posted") or {}))
    except Exception:
        pass


def party_save():
    data = {"code": _party["code"], "since": _party["since"], "posted": _party["posted"]}
    tmp = PARTY_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, indent=1), encoding="utf-8")
    os.replace(tmp, PARTY_FILE)


PARTY_BACKFILL = 3   # a join shares this many of the fights already closed, so the table fills at once


def party_backfill_since():
    """The join clock: the start of the third most recent closed fight with damage (else now), so a join shares
    a little history instead of the whole day."""
    now = datetime.now()
    log = latest_chatlog()
    if not log:
        return local_iso(now)
    try:
        tracker, st = dps_tracker(log)
        rows = [r for r in tracker.result("day", log, st)["fights"] if not r["open"] and not r["minor"] and r["dmg"] > 0]
    except Exception:
        rows = []
    tail = rows[-PARTY_BACKFILL:]
    return tail[0]["at"] if tail else local_iso(now)


def party_set(code):
    """Join a topic (code), leave it (None) or make a new code ("new"). Joining sets the clock to the third most
    recent closed fight (PARTY_BACKFILL): those and every fight that closes from then on are posted, never the
    whole day. The record of what was posted survives a leave, so an undo does not post the same fights twice."""
    import secrets
    with PARTY_LOCK:
        if code == "new":
            code = "gn-" + "".join(secrets.choice(PARTY_CODE_ALPHABET) for _ in range(12))
        elif code is not None:
            code = str(code).strip().lower()
            if not PARTY_CODE_RE.match(code):
                raise BadRequest("a party code looks like gn- and 12 letters or digits")
        if code != _party["code"]:
            _party.update(code=code, since=party_backfill_since() if code else None, remote={}, sinceId=None, lastPoll=0.0,
                          lastOkAt=None, lastErrAt=None, lastErr=None, lastPostAt=None, lastMsgAt=None)
            cutoff = local_iso(datetime.now() - timedelta(hours=24))
            _party["posted"] = {k: v for k, v in _party["posted"].items() if v >= cutoff}
            party_save()
        party_thread()
        return _party["code"]


def party_summary(row, me, app_version):
    """The message one fight becomes: the fight's figures, its top abilities and the enemy ids, under 4 KB."""
    pets = Counter()
    for a in row["abilities"]:
        if a["who"] != "you":
            pets[a["who"]] += a["dmg"]
    out = {"v": PARTY_VERSION, "who": me, "start": row["at"], "end": row["endAt"], "dur": row["dur"],
           "dmg": row["dmg"], "me": row["me"], "pets": dict(pets.most_common(4)), "dps": row["dps"],
           "taken": row["taken"], "kills": row["kills"] + row["petKills"], "deaths": row["deaths"],
           "top": [[a["name"] if a["who"] == "you" else f"{a['who']}: {a['name']}", a["dmg"]] for a in row["abilities"][:5]],
           "targets": [t["name"] for t in row["targets"][:3]], "enemies": row.get("mobIds", [])[:40],
           "area": row["area"], "app": app_version}
    while len(json.dumps(out, separators=(",", ":"))) > PARTY_MSG_MAX and out["enemies"]:
        out["enemies"] = out["enemies"][: len(out["enemies"]) // 2]
    return out


def ntfy(path, data=None, headers=None):
    h = {"User-Agent": "gorgon-notes/" + str(PARTY_VERSION)}
    h.update(headers or {})
    req = Request(f"{NTFY_BASE}/{path}", data=data, headers=h, method="POST" if data is not None else "GET")
    return urlopen(req, timeout=PARTY_HTTP_SEC).read()


def iso_dt(s):
    try:
        return datetime.fromisoformat(s) if s else None
    except ValueError:
        return None


def party_local_rows():
    """This machine's closed, non-minor fights since the code was set (the day scope of the live tracker)."""
    log = latest_chatlog()
    if not log or not _party["code"]:
        return None, []
    tracker, st = dps_tracker(log)
    rep = tracker.result("day", log, st)
    since = iso_dt(_party["since"])
    rows = [r for r in rep["fights"] if not r["open"] and not r["minor"] and r["dmg"] > 0 and r["endAt"]
            and (since is None or (iso_dt(r["endAt"]) or since) >= since)]
    return rep["character"], rows


def party_publish():
    """Post every closed fight not posted yet. A failure leaves it for the next tick."""
    code = _party["code"]
    me, rows = party_local_rows()
    if not code or not me:
        return
    for r in rows:
        key = f"{code}|{r['at']}"
        if key in _party["posted"]:
            continue
        body = json.dumps(party_summary(r, me, "gorgon-notes"), separators=(",", ":")).encode("utf-8")
        try:
            ntfy(code, body, {"Content-Type": "application/json", "X-Title": f"{me}: fight at {r['start'][9:14]}", "X-Tags": "crossed_swords"})
        except Exception as e:
            _party.update(lastErr=f"post: {e}"[:200], lastErrAt=local_iso(datetime.now()))
            return
        now = local_iso(datetime.now())
        _party["posted"][key] = r["endAt"]
        _party.update(lastPostAt=now, lastOkAt=now)
    party_save()


def party_poll():
    """Read what the others posted since the last message seen (all of the topic's 12 h cache the first time)."""
    code = _party["code"]
    if not code:
        return
    try:
        raw = ntfy(f"{code}/json?poll=1&since={_party['sinceId'] or 'all'}")
    except Exception as e:
        _party.update(lastErr=f"poll: {e}"[:200], lastErrAt=local_iso(datetime.now()))
        return
    now = datetime.now()
    _party.update(lastOkAt=local_iso(now), lastPoll=time.time())
    for line in raw.decode("utf-8", errors="replace").splitlines():
        try:
            ev = json.loads(line)
        except ValueError:
            continue
        if ev.get("id"):
            _party["sinceId"] = ev["id"]
        if ev.get("event") != "message":
            continue
        try:
            summ = json.loads(ev.get("message") or "")
        except ValueError:
            continue
        if not isinstance(summ, dict) or summ.get("v") != PARTY_VERSION or not isinstance(summ.get("who"), str):
            continue
        if not all(isinstance(summ.get(k), str) for k in ("start", "end")) or not isinstance(summ.get("dmg"), (int, float)):
            continue
        summ["who"] = summ["who"][:40]
        summ["ntfyAt"] = local_iso(datetime.fromtimestamp(ev.get("time") or now.timestamp()))
        _party["remote"][f"{summ['who']}|{summ['start']}"] = summ  # one row per player and fight, however often it was posted
        _party["lastMsgAt"] = summ["ntfyAt"]
    cutoff = now - timedelta(seconds=PARTY_KEEP_SEC)
    for k in [k for k, v in _party["remote"].items() if (iso_dt(v.get("ntfyAt")) or now).replace(tzinfo=None) < cutoff]:
        del _party["remote"][k]


def party_tick():
    with PARTY_LOCK:
        if not _party["code"]:
            return
        try:
            party_publish()
        except Exception as e:
            _party.update(lastErr=f"publish: {e}"[:200], lastErrAt=local_iso(datetime.now()))
        if time.time() - _party["lastReq"] < PARTY_IDLE_SEC:
            party_poll()


def party_thread():
    """One daemon thread ticks every PARTY_TICK_SEC while a code is set."""
    t = _party.get("thread")
    if t and t.is_alive():
        return
    def loop():
        while True:
            time.sleep(PARTY_TICK_SEC)
            if _party["code"]:
                party_tick()
    t = threading.Thread(target=loop, name="party", daemon=True)
    _party["thread"] = t
    t.start()


def party_merge(me, local_rows, remote, since=None):
    """Party fights: summaries whose time windows overlap, one per player per group. Enemy ids decide nothing
    yet (whether two clients log the same #id for one mob is unverified); `byIds` reports when they did match.
    The window shows fights since this copy joined: a remote fight that ended before `since`, or dealt no
    damage, is left out, as the local ones are."""
    items = []
    for r in local_rows:
        s = party_summary(r, me, "local")
        s["mine"] = True
        items.append(s)
    for s in remote.values():
        if s.get("who") == me or not s.get("dmg"):
            continue
        if since is not None and (iso_dt(s.get("end")) or since) < since:
            continue
        items.append(dict(s, mine=False))
    def t(x):
        try:
            return datetime.fromisoformat(x).timestamp()
        except Exception:
            return None
    items = [dict(i, _s=t(i["start"]), _e=t(i["end"])) for i in items]
    items = [i for i in items if i["_s"] is not None and i["_e"] is not None]
    items.sort(key=lambda i: i["_s"])
    groups = []
    for i in items:
        g = next((g for g in groups if i["_s"] <= g["_e"] and i["_e"] >= g["_s"] and i["who"] not in g["whos"]), None)
        if g is None:
            g = {"_s": i["_s"], "_e": i["_e"], "whos": set(), "items": [], "ids": set()}
            groups.append(g)
        g["_s"], g["_e"] = min(g["_s"], i["_s"]), max(g["_e"], i["_e"])
        g["whos"].add(i["who"])
        g["items"].append(i)
    out = []
    for g in groups:
        id_sets = [set(map(str, i.get("enemies") or [])) for i in g["items"]]
        shared = len(id_sets) > 1 and bool(set.intersection(*id_sets))
        members = sorted(({k: v for k, v in i.items() if not k.startswith("_") and k != "v"} for i in g["items"]), key=lambda m: -m["dmg"])
        total = sum(m["dmg"] for m in members)
        for m in members:
            m["share"] = round(m["dmg"] / total, 3) if total else 0
        first = min(g["items"], key=lambda i: i["_s"])
        out.append({"id": first["start"], "start": first["start"], "end": max(g["items"], key=lambda i: i["_e"])["end"],
                    "dur": int(g["_e"] - g["_s"]) + 1, "area": next((i.get("area") for i in g["items"] if i.get("area")), None),
                    "total": total, "byIds": shared, "members": members, "solo": len(members) == 1})
    return out


def party_state():
    """GET /api/party: the code, the link's health and the merged party fights."""
    with PARTY_LOCK:
        _party["lastReq"] = time.time()
        code = _party["code"]
        if code:
            party_thread()
            if not _party["lastPoll"]:  # first look after joining or starting: fetch now; the thread takes over
                party_poll()
        me, rows = party_local_rows() if code else (None, [])
        fights = party_merge(me, rows, _party["remote"], iso_dt(_party["since"])) if code else []
        ok, err = _party["lastOkAt"], _party["lastErrAt"]
        reachable = bool(ok) and (not err or ok >= err)
        pending = len([r for r in rows if f"{code}|{r['at']}" not in _party["posted"]]) if code else 0
        return {"version": PARTY_VERSION, "code": code, "since": _party["since"], "character": me, "base": NTFY_BASE,
                "ntfy": {"reachable": reachable, "lastOkAt": ok, "lastErrorAt": err, "lastError": _party["lastErr"],
                         "lastPostAt": _party["lastPostAt"], "lastMessageAt": _party["lastMsgAt"],
                         "posted": len([k for k in _party["posted"] if code and k.startswith(code + "|")]),
                         "pending": pending, "received": len(_party["remote"])},
                "members": sorted({m["who"] for f in fights for m in f["members"]}), "fights": fights}


def gaming_receipt(gaming, t, amount, run=False):
    """Is a councils receipt at datetime t a casino win? `gaming` is the sorted list of Gaming XP datetimes.
    A 0 receipt always is: every "You received 0 Councils." in every log is a slot pull in the Casino (278 of
    278, 24 Oct), and a losing streak runs past any window from the last win (zeros 121 to 127 s after the
    Gaming XP line, zeros before the first win of a visit, zeros at the top of a log). Otherwise within 3 s of
    a Gaming XP line, or within 120 s after one when it sits in a run of slot pulls (`run`, see gaming_flags)."""
    if amount == 0:
        return True
    i = bisect.bisect_left(gaming, t)
    for j in (i - 1, i):
        if 0 <= j < len(gaming) and abs((gaming[j] - t).total_seconds()) <= GAMING_NEAR_SEC:
            return True
    return run and i > 0 and (t - gaming[i - 1]).total_seconds() <= GAMING_ZERO_SEC


def gaming_flags(gaming, receipts):
    """One bool per (datetime, amount) receipt, chronological: casino win or not. Small wins (3 to 19
    councils) land 8 to 66 s after the Gaming XP line inside the run of 0 receipts, so a receipt within
    GAMING_RUN_SEC of the previous gaming receipt or of the next 0 receipt is gaming too; an isolated
    receipt (the 33,250 ones, nothing within 60 s) is not."""
    flags = []
    for k, (t, n) in enumerate(receipts):
        prev = k > 0 and flags[-1] and (t - receipts[k - 1][0]).total_seconds() <= GAMING_RUN_SEC
        nxt = k + 1 < len(receipts) and receipts[k + 1][1] == 0 and (receipts[k + 1][0] - t).total_seconds() <= GAMING_RUN_SEC
        flags.append(gaming_receipt(gaming, t, n, run=prev or nxt))
    return flags


def councils_match(msg):
    """(kind, amount, who[, source]) for a councils line, else None. Names are kept verbatim ("1 victim" is one).
    `source` on receipts: "councils" (the game's own line), "corpse" (looted), "coins" ("You receive N coins"),
    "given" (another player handed them over, `who` names them)."""
    if m := COUNCILS_RECEIVED_RE.match(msg):
        return "received", int(m.group(1).replace(",", "")), None, "councils"
    if m := COINS_CORPSE_RE.match(msg):
        return "received", int(m.group(1).replace(",", "")), None, "corpse"
    if m := COINS_RECEIVE_RE.match(msg):
        return "received", int(m.group(1).replace(",", "")), None, "coins"
    if m := COINS_GIVEN_RE.match(msg):
        return "received", int(m.group(1).replace(",", "")), m.group(2), "given"
    if m := COUNCILS_STOLEN_RE.match(msg):
        return "stolen", int(m.group(2).replace(",", "")), m.group(1)
    if m := COUNCILS_RECOVERED_RE.match(msg):
        return "recovered", int(m.group(1).replace(",", "")), m.group(2)
    if m := COUNCILS_OVERBURDENED_RE.match(msg):
        return "overburdened", int(m.group(1).replace(",", "")), m.group(2)
    return None


def councils_events(lines, character=None):
    """Councils events, chronological, from (ts, msg) lines already in scope. `character` is the fallback
    for lines before the first login in `lines`; a login line switches it."""
    gaming = [chat_dt(ts) for ts, msg in lines if GAMING_XP_RE.match(msg)]
    out = []
    for ts, msg in lines:
        if lm := LOGIN_RE.match(msg):
            character = lm.group(1)
            continue
        hit = councils_match(msg)
        if not hit:
            continue
        kind, amount, who = hit[:3]
        source = hit[3] if len(hit) > 3 else None
        e = {"ts": ts, "at": chat_iso(ts), "kind": kind, "amount": amount, "character": character}
        if kind != "received" or who:
            e["who"] = who
        if kind == "received":
            e["source"] = source
            e["gaming"] = False
        out.append(e)
    # Only the game's own "You received N Councils." lines can be casino wins; coins lines never are.
    received = [e for e in out if e["kind"] == "received" and e["source"] == "councils"]
    for e, g in zip(received, gaming_flags(gaming, [(chat_dt(e["ts"]), e["amount"]) for e in received])):
        e["gaming"] = g
    return out


def councils_on_hand(character):
    """Councils balance (Currencies.GOLD) from the newest good character export, or None."""
    if not character:
        return None
    try:
        rep = latest_report("CharacterSheet", character)
        if not rep:
            return None
        amount = (load_report(rep["file"]).get("Currencies") or {}).get("GOLD")
        if amount is None:
            return None
        return {"amount": int(amount), "at": local_iso(report_dt(rep["timestamp"] or "")), "file": rep["file"],
                "character": character}
    except Exception:
        return None


def councils_owner(events, character):
    """Whose balance belongs under the events: the one character the events in scope belong to (a day that
    ends on an alt still pairs the main's thefts with the main's export), else the chat log's `character`."""
    owners = {e["character"] for e in events if e.get("character")}
    return next(iter(owners)) if len(owners) == 1 else character


def councils_summary(events, character, selected=None):
    """The /api/session `councils` object. `received` is what came in outside the casino (coins lines included
    since 26 Oct), `gaming` the casino wins as their own figure; net = received + gaming - stolen + recovered;
    overburdened [Error] lines are reported but not counted (what they mean beyond their wording is unverified).
    `onHand` is the export of the character selected in the page (`selected`, user decision 26 Oct), else of
    the events' owner (councils_owner)."""
    rec = [e for e in events if e["kind"] == "received"]
    gam = [e for e in rec if e["gaming"]]
    plain = [e for e in rec if not e["gaming"]]
    sto = [e for e in events if e["kind"] == "stolen"]
    rcv = [e for e in events if e["kind"] == "recovered"]
    ovb = [e for e in events if e["kind"] == "overburdened"]
    received, gaming, stolen, recovered = (sum(e["amount"] for e in g) for g in (plain, gam, sto, rcv))
    thieves = []
    for e in sto:
        if e["who"] not in thieves:
            thieves.append(e["who"])
    by_source = Counter(e["source"] for e in plain)
    return {
        "received": received, "receivedLines": len(plain),
        "corpseLines": by_source.get("corpse", 0), "corpseCoins": sum(e["amount"] for e in plain if e["source"] == "corpse"),
        "coinsLines": by_source.get("coins", 0) + by_source.get("given", 0),
        "zeroLines": sum(1 for e in rec if e["amount"] == 0),
        "gaming": gaming, "gamingLines": len(gam), "gamingWins": sum(1 for e in gam if e["amount"] > 0),
        "gamingReceived": gaming,  # kept for older pages
        "stolen": stolen, "stolenLines": len(sto), "thieves": thieves,
        "recovered": recovered, "recoveredLines": len(rcv),
        "net": received + gaming - stolen + recovered,
        "overburdened": sum(e["amount"] for e in ovb), "overburdenedLines": len(ovb),
        "events": events,
        "spendingLogged": False,  # the chat log has no councils-spent line (casino tickets name no currency: unverified)
        "onHand": councils_on_hand(selected or councils_owner(events, character)),
    }


def parse_session(path, scope="day", selected=None):
    """Summarise a chat log: the whole day, or only since the last login."""
    lines = []
    with path.open(encoding="utf-8", errors="replace") as f:
        for raw in f:
            m = LINE_RE.match(raw.rstrip("\n"))
            if m:
                lines.append((m.group(1), m.group(2)))
            elif lines:  # continuation of a multi-line message
                lines[-1] = (lines[-1][0], lines[-1][1] + " " + raw.strip())

    all_lines = lines
    # start at the last login marker
    start = None
    for i, (_, msg) in enumerate(lines):
        if LOGIN_RE.match(msg) and (scope == "login" or start is None):
            start = i
    lines = lines[start or 0:]

    character = server = None
    events = []
    channels = Counter()
    xp = defaultdict(int)
    levels = []
    loot = Counter()
    areas = []
    xp_timeline = []  # (ts, total) for sparkline
    total_xp = 0
    for ts, msg in lines:
        cm = CHANNEL_RE.match(msg)
        channels[cm.group(1) if cm else "System"] += 1
        if m := LOGIN_RE.match(msg):
            character, server = m.groups()
            events.append({"ts": ts, "at": chat_iso(ts), "kind": "login", "character": character, "server": server})
        elif LOGOUT_RE.match(msg):
            events.append({"ts": ts, "at": chat_iso(ts), "kind": "logout"})
        elif m := AREA_RE.match(msg):
            areas.append({"ts": ts, "area": m.group(1)})
            events.append({"ts": ts, "at": chat_iso(ts), "kind": "area", "area": m.group(1)})
        elif (m := SAVED_RE.search(msg)) and msg.startswith("[Status]"):
            info = report_info(m.group(1))
            if info:
                events.append({"ts": ts, "at": chat_iso(ts), "kind": "export", **info})
        elif m := XP_RE.match(msg):
            amount, lvl, skill = int(m.group(1)), m.group(2), m.group(3)
            xp[skill] += amount
            total_xp += amount
            xp_timeline.append([ts, total_xp])
            if lvl:
                levels.append({"ts": ts, "skill": skill, "level": int(lvl)})
                events.append({"ts": ts, "at": chat_iso(ts), "kind": "level", "skill": skill, "level": int(lvl)})
        elif m := LOOT_RE.match(msg):
            loot[m.group(1)] += int(m.group(2) or 1)

    # Second pass: deaths, kills and pet kills. Follows `scope` like xp and loot, so the day scope
    # can miss a death before the day's first login (combat31d sums whole files instead).
    resolved = []

    def resolve():
        resolved.append(last_login_before(path))
        return resolved[0][0]
    tracker = CombatTracker(resolve=resolve)
    for ts, msg in lines:
        tracker.feed(ts, msg)
    combat = tracker.result()
    if combat["deaths"]:
        events.extend(combat["deaths"])
        events.sort(key=lambda e: e["ts"])

    if character is None:
        character, server = resolved[0] if resolved else last_login_before(path)

    # Councils in and out, same `lines` slice (the first line in scope is a login line whenever there is one).
    councils = councils_summary(councils_events(lines, character), character, selected)

    def to_dt(ts):
        return datetime.strptime(ts, "%y-%m-%d %H:%M:%S")

    started = lines[0][0] if lines else None
    hours = 0
    live = (datetime.now().timestamp() - path.stat().st_mtime) < 15 * 60
    if started:
        end = datetime.now() if live else to_dt(lines[-1][0])
        hours = max((end - to_dt(started)).total_seconds() / 3600, 1 / 60)
    logged_in, logged_in_at, logged_out_at = login_state(path, all_lines)
    return {
        "loggedIn": logged_in,
        "loggedInAt": logged_in_at,
        "loggedOutAt": logged_out_at,
        "lastLineAt": chat_iso(all_lines[-1][0]) if all_lines else None,
        "playing": bool(live and logged_in),
        "events": events,
        "channels": dict(channels),
        "log": path.name,
        "scope": scope,
        "character": character,
        "server": server,
        "started": started,
        "live": live,
        "hours": hours,
        "xp": sorted(({"skill": k, "xp": v, "perHour": v / hours if hours else 0} for k, v in xp.items()),
                     key=lambda r: -r["xp"]),
        "totalXp": total_xp,
        "levels": levels,
        "loot": [{"item": k, "count": v} for k, v in loot.most_common()],
        "areas": areas,
        "currentArea": areas[-1]["area"] if areas else None,
        "xpTimeline": xp_timeline,
        "combat": {"deaths": len(combat["deaths"]), "kills": combat["kills"], "petKills": combat["petKills"],
                   "petDeaths": combat["petDeaths"], "closeCalls": combat["closeCalls"], "pets": combat["pets"],
                   "lastDeath": {k: v for k, v in combat["deaths"][-1].items() if k != "kind"} if combat["deaths"] else None},
        "combat31d": combat_31d(),
        "councils": councils,
    }


def tail(path, offset, limit=200):
    size = path.stat().st_size
    if offset is None or offset > size:
        offset = max(0, size - 20000)
    with path.open("rb") as f:
        f.seek(offset)
        data = f.read()
    text = data.decode("utf-8", errors="replace")
    out = []
    for raw in text.splitlines():
        m = LINE_RE.match(raw)
        if m:
            out.append({"ts": m.group(1), "msg": m.group(2)})
    return {"log": path.name, "offset": size, "lines": out[-limit:]}


# ---------------------------------------------------------------------------
# Data health (GET /api/health). Additive; see DESIGN.md -> Server contract.
# ---------------------------------------------------------------------------
THRESHOLDS = {"character-export": 86400, "storage-export": 172800, "chat-silence": 900, "alt-stale": 604800}
# Activity since the storage export that turns it amber (served as "activityThresholds"). A storage search is
# always a deliberate storage interaction, so 1 counts. Loot is counted in stacks (lines), since a stack is
# what fills a slot: over 143 real login sessions the median was 33 stacks and the 75th percentile 119;
# sessions under 20 min never reach 50, hour-long ones always do.
ACTIVITY = {"storageSearches": 1, "lootStacks": 50}
# export-stale reminder anchors: a search or loot pause within followThroughSec after entering a vault area is the
# zone-storage reminder's follow-through (deferred, not a reminder); anchors are at least gapSec apart.
STALE_REMINDER = {"followThroughSec": 15 * 60, "gapSec": 2 * 3600}
_logsum = {}
_plog = {"key": None, "found": None}


def chat_logs():
    return sorted(CHATLOGS.glob("Chat-*.log"), key=lambda p: p.stat().st_mtime)


def chat_logs_before(path, limit=10):
    logs = chat_logs()
    older = logs[:logs.index(path)] if path in logs else logs
    return older[-limit:]


def log_summary(path):
    """Compact per-log facts used by health checks; cached by size and mtime."""
    st = path.stat()
    key = (st.st_size, st.st_mtime)
    hit = _logsum.get(path)
    if hit and hit[0] == key:
        return hit[1]
    s = {"logins": [], "logouts": [], "areas": [], "sales": [], "favor": [], "searches": [],
         "loot": [], "saved": [], "activity": [], "councils": [], "first": None, "last": None}
    tracker = CombatTracker(resolve=lambda: last_login_before(path)[0])  # deaths/kills; see CombatTracker
    gaming = []  # Gaming XP datetimes; the councils receipts are flagged against them after the loop
    with path.open(encoding="utf-8", errors="replace") as f:
        for raw in f:
            m = LINE_RE.match(raw.rstrip("\n"))
            if not m:
                continue
            ts, msg = m.groups()
            s["first"] = s["first"] or ts
            s["last"] = ts
            tracker.feed(ts, msg)
            if lm := LOGIN_RE.match(msg):
                s["logins"].append((ts, lm.group(1), lm.group(2)))
            elif LOGOUT_RE.match(msg):
                s["logouts"].append(ts)
            elif am := AREA_RE.match(msg):
                s["areas"].append((ts, am.group(1)))
            elif cm := councils_match(msg):
                if cm[0] != "received" or cm[3] == "councils":  # coins lines (corpses, gifts) are never vendor sales
                    s["councils"].append((ts,) + cm[:3])  # (ts, kind, amount, who); gaming flag added below
            elif fm := FAVOR_GAIN_RE.match(msg):
                s["favor"].append((ts, fm.group(2)))
            elif SEARCH_RE.match(msg):
                s["searches"].append(ts)
            elif (rm := SAVED_RE.search(msg)) and msg.startswith("[Status]"):
                info = report_info(rm.group(1))
                if info:
                    s["saved"].append((ts, info))
            elif lo := LOOT_RE.match(msg):
                s["loot"].append((ts, int(lo.group(2) or 1)))
                if not s["activity"] or s["activity"][-1] != ts[:14]:
                    s["activity"].append(ts[:14])
            elif msg.startswith("[Combat]") or (xm := XP_RE.match(msg)):
                if not msg.startswith("[Combat]") and xm.group(3) == "Gaming":
                    gaming.append(chat_dt(ts))
                if not s["activity"] or s["activity"][-1] != ts[:14]:
                    s["activity"].append(ts[:14])
    s["combat"] = tracker.result()  # "deaths" is the event list here; /api/session reports its length
    # (ts, kind, amount, who, gaming); "sales" keeps its (ts, amount) shape but holds only non-zero receipts
    # that are not casino wins, so the character-export evidence and the after-selling moment skip gambling.
    flags = iter(gaming_flags(gaming, [(chat_dt(ts), n) for ts, kind, n, who in s["councils"] if kind == "received"]))
    s["councils"] = [(ts, kind, n, who, kind == "received" and next(flags)) for ts, kind, n, who in s["councils"]]
    s["sales"] = [(ts, n) for ts, kind, n, who, g in s["councils"] if kind == "received" and n > 0 and not g]
    _logsum[path] = (key, s)
    return s


def read_settings():
    try:
        out = {"readable": True}
        combat = {}
        for line in SETTINGS_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
            parts = line.split("\t")
            if len(parts) < 3:
                continue
            key, val = parts[1], parts[-1].strip()
            if key in ("LogChat", "GUI_ChatLogs", "AutoExportCharacterOnLogout", "VIP_CombatLogging", "LogNonAttacks"):
                out[key] = int(val) if val.lstrip("-").isdigit() else val
            elif key.startswith("combatLog_"):
                combat[key[10:]] = int(val) if val.lstrip("-").isdigit() else val
        out["combatLog"] = combat
        return out
    except Exception:
        return {"readable": False}


_running = {"at": 0.0, "value": None}


def game_running():
    try:
        if WINDOWS:
            # The Windows binary's name is not verified; any process image containing "gorgon" counts
            # (our own process is python.exe). tasklist takes ~0.1 s, so the answer is kept for 5 s.
            if time.time() - _running["at"] < 5:
                return _running["value"]
            r = subprocess.run(["tasklist", "/FO", "CSV", "/NH"], capture_output=True, timeout=5,
                               creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
            names = [line.split(",", 1)[0].strip('"').lower()
                     for line in r.stdout.decode("utf-8", errors="replace").splitlines()]
            value = any("gorgon" in n for n in names) if r.returncode == 0 and names else None
            _running.update(at=time.time(), value=value)
            return value
        # Verified 2026-10-23: the binary is MacPlayer.app/Contents/MacOS/Project Gorgon.
        r = subprocess.run(["pgrep", "-x", "Project Gorgon"], capture_output=True, timeout=2)
        return {0: True, 1: False}.get(r.returncode)
    except Exception:
        return None


def player_log_events():
    try:
        st = PLAYER_LOG.stat()
    except OSError:
        return None
    key = (st.st_size, st.st_mtime)
    if _plog["key"] != key:
        found = False
        with PLAYER_LOG.open("rb") as f:
            for raw in f:
                if b"LocalPlayer: Process" in raw:
                    found = True
                    break
        _plog.update(key=key, found=found)
    return _plog["found"]


def human_age(sec):
    if sec is None:
        return ""
    if sec < 90:
        return "just now"
    if sec < 3600:
        return f"{int(sec // 60)} min ago"
    if sec < 86400:
        return f"{int(sec // 3600)} h ago"
    return f"{int(sec // 86400)} d ago"


def plural(n, one, many=None):
    return f"{n:,} {one if n == 1 else (many or one + 's')}"


def join_names(names):
    names = list(names)
    if len(names) <= 1:
        return "".join(names)
    return ", ".join(names[:-1]) + " and " + names[-1]


def join_some(names, k=4):
    """First k names, then 'and N more', so a list never drops names silently."""
    names = list(names)
    if len(names) <= k:
        return join_names(names)
    return ", ".join(names[:k]) + f" and {len(names) - k} more"


def health(character=None):
    now = datetime.now().astimezone()
    logs = chat_logs()
    newest = logs[-1] if logs else None
    recent = [p for p in logs if now.timestamp() - p.stat().st_mtime < 31 * 86400]
    sums = [(p, log_summary(p)) for p in recent]
    settings = read_settings()
    running = game_running()

    # --- game state from login/logout lines
    last_in = last_out = None
    for p, sm in reversed(sums):
        if last_in is None and sm["logins"]:
            last_in = sm["logins"][-1]
        if last_out is None and sm["logouts"]:
            last_out = sm["logouts"][-1]
        if last_in and last_out:
            break
    logged_in = bool(last_in and (last_out is None or chat_dt(last_in[0]) > chat_dt(last_out)))
    last_line = None
    for p, sm in reversed(sums):
        if sm["last"]:
            last_line = sm["last"]
            break
    silence = (now.replace(tzinfo=None) - chat_dt(last_line)).total_seconds() if last_line else None
    area = area_since = None
    for p, sm in reversed(sums):
        if sm["areas"]:
            area_since, area = sm["areas"][-1]
            break
    running_known = running is not None
    effective_running = running if running_known else bool(logged_in and silence is not None and silence < 900)
    game_char = last_in[1] if last_in else None
    character = character or game_char
    game = {"running": running, "loggedIn": logged_in, "character": game_char,
            "loggedInAt": chat_iso(last_in[0]) if last_in else None,
            "loggedOutAt": chat_iso(last_out) if last_out else None,
            "area": area, "areaSince": chat_iso(area_since),
            "lastLineAt": chat_iso(last_line), "log": newest.name if newest else None}

    # --- exports
    reports = list_reports()

    def newest_report(kind, who):
        rs = [r for r in reports if r["report"] == kind and r["character"] == who and report_dt(r["timestamp"] or "")]
        return max(rs, key=lambda r: report_dt(r["timestamp"])) if rs else None

    char_rep = newest_report("CharacterSheet", character)
    stor_rep = newest_report("Storage", character)

    def since(dt_utc, who=None, vaults=()):
        """Activity in every chat log after a UTC export time, counting only lines written while `who`
        was logged in (the last "Logged In As" line at or before the line, carried across logs).
        `vaults` (the character's vault areas) feeds the export-stale reminder anchors: `searchReminders`, every
        storage search that is not a zone-storage follow-through (within STALE_REMINDER followThroughSec after
        entering a vault area) and comes gapSec after the previous anchor; `lootReminders`, every zone change
        that is not into a vault area or a follow-through of one, after ACTIVITY lootStacks more stacks than
        the previous anchor (or the export) and gapSec after it. Each is an ISO local time."""
        out = {"sales": 0, "councils": 0, "favorGains": 0, "favorNpcs": [], "storageSearches": 0,
               "itemsLooted": 0, "areas": [], "lootStacks": 0, "firstSearchAt": None, "lootCrossedAt": None,
               "lootPauseAt": None, "searchReminders": [], "lootReminders": [], "activityBy": who}
        if not dt_utc:
            return out
        cut = dt_utc.astimezone().replace(tzinfo=None)
        follow, gap = STALE_REMINDER["followThroughSec"], STALE_REMINDER["gapSec"]
        last_vault = None  # when `who` last entered a vault area (naive local)
        search_rem_at, loot_rem_at, loot_rem_stacks = None, None, 0  # the previous anchors
        cur = None  # character of the last login seen so far
        for p, sm in sums:
            if sm["last"] and chat_dt(sm["last"]) < cut:
                if sm["logins"]:
                    cur = sm["logins"][-1][1]
                continue
            login_ts = [l[0] for l in sm["logins"]]

            def owner(ts):
                i = bisect.bisect_right(login_ts, ts)
                return sm["logins"][i - 1][1] if i else cur

            def counts(ts):
                return chat_dt(ts) > cut and (who is None or owner(ts) == who)

            for ts, n in sm["sales"]:
                if counts(ts):
                    out["sales"] += 1
                    out["councils"] += n
            for ts, npc in sm["favor"]:
                if counts(ts):
                    out["favorGains"] += 1
                    if npc not in out["favorNpcs"]:
                        out["favorNpcs"].append(npc)
            # searches, loot and zone changes in log order (the ts strings sort chronologically)
            evs = sorted([(ts, "search", None) for ts in sm["searches"]] + [(ts, "loot", n) for ts, n in sm["loot"]] +
                         [(ts, "area", a) for ts, a in sm["areas"]])
            for ts, kind, val in evs:
                if not counts(ts):
                    continue
                dt = chat_dt(ts)
                followed = last_vault is not None and 0 <= (dt - last_vault).total_seconds() <= follow
                if kind == "search":
                    out["storageSearches"] += 1
                    out["firstSearchAt"] = out["firstSearchAt"] or chat_iso(ts)
                    if not followed and (search_rem_at is None or (dt - search_rem_at).total_seconds() >= gap):
                        out["searchReminders"].append(chat_iso(ts))
                        search_rem_at = dt
                elif kind == "loot":
                    out["itemsLooted"] += val
                    out["lootStacks"] += 1
                    if out["lootStacks"] == ACTIVITY["lootStacks"]:
                        out["lootCrossedAt"] = chat_iso(ts)
                else:
                    if val not in out["areas"]:
                        out["areas"].append(val)
                    if out["lootCrossedAt"] and not out["lootPauseAt"] and chat_iso(ts) > out["lootCrossedAt"]:
                        out["lootPauseAt"] = chat_iso(ts)  # first zone change after the crossing: a pause
                    if val in vaults:
                        last_vault = dt  # the zone-storage reminder fires here; what follows is its follow-through
                    elif (not followed and out["lootStacks"] - loot_rem_stacks >= ACTIVITY["lootStacks"] and
                          (loot_rem_at is None or (dt - loot_rem_at).total_seconds() >= gap)):
                        out["lootReminders"].append(chat_iso(ts))
                        loot_rem_at, loot_rem_stacks = dt, out["lootStacks"]
            if sm["logins"]:
                cur = sm["logins"][-1][1]
        return out

    vault_areas = set()
    vendor_rows = []
    try:
        st = storage(character)
        vault_areas = {v["area"] for v in st.get("vaults", []) if v.get("area") and v["area"] != "Anywhere" and v.get("used")}
        vaults = st.get("vaults", [])
    except Exception:
        st, vaults = {}, []
    try:
        vendor_rows = vendors(character).get("vendors", [])
    except Exception:
        vendor_rows = []

    items = []

    def add(source, severity, title, evidence, fix_key=None, views=(), at=None, item_id=None, server_only=False,
            evidence_data=None, fix_args=None, **extra):
        age = (now - at).total_seconds() if at else None
        views = list(views) + (["files"] if source in FILES_SOURCES and "files" not in views else [])  # Files margin
        items.append({"id": item_id or source, "source": source, "severity": severity,
                      "at": local_iso(at) if at else None, "ageSec": int(age) if age is not None else None,
                      "title": title, "evidence": evidence, "evidenceData": evidence_data or {},
                      "fixKey": fix_key, "fixArgs": fix_args or {}, "topic": source,
                      "views": views, "serverOnly": server_only, **extra})

    # game
    if not newest:
        ev = {True: "The game is running, but without a chat log there's no login to follow.",
              False: "The game isn't running. Without a chat log there's nothing more to know."}.get(running, "Not known without a chat log.")
        add("game", "info", "Game", ev, views=[])
    elif logged_in:
        ev = f"Logged in as {game_char}" + (f" in {area}." if area else ".")
        if not running_known:
            ev += " Couldn't check whether the game is running; going by the chat log."
        add("game", "ok" if effective_running else "info", "Game", ev, views=[], server_only=True)
    else:
        if last_out:
            ev = f"Logged out {chat_dt(last_out).strftime('%H:%M')}."
            if running is False:
                ev += " Game not running."
            elif running is True:
                ev += " The game is running."
        elif running is True:
            ev = "The game is running, but with no chat log there's no login to follow."
        elif running is False:
            ev = "Game not running."
        else:
            ev = "Couldn't check whether the game is running, and there's no chat log to go by."
        add("game", "info", "Game", ev, views=[], server_only=True)

    # chat log
    if not newest:
        # Say exactly what was looked at, so a player on a new machine can tell a wrong folder from a setting
        # that is still off (seen on a friend's Windows PC, 2026-10-24: exports fine, no ChatLogs file).
        ev = "No chat log found. The game only writes one with Log All Chat on."
        looked = f" Looked in {CHATLOGS}" + ("" if CHATLOGS.is_dir() else ", which doesn't exist") + "."
        if settings.get("readable"):
            state = {1: "on", 0: "off"}.get(settings.get("LogChat"))
            try:
                saved = datetime.fromtimestamp(SETTINGS_FILE.stat().st_mtime).strftime("%H:%M")
            except OSError:
                saved = None
            if state:
                looked += f" The game's settings file (saved {saved}) says chat logging is {state}."
                if state == "on":
                    looked += " No log file has appeared yet: log out and back in, then check again."
        else:
            looked += f" The game's settings file ({SETTINGS_FILE.name}) couldn't be read."
        add("chat-log", "bad", "Chat log", ev + looked,
            "chat-logging", views=["session", "combat", "vendors", "storage", "character"])
    elif settings.get("readable") and settings.get("LogChat") == 0:
        add("chat-log", "bad", "Chat log", "Chat logging is off in the game, so nothing new is recorded.",
            "chat-logging", views=["session", "combat", "vendors", "storage", "character"], server_only=True,
            at=chat_dt(last_line).astimezone() if last_line else None)
    else:
        lat = chat_dt(last_line).astimezone() if last_line else None
        today = newest.name == now.strftime("Chat-%y-%m-%d.log")
        if logged_in and effective_running and silence is not None and silence >= 900:
            add("chat-log", "warn", "Chat log", f"You're logged in but nothing was written since {lat.strftime('%H:%M')}.",
                "chat-logging", views=["session", "combat"], at=lat)
        elif running is True and not today:
            add("chat-log", "warn", "Chat log", "The game is running but there's no chat log for today yet.",
                "chat-logging", views=["session", "combat"], at=lat)
        elif logged_in and not effective_running:
            add("chat-log", "info", "Chat log", "The last session has no Logged Out line, so it may have been cut short (quit or crash).",
                "chat-logging-ok", views=["session", "combat"], at=lat)
        else:
            ev = "Being written as you play." if logged_in else "Logging is on. It fills in next time you play."
            add("chat-log", "ok", "Chat log", ev, "chat-logging-ok", views=["session", "combat"], at=lat)

    # character export
    if not char_rep:
        add("character-export", "bad", "Character export", f"No character export{' for ' + character if character else ''} yet.",
            "export-character", views=["vendors", "character", "storage"], item_id=f"character-export:{character}")
    else:
        at = report_dt(char_rep["timestamp"])
        act = since(at, character)
        bits = []
        if act["sales"]:
            bits.append(f"You received councils {plural(act['sales'], 'time')} since it, not counting Gaming wins, so vendor room is lower than shown.")
        if act["favorGains"]:
            bits.append(f"You gained favor {plural(act['favorGains'], 'time')} since, with {join_names(act['favorNpcs'][:3])}.")
        age = (now - at).total_seconds()
        sev = "warn" if bits or age >= THRESHOLDS["character-export"] else "ok"
        ev = " ".join(bits) or ("No councils received or favor gained since it." if sev == "ok" else f"It's {human_age(age).replace(' ago', '')} old.")
        add("character-export", sev, "Character export", ev, "export-character", views=["vendors", "character", "storage"],
            at=at, item_id=f"character-export:{character}", evidence_data=act, file=char_rep["file"])

    # storage export
    stor_act, stor_activity = None, False  # the storage export's since() result; whether searches or loot made it warn
    if not stor_rep:
        add("storage-export", "bad", "Storage export", f"No storage export{' for ' + character if character else ''} yet.",
            "export-storage", views=["storage", "vendors"], item_id=f"storage-export:{character}")
    else:
        at = report_dt(stor_rep["timestamp"])
        act = stor_act = since(at, character, vault_areas)
        visited = [a for a in act["areas"] if a in vault_areas]
        bits = []
        if visited:
            bits.append(f"Since then you visited {join_names(visited[:4])}, where your vaults are.")
        if act["storageSearches"] >= ACTIVITY["storageSearches"]:
            bits.append(f"You've searched your storage {plural(act['storageSearches'], 'time')} since it, so vault contents have likely moved.")
        if act["lootStacks"] >= ACTIVITY["lootStacks"]:
            bits.append(f"You've picked up {plural(act['lootStacks'], 'stack')} of loot since it, so Slots Free is lower than shown.")
        stor_activity = len(bits) > (1 if visited else 0)  # searches or loot, not a visit alone; feeds the export-stale moment
        age = (now - at).total_seconds()
        sev = "warn" if bits or age >= THRESHOLDS["storage-export"] else "ok"
        ev = " ".join(bits) or (f"No vault visits or storage searches since it, and under {ACTIVITY['lootStacks']} stacks of loot." if sev == "ok"
                                else f"It's {human_age(age).replace(' ago', '')} old.")
        act["vaultAreas"] = visited
        add("storage-export", sev, "Storage export", ev, "export-storage", views=["storage"] + (["vendors"] if sev != "ok" else []),
            at=at, item_id=f"storage-export:{character}", evidence_data=act, file=stor_rep["file"])

    # partial export
    partials = [r for r in reports if r["report"] == "CharacterSheet" and r["character"] == "???" and report_dt(r["timestamp"] or "")]
    if not partials:
        add("partial-export", "ok", "Partial export", "No partial exports.", views=[])
    else:
        pr = max(partials, key=lambda r: report_dt(r["timestamp"]))
        pat = report_dt(pr["timestamp"])
        goods = [r for r in reports if r["report"] == "CharacterSheet" and r["character"] not in (None, "???") and report_dt(r["timestamp"] or "")]
        twin = next((g for g in goods if abs((report_dt(g["timestamp"]) - pat).total_seconds()) <= 120), None)
        newer_good = any(report_dt(g["timestamp"]) > pat for g in goods if g["character"] == character)
        if twin or newer_good:
            gap = int(abs((report_dt(twin["timestamp"]) - pat).total_seconds())) if twin else None
            ev = (f"At logout the game also wrote a second, incomplete copy of your export ({gap} s after the good one). It's ignored; the good one is in use."
                  if twin else "An older partial export is ignored; a newer good one is in use.")
            add("partial-export", "info", "Partial export", ev, views=["character"], at=pat, file=pr["file"])
        else:
            add("partial-export", "bad", "Partial export",
                'That export came out a bit… partial (name "???"). Export again while fully logged in.',
                "export-again", views=["character", "vendors", "storage"], at=pat, file=pr["file"])

    # auto export on logout
    if settings.get("readable"):
        if settings.get("AutoExportCharacterOnLogout") == 1:
            # Folded: when a partial copy exists, the Partial export note already says it's ignored.
            add("auto-export", "info", "Auto-export on logout", "On: the game exports your character at every zone change and at logout, so vendor numbers stay fresh. A logout can leave a second, incomplete copy; it's ignored.",
                "auto-export", views=[], server_only=True)
        else:
            add("auto-export", "ok", "Auto-export on logout", "Off: character exports only happen when you press VIP menu → Export Character JSON.", "auto-export", views=[], server_only=True)
    else:
        add("auto-export", "info", "Auto-export on logout", "Couldn't read GorgonSettings.txt.", views=[], server_only=True)

    # vault sizes
    unknown = [v["name"] for v in vaults if v.get("capacity") is None]
    manual = [v["name"] for v in vaults if v.get("capacitySource") == "manual"]
    if not vaults:
        pass
    elif unknown:
        add("vault-sizes", "warn", "Vault sizes", f"{plural(len(unknown), 'vault')} with no known size: {join_some(unknown)}.",
            "vault-size", views=["storage"], evidence_data={"unknown": unknown, "manual": manual})
    elif manual:
        add("vault-sizes", "info", "Vault sizes", f"{plural(len(manual), 'size')} typed in by you ({join_some(manual)}). The game doesn't publish them.",
            "vault-size", views=["storage"], evidence_data={"unknown": [], "manual": manual})
    else:
        add("vault-sizes", "ok", "Vault sizes", "All known.", "vault-size", views=["storage"])

    # alts
    logins30 = Counter()
    first_seen = {}
    last_login_at = {}
    for p, sm in sums:
        for ts, who, srv in sm["logins"]:
            if (now.replace(tzinfo=None) - chat_dt(ts)).total_seconds() <= 30 * 86400:
                logins30[who] += 1
                first_seen.setdefault(who, ts)
            last_login_at[who] = ts
    exporters = {r["character"] for r in reports if r["character"] not in (None, "???")}
    for who in sorted(exporters - {character}):
        rs = [report_dt(r["timestamp"]) for r in reports if r["character"] == who and report_dt(r["timestamp"] or "")]
        newest_at = max(rs) if rs else None
        if newest_at and (now - newest_at).total_seconds() > THRESHOLDS["alt-stale"]:
            add("alt-stale", "info", f"{who}'s exports",
                f"{who}'s newest export is from {newest_at.astimezone().strftime('%-d %b')}.",
                "alt-export", views=["character"], at=newest_at, item_id=f"alt-stale:{who}", fix_args={"alt": who})
    for who in sorted(set(logins30) - exporters - {character}):
        since_txt = chat_dt(first_seen[who]).strftime("%-d %b")
        add("alt-missing", "info", f"{who} has no exports",
            f"{who} logged in {plural(logins30[who], 'time')} since {since_txt} and has no exports yet.",
            "alt-export", views=["character"], item_id=f"alt-missing:{who}", server_only=True, fix_args={"alt": who})

    # combat logging
    if settings.get("readable"):
        cl = settings.get("combatLog", {})
        ok = settings.get("VIP_CombatLogging") == 1 and settings.get("LogNonAttacks") == 1 and cl and all(
            isinstance(v, int) and v == 2 for v in cl.values())
        # Listed on Session when the death tracker (deaths, kills, pet kills) would miss something, and on Combat
        # (the DPS meter) whenever any category is below 2, the only level verified to write damage numbers.
        vip = settings.get("VIP_CombatLogging")
        off = sorted(k for k, v in cl.items() if not (isinstance(v, int) and v > 0))
        reduced = sorted(k for k, v in cl.items() if v == 1)
        if ok:
            ev, views = "On.", []
        elif vip != 1:
            ev = (f"Combat logging is off (VIP_CombatLogging {vip}), so kills, killers and damage aren't in the log. "
                  "Deaths still count from the game's Dying XP line, without a killer.")
            views = ["session", "combat"]
        elif off or not cl:
            keys = ", ".join("combatLog_" + k for k in off)
            ev = (f"Some fights aren't logged: {keys} {'are' if len(off) > 1 else 'is'} 0 in GorgonSettings.txt. " if off
                  else "Some fights aren't logged: no combatLog_* keys in GorgonSettings.txt. ") + \
                "Deaths need EnemyAttackMe, kills MeAttackEnemy, pet kills PetAttackEnemy; the DPS meter needs them all."
            views = ["session", "combat"]
        elif reduced:
            keys = ", ".join("combatLog_" + k for k in reduced)
            ev = (f"{keys} {'are' if len(reduced) > 1 else 'is'} 1 in GorgonSettings.txt. Only 2 is verified to write damage "
                  "numbers, so the DPS meter may miss hits. Deaths and kills don't need it.")
            views = ["combat"]
        else:
            ev, views = "LogNonAttacks is 0. Deaths, kills and damage don't need it.", []
        add("combat-logging", "ok" if ok else "info", "Combat logging", ev, "combat-logging", views=views, server_only=True,
            evidence_data={"off": off, "reduced": reduced, "vipCombatLogging": vip})

    # live game events
    found = player_log_events()
    if found:
        add("player-log", "ok", "Live game events", "Player.log has live inventory events.", "player-log", views=[], server_only=True)
    else:
        add("player-log", "info", "Live game events",
            "The Mac client doesn't write live inventory events, so vendor and storage numbers come from exports. Nothing to do.",
            "player-log", views=[], server_only=True)

    # VIP
    any_exports = [report_dt(r["timestamp"]) for r in reports if report_dt(r["timestamp"] or "")]
    newest_any = max(any_exports) if any_exports else None
    logins_since = sum(1 for p, sm in sums for ts, who, srv in sm["logins"]
                       if not newest_any or chat_dt(ts) > newest_any.astimezone().replace(tzinfo=None))
    age_any = (now - newest_any).total_seconds() if newest_any else None
    if age_any is not None and age_any >= 30 * 86400 and logins_since >= 3:
        add("vip", "warn", "VIP", f"No exports in {int(age_any // 86400)} days across {logins_since} logins. If the VIP menu is missing, VIP may have lapsed.",
            "vip", views=["session", "vendors", "storage", "character"], server_only=True, at=newest_any)
    elif age_any is not None and age_any >= 14 * 86400 and logins_since >= 3:
        add("vip", "info", "VIP", f"No exports in {int(age_any // 86400)} days across {logins_since} logins. If the VIP menu is missing, VIP may have lapsed.",
            "vip", views=["session", "vendors", "storage", "character"], server_only=True, at=newest_any)
    else:
        add("vip", "ok", "VIP", "Exports are coming in.", "vip", views=[], server_only=True, at=newest_any)

    # CDN game data
    ver = cdn_version()
    cached = cached_versions() if CACHE.exists() else []
    if ver is None:
        add("cdn", "bad", "Game data", "The game data server isn't answering and nothing is cached, so caps and areas are unknown.",
            views=["vendors", "storage"], server_only=True)
    elif not _ver["reachable"]:
        add("cdn", "info", "Game data", f"The game data server isn't answering; using cached v{ver}.", views=["vendors", "storage"], server_only=True)
    elif _ver["changedAt"]:
        add("cdn", "info", "Game data", f"Game data updated to v{ver}: caps refreshed.", views=["vendors", "storage"], server_only=True)
    else:
        add("cdn", "ok", "Game data", f"Game data v{ver}, current.", views=[], server_only=True)

    # party sharing over ntfy.sh, only while joined (docs/SHARING.md)
    with PARTY_LOCK:
        pcode = _party["code"]
        if pcode:
            ok_at, err_at = _party["lastOkAt"], _party["lastErrAt"]
            reachable = bool(ok_at) and (not err_at or ok_at >= err_at)
            try:
                _, prow = party_local_rows()
                pending = len([r for r in prow if f"{pcode}|{r['at']}" not in _party["posted"]])
            except Exception:
                pending = 0
            sent = len([k for k in _party["posted"] if k.startswith(pcode + "|")])
            last_msg = iso_dt(_party["lastMsgAt"])
            last_txt = f"last message {last_msg.strftime('%H:%M')}" if last_msg else "nothing received yet"
            if not reachable and err_at:
                since_t = iso_dt(err_at)
                add("party-sharing", "warn", "Party sharing",
                    f"ntfy.sh hasn't answered since {since_t.strftime('%H:%M') if since_t else 'a while'}; "
                    f"{plural(pending, 'fight waits', 'fights wait')} and {'goes' if pending == 1 else 'go'} out when it does.",
                    "party-sharing", views=["combat"], at=since_t.replace(tzinfo=None) if since_t else None, evidence_data={"code": pcode, "pending": pending})
            else:
                add("party-sharing", "ok", "Party sharing", f"Topic {pcode}, {last_txt}, {plural(sent, 'fight')} sent{f', {pending} waiting' if pending else ''}.",
                    "party-sharing", views=["combat"], evidence_data={"code": pcode, "pending": pending})

    # summary
    counts = Counter(i["severity"] for i in items)
    worst = next((s for s in ("bad", "warn", "info") if counts[s]), "ok")
    parts = []
    if counts["bad"]:
        parts.append(f"{counts['bad']} broken")
    if counts["warn"]:
        parts.append(f"{counts['warn']} to do")
    header = " · ".join(parts) if parts else "All sources recent"
    if counts["info"]:
        header += f" · {plural(counts['info'], 'note')}"

    # moments (last 6 h)
    moments = []
    cutoff = now.replace(tzinfo=None) - timedelta(hours=6)
    export_warn = any(i["severity"] in ("warn", "bad") for i in items if i["source"] in ("character-export", "storage-export", "partial-export"))
    char_at = report_dt(char_rep["timestamp"]).astimezone().replace(tzinfo=None) if char_rep else None
    stor_at = report_dt(stor_rep["timestamp"]).astimezone().replace(tzinfo=None) if stor_rep else None
    good_saved = []
    for p, sm in sums[-2:]:
        for ts, info in sm["saved"]:
            good_saved.append((chat_dt(ts), info))
    for p, sm in sums[-2:]:
        if sm["last"] and chat_dt(sm["last"]) < cutoff:
            continue
        for ts, who, srv in sm["logins"]:
            if chat_dt(ts) >= cutoff:
                stale_bits = [f"{i['title']} {human_age(i['ageSec']).replace(' ago', '')} old" if i["severity"] != "ok" else f"{i['title']} OK"
                              for i in items if i["source"] in ("storage-export", "character-export")]
                chat_ok = next((i for i in items if i["source"] == "chat-log"), {}).get("severity") in ("ok", "info")
                moments.append({"id": f"login-checklist:{chat_iso(ts)}", "topic": "login-checklist", "at": chat_iso(ts),
                                "level": "act-now" if export_warn else "status", "title": f"Logged in as {who}",
                                "body": " · ".join(stale_bits + ["Chat logging on" if chat_ok else "Chat logging off"]),
                                "fixKey": None, "args": {"character": who}})
        cur_area, sales_here = None, 0
        evs = sorted([(chat_dt(t), "area", a) for t, a in sm["areas"]] + [(chat_dt(t), "sale", n) for t, n in sm["sales"]])
        for dt, kind, val in evs:
            if kind == "sale":
                if char_at is None or dt > char_at:
                    sales_here += 1
                continue
            if dt >= cutoff and cur_area and sales_here:
                moments.append({"id": f"after-selling:{local_iso(dt)}", "topic": "after-selling", "at": local_iso(dt), "level": "act-now",
                                "title": f"Received councils {plural(sales_here, 'time')} in {cur_area}",
                                "body": "Export Character JSON to update vendor caps. VIP menu → Export Character JSON",
                                "fixKey": "export-character", "args": {"area": cur_area}})
            if dt >= cutoff and val in vault_areas and (stor_at is None or dt > stor_at):
                moments.append({"id": f"zone-storage:{val}:{local_iso(dt)}", "topic": "zone-storage", "at": local_iso(dt), "level": "act-now",
                                "title": f"Your vaults are in {val}",
                                "body": "Export Storage after you're done here. VIP menu → Export Storage JSON",
                                "fixKey": "export-storage", "args": {"area": val}})
            cur_area, sales_here = val, 0
        for ts, info in sm["saved"]:
            dt = chat_dt(ts)
            if dt < cutoff:
                continue
            if info["partial"]:
                twin = any(not i2["partial"] and i2["report"] == "Character" and abs((d2 - dt).total_seconds()) <= 120 for d2, i2 in good_saved)
                if not twin:
                    moments.append({"id": f"broken-export:{info['file']}:{chat_iso(ts)}", "topic": "broken-export", "at": chat_iso(ts),
                                    "level": "broken", "title": "That export came out partial",
                                    "body": "Export again while fully logged in: VIP menu → Export Character JSON",
                                    "fixKey": "export-again", "args": {"file": info["file"]}})
            else:
                moments.append({"id": f"export-confirmed:{info['file']}:{chat_iso(ts)}", "topic": "export-confirmed", "at": chat_iso(ts),
                                "level": "status", "title": f"{info['report']} export saved", "body": info["file"],
                                "fixKey": None, "args": dict(info)})
    # wrapping up
    if logged_in and effective_running and last_in and export_warn:
        lin = chat_dt(last_in[0])
        mins = (now.replace(tzinfo=None) - lin).total_seconds() / 60
        if mins >= 60:
            searched_late = any(chat_dt(t) > lin + timedelta(minutes=60) for p, sm in sums[-1:] for t in sm["searches"])
            act = sums[-1][1]["activity"] if sums else []
            quiet = not act or (now.replace(tzinfo=None) - datetime.strptime(act[-1], "%y-%m-%d %H:%M")).total_seconds() >= 600
            if searched_late or (quiet and area in vault_areas):
                moments.append({"id": f"before-logout:{chat_iso(last_in[0])}", "topic": "before-logout", "at": local_iso(now), "level": "act-now",
                                "title": "Wrapping up?",
                                "body": "Before you log out: export Character and Storage JSON from the VIP menu. Exports right at logout can come out partial.",
                                "fixKey": "export-character", "args": {}})
    # storage nearly full
    if stor_rep and (now - report_dt(stor_rep["timestamp"])).total_seconds() < 3600:
        tight = [v for v in vaults if v.get("free") is not None and 0 <= v["free"] <= 2 and v.get("used")]
        if tight:
            body = ", ".join(f"{v['name']} {'full' if v['free'] == 0 else str(v['free']) + ' free'}" for v in tight[:4]) + "."
            moments.append({"id": f"storage-full:{stor_rep['file']}", "topic": "storage-full", "at": local_iso(report_dt(stor_rep["timestamp"])),
                            "level": "info", "title": "Storage nearly full", "body": body, "fixKey": None, "args": {}})
    # vendor resets (positive)
    resets = []
    for r in vendor_rows:
        if not r.get("resetSinceExport") or not r.get("exportResetAt"):
            continue
        rdt = datetime.fromisoformat(r["exportResetAt"])
        drained = r["cap"] and (r["cap"] - r["spentAtExport"]) < 0.02 * r["cap"]
        if (now - rdt).total_seconds() <= 6 * 3600 and (drained or r["spentAtExport"] >= 0.1 * (r["cap"] or 1)):
            resets.append((rdt, r))
    resets.sort(key=lambda x: x[0])
    batch = []
    for rdt, r in resets + [(None, None)]:
        if batch and (rdt is None or (rdt - batch[0][0]).total_seconds() > 300):
            total = sum(x[1]["restored"] for x in batch)
            names = [x[1]["name"] for x in batch]
            moments.append({"id": f"vendor-reset:{local_iso(batch[0][0])}", "topic": "vendor-reset", "at": local_iso(batch[0][0]),
                            "level": "positive", "title": f"{names[0]} reset" if len(names) == 1 else f"{len(names)} vendors reset",
                            "body": f"{total:,} councils available again.", "fixKey": None,
                            "args": {"npcs": names, "restored": total}})
            batch = []
        if rdt is not None:
            batch.append((rdt, r))
    # storage export stale by activity (searches or loot since it; age or a vault-area visit alone is not a moment)
    if stor_rep and stor_act and stor_activity:
        f = stor_rep["file"]
        exp = report_dt(stor_rep["timestamp"]).astimezone()
        when = exp.strftime("%H:%M") if exp.date() == now.date() else exp.strftime("%-d %b %H:%M")

        def naive(iso):
            return datetime.fromisoformat(iso).replace(tzinfo=None)

        # One moment per anchor since() recorded (a search or loot pause that is not a zone-storage follow-through,
        # 2 h apart); the anchor time is in the id, so a later search or pause is a new moment and the browser's
        # per-file cooldown does the rate limiting. Anchors depend only on earlier lines, so none appears late.
        n = stor_act["storageSearches"]
        for at in stor_act["searchReminders"]:
            if naive(at) >= cutoff:
                moments.append({"id": f"export-stale:search:{f}:{at}", "topic": "export-stale", "at": at, "level": "act-now",
                                "title": "Storage export is stale",
                                "body": f"You've searched your storage {plural(n, 'time')} since the export of {when}. VIP menu → Export Storage JSON",
                                "fixKey": "export-storage", "args": {"report": "Storage", "file": f, "signal": "search", "count": n}})
        stacks = stor_act["lootStacks"]
        for at in stor_act["lootReminders"]:
            if naive(at) >= cutoff:
                moments.append({"id": f"export-stale:loot:{f}:{at}", "topic": "export-stale", "at": at, "level": "act-now",
                                "title": "Storage export is stale",
                                "body": f"You've picked up {plural(stacks, 'stack')} of loot since the export of {when}, so Slots Free is lower than shown. VIP menu → Export Storage JSON",
                                "fixKey": "export-storage", "args": {"report": "Storage", "file": f, "signal": "loot", "count": stacks}})
    moments.sort(key=lambda m: m["at"] or "", reverse=True)

    # characters
    names = set(logins30) | exporters
    chars = []
    for who in sorted(names, key=lambda n: (-logins30.get(n, 0), n)):
        cr = newest_report("CharacterSheet", who)
        sr = newest_report("Storage", who)
        chars.append({"name": who, "logins30d": logins30.get(who, 0),
                      "lastLoginAt": chat_iso(last_login_at.get(who)),
                      "characterExportAt": local_iso(report_dt(cr["timestamp"])) if cr else None,
                      "storageExportAt": local_iso(report_dt(sr["timestamp"])) if sr else None})

    return {"version": 1, "checkedAt": local_iso(now), "character": character,
            "server": last_in[2] if last_in else None, "cdnVersion": ver, "game": game, "settings": settings,
            "cdn": {"version": ver, "cached": cached, "reachable": _ver["reachable"], "changedAt": _ver["changedAt"]},
            "thresholds": THRESHOLDS, "activityThresholds": ACTIVITY, "summary": {"worst": worst, "counts": dict(counts), "header": header},
            "items": items, "moments": moments, "characters": chars}


# ---------------------------------------------------------------------------
# Icons and readable names (GET /api/icons, GET /api/lookup)
# ---------------------------------------------------------------------------
_maps = {}


def item_maps():
    if "items" not in _maps:
        items = cdn_data("items")
        by_name, by_internal, by_type_id = {}, {}, {}
        for key, it in items.items():
            icon = it.get("IconId")
            by_name.setdefault(it.get("Name"), icon)
            by_internal[it.get("InternalName")] = icon
            by_type_id[key.removeprefix("item_")] = icon
        _maps["items"] = (by_name, by_internal, by_type_id)
    return _maps["items"]


def type_icon_map():
    try:
        return json.loads(TYPE_ICONS_FILE.read_text(encoding="utf-8")).get("types", {})
    except Exception:
        return {}


def icons(q):
    ver = cdn_version() or "488"
    out = {"cdnVersion": ver, "base": f"{CDN}/v{ver}/icons/", "byName": {}, "byTypeId": {}, "byType": {}}
    split = lambda k: [x for x in (q.get(k) or "").split(",") if x]
    by_name, by_internal, by_type_id = item_maps()
    for n in split("names"):
        out["byName"][n] = by_name.get(n)
    for t in split("typeIds"):
        out["byTypeId"][t] = by_type_id.get(t)
    tmap = type_icon_map()
    for t in split("types"):
        out["byType"][t] = by_internal.get(tmap.get(t)) if tmap.get(t) else None
    return out


def power_text(power, tier):
    if "powers" not in _maps:
        _maps["powers"] = {v.get("InternalName"): v for v in cdn_data("tsysclientinfo").values()}
        _maps["attrs"] = cdn_data("attributes")
    p = _maps["powers"].get(power)
    if not p:
        return None
    t = (p.get("Tiers") or {}).get(f"id_{tier}")
    if not t:
        return None
    attrs = _maps["attrs"]
    parts = []
    for desc in t.get("EffectDescs", []):
        m = re.fullmatch(r"\{(\w+)\}\{(-?[\d.]+)\}", desc.strip())
        if not m:
            parts.append(re.sub(r"<[^>]+>", "", desc))
            continue
        key, val = m.group(1), float(m.group(2))
        a = attrs.get(key, {})
        label = (a.get("Label") or key.replace("_", " ").title()).replace(" %", "").strip()
        dt = a.get("DisplayType", "")
        if dt in ("AsBuffMod", "AsPercent", "AsDebuffMod"):
            pct = val * 100
            parts.append(f"{'+' if pct >= 0 else ''}{pct:g}% {label}")
        else:
            parts.append(f"{'+' if val >= 0 else ''}{val:g} {label}")
    return "; ".join(parts) or None


def buy_words():
    """Every item-type word any vendor's CapIncreases names (the vocabulary of the Vendors view's Buys column)."""
    if "buywords" not in _maps:
        words = set()
        for info in cdn_data("npcs").values():
            for sv in info.get("Services", []):
                if sv.get("Type") == "Store":
                    for c in sv.get("CapIncreases") or []:
                        parts = c.split(":")
                        if len(parts) > 2:
                            words.update(w for w in parts[2].split(",") if w)
        _maps["buywords"] = words
    return _maps["buywords"]


def item_types(query):
    """Vendors search by item (GET /api/lookup?item=): the vendor type words carried by the items whose name
    contains the query, counted, so "figurine" finds the Artwork and Antique buyers. A type is kept when at
    least two matching items carry it and at least a tenth of them do; at most six types, most common first."""
    q = (query or "").strip().lower()
    if len(q) < 3:
        return None
    words = buy_words()
    counts, n, examples = Counter(), 0, []
    for it in cdn_data("items").values():
        name = it.get("Name") or ""
        if q in name.lower():
            n += 1
            if len(examples) < 3:
                examples.append(name)
            for w in {k.split("=")[0] for k in it.get("Keywords") or []}:
                if w in words:
                    counts[w] += 1
    types = [{"type": w, "items": c} for w, c in counts.most_common() if c >= 2 and c * 10 >= n][:6]
    return {"query": query, "items": n, "examples": examples, "types": types}


def lookup(q):
    out = {"cdnVersion": cdn_version() or "488", "quests": {}, "powers": {}}
    if "item" in q:
        out["item"] = item_types(q.get("item"))
    keys = [x for x in (q.get("quests") or "").split(",") if x]
    if keys:
        if "quests" not in _maps:
            _maps["quests"] = {v.get("InternalName"): v.get("Name") for v in cdn_data("quests").values()}
        for k in keys:
            out["quests"][k] = _maps["quests"].get(k)
    for k in [x for x in (q.get("powers") or "").split(",") if x]:
        name, _, tier = k.partition(":")
        try:
            text = power_text(name, int(tier or 1))
        except Exception:
            text = None
        out["powers"][k] = {"text": text, "tier": int(tier) if tier.isdigit() else None} if text else None
    return out


# ---------------------------------------------------------------------------
# JSON inspector: GET /api/files, /api/file/node, /api/file/search, /api/file/raw (Files view)
# Read-only. Four locations only: Reports/ exports, the app's capacity.json, the CDN cache and the ChatLogs/ folder
# (the chat logs the DPS meter, Session and the health checks read; served as text lines, never as JSON nodes).
# ---------------------------------------------------------------------------
FILE_ID_RE = re.compile(r"^(reports|app|cdn/v\d{1,6})/([A-Za-z0-9_.\-]+\.json)$|^(logs)/(Chat-\d\d-\d\d-\d\d\.log)$")  # no "/", "\", NUL or ".." by construction
FILES_SOURCES = ("character-export", "storage-export", "partial-export", "vault-sizes", "cdn", "alt-stale", "alt-missing", "chat-log")
LINES_PAGE = 500           # /api/file/lines: lines per page and matches per search
LINES_PAGE_MAX = 2000
LINES_TOTAL_MAX = 10000    # a search keeps counting matches past the page up to this
NODE_PAGE = 200            # children per page (client TREE_PAGE)
NODE_PAGE_MAX = 1000
EXPAND_MAX_NODES = 2000    # default depth budget for depth > 1 (client TREE_EXPAND_MAX)
EXPAND_MAX_CAP = 5000
STRING_CUT = 200           # child-row strings are cut here; the scalar node itself is always sent whole
SEARCH_LIMIT = 200
SEARCH_LIMIT_MAX = 500
SEARCH_TOTAL_MAX = 10000   # total keeps counting past limit up to this
SEARCH_BUDGET_S = 2.0
RAW_MAX_BYTES = 1048576    # /api/file/raw?path= subtree copy limit (413 above)
FILES_LRU = 8              # parsed exports and older CDN versions kept; current CDN files share cdn_data()
FILES_LOCK = threading.RLock()
_files = OrderedDict()     # (resolved path, st_size, st_mtime_ns) -> {"obj", "total", "index", "pinned", ...}
_heads = {}                # resolved path -> (st_size, st_mtime_ns, head dict); the 60 s poll never re-parses an unchanged export
CDN_LABELS = {"items": "Items", "quests": "Quests", "npcs": "NPCs", "attributes": "Stats", "areas": "Areas",
              "storagevaults": "Storage vaults", "tsysclientinfo": "Item powers"}
_name_keys = {}            # cdn file -> {InternalName: key} for the FILE_LINKS InternalName rules


class FileError(Exception):
    """An /api/file* answer with its own status: 409 file changed, 422 invalid JSON, 413 too big."""
    def __init__(self, status, payload):
        super().__init__(payload.get("error"))
        self.status, self.payload = status, payload


def file_path(fid):
    """(Path, group, version|None) for a file id `<group>/<name>`; 400 on a malformed id, 404 for anything not in
    the three known locations (the load_report idiom: resolved parent must be the root, so a planted symlink is refused)."""
    m = FILE_ID_RE.match(fid or "")
    if not m:
        raise BadRequest("bad file id")
    group, name = (m.group(1), m.group(2)) if m.group(1) else (m.group(3), m.group(4))
    version = None
    if group == "logs":
        root = CHATLOGS
    elif group == "reports":
        root = REPORTS
    elif group == "app":
        if name != CAPACITY_FILE.name:
            raise FileNotFoundError(fid)
        root = CAPACITY_FILE.parent
    else:
        version = group[5:]
        root = CACHE / f"v{version}"
    p = (root / name).resolve()
    if p.parent != root.resolve() or not p.is_file():
        raise FileNotFoundError(fid)
    return p, group.split("/")[0], version


def _head(p):
    """Head fields of a small JSON file (export or capacity.json), cached per (size, mtime_ns)."""
    st = p.stat()
    key = (st.st_size, st.st_mtime_ns)
    hit = _heads.get(str(p))
    if hit and hit[0] == key:
        return hit[1]
    head = {"valid": True, "error": None, "keys": None}
    try:
        with p.open(encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            head.update({k: data.get(k) for k in ("Report", "Character", "ServerName", "Timestamp", "Race")})
            head["keys"] = len(data)
    except json.JSONDecodeError as e:
        head.update(valid=False, error=f"line {e.lineno} col {e.colno}: {e.msg}", line=e.lineno, col=e.colno, msg=e.msg)
    except Exception as e:
        head.update(valid=False, error=str(e) or repr(e))
    _heads[str(p)] = (key, head)
    return head


def _export_name_parts(name):
    """(report, character, server) guessed from an export file name, for files whose head can't be read."""
    if m := re.match(r"^Character_(.*)_([^_]+)\.json$", name):
        return "CharacterSheet", m.group(1) or None, m.group(2)
    if m := re.match(r"^([^_]+)_([^_]+)_items_\d{4}-\d\d-\d\d-\d\d-\d\d-\d\dZ\.json$", name):
        return "Storage", m.group(1), m.group(2)
    return None, None, None


def _file_stat(p, fid, group, name, dirname, **more):
    st = p.stat()
    entry = _files.get((str(p), st.st_size, st.st_mtime_ns))
    row = {"id": fid, "group": group, "name": name, "dir": dirname, "bytes": st.st_size,
           "mtime": local_iso(datetime.fromtimestamp(st.st_mtime)), "mtimeNs": st.st_mtime_ns, "exists": True,
           "valid": None, "error": None, "nodes": entry["total"] if entry else None}
    row.update(more)
    return row, st


def list_files():
    """Every JSON file the app knows, with size, mtime and (for exports) the head fields; nothing is parsed twice."""
    files, reports = [], []
    for p in sorted(REPORTS.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        if not p.is_file() or p.resolve().parent != REPORTS.resolve():  # file_path() would refuse it: don't list it
            continue
        head = _head(p)
        kind, who, srv = _export_name_parts(p.name)
        report = head.get("Report") or kind
        character = head.get("Character") or who
        partial = character == "???" or head.get("Race") == "Error" or p.name.startswith("Character__")
        at = report_dt(head.get("Timestamp") or "")
        row, st = _file_stat(p, f"reports/{p.name}", "reports", p.name, "Reports/",
                             report=report, character=character, server=head.get("ServerName") or srv,
                             timestamp=head.get("Timestamp"), at=local_iso(at), partial=partial, newest=False,
                             source="partial-export" if partial else {"CharacterSheet": "character-export", "Storage": "storage-export"}.get(report),
                             valid=head["valid"], error=head["error"])
        reports.append((row, at.timestamp() if at else st.st_mtime))  # nodes: filled by /api/file/node, never here
    newest = {}
    for row, t in reports:
        if row["valid"] and not row["partial"] and row["report"] and row["character"]:
            k = (row["report"], row["character"])
            if k not in newest or t > newest[k][1]:
                newest[k] = (row, t)
    for row, _ in newest.values():
        row["newest"] = True
    files.extend(r for r, _ in reports)

    p = CAPACITY_FILE
    if p.is_file():
        head = _head(p)
        row, _ = _file_stat(p, "app/capacity.json", "app", p.name, "./", source="vault-sizes",
                            valid=head["valid"], error=head["error"], vaults=head.get("keys") if head["valid"] else None)
    else:
        row = {"id": "app/capacity.json", "group": "app", "name": p.name, "dir": "./", "bytes": 0, "mtime": None, "mtimeNs": None,
               "exists": False, "source": "vault-sizes", "valid": None, "error": None, "nodes": None, "vaults": None}
    files.append(row)

    cdn_rows = []
    for p in CACHE.glob("v*/*.json") if CACHE.exists() else []:
        ver = p.parent.name[1:]
        if not ver.isdigit() or not p.is_file() or p.resolve().parent != p.parent.resolve():
            continue
        row, _ = _file_stat(p, f"cdn/v{ver}/{p.name}", "cdn", p.name, f"cache/v{ver}/", version=ver, source="cdn",
                            label=CDN_LABELS.get(p.stem, p.name))
        cdn_rows.append(row)
    cdn_rows.sort(key=lambda r: (-int(r["version"]), r["name"]))
    files.extend(cdn_rows)

    # Chat logs: every Chat-YY-MM-DD.log, newest written first. `newest` is the one latest_chatlog() returns, i.e.
    # the file the DPS meter, Session and the live health checks read; for it the DpsTracker's counts are attached
    # (cached per size/mtime by dps_tracker(), so this never parses twice). Older logs feed the 31-day combat
    # totals and the alt / previous-login lookups; nothing here reads them line by line.
    log_rows = []
    logs = sorted((p for p in CHATLOGS.glob("Chat-*.log") if CHATLOGS.is_dir()), key=lambda p: p.stat().st_mtime, reverse=True)
    for i, p in enumerate(logs):
        if not p.is_file() or p.resolve().parent != CHATLOGS.resolve() or not FILE_ID_RE.match(f"logs/{p.name}"):
            continue
        day = p.name[5:13]  # Chat-26-10-24.log -> 26-10-24
        try:
            date = datetime.strptime(day, "%y-%m-%d").date().isoformat()
        except ValueError:
            date = None
        row, st = _file_stat(p, f"logs/{p.name}", "logs", p.name, "ChatLogs/", date=date, newest=False, source="chat-log",
                             lines=None, combatLines=None, lastLineAt=None, lastCombatAt=None, character=None)
        if i == 0:
            row["newest"] = True
            try:
                tracker, _ = dps_tracker(p)
                row.update(combatLines=tracker.lines, lastLineAt=chat_iso(tracker.last_ts), lastCombatAt=chat_iso(tracker.last_combat),
                           character=tracker.char or last_login_before(p)[0])
            except Exception:
                pass  # the row still lists the file; the counts are a courtesy
        log_rows.append(row)
    files.extend(log_rows)
    return {"version": 1, "listedAt": local_iso(datetime.now()), "cdnVersion": cdn_version(),
            "csvSkipped": sum(1 for _ in REPORTS.glob("*.csv")), "files": files}


def count_nodes(obj):
    n, stack = 0, [obj]
    while stack:
        o = stack.pop()
        n += 1
        if isinstance(o, dict):
            stack.extend(o.values())
        elif isinstance(o, list):
            stack.extend(o)
    return n


def file_entry(fid, mtime=None):
    """The parsed file behind an id: (entry, path, group, version). Raises FileError 409 when `mtime` (ns) no longer
    matches the file and 422 when it isn't JSON. Current CDN files reuse cdn_data(); the rest live in an LRU of 8."""
    p, group, version = file_path(fid)
    if group == "logs":
        raise BadRequest("a chat log has lines, not JSON nodes; use /api/file/lines")
    st = p.stat()
    stamp = {"bytes": st.st_size, "mtime": local_iso(datetime.fromtimestamp(st.st_mtime)), "mtimeNs": st.st_mtime_ns}
    if mtime not in (None, "") and str(st.st_mtime_ns) != str(mtime):
        raise FileError(409, {"error": "file changed", **stamp})
    key = (str(p), st.st_size, st.st_mtime_ns)
    with FILES_LOCK:
        entry = _files.get(key)
        if entry:
            _files.move_to_end(key)
            return entry, p, group, version
        pinned = group == "cdn" and version == cdn_version() and p.stem in CDN_LABELS
        try:
            if pinned:
                obj = cdn_data(p.stem)
            else:
                with p.open(encoding="utf-8") as f:
                    obj = json.load(f)
        except json.JSONDecodeError as e:
            raise FileError(422, {"error": "invalid JSON", "line": e.lineno, "col": e.colno, "msg": e.msg, **stamp})
        except UnicodeDecodeError as e:
            raise FileError(422, {"error": "invalid JSON", "line": None, "col": None, "msg": str(e), **stamp})
        entry = {"obj": obj, "total": count_nodes(obj), "index": None, "pinned": pinned, "name": p.name, **stamp}
        for k in [k for k in _files if k[0] == key[0]]:  # a rewritten file is a new key; drop the old parse
            del _files[k]
        _files[key] = entry
        loose = [k for k, v in _files.items() if not v["pinned"]]
        for k in loose[:max(0, len(loose) - FILES_LRU)]:
            del _files[k]
    return entry, p, group, version


def pointer_parts(path):
    """RFC 6901 pointer -> list of unescaped segments ("" is the root)."""
    if path in (None, ""):
        return []
    if not path.startswith("/"):
        raise FileError(404, {"error": "no such path"})
    return [s.replace("~1", "/").replace("~0", "~") for s in path[1:].split("/")]


def pointer_join(parts):
    return "".join("/" + str(k).replace("~", "~0").replace("/", "~1") for k in parts)


def resolve_pointer(obj, parts):
    """(node, pos) where pos is each segment's index among its siblings in document order."""
    pos = []
    for seg in parts:
        if isinstance(obj, dict) and seg in obj:
            pos.append(list(obj).index(seg))
            obj = obj[seg]
        elif isinstance(obj, list) and seg.isdigit() and int(seg) < len(obj):
            pos.append(int(seg))
            obj = obj[int(seg)]
        else:
            raise FileError(404, {"error": "no such path"})
    return obj, pos


def jtype(v):
    if isinstance(v, dict):
        return "object"
    if isinstance(v, list):
        return "array"
    if isinstance(v, str):
        return "string"
    if isinstance(v, bool):
        return "boolean"
    if v is None:
        return "null"
    return "number"


def _cdn_keyed(name, version):
    """The parsed CDN file `name` of `version` when it is cached on disk, else None (links never fetch)."""
    if not version or not (CACHE / f"v{version}" / f"{name}.json").is_file():
        return None
    try:
        return file_entry(f"cdn/v{version}/{name}.json")[0]["obj"]
    except Exception:
        return None


def _name_key(name, version, internal):
    """CDN entry key whose InternalName is `internal` (quests, tsysclientinfo); the index is built once per file."""
    data = _cdn_keyed(name, version)
    if data is None or not isinstance(internal, str):
        return None
    idx = _name_keys.get((name, version))
    if idx is None:
        idx = _name_keys[(name, version)] = {v.get("InternalName"): k for k, v in data.items() if isinstance(v, dict)}
    return idx.get(internal)


def file_link(role, version, parts, key, value):
    """FILE_LINKS: where a child row points in another cached file, or None. `parts` is the parent's pointer.
    Direct-key rules first, then the InternalName rules. Skills and RecipeCompletions have no cached target."""
    n = len(parts)
    target = path = None
    if role == "CharacterSheet":
        if n == 1 and parts[0] == "NPCs" and isinstance(key, str):
            target, path = "npcs", key
        elif n == 1 and parts[0] == "CurrentStats" and isinstance(key, str):
            target, path = "attributes", key
        elif n == 0 and key == "MostRecentArea" and isinstance(value, str):
            target, path = "areas", value
        elif n == 1 and parts[0] in ("ActiveQuests", "CompletedQuests") and isinstance(value, str):
            target, path = "quests", _name_key("quests", version, value)
    if role in ("CharacterSheet", "Storage"):
        if n == 2 and parts[0] == "Items" and key == "TypeID" and isinstance(value, int) and not isinstance(value, bool):
            target, path = "items", f"item_{value}"
        elif n == 2 and parts[0] == "Items" and key == "StorageVault" and isinstance(value, str):
            target, path = "storagevaults", value
        elif n == 4 and parts[0] == "Items" and parts[2] == "TSysPowers" and key == "Power" and isinstance(value, str):
            target, path = "tsysclientinfo", _name_key("tsysclientinfo", version, value)
    elif role == "capacity" and n == 0 and isinstance(key, str):
        target, path = "storagevaults", key
    elif role == "storagevaults" and n == 1 and key == "Area" and isinstance(value, str):
        target, path = "areas", value
    elif role == "npcs" and n == 1 and key == "AreaName" and isinstance(value, str):
        target, path = "areas", value
    if target is None or path is None:
        return None
    data = _cdn_keyed(target, version)
    if data is None or not isinstance(data, dict) or path not in data:
        return None
    return {"to": f"cdn/v{version}/{target}.json", "path": pointer_join([path]), "label": f"Open in {target}.json"}


def file_role(entry, group, name):
    if group == "reports":
        return entry["obj"].get("Report") if isinstance(entry["obj"], dict) else None
    if group == "app":
        return "capacity"
    return Path(name).stem


def describe(key, v, role, version, parts):
    row = {"key": key, "type": jtype(v)}
    if isinstance(v, dict):
        row["count"] = len(v)
        row["preview"] = ", ".join(str(k) for k in list(v)[:3])
    elif isinstance(v, list):
        row["count"] = len(v)
        row["preview"] = None
    elif isinstance(v, str) and len(v) > STRING_CUT:
        row.update(value=v[:STRING_CUT], len=len(v), cut=True)
    else:
        row["value"] = v
    link = file_link(role, version, parts, key, v) if role else None
    if link:
        row["link"] = link
    return row


def _children(obj):
    return list(obj.items()) if isinstance(obj, dict) else list(enumerate(obj))


def _int(q, name, default, lo, hi):
    try:
        return min(hi, max(lo, int(q.get(name, default))))
    except (TypeError, ValueError):
        raise BadRequest(f"{name} must be a whole number")


def file_node(q):
    """One node of a file: its children page (containers) or its whole value (scalars); depth > 1 fills children
    breadth-first until maxNodes, marking what was left out with more:true so the client keeps those rows lazy."""
    t0 = time.monotonic()
    fid = q.get("id")
    entry, p, group, version = file_entry(fid, q.get("mtime"))
    path = q.get("path", "")
    parts = pointer_parts(path)
    node, pos = resolve_pointer(entry["obj"], parts)
    offset = _int(q, "offset", 0, 0, 10 ** 9)
    limit = _int(q, "limit", NODE_PAGE, 1, NODE_PAGE_MAX)
    depth = _int(q, "depth", 1, 1, 99)
    budget = _int(q, "maxNodes", EXPAND_MAX_NODES, 1, EXPAND_MAX_CAP)
    role = file_role(entry, group, p.name)
    cdn_ver = version or cdn_version()
    out = {"id": fid, "path": pointer_join(parts), "type": jtype(node), "offset": offset, "limit": limit, "more": False,
           "children": [], "value": None}
    if isinstance(node, (dict, list)):
        kids = _children(node)
        out["count"] = len(kids)
        rows = []
        frontier = []
        for k, v in kids[offset:offset + limit]:
            row = describe(k, v, role, cdn_ver, parts)
            rows.append(row)
            budget -= 1
            if isinstance(v, (dict, list)) and v:
                frontier.append((row, v, parts + [k]))
        out["children"] = rows
        out["more"] = offset + limit < len(kids)
        level = 1
        while frontier and level < depth:
            level += 1
            next_frontier = []
            for row, v, vparts in frontier:
                if budget <= 0:
                    row["more"] = True
                    continue
                sub = _children(v)
                take = min(len(sub), NODE_PAGE, budget)
                row["children"] = []
                for k, vv in sub[:take]:
                    child = describe(k, vv, role, cdn_ver, vparts)
                    row["children"].append(child)
                    budget -= 1
                    if isinstance(vv, (dict, list)) and vv:
                        next_frontier.append((child, vv, vparts + [k]))
                if take < len(sub):
                    row["more"] = True
            frontier = next_frontier
        for row, v, _ in frontier:  # containers at the last requested level: their children are not here
            if depth > 1:
                row["more"] = True
    else:
        out["value"] = node
    out.update(bytes=entry["bytes"], mtime=entry["mtime"], mtimeNs=entry["mtimeNs"],
               total=entry["total"] if not parts else None,
               pos=pos if q.get("locate") in ("1", "true") else None, ms=int((time.monotonic() - t0) * 1000))
    return out


def build_index(obj):
    """Flat pre-order index: parents/keys/pos per node plus two NUL-joined lowercase blobs (keys, scalar values)
    with their piece offsets, so a search is C-speed str.find and a hit maps back to its node by bisect."""
    parents, pos, keys, vals = array("i"), array("i"), [], []
    kparts, koff, kord, klen = [], array("q"), array("i"), 0
    vparts, voff, vord, vlen = [], array("q"), array("i"), 0
    stack = [(obj, -1, None, 0)]
    while stack:
        v, par, k, ps = stack.pop()
        i = len(parents)
        parents.append(par)
        pos.append(ps)
        keys.append(k)
        vals.append(v)
        if isinstance(k, str):
            t = k.lower()
            kord.append(i)
            koff.append(klen)
            kparts.append(t)
            klen += len(t) + 1
        if isinstance(v, dict):
            items = list(v.items())
            for j in range(len(items) - 1, -1, -1):
                stack.append((items[j][1], i, items[j][0], j))
        elif isinstance(v, list):
            for j in range(len(v) - 1, -1, -1):
                stack.append((v[j], i, j, j))
        else:
            if isinstance(v, str):
                t = v.lower()
            elif v is None:
                continue
            elif isinstance(v, bool):
                t = "true" if v else "false"
            else:
                t = json.dumps(v)
            vord.append(i)
            voff.append(vlen)
            vparts.append(t)
            vlen += len(t) + 1
    return {"parents": parents, "pos": pos, "keys": keys, "vals": vals,
            "kblob": "\x00".join(kparts) + "\x00", "koff": koff, "kord": kord,
            "vblob": "\x00".join(vparts) + "\x00", "voff": voff, "vord": vord}


def _scan(blob, off, ords, q, deadline, cap):
    """Hits (ordinal, offset in piece) for q in a blob, one per node, in document order; stops at cap or deadline."""
    hits, start, n = [], 0, 0
    while True:
        j = blob.find(q, start)
        if j < 0:
            return hits, False, False
        i = bisect.bisect_right(off, j) - 1
        hits.append((ords[i], j - off[i]))
        start = off[i + 1] if i + 1 < len(off) else len(blob)
        n += 1
        if n >= cap:
            return hits, True, False
        if n % 256 == 0 and time.monotonic() > deadline:
            return hits, False, True


def _lineage(idx, i):
    """(pointer parts, pos) of node ordinal i."""
    parts, pos = [], []
    while i > 0:
        parts.append(idx["keys"][i])
        pos.append(idx["pos"][i])
        i = idx["parents"][i]
    parts.reverse()
    pos.reverse()
    return parts, pos


def file_search(q):
    """Case-insensitive substring over keys and scalar values; hits in document order with their pos path."""
    t0 = time.monotonic()
    text = (q.get("q") or "").replace("\x00", "").strip()
    if len(text) < 2:
        raise BadRequest("type at least 2 characters")
    needle = text.lower()
    limit = _int(q, "limit", SEARCH_LIMIT, 1, SEARCH_LIMIT_MAX)
    entry, p, group, version = file_entry(q.get("id"), q.get("mtime"))
    with FILES_LOCK:
        idx = entry["index"]
        if idx is None:
            idx = entry["index"] = build_index(entry["obj"])
    deadline = time.monotonic() + SEARCH_BUDGET_S
    kh, kcap, kpart = _scan(idx["kblob"], idx["koff"], idx["kord"], needle, deadline, SEARCH_TOTAL_MAX)
    vh, vcap, vpart = _scan(idx["vblob"], idx["voff"], idx["vord"], needle, deadline, SEARCH_TOTAL_MAX)
    merged = sorted([(i, 0, o) for i, o in kh] + [(i, 1, o) for i, o in vh])
    hits = []
    for i, where, o in merged[:limit]:
        parts, pos = _lineage(idx, i)
        v = idx["vals"][i]
        if where == 0:
            src = idx["keys"][i]
        elif isinstance(v, str):
            src = v
        elif isinstance(v, bool):
            src = "true" if v else "false"
        else:
            src = json.dumps(v)
        j = src.lower().find(needle)
        j = max(0, j if j >= 0 else o)
        a = max(0, j - 40)
        b = min(len(src), a + 120)
        snippet = ("…" if a > 0 else "") + src[a:b] + ("…" if b < len(src) else "")
        hits.append({"path": pointer_join(parts), "key": idx["keys"][i], "where": "key" if where == 0 else "value",
                     "type": jtype(v), "snippet": snippet, "pos": pos})
    total = min(len(merged), SEARCH_TOTAL_MAX)
    return {"id": q.get("id"), "q": text, "hits": hits, "total": total, "capped": kcap or vcap or total >= SEARCH_TOTAL_MAX,
            "partial": kpart or vpart, "bytes": entry["bytes"], "mtime": entry["mtime"], "mtimeNs": entry["mtimeNs"],
            "ms": int((time.monotonic() - t0) * 1000)}


def file_lines(q):
    """GET /api/file/lines?id=&offset=&limit=500&q=&mtime=: a page of a chat log's lines, or the lines matching `q`.
    Without `q` the default page is the tail (the newest `limit` lines); `offset` is a 0-based line index for
    earlier pages. With `q` (case-insensitive substring, 2+ characters) every matching line is returned in file
    order up to `limit`, `total` counting on to LINES_TOTAL_MAX. A line is {n, ts, msg}; a continuation line (no
    timestamp) has ts null. The whole file is read each call (a day's log is a few MB; nothing is cached)."""
    p, group, _ = file_path(q.get("id"))
    if group != "logs":
        raise BadRequest("not a chat log")
    st = p.stat()
    stamp = {"bytes": st.st_size, "mtime": local_iso(datetime.fromtimestamp(st.st_mtime)), "mtimeNs": st.st_mtime_ns}
    if q.get("mtime") not in (None, "") and str(st.st_mtime_ns) != str(q["mtime"]):
        raise FileError(409, {"error": "file changed", **stamp})
    try:
        limit = max(1, min(int(q.get("limit", LINES_PAGE)), LINES_PAGE_MAX))
    except ValueError:
        raise BadRequest("bad limit")
    with p.open("rb") as f:
        raw = f.read().decode("utf-8", errors="replace")
    lines = raw.split("\n")
    if lines and lines[-1] == "":
        lines.pop()  # the trailing newline, not an empty last line
    total = len(lines)

    def row(n, text):
        text = text.rstrip("\r")
        m = LINE_RE.match(text)
        return {"n": n + 1, "ts": m.group(1), "msg": m.group(2)} if m else {"n": n + 1, "ts": None, "msg": text}

    query = (q.get("q") or "").strip()
    if query:
        if len(query) < 2:
            raise BadRequest("type at least 2 characters")
        needle = query.lower()
        hits, matches, capped = [], 0, False
        for n, text in enumerate(lines):
            if needle in text.lower():
                matches += 1
                if len(hits) < limit:
                    hits.append(row(n, text))
                elif matches >= LINES_TOTAL_MAX:
                    capped = True
                    break
        return {"id": q.get("id"), "q": query, "lines": hits, "matches": matches, "capped": capped, "total": total, **stamp}
    try:
        offset = int(q["offset"]) if q.get("offset") not in (None, "") else max(0, total - limit)
    except ValueError:
        raise BadRequest("bad offset")
    offset = max(0, min(offset, total))
    page = [row(offset + k, text) for k, text in enumerate(lines[offset:offset + limit])]
    return {"id": q.get("id"), "lines": page, "offset": offset, "limit": limit, "total": total,
            "more": offset + len(page) < total, **stamp}


def file_subtree(q):
    """Pretty JSON of one subtree for Copy value; 413 past RAW_MAX_BYTES. The whole file is streamed by the handler."""
    entry, p, group, version = file_entry(q.get("id"), q.get("mtime"))
    node, _ = resolve_pointer(entry["obj"], pointer_parts(q.get("path", "")))
    body = json.dumps(node, indent=2, ensure_ascii=False).encode()
    if len(body) > RAW_MAX_BYTES:
        raise FileError(413, {"error": "too big to copy", "bytes": len(body), "mtime": entry["mtime"], "mtimeNs": entry["mtimeNs"]})
    return body, p.name


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(STATIC), **kw)

    def log_message(self, fmt, *args):
        pass

    def send_json(self, obj, status=200):
        body = json.dumps(obj).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def send_raw(self, q):
        """GET /api/file/raw: the whole file streamed from disk (never json.load-ed), or one subtree pretty-printed."""
        if q.get("path", "") == "":
            p, group, version = file_path(q.get("id"))
            st = p.stat()
            if q.get("mtime") not in (None, "") and str(st.st_mtime_ns) != str(q["mtime"]):
                raise FileError(409, {"error": "file changed", "bytes": st.st_size, "mtimeNs": st.st_mtime_ns,
                                      "mtime": local_iso(datetime.fromtimestamp(st.st_mtime))})
            body, name, length = None, p.name, st.st_size
        else:
            body, name = file_subtree(q)
            length = len(body)
        self.send_response(200)
        self.send_header("Content-Type", f"{'text/plain' if name.endswith('.log') else 'application/json'}; charset=utf-8")
        self.send_header("Content-Length", str(length))
        self.send_header("Content-Disposition", f'inline; filename="{name}"')
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if body is None:
            with p.open("rb") as f:
                shutil.copyfileobj(f, self.wfile)
        else:
            self.wfile.write(body)

    LOCAL_HOSTS = ("127.0.0.1", "localhost", "::1")

    def local_only(self):
        """The server listens on 127.0.0.1 only, but a browser can be made to send a request for another host name
        that resolves there (DNS rebinding) and then read the answer as its own origin. Serve only the names the
        app, the Mac app and the Windows program use; everything else gets 403."""
        host = (self.headers.get("Host") or "").strip()
        name = host.rsplit(":", 1)[0] if re.fullmatch(r"[^:]+(:\d+)?|\[[^\]]+\](:\d+)?", host) else host
        if name.strip("[]") in self.LOCAL_HOSTS:
            return True
        self.send_json({"error": "forbidden host"}, 403)
        return False

    def do_GET(self):
        if not self.local_only():
            return
        url = urlparse(self.path)
        q = {k: v[0] for k, v in parse_qs(url.query).items()}
        try:
            if url.path == "/api/reports":
                return self.send_json(list_reports())
            if url.path == "/api/report":
                return self.send_json(load_report(q["file"]))
            if url.path == "/api/vendors":
                return self.send_json(vendors(q.get("character")))
            if url.path == "/api/storage":
                return self.send_json(storage(q.get("character")))
            if url.path == "/api/consolidation":
                return self.send_json(consolidation(q.get("character")))
            if url.path == "/api/plan":
                return self.send_json(plan(q.get("character")))
            if url.path == "/api/session":
                log = latest_chatlog()
                return self.send_json(parse_session(log, q.get("scope", "day"), q.get("character") or None) if log else {})
            if url.path == "/api/zone":
                return self.send_json(zone(q.get("character"), q.get("area")))
            if url.path == "/api/combat":
                return self.send_json(combat_report(q.get("scope", "day")))
            if url.path == "/api/party":
                return self.send_json(party_state())
            if url.path == "/api/health":
                return self.send_json(health(q.get("character")))
            if url.path == "/api/icons":
                return self.send_json(icons(q))
            if url.path == "/api/lookup":
                return self.send_json(lookup(q))
            if url.path == "/api/files":
                return self.send_json(list_files())
            if url.path == "/api/file/node":
                return self.send_json(file_node(q))
            if url.path == "/api/file/search":
                return self.send_json(file_search(q))
            if url.path == "/api/file/raw":
                return self.send_raw(q)
            if url.path == "/api/file/lines":
                return self.send_json(file_lines(q))
            if url.path == "/api/tail":
                log = latest_chatlog()
                if not log:
                    return self.send_json({"lines": []})
                off = int(q["offset"]) if "offset" in q and q.get("log") == log.name else None
                return self.send_json(tail(log, off))
        except FileNotFoundError as e:
            return self.send_json({"error": f"not found: {e}"}, 404)
        except BadRequest as e:
            return self.send_json({"error": str(e)}, 400)
        except FileError as e:  # 409 file changed, 413 too big, 422 invalid JSON (Files view states)
            return self.send_json(e.payload, e.status)
        except Exception as e:  # POC: surface errors to the UI
            return self.send_json({"error": repr(e)}, 500)
        return super().do_GET()

    def do_POST(self):
        if not self.local_only():
            return
        # Only the page itself posts here (every POST route): JSON content type (a cross-site form or no-cors
        # fetch cannot send it without a preflight, and no CORS headers are ever sent) and, when the browser
        # names an origin, this server's own.
        origin = self.headers.get("Origin")
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        if ctype != "application/json" or (origin and urlparse(origin).hostname not in self.LOCAL_HOSTS):
            return self.send_json({"error": "forbidden"}, 403)
        url = urlparse(self.path)
        if url.path == "/api/capacity":
            try:
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
                if not isinstance(body, dict):
                    raise BadRequest("body must be a JSON object")
                slots = save_capacity(body.get("vault"), body.get("slots"))
            except (BadRequest, json.JSONDecodeError) as e:
                msg = str(e) if isinstance(e, BadRequest) else "body must be JSON"
                return self.send_json({"error": msg}, 400)
            except Exception as e:
                return self.send_json({"error": repr(e)}, 500)
            return self.send_json({"ok": True, "slots": slots})
        if url.path == "/api/mark":
            try:
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
                if not isinstance(body, dict):
                    raise BadRequest("body must be a JSON object")
                marks = save_mark(body.get("typeId"), body.get("mark"))
            except (BadRequest, json.JSONDecodeError) as e:
                return self.send_json({"error": str(e) if isinstance(e, BadRequest) else "body must be JSON"}, 400)
            except Exception as e:
                return self.send_json({"error": repr(e)}, 500)
            return self.send_json({"ok": True, "marks": marks})
        if url.path == "/api/party":
            try:
                body = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))) or b"{}")
                if not isinstance(body, dict):
                    raise BadRequest("body must be a JSON object")
                code = party_set("new" if body.get("action") == "new" else body.get("code"))
            except (BadRequest, json.JSONDecodeError) as e:
                return self.send_json({"error": str(e) if isinstance(e, BadRequest) else "body must be JSON"}, 400)
            except Exception as e:
                return self.send_json({"error": repr(e)}, 500)
            return self.send_json(party_state())
        self.send_json({"error": "not found"}, 404)


def main(argv):
    """`python3 server.py [--open]`. --open launches the browser once the server listens (the Windows
    launcher passes it). Startup prints the game folder it found and what is missing, so a friend can
    report the right path without reading the code."""
    open_browser = "--open" in argv
    url = f"http://127.0.0.1:{PORT}/"
    for stream in (sys.stdout, sys.stderr):  # a Windows console may not be UTF-8; never crash on a name
        if stream is not None and hasattr(stream, "reconfigure"):
            stream.reconfigure(errors="replace", line_buffering=True)  # lines reach a log file as they happen
    if not GAME_DIR.exists():
        hint = (r"usually C:\Users\<you>\AppData\LocalLow\Elder Game\Project Gorgon" if WINDOWS
                else "usually ~/Library/Application Support/unity.Elder Game.Project Gorgon")
        sys.exit(f"Game data folder not found: {GAME_DIR}\n"
                 f"Set PG_DIR to the folder that holds Reports and ChatLogs ({hint}).\n"
                 "In game, the VIP menu's export buttons show the Reports path.")
    ThreadingHTTPServer.request_queue_size = 64
    ThreadingHTTPServer.daemon_threads = True
    try:
        srv = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError as e:
        print(f"Port {PORT} is already in use ({e}); Gorgon Notes is probably running already.")
        if open_browser:
            import webbrowser
            webbrowser.open(url)
        return 0
    exports = len(list(REPORTS.glob("*.json"))) if REPORTS.is_dir() else 0
    logs = len(list(CHATLOGS.glob("Chat-*.log"))) if CHATLOGS.is_dir() else 0
    party_load()
    if _party["code"]:
        party_thread()  # keep posting closed fights to the party's topic even while no view is open
    print(f"Gorgon Notes on {url}")
    print(f"Game data: {GAME_DIR}")
    print(f"  {plural(exports, 'export')} in Reports, {plural(logs, 'chat log')} in ChatLogs")
    if not exports:
        print("  No exports yet: in game, VIP menu -> Export Character JSON and Export Storage JSON.")
    if not logs:
        print("  No chat logs yet: the game only writes one with Log All Chat on (the app's top bar says how).")
    print("Close this window (or press Ctrl+C) to stop.")
    if open_browser:
        import webbrowser
        threading.Timer(0.5, webbrowser.open, [url]).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
