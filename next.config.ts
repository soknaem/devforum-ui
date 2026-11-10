import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  // Lint separately with `npm run lint`; do not let ESLint setup problems block `next build`.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
