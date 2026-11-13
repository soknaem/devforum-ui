import { ExternalLink, FileText } from "lucide-react";
import type { ForumContentBlock } from "@/lib/api";
import { ResourceMarkdown } from "@/components/resource/ResourceContent";
import { ProgressiveImage } from "@/components/ui/ProgressiveImage";

function safeHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function ForumContentRenderer({ blocks }: { blocks: ForumContentBlock[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        if (block.type === "TEXT" && block.text?.trim()) {
          return (
            <ResourceMarkdown
              key={`${block.type}-${index}`}
              text={block.text}
              className="text-[15px] leading-7 text-slate-700"
            />
          );
        }

        if (block.type === "CODE" && block.text) {
          return (
            <div key={`${block.type}-${index}`} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
              <div className="border-b border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {block.language || "Code"}
              </div>
              <pre className="max-h-[520px] overflow-auto p-4 text-sm leading-6 text-slate-100">
                <code>{block.text}</code>
              </pre>
            </div>
          );
        }

        if (block.type === "IMAGE" && block.url) {
          return (
            <figure key={`${block.type}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900">
              <ProgressiveImage
                src={block.url}
                alt={block.alt || block.fileName || "Forum attachment"}
                className="max-h-[620px] w-full object-contain"
                loading="lazy"
              />
              {block.alt && <figcaption className="px-4 py-2 text-xs text-slate-500">{block.alt}</figcaption>}
            </figure>
          );
        }

        if (block.type === "LINK") {
          const url = safeHttpUrl(block.url);
          if (!url) return null;
          return (
            <a
              key={`${block.type}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-600 shadow-sm dark:bg-slate-800">
                <ExternalLink className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-slate-800 dark:text-slate-100">{block.title || url}</span>
                <span className="mt-1 block break-all text-xs text-slate-500">{url}</span>
              </span>
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          );
        }

        if (block.type === "FILE" && block.url) {
          const url = safeHttpUrl(block.url);
          if (!url) return null;
          return (
            <a
              key={`${block.type}-${index}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50">
                <FileText className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700 dark:text-slate-200">{block.fileName || block.title || "Download attachment"}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-slate-400" />
            </a>
          );
        }

        return null;
      })}
    </div>
  );
}

export function forumBlockPreview(blocks: ForumContentBlock[]) {
  const block = blocks.find((item) => item.text?.trim() || item.title || item.fileName || item.url);
  const value = block?.text || block?.title || block?.fileName || block?.url || "Shared an attachment";
  return value.replace(/\s+/g, " ").trim();
}
