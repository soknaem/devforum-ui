import type { Metadata, Viewport } from "next";
import "./globals.css"; 
import { AppProviders } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/components/theme/ThemeProvider";
import { PwaServiceWorker } from "@/components/PwaServiceWorker";

export const metadata: Metadata = {
  title: "DevForum",
  description: "Developer community and knowledge sharing platform",
  applicationName: "DevForum",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DevForum",
  },
  icons: {
    icon: [{ url: "/pwa-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/pwa-icon-512.png", type: "image/png", sizes: "512x512" }],
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
