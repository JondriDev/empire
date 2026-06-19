#!/usr/bin/env bash
# Empire Auto-Iteration Loop — unattended "background" engine.
#
# Re-invokes Claude Code headlessly to perform ONE iteration per run, following
# docs/ITERATION_PROTOCOL.md, on the auto/iteration branch. The backlog file is
# the persistent state between cold starts, so each run resumes where the last
# left off.
#
# Usage:
#   scripts/empire-auto-loop.sh [MAX_ITERS] [SLEEP_SECONDS]
#     MAX_ITERS      default 20   (0 = run until stop-file or BACKLOG-EMPTY)
#     SLEEP_SECONDS  default 30   (pause between iterations)
#
# Stop gracefully:   touch logs/.stop-auto-loop     (or Ctrl-C)
# Run detached:      setsid nohup scripts/empire-auto-loop.sh 50 30 >/dev/null 2>&1 &
# Publish each step: EMPIRE_LOOP_PUSH=1   (pushes auto/iteration so a PR stays current)
#
# Permissions: an unattended loop cannot answer permission prompts. The default
# uses `--permission-mode acceptEdits` (auto-accepts file edits, but may still
# pause on some shell commands). For a truly hands-off overnight run, export:
#     EMPIRE_LOOP_PERM="--dangerously-skip-permissions"
# (only do that in this trusted local repo — it skips ALL confirmations).
set -uo pipefail

EMPIRE_DIR="${EMPIRE_DIR:-/data/data/com.termux/files/home/Desktop/empire}"
BRANCH="auto/iteration"
MAX_ITERS="${1:-20}"
SLEEP_SECONDS="${2:-30}"
STOP_FILE="$EMPIRE_DIR/logs/.stop-auto-loop"
PERM_FLAG="${EMPIRE_LOOP_PERM:---permission-mode acceptEdits}"
TS="$(date '+%Y%m%d-%H%M%S')"
LOG="$EMPIRE_DIR/logs/auto-loop-$TS.log"

cd "$EMPIRE_DIR" || { echo "Empire dir not found: $EMPIRE_DIR" >&2; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "claude CLI not on PATH" >&2; exit 1; }
mkdir -p logs
rm -f "$STOP_FILE"

# Liveness + single-instance lock. If another loop is already running, refuse.
PIDFILE="$EMPIRE_DIR/logs/.auto-loop.pid"
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE" 2>/dev/null)" 2>/dev/null; then
  echo "Another auto-loop is already running (PID $(cat "$PIDFILE")). Exiting." >&2
  exit 1
fi
echo "$$" > "$PIDFILE"
trap 'rm -f "$PIDFILE"' EXIT

# Always operate on the dedicated branch.
CURRENT="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '?')"
if [ "$CURRENT" != "$BRANCH" ]; then
  git checkout "$BRANCH" 2>/dev/null || git checkout -b "$BRANCH" || {
    echo "Could not switch to $BRANCH" >&2; exit 1; }
fi

PROMPT='Perform exactly ONE Empire iteration following docs/ITERATION_PROTOCOL.md to the letter: take the single topmost unchecked item in docs/ITERATION_BACKLOG.md, implement the smallest coherent change, run `npm run build` and ensure it passes (fix it, or `git checkout -- .` to revert and pick a simpler item — never commit a red build), commit on the auto/iteration branch WITHOUT pushing, then flip that item to [x] in the backlog and append any follow-ups. Then stop. If there are no unchecked items, change nothing and reply with exactly: BACKLOG-EMPTY'

echo "Empire auto-loop | start=$TS max=$MAX_ITERS sleep=${SLEEP_SECONDS}s"
echo "  branch=$BRANCH perm='$PERM_FLAG'"
echo "  log=$LOG  (stop: touch $STOP_FILE)"

i=0
while :; do
  i=$((i + 1))
  if [ "$MAX_ITERS" -ne 0 ] && [ "$i" -gt "$MAX_ITERS" ]; then
    echo "Reached MAX_ITERS=$MAX_ITERS — stopping."; break
  fi
  if [ -f "$STOP_FILE" ]; then
    echo "Stop file found — halting."; rm -f "$STOP_FILE"; break
  fi

  echo "===== iteration $i @ $(date '+%Y-%m-%d %H:%M:%S') =====" | tee -a "$LOG"
  # shellcheck disable=SC2086
  OUT="$(claude -p "$PROMPT" $PERM_FLAG 2>&1)"
  printf '%s\n' "$OUT" | tee -a "$LOG"

  if printf '%s' "$OUT" | grep -q "BACKLOG-EMPTY"; then
    echo "Backlog empty — nothing left to do. Halting." | tee -a "$LOG"; break
  fi

  # Publish to the PR branch when EMPIRE_LOOP_PUSH is set (keeps a PR current).
  if [ -n "${EMPIRE_LOOP_PUSH:-}" ]; then
    git push -u origin "$BRANCH" 2>&1 | tee -a "$LOG"
  fi

  sleep "$SLEEP_SECONDS"
done

echo "Empire auto-loop done after $((i - 1)) completed iteration(s). Log: $LOG"
