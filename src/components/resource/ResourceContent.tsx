"use client";

import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";

import type { Media, Resource } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function isVideo(url?: string, contentType?: string) {
  return Boolean(
    contentType?.startsWith("video/") ||
      /\.(mp4|webm|ogg)(\?|$)/i.test(url || ""),
  );
}

function isImage(url?: string, contentType?: string) {
  return Boolean(
    contentType?.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|avif)(\?|$)/i.test(url || ""),
  );
}

function youtubeEmbed(url?: string) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    let id = "";

    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.slice(1);
    }

    if (parsed.hostname.includes("youtube.com")) {
      id = parsed.searchParams.get("v") || "";
    }

    if (!id) return null;

    return `https://www.youtube.com/embed/${id}`;
  } catch {
    return null;
  }
}

function MediaItem({ media, title }: { media: Media; title: string }) {
  if (isImage(media.url, media.contentType)) {
    return (
      <a
        href={media.url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={media.url}
          alt={media.fileName || title}
          className="max-h-[520px] w-full object-cover"
          loading="lazy"
        />
      </a>
    );
  }

  if (isVideo(media.url, media.contentType)) {
    return (
      <video
        src={media.url}
        controls
        preload="metadata"
        className="max-h-[520px] w-full bg-black"
        onClick={(event) => event.stopPropagation()}
      />
    );
  }

  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 p-4"
      onClick={(event) => event.stopPropagation()}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
        <FileText className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
        {media.fileName}
      </span>

      <ExternalLink className="h-4 w-4 text-slate-400" />
    </a>
  );
}

/**
 * Everything that makes up a post's content: badges, title, description, media,
 * YouTube / external link preview and tags. Used by the feed card for normal posts
 * AND for the original post embedded inside a share.
 */
export function ResourceContent({
  resource,
  compact = false,
  allMedia = false,
  fullText = false,
}: {
  resource: Resource;
  /** Hide the description (used by compact lists). */
  compact?: boolean;
  /** Render every attached file instead of just the first one. */
  allMedia?: boolean;
  /** Show the whole description instead of clamping it to 3 lines. */
  fullText?: boolean;
}) {
  const mediaList = allMedia
    ? (resource.media ?? [])
    : (resource.media ?? []).slice(0, 1);

  const youtubeUrl = youtubeEmbed(resource.url);

  return (
    <>
      <Link href={`/resources/${resource.id}`} className="block">
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="badge">{resource.type || "RESOURCE"}</span>

          {resource.categoryName && (
            <span className="badge">{resource.categoryName}</span>
          )}
        </div>

        <h2 className="mt-3 text-[21px] font-black leading-snug tracking-tight text-slate-950 sm:text-[23px]">
          {resource.title}
        </h2>

        {resource.description && !compact && (
          <p
            className={
              fullText
                ? "mt-2 whitespace-pre-wrap break-words text-[16px] leading-7 text-slate-600"
                : "mt-2 line-clamp-3 text-[16px] leading-7 text-slate-600"
            }
          >
            {resource.description}
          </p>
        )}
      </Link>

      {mediaList.length > 0 && (
        <div className="mt-4 space-y-2">
          {mediaList.map((item) => (
            <div
              key={item.id}
              className="overflow-hidden rounded-2xl bg-slate-100"
            >
              <MediaItem media={item} title={resource.title} />
            </div>
          ))}
        </div>
      )}

      {youtubeUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl bg-black">
          <iframe
            src={youtubeUrl}
            title={resource.title}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : resource.url ? (
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          onClick={(event) => event.stopPropagation()}
          className="link-preview mt-4"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
              {hostname(resource.url)}
            </div>

            <div className="mt-1 line-clamp-2 text-[15px] font-bold text-slate-800">
              {resource.title}
            </div>

            <div className="mt-1 break-all text-sm text-slate-500">
              {resource.url}
            </div>
          </div>

          <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
        </a>
      ) : null}

      {resource.tags?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {resource.tags.slice(0, 6).map((tag) => (
            <Link
              key={tag}
              href={`/?search=${encodeURIComponent(tag)}`}
              onClick={(event) => event.stopPropagation()}
              className="tag-link"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/**
 * The bordered "original post" box shown inside a share, Facebook-style:
 * original author + date on top, then the full original content.
 */
export function SharedPostEmbed({
  original,
  compact = false,
}: {
  original: Resource;
  compact?: boolean;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-4 pt-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={original.authorUsername} size="sm" />

          <div className="min-w-0 flex-1">
            <Link
              href={`/users/${original.authorUsername}`}
              className="text-[15px] font-extrabold text-slate-950"
              onClick={(event) => event.stopPropagation()}
            >
              @{original.authorUsername}
            </Link>

            <div className="text-[12px] text-slate-500">
              {new Date(original.createdAt).toLocaleString()}
            </div>
          </div>
        </div>

        <ResourceContent
          resource={original}
          compact={compact}
          allMedia
          fullText
        />
      </div>
    </div>
  );
}
