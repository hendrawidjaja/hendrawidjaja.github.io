const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  poweredByHeader: false,
  // `pg` has optional native bindings; keep it external so Node resolves it at
  // runtime instead of bundling it into the server output. (Next also
  // auto-externalizes `pg`; listing it explicitly guards against that list
  // changing.)
  serverExternalPackages: ['pg'],
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
  // Podman on macOS (AppleHV + virtiofs) never propagates file-watch events
  // from host into the guest (podman#22343), so hot reload in the dev
  // container only works with polling. This is the documented last resort in
  // the Next.js local-development guide; remove it if the dev server ever
  // runs directly on the host.
  watchOptions: {
    pollIntervalMs: 2000,
  },
  async headers() {
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
