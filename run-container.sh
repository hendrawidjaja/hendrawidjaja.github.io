#!/usr/bin/env sh
# Build and run the dev container via compose. Whatever holds the host port -- a
# container from this or another project, or a host process -- is stopped first,
# so a run never fails with "address already in use".
set -eu

PORT=${PORT:-3000}

podman ps --format '{{.ID}} {{.Ports}}' | awk -v p=":$PORT->" 'index($0, p) {print $1}' |
  while read -r id; do
    echo "stopping container $(podman inspect --format '{{.Name}}' "$id") holding :$PORT"
    podman stop "$id" >/dev/null
  done

pids=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "stopping host process(es) $pids holding :$PORT"
  kill $pids 2>/dev/null || true
  sleep 2
  pids=$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null || true)
  if [ -n "$pids" ]; then
    kill -9 $pids 2>/dev/null || true
  fi
fi

podman rm -f my-cv-dev >/dev/null 2>&1 || true
podman-compose up -d --build
