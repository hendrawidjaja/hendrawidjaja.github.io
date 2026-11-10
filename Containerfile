# Multi-stage build, OCI-compatible (podman, docker, buildah).
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_OUTPUT_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# Minimal runtime: Alpine's `nodejs` package is ~53 MB stripped, versus the
# ~124 MB Node binary (plus npm/yarn/corepack) in node:22-alpine.
FROM alpine:3.22 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
RUN apk add --no-cache nodejs \
  && addgroup -S -g 1001 app \
  && adduser -S -u 1001 -G app app \
  && rm -rf /var/cache/apk/* /usr/share/man
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
COPY --from=build --chown=app:app /app/public ./public
USER app
EXPOSE 3000
CMD ["node", "server.js"]
