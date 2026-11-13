"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, X } from "lucide-react";

import type { ContentBlock, Media, Resource } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

export function ResourceMarkdown({ text, className = "" }: { text: string; className?: string }) {
  return (
    <div className={`resource-markdown min-w-0 break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
          h1: ({ children }) => <h3 className="text-xl font-black leading-tight">{children}</h3>,
          h2: ({ children }) => <h4 className="text-lg font-extrabold leading-tight">{children}</h4>,
          h3: ({ children }) => <h5 className="text-base font-bold leading-tight">{children}</h5>,
          ul: ({ children }) => <ul className="list-disc pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6">{children}</ol>,
          li: ({ children }) => <li className="my-1">{children}</li>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-slate-300 pl-4 text-slate-500">{children}</blockquote>,
          a: ({ href, children }) => (
            <a href={href} target={href?.startsWith("#") ? undefined : "_blank"} rel={href?.startsWith("#") ? undefined : "noreferrer"} className="font-semibold text-blue-600 underline underline-offset-2">
              {children}
            </a>
          ),
          pre: ({ children }) => <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm leading-6 text-slate-100">{children}</pre>,
          code: ({ className: codeClassName, children }) => (
            <code className={codeClassName || "rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.9em] text-slate-800"}>{children}</code>
          ),
          table: ({ children }) => <table className="w-full border-collapse text-left text-sm">{children}</table>,
          th: ({ children }) => <th className="border border-slate-200 bg-slate-100 px-3 py-2 font-bold">{children}</th>,
          td: ({ children }) => <td className="border border-slate-200 px-3 py-2 align-top">{children}</td>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

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

export function ImageGallery({
  images,
  title,
}: {
  images: Media[];
  title: string;
}) {
  const visibleImages = images.slice(0, 4);
  const count = visibleImages.length;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const gridClass = count === 1
    ? "mx-auto flex w-full max-w-4xl justify-center"
    : count === 3
      ? "grid-cols-[1.15fr_1fr] grid-rows-[minmax(0,1fr)_minmax(0,1fr)]"
      : "grid-cols-2";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (activeIndex !== null && !dialog.open) dialog.showModal();
    if (activeIndex === null && dialog.open) dialog.close();
  }, [activeIndex]);

  useEffect(() => {
    if (activeIndex === null || images.length < 2) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => current === null ? null : (current + 1) % images.length);
      } else if (event.key === "ArrowLeft") {
        setActiveIndex((current) => current === null ? null : (current - 1 + images.length) % images.length);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length]);

  if (!count) return null;

  function closeGallery() {
    if (dialogRef.current?.open) dialogRef.current.close();
    setActiveIndex(null);
  }

  function showImage(index: number) {
    setActiveIndex(index);
  }

  const activeImage = activeIndex === null ? null : images[activeIndex];

  return (
    <>
      <div className={`overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-900 ${count > 1 ? "grid" : ""} ${gridClass} ${count === 3 ? "h-[340px]" : ""}`}>
        {visibleImages.map((image, index) => {
          const tileClass = count === 1
            ? "max-h-[min(70vh,720px)]"
            : count === 3
              ? index === 0 ? "row-span-2 min-h-0" : "min-h-0"
              : "aspect-[4/3]";
          const remaining = images.length - 4;
          return (
            <MediaItem
              key={image.id}
              media={image}
              title={title}
              className={tileClass}
              moreCount={index === 3 ? remaining : 0}
              fit={count === 1 ? "contain" : "cover"}
              onImageClick={() => showImage(index)}
            />
          );
        })}
      </div>

      <dialog
        ref={dialogRef}
        aria-label={`${title} image gallery`}
        onClose={() => setActiveIndex(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeGallery();
        }}
        className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-hidden border-0 bg-black/90 p-0 text-white backdrop:bg-black/80"
      >
        {activeImage && activeIndex !== null && (
          <div className="mx-auto flex h-full w-full max-w-[1200px] flex-col">
            <div className="flex items-center justify-between gap-4 p-4">
              <p className="min-w-0 truncate text-sm text-white/80">
                {activeImage.fileName || title}
              </p>
              <button
                type="button"
                onClick={closeGallery}
                aria-label="Close image gallery"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center p-4 pt-0">
              <img
                src={activeImage.url}
                alt={activeImage.fileName || title}
                className="h-auto max-h-full w-auto max-w-full object-contain"
              />

              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((activeIndex - 1 + images.length) % images.length)}
                    aria-label="Previous image"
                    className="absolute left-5 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-8"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveIndex((activeIndex + 1) % images.length)}
                    aria-label="Next image"
                    className="absolute right-5 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-white transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-8"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <p className="pb-4 text-center text-sm text-white/75" aria-live="polite">
                {activeIndex + 1} / {images.length}
              </p>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}

function MediaItem({
  media,
  title,
  className = "",
  moreCount = 0,
  fit = "cover",
  onImageClick,
}: {
  media: Media;
  title: string;
  className?: string;
  moreCount?: number;
  fit?: "contain" | "cover";
  onImageClick?: () => void;
}) {
  if (isImage(media.url, media.contentType)) {
    const containedImage = fit === "contain";

    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onImageClick?.();
        }}
        className={`${containedImage ? "group relative flex w-full items-center justify-center overflow-hidden" : "group relative block h-full overflow-hidden"} ${className}`}
        aria-label={moreCount > 0 ? `Open image, and ${moreCount} more images` : `View ${media.fileName || title}`}
        aria-haspopup="dialog"
      >
        <ProgressiveImage
          src={media.url}
          alt={media.fileName || title}
          className={containedImage
            ? "h-auto max-h-[min(70vh,720px)] w-auto max-w-full object-contain"
            : "h-full min-h-36 max-h-[520px] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"}
          loading="lazy"
        />
        {moreCount > 0 && (
          <span className="absolute inset-0 grid place-items-center bg-black/55 text-3xl font-black text-white">
            +{moreCount}
          </span>
        )}
      </button>
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
export function ResourceBlockBody({
  blocks,
  title,
}: {
  blocks: ContentBlock[];
  title: string;
}) {
  return (
    <div className="mt-5 space-y-5">
      {blocks.map((block) => {
        if (block.type === "TEXT") {
          return block.text?.trim() ? (
            <ResourceMarkdown key={block.id} text={block.text} className="text-[16px] leading-7 text-slate-700" />
          ) : null;
        }

        if (!block.media) return null;
        if (isImage(block.media.url, block.media.contentType)) {
          return <ImageGallery key={block.id} images={[block.media]} title={title} />;
        }

        return (
          <div key={block.id} className="overflow-hidden rounded-2xl bg-slate-100">
            <MediaItem media={block.media} title={title} />
          </div>
        );
      })}
    </div>
  );
}

export function ResourceContent({
  resource,
  compact = false,
  allMedia = false,
  fullText = false,
  orderedBody = false,
}: {
  resource: Resource;
  /** Hide the description (used by compact lists). */
  compact?: boolean;
  /** Render every attached file instead of just the first one. */
  allMedia?: boolean;
  /** Show the whole description instead of clamping it to 3 lines. */
  fullText?: boolean;
  /** Use authored text/media order on detail embeds; feed cards keep the legacy layout. */
  orderedBody?: boolean;
}) {
  const mediaList = resource.media ?? [];
  const imageMedia = mediaList.filter((item) => isImage(item.url, item.contentType));
  const otherMedia = mediaList.filter((item) => !isImage(item.url, item.contentType));
  const attachmentMedia = allMedia || imageMedia.length === 0 ? otherMedia : [];

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
      </Link>

      {resource.description && !compact && !(orderedBody && resource.blocks?.length) && (
        <ResourceMarkdown
          text={resource.description}
          className={
            fullText
              ? "mt-2 text-[16px] leading-7 text-slate-600"
              : "mt-2 line-clamp-3 text-[16px] leading-7 text-slate-600"
          }
        />
      )}

      {orderedBody && resource.blocks?.length ? (
        <ResourceBlockBody blocks={resource.blocks} title={resource.title} />
      ) : (imageMedia.length > 0 || attachmentMedia.length > 0) ? (
        <div className="mt-4 space-y-3">
          <ImageGallery images={imageMedia} title={resource.title} />
          {attachmentMedia.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl bg-slate-100">
              <MediaItem media={item} title={resource.title} />
            </div>
          ))}
        </div>
      ) : null}

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
  orderedBody = false,
}: {
  original: Resource;
  compact?: boolean;
  orderedBody?: boolean;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="p-4 pt-3.5">
        <div className="flex items-center gap-3">
          <Avatar name={original.authorUsername} src={original.authorAvatarUrl || undefined} size="sm" />

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
          orderedBody={orderedBody}
        />
      </div>
    </div>
  );
}
