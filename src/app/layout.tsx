import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/components/theme/ThemeProvider";
import { PwaServiceWorker } from "@/components/PwaServiceWorker";
import { getSiteUrl } from "@/lib/site-url";

const siteUrl = getSiteUrl();
const assetVersion = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "v2";
const socialPreview = new URL(`/social-preview.png?v=${assetVersion}`, siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "DevForum",
  description: "A developer community for useful resources, ideas and conversations.",
  applicationName: "DevForum",
  keywords: ["developer community", "programming resources", "software development", "developer forum"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "DevForum",
    title: "DevForum — Build. Share. Learn.",
    description: "A developer community for useful resources, ideas and conversations.",
    url: "/",
    images: [{ url: socialPreview, width: 1200, height: 630, alt: "DevForum — Build. Share. Learn." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DevForum — Build. Share. Learn.",
    description: "A developer community for useful resources, ideas and conversations.",
    images: [{ url: socialPreview, alt: "DevForum — Build. Share. Learn." }],
  },
  robots: { index: true, follow: true },
  manifest: `/manifest.webmanifest?v=${assetVersion}`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DevForum",
  },
  icons: {
    icon: [{ url: `/pwa-icon.svg?v=${assetVersion}`, type: "image/svg+xml" }],
    apple: [{ url: `/pwa-icon-512.png?v=${assetVersion}`, type: "image/png", sizes: "512x512" }],
  },
};

// Lets the browser draw native controls (scrollbars, inputs) in the right theme.
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the inline script below adds the "dark" class before React runs.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <PwaServiceWorker />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
