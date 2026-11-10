import type { Metadata, Viewport } from "next";
import "./globals.css"; 
import { AppProviders } from "@/components/providers";
import { THEME_INIT_SCRIPT } from "@/components/theme/ThemeProvider";

export const metadata: Metadata = {
  title: "DevForum",
  description: "Developer community and knowledge sharing platform"
};

// Lets the browser draw native controls (scrollbars, inputs) in the right theme.
export const viewport: Viewport = {
  colorScheme: "light dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the inline script below adds the "dark" class before React runs.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
