#!/bin/zsh
# Autopsy probe: find out where (if anywhere) a successful autopsy report lands on disk.
#   tools/autopsy-probe.sh before   # snapshot Books/, Player.log, today's chat log, Reports/
#   tools/autopsy-probe.sh after    # show everything new since the snapshot
# Read-only on the game folders; snapshots go to the repo's tools/probe-state/ (gitignored later).
set -u
G="$HOME/Library/Application Support/unity.Elder Game.Project Gorgon"
PL="$HOME/Library/Logs/Elder Game/Project Gorgon/Player.log"
ST="${0:A:h}/probe-state"
mkdir -p "$ST"
case "${1:-}" in
  before)
    ls -la "$G/Books" > "$ST/books.txt"
    wc -l < "$PL" > "$ST/playerlog.lines"
    cp "$PL" "$ST/playerlog.before"
    ls -la "$G/Reports" > "$ST/reports.txt"
    find "$G" -type f -not -path "*/Unity/*" | sort > "$ST/files.txt"
    date > "$ST/stamp"
    echo "Snapshot taken $(cat "$ST/stamp"). Now do the autopsies, then run: tools/autopsy-probe.sh after"
    ;;
  after)
    echo "== Snapshot was: $(cat "$ST/stamp")"
    echo "== New or changed files in the game folder (excluding Unity/):"
    find "$G" -type f -not -path "*/Unity/*" -newer "$ST/stamp" | sed "s|$G/||"
    echo "== New Books files:"
    ls -la "$G/Books" | diff "$ST/books.txt" - | grep '^>' || echo "(none)"
    echo "== Player.log: $(cat "$ST/playerlog.lines") -> $(wc -l < "$PL") lines. New lines mentioning autopsy/corpse/kill/damage/book/talk/report:"
    n=$(cat "$ST/playerlog.lines")
    if [[ $(wc -l < "$PL") -lt $n ]]; then echo "(Player.log rotated; compare with Player-prev.log by hand)"; n=0; fi
    tail -n +$((n+1)) "$PL" | grep -i "autops|corpse|kill|damage|book|talk|report|patholog" -E | grep -v "Download|LoadAsset|appearance" | cut -c1-240 | head -60
    echo "== New Player.log line kinds (first word), top 30:"
    tail -n +$((n+1)) "$PL" | sed 's/^\[[0-9:]*\] //' | grep -o '^[A-Za-z_][A-Za-z0-9_.-]\{2,40\}' | sort | uniq -c | sort -rn | head -30
    C=$(ls -t "$G/ChatLogs"/Chat-*.log | head -1)
    echo "== Chat log ($C:t) lines since the snapshot mentioning autopsy/anatomy/pathology:"
    find "$C" -newer "$ST/stamp" >/dev/null
    awk -v s="$(date -r "$ST/stamp" +%y-%m-%d\ %H:%M:%S)" -F'\t' '$1 >= s' "$C" | grep -i "autops|anatomy|patholog|killed|cause of death" -E | cut -c1-240 | head -40
    ;;
  *) echo "usage: $0 before|after"; exit 1 ;;
esac
