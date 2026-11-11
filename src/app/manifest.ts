import type { MetadataRoute } from "next";

const assetVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "v2";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "DevForum — Developer Community",
    short_name: "DevForum",
    description: "Developer community and knowledge sharing platform",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#0b1220",
    theme_color: "#0b1220",
    icons: [
      {
        src: `/pwa-icon-192.svg?v=${assetVersion}`,
        sizes: "192x192",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `/pwa-icon-512.png?v=${assetVersion}`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `/pwa-icon.svg?v=${assetVersion}`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
