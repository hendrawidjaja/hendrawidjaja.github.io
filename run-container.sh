#!/usr/bin/env sh
# Build and run the dev container. Whatever holds the host port -- a container
# from this or another project, or a host process -- is stopped first, so a run
# never fails with "address already in use".
set -eu

PORT=${PORT:-3000}
IMAGE=my-cv-dev
NAME=my-cv-dev

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

podman build -t "$IMAGE" -f Containerfile.dev . >/dev/null
podman rm -f "$NAME" >/dev/null 2>&1 || true
podman run -d -p "$PORT:3000" --name "$NAME" \
  -v "$PWD":/app \
  -v my-cv-dev-node-modules:/app/node_modules \
  -v my-cv-dev-next:/app/.next \
  "localhost/$IMAGE:latest" \
  sh -c 'bun install && bunx next dev -p 3000' >/dev/null