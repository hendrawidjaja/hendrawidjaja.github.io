# Executive Career CV & Portfolio (Bun Ready)

A full-stack, modern executive career CV showcase and resume builder featuring authentication, live CRUD management across career sections, and publication-ready PDF export.

## Prerequisites

- **Bun**: v1.0.0+ (v1.2+ recommended) — install via `curl -fsSL https://bun.sh/install | bash`
- *(Optional fallback: Node.js v18+)*

---

## Running with Bun (Recommended)

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Start the development server**:
   ```bash
   bun dev
   ```
   *(Or run directly: `bunx next dev -p 3000 --hostname 0.0.0.0`)*

3. **Open in your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Production Build & Run with Bun

1. **Build the production client bundle**:
   ```bash
   bun run build
   ```

2. **Start the production server**:
   ```bash
   bun start
   ```

The server serves the optimized Next.js production build and handles API requests on port `3000` (or your configured `PORT` environment variable).

---

## Running with Node / npm (Alternative)

If you ever need to run in a standard Node.js environment:
```bash
npm install
npm run dev
```

---

## User accounts (Postgres)

With `DATABASE_URL` set, users and password hashes live in Postgres instead of
`data/auth-config.json`, which is what makes admin login work on serverless
hosts. The schema (`app_users`) is created automatically on first use.

```bash
export DATABASE_URL="postgres://user:pass@host:5432/dbname"
```

- **Registration is first-user-only.** While the table is empty, the login
  dialog offers “Create admin account”; the first account created becomes the
  admin. As soon as one user exists, registration closes permanently (`403`).
- The username is 3–32 characters (`letters`, `digits`, `.`, `_`, `-`); the
  password must be at least 12 characters.
- Without `DATABASE_URL` the legacy single-admin JSON store is used and
  registration is not offered.
- Hosted Postgres requires TLS; connections to `localhost`/`127.0.0.1` skip it.

> The user store is only one half of persistence: `data/cv-data.json` edits
> still need a writable volume. So on Vercel/Netlify you can log in once a
> `DATABASE_URL` exists, but CV content changes still fail there.

---

## Running with Containers (Podman)

### Development (hot reload — no rebuild needed)

The dev container (`Containerfile.dev`) bind-mounts this directory, so edits
you make on the host are served automatically at [http://localhost:3000](http://localhost:3000):

```bash
podman build -t my-cv-dev -f Containerfile.dev .
podman run -d -p 3000:3000 --name my-cv-dev \
  -v "$PWD":/app -v my-cv-dev-node-modules:/app/node_modules \
  localhost/my-cv-dev:latest
```

Dependencies install into the `my-cv-dev-node-modules` volume on first start,
which keeps the host's `node_modules` out of the Linux container.

> **Note:** Podman on macOS (AppleHV + virtiofs) does not propagate file-watch
> events from host to guest ([podman#22343](https://github.com/podman-container-tools/podman/issues/22343)),
> so `next dev` cannot see host edits via inotify. `next.config.mjs` therefore
> sets `watchOptions.pollIntervalMs: 2000` (the documented last resort — it
> costs ~40% of a vCPU while idle). Remove it if the dev server runs directly
> on the host.

### Production (baked build — rebuild required)

```bash
podman build -t my-cv:latest -f Containerfile .
export AUTH_JWT_SECRET="$(openssl rand -base64 48)"   # 32+ chars, keep it stable
podman run -d -p 3000:3000 --name my-cv \
  -e AUTH_JWT_SECRET="$AUTH_JWT_SECRET" \
  -v my-cv-data:/app/data \
  localhost/my-cv:latest
```

`AUTH_JWT_SECRET` is **required in production** and must be at least 32
characters; the app refuses to issue or verify tokens without it. Keep the same
value across restarts and deployments so existing tokens stay valid. Changing it
invalidates every outstanding token.

Mount a volume at `/app/data` in production. That directory holds the password
hash and CV content; without it, credentials and edits disappear when the
container is recreated. On first boot the entrypoint copies the bundled defaults
into the empty volume, then drops from root to the non-root `app` user.

> **Serverless hosting (Vercel/Netlify):** accounts and password changes can
> persist via `DATABASE_URL` (see *User accounts*), but the filesystem is
> read-only or ephemeral, so CV content edits cannot persist. Use a container
> host with a volume for full admin functionality.

The production image is a snapshot of the code **at build time** — edits on the
host do not reach it; re-run the build after every change. Dev and production
both use port 3000, so stop one before starting the other:

```bash
podman stop my-cv-dev   # switch to production
podman stop my-cv       # switch back to development
```

### Deploying to a container host (Fly.io example)

```bash
fly launch --no-deploy --name <your-app>
fly volumes create cv_data --size 1
fly secrets set AUTH_JWT_SECRET="$(openssl rand -base64 48)"
fly deploy
```

Add the mount to `fly.toml`:

```toml
[mounts]
  source = "cv_data"
  destination = "/app/data"
```

Render, Coolify, Railway, and plain Docker follow the same pattern: build the
`Containerfile`, set `AUTH_JWT_SECRET`, and attach a persistent disk/volume at
`/app/data`.

### Deploying to Netlify or Vercel

Both env vars must be set in the host dashboard, then the site redeployed:

| Variable | Required | Notes |
|---|---|---|
| `AUTH_JWT_SECRET` | Yes | 32+ random characters; stable across deploys |
| `DATABASE_URL` | Yes for admin use | Postgres (Neon, Supabase, …) |

Set `DATABASE_URL` **before** logging in: without it the app falls back to the
read-only `data/auth-config.json` bundle, so the bootstrap-login → forced
password-change step cannot be saved and admin access never completes. With it,
the first visit offers **Create admin account** and the hash persists.

CV content edits still cannot persist on these hosts (serverless filesystems are
read-only/immutable); only accounts and passwords move to Postgres.

---

## Default Admin Credentials

### With `DATABASE_URL` (Postgres)

The store starts empty: open the Admin dialog and choose **Create admin
account**. That first account is the only self-service registration; edit mode
is enabled immediately with the password you chose.

### Without `DATABASE_URL` (legacy JSON store)

- **Username**: `admin`
- **Password**: `admin123` (bootstrap only)

To sign in:
1. Click the **Admin** button (lock icon) in the top right or bottom footer.
2. Enter `admin` and `admin123`.
3. Because that is the bootstrap password, the app immediately opens the
   password dialog. Choose a password of **at least 12 characters**; editing is
   locked until you do.
4. After the change you are signed out and must log in again with the new
   password. You can change it later via **Password** in the footer.

> Login, registration, and password-change attempts are rate limited: 5 failures
> per 15 minutes per IP (login also scoped per username), then `429` with
> `Retry-After`. The limiter is in-memory, so it applies to a single running
> instance.

---

## Project Structure & Data Persistence

- `app/`: Next.js App Router pages, server actions, and REST routes (`/api/cv/*`, `/api/auth/*`). Server actions handle all authenticated CV mutations.
- `data/cv-data.json`: Local JSON file storing your custom CV data, created and updated automatically.
- `data/auth-config.json`: Legacy salted password hash (only when `DATABASE_URL` is unset).
- `src/server/user-db.ts`: Postgres user store (`app_users`), used when `DATABASE_URL` is set.
- `src/`: React frontend with Tailwind CSS v4, Lucide icons, and PDF export engine.

---

## Documentation

| Doc | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, directory map, data flow (single JSON source of truth), PDF pipeline, known limitations |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Full capability inventory: public showcase, admin editing, rich text, PDF export |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Auth model, rich-text sanitization trust boundary, hardening checklist |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Commands, conventions, gotchas, verification loop |
