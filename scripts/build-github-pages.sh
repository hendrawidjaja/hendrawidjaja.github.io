#!/usr/bin/env bash
# Build the read-only CV that GitHub Pages serves.
#
# Static export cannot contain API routes or server actions, so the build runs
# in a throwaway copy with those swapped for read-only stand-ins. The editable
# app keeps running elsewhere (Netlify) from the same source.
#
# Usage: ./scripts/build-github-pages.sh [output-dir]
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out_dir="${1:-out-github-pages}"
# Project pages live at https://<user>.github.io/<repo>/, so assets need the
# repo name as base path. A user/organisation site (repo `<user>.github.io`) is
# served from the domain root and needs no base path. The workflow picks the
# right one; the local default is the root-served case.
base_path="${STATIC_BASE_PATH-}"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  --exclude .env.local \
  --exclude out \
  --exclude "$out_dir" \
  "$repo_root/" "$work/"

# Reuse the installed toolchain instead of reinstalling inside the temp copy.
ln -s "$repo_root/node_modules" "$work/node_modules"

rm -rf "$work/src/app/api"
cp "$repo_root/scripts/github-pages/page.tsx" "$work/src/app/page.tsx"
cp "$repo_root/scripts/github-pages/mutations.ts" "$work/src/services/mutations.ts"

cd "$work"
# The temp copy has no `.git`; hand next.config the commit count from the repo.
APP_VERSION="$(
  git -C "$repo_root" rev-list --count HEAD 2>/dev/null | sed 's/^/0./;s/$/.0/'
)" \
STATIC_EXPORT=1 \
  STATIC_BASE_PATH="$base_path" \
  NEXT_PUBLIC_READ_ONLY=1 \
  npx next build --webpack

rm -rf "${repo_root:?}/$out_dir"
cp -R "$work/out" "$repo_root/$out_dir"
echo "Static site written to $repo_root/$out_dir (base path: '$base_path')"
