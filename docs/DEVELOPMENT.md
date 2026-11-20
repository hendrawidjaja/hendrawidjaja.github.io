# Development

Practical commands and conventions for working on this repository.

## Requirements

- Bun 1.2+ (`curl -fsSL https://bun.sh/install | bash`)
- Node.js >= 20 typings for editor tooling

## Commands

| Task                 | Command                        | Notes                                            |
|----------------------|--------------------------------|--------------------------------------------------|
| Install              | `bun install`                  |                                                  |
| Dev server           | `bun run dev`                  | Next dev, `localhost:3000`, `--hostname 0.0.0.0` |
| Type check           | `bunx tsc --noEmit`            | also wired as `bun run lint`                     |
| Production build     | `bun run build`                | use to verify integrity after refactors          |
| Run production       | `bun start`                    | serves the built `.next`                         |
| Format               | `bunx biome format --write ./` | double quotes, **no trailing newline**           |
| Lint + format        | `bunx biome check --write ./`  | add `--unsafe` for assist fixes                  |
| Wipe build artifacts | `bun run clean`                | removes `.next` only                             |

## Gotchas

- **Port 3000 already in use** — stale dev servers are the usual cause:
  `lsof -ti:3000 | xargs kill`. Do not start a second `bun run dev` for this
  project; if you need a parallel instance, use `next dev -p 3001`.
- **JSON seed was removed on purpose** — if a page starts throwing
  `CV data file missing`, restore `data/cv-data.json` (backup or re-create).
  There is intentionally no code fallback.
- **Formatting** — Biome 2.x with `tailwindDirectives: true` in `biome.json`
  (needed for Tailwind v4 `@theme`/`@custom-variant` syntax in `globals.css`).
  Biome is a real devDependency, so IDE integrations resolve it locally.
- **After touching rich-text rendering** — check print CSS too:
  `.rich-text` rules live in `../src/app` (media print handled by the same
  block; toggling `dark` off during export is done in `PdfExportModal`).
- **After changes** Delete the node_modules and .next folder. Build again with `bun dev`

## Conventions

- **Quotes / style** — Biome decides; do not hand-merge formatting. Use double quote
- **Server mutations** belong in `../src/app` (auth check + sanitize +
  merge + write). API routes call actions; components call actions or the
  service layer, never `fs`.
- **Rich text fields**: `summary`, `description`, `headline`, `tagline`,
  `highlights[]`. Render through `toRenderableHtml()` and a `rich-text`
  container; store raw HTML only via a sanitize pass.
- **Types**: `src/types/cv.ts` is the contract; keep server actions always use React Server action or NextJS SSR, JSON
  store, and UI types aligned through it.
- **Icons**: inline SVG components in `src/components/Icons.tsx` — no icon
  dependency.
- **New endpoints**: compose from existing actions rather than re-implementing
  business logic.

## Test / verify loop (manual)

1. `bunx tsc --noEmit`
2. `bunx biome check --write ./`
3. `bun run build`
4. `bun run dev`, then exercise the CV UI: login → edit a field with the rich
   editor → save → hard-reload → confirm persistence in `data/cv-data.json`.

Docs: `docs/ARCHITECTURE.md` (how the pieces fit), `docs/SECURITY.md`
(trust boundaries), `docs/FEATURES.md` (capability inventory).