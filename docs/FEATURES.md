# Features

What the deployed application can do, end to end. All entries are implemented
and verified against the running app.

## Public (no login)

- **Executive CV showcase** — profile, headline, metrics, experience timeline,
  education, skill categories, featured projects, contact footer. Fully SSR.
- **Dark / light theme** — toggle in the header, `dark` class strategy
  (`@custom-variant` in Tailwind v4).
- **Download PDF** — client-side export via `html2canvas` → `jsPDF`
  (A4, always rendered in light theme regardless of current theme; see
  `docs/ARCHITECTURE.md#pdf-export-pipeline`).
- **Print stylesheet** — chrome (nav, buttons, modals) hides via `.no-print`;
  content colors stay print-accurate.
- **Public JSON read** — `GET /api/cv` returns the full CV data.
- **Rich-text rendering** — bold/italic/underlined text, bullet and numbered
  lists, and hyperlinks inside summaries, descriptions, and highlights, with
  legacy plain text still supported without migration.

## Admin experience (after login)

- **Login modal** — username + password → bearer session token.
  Default seed is `admin/admin123` and changing it is required.
- **Edit mode toggle** — header button flips the CV into inline edit mode,
  exposing per-section `+` (add) and pencil (edit) affordances.
- **Mutating sections**
  - Profile: name, title, headline, summary (rich text), contacts, social URLs,
    status/availability, metrics.
  - Experience: role, company, dates, "I currently work here" flag, summary
    (rich text), key achievements (rich text bullets), tech stack tags.
  - Education: degree, field, institution, years, honors, highlights (rich text).
  - Skill categories: name + per-skill level (Expert/Proficient/Familiar) and
    "featured" flags.
  - Projects: title, tagline, description (rich text), role, year, demo/GitHub
    URLs, tech tags, featured badge.
- **WYSIWYG rich text editor** — toolbar: bold, italic, underline,
  strikethrough, bullet list, numbered list, insert link (`https`, `mailto`,
  `tel`, anchors), remove link, clear formatting. Pastes as plain text,
  `Ctrl/Cmd+B/I/U` shortcuts work, active formats highlighted while typing.
- **Delete confirmation modal** — destructive deletes require typed intent.
- **Reset data** — removed by design; `docs/ARCHITECTURE.md` explains why
  (`data/cv-data.json` is the single source of truth).
- **Change password** — requires the current password; a new hash is written to
  Postgres (`DATABASE_URL` set) or `data/auth-config.json` (legacy) with a fresh
  salt.
- **First-user registration** — with `DATABASE_URL` set and no users yet, the
  login dialog offers account creation; it closes after the first account.
- **Instant toasts** — success/error feedback per operation.

## Data & persistence

- Single JSON store: `data/cv-data.json` (descriptive error, no silent reset).
- Save writes are server-side and sanitized regardless of client
  (see `docs/SECURITY.md`).
- `GET /api/cv` for external consumers; auth endpoints under `/api/auth/*`
  (`login`, `verify`, `change-password`, `logout`) as thin wrappers over the
  same server actions used by the UI.

## Verified end-to-end (this repo)

- Attack-payload round trip: `<script>`, `<img onerror>`, `javascript:`
  stripped at the action boundary; safe links kept with
  `rel="noopener noreferrer"`.
- Missing-store test: removing `data/cv-data.json` yields a clear server error
  rather than fabricating template content.
