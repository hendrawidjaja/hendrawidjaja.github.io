import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// `STATIC_EXPORT=1` builds the read-only site that GitHub Pages serves.
// scripts/build-github-pages.sh removes the API routes and server-action page
// from a temp copy first, because static export cannot contain them.
const isStaticExport = process.env.STATIC_EXPORT === '1';
const staticBasePath = process.env.STATIC_BASE_PATH || '';

/**
 * Footer version: `0.<commit count>.0`, so every commit bumps the minor tick.
 * APP_VERSION wins (the static build runs from a copy without `.git`), and a
 * checkout without git history falls back to package.json.
 */
function appVersion() {
  if (process.env.APP_VERSION) return process.env.APP_VERSION;
  try {
    const count = execSync('git rev-list --count HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (/^\d+$/.test(count)) return `0.${count}.0`;
  } catch {
    // No git binary or no repository (dev container, tarball builds).
  }
  try {
    return JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version;
  } catch {
    return '0.0.0';
  }
}

const nextConfig = {
  reactStrictMode: true,
  env: { NEXT_PUBLIC_APP_VERSION: appVersion() },
  output: isStaticExport ? 'export' : 'standalone',
  basePath: isStaticExport ? staticBasePath : '',
  trailingSlash: isStaticExport,
  poweredByHeader: false,
  // `pg` has optional native bindings; keep it external so Node resolves it at
  // runtime instead of bundling it into the server output. (Next also
  // auto-externalizes `pg`; listing it explicitly guards against that list
  // changing.)
  serverExternalPackages: ['pg'],
  // Dev-only self-restart. Bun's Node shim reports a fixed ~268 MB V8 heap
  // limit regardless of the host, so Next's "80% of heap used" check fires
  // within minutes and restarts the server mid-request. The container has
  // ~2 GB, so keep the process alive instead of restarting every few requests.
  experimental: {
    devMemoryThresholdRestart: false,
  },
  // Serve images as-is instead of pulling Next's sharp/libvips optimizer into
  // the runtime image. The CV has one local avatar; the ~18 MB saved is worth
  // more than image resizing here.
  images: {
    unoptimized: true,
  },
  // Keep sharp/libvips out of the standalone trace entirely. Deleting it in a
  // later image layer would still ship the ~18 MB in the COPY layer.
  outputFileTracingExcludes: {
    '*': ['node_modules/sharp/**/*', 'node_modules/@img/**/*'],
  },
  // `data/` is read at request time through a runtime path, so Next's tracer
  // cannot see it. Include it explicitly or serverless hosts (Netlify/Vercel)
  // deploy functions without the CV/credential files and every auth call fails
  // with "Authentication unavailable".
  outputFileTracingIncludes: {
    '*': ['./data/**/*'],
  },
  // Podman on macOS (AppleHV + virtiofs) never propagates file-watch events
  // from host into the guest (podman#22343), so hot reload in the dev
  // container only works with polling. This is the documented last resort in
  // the Next.js local-development guide; remove it if the dev server ever
  // runs directly on the host.
  watchOptions: {
    pollIntervalMs: 2000,
  },
  async headers() {
    // Static export ignores response headers; GitHub Pages sets its own.
    if (isStaticExport) return [];
    // Baseline hardening headers. A strict CSP is deliberately omitted: the
    // App Router relies on inline bootstrap scripts, so a nonce-based policy
    // needs a proxy layer — revisit before public exposure (docs/SECURITY.md).
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
        ],
      },
    ];
  },
};

export default nextConfig;
