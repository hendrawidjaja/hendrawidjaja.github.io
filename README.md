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
export AUTH_JWT_SECRET="$(openssl rand -base64 32)"   # 32+ chars, keep it stable
podman run -d -p 3000:3000 --name my-cv \
  -e AUTH_JWT_SECRET="$AUTH_JWT_SECRET" \
  localhost/my-cv:latest
```

`AUTH_JWT_SECRET` is **required in production** and must be at least 32
characters; the app refuses to issue or verify tokens without it. Keep the same
value across restarts and deployments so existing tokens stay valid. Changing it
invalidates every outstanding token.

The production image is a snapshot of the code **at build time** — edits on the
host do not reach it; re-run the build after every change. Dev and production
both use port 3000, so stop one before starting the other:

```bash
podman stop my-cv-dev   # switch to production
podman stop my-cv       # switch back to development
```

---

## Default Admin Credentials

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

> Login and password-change attempts are rate limited: 5 failures per 15 minutes
> per IP (login also scoped per username), then `429` with `Retry-After`. The
> limiter is in-memory, so it applies to a single running instance.

---

## Project Structure & Data Persistence

- `app/`: Next.js App Router pages, server actions, and REST routes (`/api/cv/*`, `/api/auth/*`). Server actions handle all authenticated CV mutations.
- `data/cv-data.json`: Local JSON file storing your custom CV data, created and updated automatically.
- `data/auth-config.json`: Local salted password hash storage.
- `src/`: React frontend with Tailwind CSS v4, Lucide icons, and PDF export engine.

---

## Documentation

| Doc | Contents |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, directory map, data flow (single JSON source of truth), PDF pipeline, known limitations |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Full capability inventory: public showcase, admin editing, rich text, PDF export |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Auth model, rich-text sanitization trust boundary, hardening checklist |
| [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md) | Commands, conventions, gotchas, verification loop |
