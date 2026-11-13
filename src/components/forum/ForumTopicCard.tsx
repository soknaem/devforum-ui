"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, MessageSquareText, MessagesSquare, Share2 } from "lucide-react";
import type { ForumCategory, ForumContentBlock, ForumTopic } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ForumShareDialog } from "@/components/forum/ForumShareDialog";
import { ForumTopicMenu } from "@/components/forum/ForumTopicMenu";

// Full class strings so Tailwind can see them. A topic always gets the same gradient (picked from its id).
const COVER_GRADIENTS = [
  "from-blue-600 via-indigo-600 to-violet-700",
  "from-sky-500 via-blue-600 to-indigo-800",
  "from-emerald-500 via-teal-600 to-cyan-700",
  "from-fuchsia-500 via-purple-600 to-indigo-700",
  "from-amber-500 via-orange-500 to-rose-600",
  "from-rose-500 via-pink-600 to-purple-700",
  "from-cyan-500 via-sky-600 to-blue-800",
  "from-lime-500 via-emerald-600 to-teal-700",
];

const BARE_URL = /^(https?:\/\/|www\.)\S+$/i;

function hashOf(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  return hash;
}

function httpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The first IMAGE block that has a usable http(s) URL, or null. */
function firstImageUrl(blocks?: ForumContentBlock[]) {
  for (const block of blocks ?? []) {
    if (block.type !== "IMAGE") continue;
    const url = httpUrl(block.url);
    if (url) return url;
  }
  return null;
}

const clean = (value?: string | null) => (value ?? "").replace(/\s+/g, " ").trim();

/** Card text. Never shows a raw URL: image-only topics get a short label instead. */
function previewText(topic: ForumTopic) {
  const summary = clean(topic.summary);
  if (summary && !BARE_URL.test(summary)) return summary;

  const blocks = topic.blocks ?? [];
  for (const block of blocks) {
    const value = clean(block.text) || (block.type === "IMAGE" ? "" : clean(block.title) || clean(block.fileName));
    if (value && !BARE_URL.test(value)) return value;
  }
  if (blocks.some((block) => block.type === "IMAGE")) return "Shared an image";
  if (blocks.length) return "Shared an attachment";
  return "Open this discussion to see the shared context.";
}

function TopicCover({ topicId, imageUrl }: { topicId: ForumTopic["id"]; imageUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const gradient = COVER_GRADIENTS[hashOf(String(topicId)) % COVER_GRADIENTS.length];

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-slate-100 dark:bg-slate-800">
      {imageUrl && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div aria-hidden="true" className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${gradient}`}>
          <span className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/15" />
          <span className="absolute -bottom-10 -left-6 h-36 w-36 rounded-full bg-black/10" />
          <span className="absolute bottom-4 right-10 h-10 w-10 rounded-full bg-white/10" />
          <MessagesSquare className="relative h-10 w-10 text-white/80" />
        </div>
      )}
    </div>
  );
}

export function ForumTopicCard({ topic, categories }: { topic: ForumTopic; categories: ForumCategory[] }) {
  const [shareOpen, setShareOpen] = useState(false);

  // A share shows the original discussion's cover and category, with the sharer's caption as the text.
  const original = topic.sharedFrom ?? null;
  const source = original ?? topic;
  const category = categories.find((item) => item.key === source.categoryKey);
  const imageUrl = httpUrl(source.coverImageUrl ?? undefined) ?? firstImageUrl(source.blocks);
  const caption = original ? clean(topic.summary) : "";
  const preview = caption && !BARE_URL.test(caption) ? caption : previewText(source);

  return (
    <article className="group relative flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700">
      <TopicCover key={String(source.id)} topicId={source.id} imageUrl={imageUrl} />

      <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="inline-flex max-w-full items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950/70 dark:text-blue-200">
            <span className="truncate">{category?.label || source.categoryLabel || "General"}</span>
          </span>
          {original && (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/60 dark:text-violet-200">
              <Share2 className="h-3 w-3" /> Shared
            </span>
          )}
          <span className="inline-flex min-w-0 items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <Avatar name={topic.authorUsername} src={topic.authorAvatarUrl || undefined} size="sm" />
            <span className="truncate">@{topic.authorUsername}</span>
            <span aria-hidden="true" className="text-slate-400">·</span>
            <time dateTime={topic.createdAt} className="shrink-0 text-slate-500 dark:text-slate-400">{new Date(topic.createdAt).toLocaleDateString()}</time>
          </span>
        </div>

        {/* The title link stretches over the whole card; the share and menu buttons sit above it. */}
        <h2 className="mt-3 line-clamp-2 text-lg font-black leading-snug text-slate-950 transition-colors group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-300">
          <Link href={`/forum/${topic.id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
            {topic.title}
          </Link>
        </h2>
        <p className="mt-1.5 line-clamp-3 break-words text-sm leading-6 text-slate-700 dark:text-slate-300">{preview}</p>
        {original && (
          <p className="mt-2 truncate text-xs font-semibold text-slate-500 dark:text-slate-400">Originally by @{original.authorUsername}</p>
        )}

        <div className="mt-auto pt-4">
          <div className="flex items-center gap-4 border-t border-slate-100 pt-3 text-sm font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5" aria-label={`${topic.replyCount} replies`}><MessageSquareText className="h-4 w-4 text-slate-500" />{topic.replyCount}<span className="hidden sm:inline">replies</span></span>
            <span className="inline-flex items-center gap-1.5" aria-label={`${topic.viewCount} views`}><Eye className="h-4 w-4 text-slate-500" />{topic.viewCount}<span className="hidden sm:inline">views</span></span>
            <span className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                aria-label={`Share ${topic.title}`}
                className="relative z-10 inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <ForumTopicMenu topic={topic} direction="up" />
            </span>
          </div>
        </div>
      </div>

      <ForumShareDialog open={shareOpen} onClose={() => setShareOpen(false)} topic={topic} />
    </article>
  );
}
