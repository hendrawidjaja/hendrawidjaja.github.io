# Architecture

Single-user professional CV web application. Next.js App Router with server-side
persistence to a local JSON file, rendered with React 19 and Tailwind CSS v4.

## Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router, Turbopack) | 16.4.5 |
| UI | React + React DOM | 19.x |
| Styling | Tailwind CSS (via PostCSS) | 4.3.5 |
| Rich text | `contentEditable` + `document.execCommand` | — |
| PDF export | `html2canvas` → `jsPDF` | 1.4.1 / 4.x |
| Runtime | Bun | 1.4+ |
| Formatting / linting | Biome | 2.x |
| Type checking | TypeScript (`tsc --noEmit`) | — |

## Directory map

```
app/                     Next.js App Router
  actions.ts             ALL authenticated mutations (server actions) + auth session store
  page.tsx               SSR entry: loads CV data, renders <CVClient>
  layout.tsx             Root layout, font loading, theme setup
  globals.css            Tailwind entrypoint + .rich-text styles + print CSS
  api/
    cv/route.ts          GET /api/cv (public read)
    auth/*/route.ts      login / verify / change-password / logout (HTTP wrappers)
components/
  CVClient.tsx           Client shell: state, toasts, CRUD orchestration
src/components/          Section + modal components (Header, Hero, sections, editors)
src/context/AuthContext  Auth + edit-mode state
src/services/api.ts      Thin HTTP client (auth endpoints used by the UI)
src/types/cv.ts          CVData domain types — the data contract
src/utils/richText.ts    Sanitizer + text/html conversion utilities
data/
  cv-data.json           SINGLE SOURCE OF TRUTH for all CV content
  auth-config.json       PBKDF2-salted admin hash (legacy, only without DATABASE_URL)
src/server/user-db.ts    Postgres user store (used when DATABASE_URL is set)
public/                  Static assets (avatar image)
```

## Data flow

```
Render:   data/cv-data.json --(server action, SSR)--> page.tsx --> CVClient --> sections
Edit:     RichTextEditor / forms --> CVClient handlers --> server actions
          --> sanitizeRichFields() --> data/cv-data.json (atomic full-file write)
```

### Single source of truth

`data/cv-data.json` holds ALL CV content. There is no seed fallback in code:
if the file is missing or invalid, `readCVData()` throws a descriptive error
instead of regenerating template data. Protect this file or restore from backup.

### Where mutations happen — `app/actions.ts`

Every authenticated create/update/delete is a server action in one file:
- verifies the in-memory session token
- applies `sanitizeRichFields()` (see `docs/SECURITY.md`)
- merges into the loaded `CVData` and rewrites the JSON file

REST endpoints under `app/api/` are thin wrappers over the same actions and
exist for external clients; the built-in UI calls the server actions directly.

## Rendering model

- Server component page fetches CV data synchronously on request (dynamic SSR).
- Section components are dumb presenters; they render rich fields through
  `toRenderableHtml()` (legacy plain text and stored HTML both handled).
- Rich-text containers use the `rich-text` CSS class so lists, links, and
  highlights render inside already-styled blocks; print CSS keeps them intact.

## PDF export pipeline (PdfExportModal)

1. Temporarily removes the `dark` class (export is always light theme).
2. `html2canvas` snapshots the CV element at `scale: 2`, fixed `windowWidth: 1200`.
3. JPEG at 0.95 quality fed to `jsPDF` (A4 portrait, 210mm width).
4. Pages sliced by repeating `addImage` with negative vertical offsets.
5. `dark` class restored afterwards.

## Known limitations

- Sessions are held in process memory (`Set<string>`) — a server restart logs
  everyone out; horizontal scaling would need a shared store.
- The data layer is a single JSON file — fine for one editor, unsuitable for
  concurrent writers or a public multi-user deployment.
- PDF export is client-side rasterization (JPEG), so text is not selectable.
