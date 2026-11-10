#!/bin/sh
set -eu

# A mounted volume starts empty (and usually root-owned), hiding the image's
# seeded data. Copy the bundled defaults once, then hand ownership to `app`.
mkdir -p /app/data
for file in cv-data.json auth-config.json; do
  if [ ! -e "/app/data/$file" ] && [ -e "/app/data-seed/$file" ]; then
    cp "/app/data-seed/$file" "/app/data/$file"
  fi
done

if [ "$(id -u)" = "0" ]; then
  chown -R app:app /app/data
  exec su-exec app "$@"
fi

exec "$@"
