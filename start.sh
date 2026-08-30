#!/usr/bin/env bash
# ============================================================
#  Space Observatory Agents — master start script
#  Boots the FastAPI backend + Next.js frontend in parallel.
#
#  Safe to invoke from ANY working directory:
#    bash /path/to/space-observatory-agents/start.sh
#    bash start.sh          (from inside the project folder)
#    ./start.sh             (from inside the project folder)
# ============================================================

# Resolve the directory this script lives in — works regardless
# of cwd, symlinks, or how the script was invoked.
SCRIPT_PATH="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/$(basename "${BASH_SOURCE[0]}")"
ROOT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

# cd into the project root immediately so every relative path
# used by child processes (uvicorn --reload-dir, npm run dev, etc.)
# is anchored here, no matter where the terminal was when this
# script was called.
cd "$ROOT_DIR"

VENV_DIR="$ROOT_DIR/.venv"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
ROOT_NODE_MODULES="$ROOT_DIR/node_modules"

# ── Colour helpers ────────────────────────────────────────────
CYAN="\033[0;36m"; MAGENTA="\033[0;35m"
GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"
RESET="\033[0m"

log()  { echo -e "${GREEN}[observatory]${RESET} $*"; }
info() { echo -e "${YELLOW}[observatory]${RESET} $*"; }
err()  { echo -e "${RED}[observatory]${RESET} $*" >&2; }

# ── Pre-flight: verify project structure ─────────────────────
for required in "$BACKEND_DIR" "$FRONTEND_DIR" "$BACKEND_DIR/requirements.txt"; do
  if [ ! -e "$required" ]; then
    err "Required path not found: $required"
    err "Make sure you are running start.sh from inside space-observatory-agents/"
    err "or passing the full path to start.sh."
    exit 1
  fi
done

log "Project root: $ROOT_DIR"

# ── 1. Python virtualenv + dependencies ──────────────────────
if [ ! -d "$VENV_DIR" ]; then
  log "Creating Python virtualenv at .venv …"
  python3 -m venv "$VENV_DIR"
fi

log "Installing / verifying backend Python dependencies …"
"$VENV_DIR/bin/pip" install -q --upgrade pip
"$VENV_DIR/bin/pip" install -q -r "$BACKEND_DIR/requirements.txt"

# ── 2. Root-level concurrently (for npm run dev) ──────────────
if [ ! -d "$ROOT_NODE_MODULES" ]; then
  log "Installing root npm devDependencies (concurrently) …"
  (cd "$ROOT_DIR" && npm install)
else
  info "Root node_modules present — skipping root npm install."
fi

# ── 3. Frontend npm dependencies ─────────────────────────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  log "Installing frontend npm dependencies …"
  (cd "$FRONTEND_DIR" && npm install)
else
  info "Frontend node_modules present — skipping frontend npm install."
fi

# ── 4. Launch both servers ────────────────────────────────────
log "Backend  → http://localhost:8000  |  Docs: http://localhost:8000/docs"
log "Frontend → http://localhost:3001"
echo ""

# Shutdown handler — kill by saved PIDs, not by pipeline-end PIDs
BACKEND_PID=""
FRONTEND_PID=""
cleanup() {
  echo ""
  log "Shutting down …"
  [ -n "$BACKEND_PID"  ] && kill "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill "$FRONTEND_PID" 2>/dev/null || true
  # Give processes a moment, then force-kill any stragglers
  sleep 1
  [ -n "$BACKEND_PID"  ] && kill -0 "$BACKEND_PID"  2>/dev/null && kill -9 "$BACKEND_PID"  2>/dev/null || true
  [ -n "$FRONTEND_PID" ] && kill -0 "$FRONTEND_PID" 2>/dev/null && kill -9 "$FRONTEND_PID" 2>/dev/null || true
  log "Done."
}
trap cleanup INT TERM EXIT

# ── Backend ───────────────────────────────────────────────────
# Run uvicorn from ROOT_DIR (guaranteed by the cd above) so that
# `backend`, `agents`, and `pipelines` are all importable as
# top-level packages.  Output is prefixed via process substitution
# so the real uvicorn PID is captured, not a sed/pipe PID.
PYTHONPATH="$ROOT_DIR" \
  "$VENV_DIR/bin/uvicorn" backend.main:app \
  --reload \
  --reload-dir "$BACKEND_DIR" \
  --reload-dir "$ROOT_DIR/agents" \
  --reload-dir "$ROOT_DIR/pipelines" \
  --host 0.0.0.0 \
  --port 8000 \
  --log-level info \
  > >(while IFS= read -r line; do echo -e "${CYAN}[API]   ${RESET}${line}"; done) \
  2>&1 &
BACKEND_PID=$!

# ── Frontend ──────────────────────────────────────────────────
(cd "$FRONTEND_DIR" && npm run dev) \
  > >(while IFS= read -r line; do echo -e "${MAGENTA}[WEB]   ${RESET}${line}"; done) \
  2>&1 &
FRONTEND_PID=$!

# ── Wait ──────────────────────────────────────────────────────
# Block until both children exit (normal) or Ctrl-C fires the trap
wait "$BACKEND_PID" "$FRONTEND_PID"
