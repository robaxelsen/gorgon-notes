import importlib.util, sys, json
from pathlib import Path
from datetime import timedelta
spec = importlib.util.spec_from_file_location("srv", str(Path(__file__).resolve().parent.parent / "server.py")); srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(srv)
"""Compare two players' chat logs for one shared session: enemy ids in common, overlapping fights, and what
party_merge makes of them. Used 26 Oct 2026 on Robchew's and Akriex's 25 Oct logs (docs/DPS-FEASIBILITY.md).

  python3 -I tools/compare-logs.py <my log> <me> <friend log> <friend> <friend offset hours> <my window from> <my window to>
  e.g. … Chat-26-10-25.log Robchew ~/Downloads/Chat-26-10-25.log Akriex 6 "2026-10-25T14:13" "2026-10-25T16:04"

The friend's offset is my timezone minus theirs (their log is stamped in their local time); the friend's window
is derived from mine. Reads the logs only; writes nothing."""
ARGS = sys.argv[1:]
sys.argv = ["x"]
U, ME, F, FR, OFF, LO, HI = Path(ARGS[0]), ARGS[1], Path(ARGS[2]), ARGS[3], float(ARGS[4]), ARGS[5], ARGS[6]

def parse(path, who):
    t = srv.DpsTracker(resolve=lambda: who)
    for raw in path.read_bytes().decode("utf-8", errors="replace").split("\n"):
        m = srv.LINE_RE.match(raw.rstrip("\r"))
        if m: t.feed(m.group(1), m.group(2))
    return t, t.result("day", path, path.stat())

tu, ru = parse(U, ME); tf, rf = parse(F, FR)
print("user fights", len(ru["fights"]), "friend fights", len(rf["fights"]), "friend character", rf["character"], "friend roster", sorted(tf.roster), "leader", tf.leader, "party", tf.party_name)
SH = timedelta(hours=OFF)
def win(fs, lo, hi): return [f for f in fs if lo <= f["at"][:16] <= hi]
from datetime import datetime as _dt
flo = (_dt.fromisoformat(LO) - SH).isoformat()[:16]; fhi = (_dt.fromisoformat(HI) - SH).isoformat()[:16]
fu = win(ru["fights"], LO, HI); ff = win(rf["fights"], flo, fhi)
print("in the shared window: user", len(fu), "friend", len(ff))
print("user fights in party per the log:", sum(1 for f in fu if f.get("inParty")), "friend:", sum(1 for f in ff if f.get("inParty")))
# enemy ids
idu = {i for f in fu for i in f.get("mobIds", [])}; idf = {i for f in ff for i in f.get("mobIds", [])}
print("enemy ids user", len(idu), "friend", len(idf), "shared", len(idu & idf))
# names of shared ids (from targets)
# pairwise overlap after shifting the friend's times by +6 h
def dt(s): return srv.iso_dt(s)
pairs = 0; shared_pairs = 0; both = []
for a in fu:
    sa, ea = dt(a["at"]), dt(a["endAt"])
    for b in ff:
        sb, eb = dt(b["at"]) + SH, dt(b["endAt"]) + SH
        if sa <= eb and sb <= ea:
            pairs += 1
            sh = set(a.get("mobIds", [])) & set(b.get("mobIds", []))
            if sh: shared_pairs += 1
            both.append((a["at"][11:19], b["at"][11:19], a["dmg"], b["dmg"], len(sh), a.get("top"), b.get("top")))
print("overlapping fight pairs", pairs, "of which with a shared enemy id", shared_pairs)
for row in both[:12]: print("  ", row)
# party_merge with shifted friend summaries
remote = {}
for b in ff:
    s = srv.party_summary(b, FR, "test")
    s["start"] = (dt(s["start"]) + SH).isoformat(); s["end"] = (dt(s["end"]) + SH).isoformat()
    remote[f"{FR}|{s['start']}"] = s
local = [f for f in fu if f["dmg"] > 0]
merged = srv.party_merge(ME, local, remote, None)
multi = [m for m in merged if len(m["members"]) > 1]
print("party_merge: groups", len(merged), "with both players", len(multi), "byIds", sum(1 for m in multi if m.get("byIds")), "byRoster", sum(1 for m in multi if m.get("byRoster")))
for m in multi[:6]:
    print("  ", m["start"][11:19], m["area"], m["dur"], "s", [(x["who"], x["dmg"], round(x["share"]*100)) for x in m["members"]], "byIds", m.get("byIds"))
