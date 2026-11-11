export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    "http://localhost:3000";

  const withProtocol = /^https?:\/\//i.test(configuredUrl)
    ? configuredUrl
    : `${configuredUrl.includes("localhost") ? "http" : "https"}://${configuredUrl}`;

  return new URL(withProtocol);
}
