import type { NextConfig } from "next";

const standalone = process.env.NEXT_OUTPUT_STANDALONE === "true";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  output: standalone ? "standalone" : undefined,
  poweredByHeader: false,
};

export default nextConfig;