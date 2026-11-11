import type { Metadata } from "next";
import ResourcePageClient from "./ResourcePageClient";
import { getSiteUrl } from "@/lib/site-url";

type ResourceMetadata = {
  id: string | number;
  title?: string;
  description?: string;
  url?: string;
  status?: string;
  authorUsername?: string;
  media?: { url?: string; contentType?: string }[];
  sharedFrom?: ResourceMetadata | null;
};

type ResourceResponse = { data?: ResourceMetadata };

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1").replace(/\/$/, "");
const siteUrl = getSiteUrl();

async function getResourceForMetadata(id: string): Promise<ResourceMetadata | null> {
  if (!/^\d+$/.test(id)) return null;

  try {
    const response = await fetch(`${apiBase}/resources/${id}`, {
      next: { revalidate: 120 },
    });
    if (!response.ok) return null;
    const result = (await response.json()) as ResourceResponse;
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = await getResourceForMetadata(id);
  const original = resource?.sharedFrom ?? resource;
  const title = original?.title?.trim() || "Developer resource";
  const description =
    (resource?.description || original?.description || `A resource shared by @${original?.authorUsername || "a DevForum member"}.`)
      .replace(/\s+/g, " ")
      .slice(0, 240);
  const imageUrl = original?.media?.find((media) => media.contentType?.startsWith("image/") && media.url)?.url;
  let absoluteImageUrl = new URL("/social-preview.png", siteUrl).toString();
  if (imageUrl) {
    try {
      const candidate = new URL(imageUrl, siteUrl);
      if (candidate.protocol === "https:" || candidate.protocol === "http:") {
        absoluteImageUrl = candidate.toString();
      }
    } catch {
      // Use the branded site preview for invalid or unsupported media URLs.
    }
  }
  const canonicalUrl = new URL(`/resources/${encodeURIComponent(id)}`, siteUrl).toString();
  const isPublished = Boolean(resource) && (!resource?.status || resource.status === "PUBLISHED");

  return {
    title: `${title} | DevForum`,
    description,
    alternates: { canonical: canonicalUrl },
    robots: isPublished ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      siteName: "DevForum",
      title,
      description,
      images: [{ url: absoluteImageUrl, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: absoluteImageUrl, alt: title }],
    },
  };
}

export default function ResourcePage() {
  return <ResourcePageClient />;
}
