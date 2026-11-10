# Security

Trust model: one admin user, one password hash, self-contained signed tokens.
The Reader (public) sees only what the CV contains; the Editor is anyone holding
a valid, unexpired token whose credential version matches the current password.

## Authentication

- Credentials are checked by `loginAction` (`app/actions.ts`); the error is a
  generic "Invalid credentials" for both a wrong username and a wrong password.
- **Password storage:** PBKDF2-SHA512, 210,000 iterations, 64-byte key, random
  16-byte salt — `data/auth-config.json`. Hashes created by older builds with
  10,000 iterations are upgraded transparently on the next successful login.
- **First run** creates `admin / admin123`. That password is a bootstrap value:
  login succeeds but returns `mustChangePassword: true`, the UI forces the
  password dialog, and every content mutation is rejected until it is replaced.
- **Password policy:** new passwords must be at least 12 characters and must not
  be the bootstrap password.
- **Tokens:** JWT (HMAC-SHA256), 24-hour TTL, kept client-side in `localStorage`
  and sent as `Authorization: Bearer <token>`. Payload carries `sub`, `iat`,
  `ver` (credential version) and `mustChange`.
- **Revocation:** changing the password bumps `tokenVersion` in
  `data/auth-config.json`; existing tokens carry the old `ver` and are rejected
  immediately. Logout is a client-side discard only — the token stays valid
  until its TTL expires (accepted for a single-admin, stateless design).
- **Signing secret:** `AUTH_JWT_SECRET` (at least 32 characters). It is required
  in production — the app fails closed if it is missing. In development an
  ephemeral per-process secret is generated and a warning is logged, so tokens
  do not survive a restart there. Resolved lazily, so `next build` does not need
  the secret.
- **Timing:** login hashes the supplied password unconditionally before comparing,
  and username/hash/signature comparisons use `crypto.timingSafeEqual` (via
  SHA-256 digests to avoid length leaks), so a wrong username costs the same as
  a wrong password.

## Rate limiting

`src/server/rate-limit.ts` implements an in-memory fixed-window limiter used by
`app/api/auth/[[...action]]/route.ts`:

| Endpoint | Key | Budget |
|---|---|---|
| `POST /api/auth/login` | client IP + lowercased username | 5 failures / 15 min |
| `POST /api/auth/change-password` | client IP | 5 failures / 15 min |

- Only **failed** attempts count; a successful call clears the bucket.
- Over budget: `429 Too Many Requests` with `Retry-After` (seconds) and
  `Cache-Control: no-store`.
- Policy violations (password too short, etc.) return `400` and do **not**
  consume the budget; only real auth failures (`401`) do.
- Malformed or non-object JSON bodies return `400 Invalid request body`.
- **Single process only.** Counters live in memory, so multiple app instances or
  a serverless deployment each get their own budget. Move the map behind a
  shared store (e.g. Redis) with the same API before scaling horizontally.

## Rich text — the main injection surface

CV fields (`summary`, `description`, `headline`, `tagline`, `highlights[]`) are
rendered with `dangerouslySetInnerHTML`. The client editor is NOT trusted:
everything is sanitized server-side before it can reach the JSON store
(`sanitizeRichFields` in `app/actions.ts`, allowlist in `src/utils/richText.ts`).

Allowlist (tags): `p, br, strong, b, em, i, u, s, ul, ol, li, a, mark, code, span, h1–h4`
- `<a>` keeps only `href`, `rel`, `target` (validated `_blank`/`_self`/...)
- `href` schemes: `http`, `https`, `mailto`, `tel`, `#anchor`, `/relative`
  (protocol-relative `//` is rejected); `javascript:` or `data:` is dropped
- Everything dropped rather than escaped for tags with executable content:
  script/style/iframe/object/embed/svg/math/template are removed WITH their
  content; event handlers (`on*`) and `style` attributes are stripped
- Unknown elements are unwrapped — text survives, markup does not
- Unclosed tags are balanced on output; empty nodes are pruned
- `target="_blank"` gains `rel="noopener noreferrer"` automatically
- Legacy plain text is escaped and converted to `<p>` paragraphs — all data
  saved before rich text existed renders safely without migration

Client-side defenses: `RichTextEditor` pastes as plain text; the toolbar can
only produce allowlisted output.

## HTTP headers

`next.config.mjs` sets baseline hardening headers on every response:
`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: camera=(), microphone=(), geolocation=()`, and
`Strict-Transport-Security: max-age=31536000` (a no-op over plain HTTP, active
behind TLS). `X-Powered-By` is disabled.

A strict Content-Security-Policy is deliberately **not** set: the App Router
emits inline bootstrap scripts, so a nonce-based policy needs a proxy layer.
Add one before public exposure.

## Other surfaces

- Every mutating action calls `verifyEditorJwt`, not just `verifyJwt`: a token
  issued while the bootstrap password is still active can only change the
  password, not edit content.
- REST routes (`app/api/*`) go through the same actions, so attackers bypassing
  the UI still pass sanitization and auth.
- `GET /api/cv` is intentionally public and includes profile contact details
  (name, email, phone, location, LinkedIn) — that is the point of a public CV.
- JSON writes are full-file rewrites of a parsed-and-validated object, never raw
  string splicing — injection into the store would only pass if it fits CVData.
- Files written with `fs.writeFileSync` are inside `data/` only; no
  user-controlled paths.
- No CORS headers are sent, so browsers block cross-origin reads by default.
  Bearer tokens (not cookies) mean there is no CSRF surface.

## Hardening checklist for public internet exposure

1. Set a strong, stable `AUTH_JWT_SECRET` (32+ random characters) in the runtime
   environment and change the bootstrap password immediately after first login.
2. Move the rate-limit counters to a shared store (Redis/Upstash) if running
   more than one instance.
3. Serve over HTTPS and add a nonce-based CSP at the proxy.
4. Keep `data/` on a persistent volume with backups; it holds the CV and the
   credential hash.
