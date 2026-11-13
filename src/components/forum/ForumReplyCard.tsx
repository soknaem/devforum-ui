"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, PencilLine } from "lucide-react";
import type { ForumReply } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ForumContentRenderer, forumBlockPreview } from "@/components/forum/ForumContentRenderer";

export function ForumReplyCard({ reply }: { reply: ForumReply }) {
  const [expanded, setExpanded] = useState(false);
  const preview = forumBlockPreview(reply.blocks);
  const blockKinds = [...new Set(reply.blocks.map((block) => block.type.toLowerCase()))];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <Avatar name={reply.authorUsername} src={reply.authorAvatarUrl || undefined} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">@{reply.authorUsername}</span>
            <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={reply.createdAt}>{new Date(reply.createdAt).toLocaleString()}</time>
            {reply.edited && <span className="inline-flex items-center gap-1 text-[11px] text-slate-400"><PencilLine className="h-3 w-3" /> edited</span>}
          </div>
          <p className={`mt-2 break-words text-sm leading-6 text-slate-600 dark:text-slate-300 ${expanded ? "" : "line-clamp-3"}`}>{preview}</p>
          {!expanded && blockKinds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Reply content types">
              {blockKinds.map((kind) => <span key={kind} className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400">{kind}</span>)}
            </div>
          )}
          <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="mt-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-extrabold text-blue-600 hover:text-blue-700 dark:text-blue-400">
            {expanded ? <>Collapse reply <ChevronUp className="h-3.5 w-3.5" /></> : <>View full reply <ChevronDown className="h-3.5 w-3.5" /></>}
          </button>
          {expanded && <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800"><ForumContentRenderer blocks={reply.blocks} /></div>}
        </div>
      </div>
    </article>
  );
}
