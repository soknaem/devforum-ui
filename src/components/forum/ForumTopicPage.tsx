"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, MessageSquareText, Send, Share2 } from "lucide-react";
import { useCreateForumReplyMutation, useGetForumCategoriesQuery, useGetForumRepliesQuery, useGetForumTopicQuery, type ForumContentBlock, type ForumReply } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ForumContentEditor } from "@/components/forum/ForumContentEditor";
import { ForumContentRenderer } from "@/components/forum/ForumContentRenderer";
import { ForumReplyCard } from "@/components/forum/ForumReplyCard";
import { ForumShareDialog } from "@/components/forum/ForumShareDialog";
import { ForumTopicMenu } from "@/components/forum/ForumTopicMenu";
import { useToast } from "@/components/ui/Toast";

export function ForumTopicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: topicResponse, isLoading, isError } = useGetForumTopicQuery(id);
  const { data: categoriesResponse } = useGetForumCategoriesQuery();
  const [replyPage, setReplyPage] = useState(0);
  const [allReplies, setAllReplies] = useState<ForumReply[]>([]);
  const { data: repliesPage, isLoading: repliesLoading, isFetching: repliesFetching } = useGetForumRepliesQuery({ topicId: id, page: replyPage, size: 50 }, { skip: !topicResponse?.data });
  const [createReply, { isLoading: submitting }] = useCreateForumReplyMutation();
  const [blocks, setBlocks] = useState<ForumContentBlock[]>([{ type: "TEXT", text: "" }]);
  const { toast } = useToast();
  const router = useRouter();
  const [shareOpen, setShareOpen] = useState(false);
  const topic = topicResponse?.data;
  const category = categoriesResponse?.data?.find((item) => item.key === topic?.categoryKey);
  const replies = allReplies;
  const original = topic?.sharedFrom ?? null;

  useEffect(() => {
    setReplyPage(0);
    setAllReplies([]);
  }, [id]);

  useEffect(() => {
    if (!repliesPage || repliesPage.pageNumber !== replyPage) return;
    setAllReplies((previous) => {
      if (replyPage === 0) return repliesPage.content;
      const seen = new Set(previous.map((reply) => String(reply.id)));
      return [...previous, ...repliesPage.content.filter((reply) => !seen.has(String(reply.id)))];
    });
  }, [replyPage, repliesPage]);

  async function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = blocks.filter((block) => block.type === "IMAGE" || block.type === "FILE" || (block.type === "LINK" && block.url?.trim()) || Boolean(block.text?.trim()));
    if (!content.length) {
      toast("Add some content before posting your reply.", "error");
      return;
    }
    try {
      await createReply({ topicId: id, blocks: content }).unwrap();
      setReplyPage(0);
      setAllReplies([]);
      setBlocks([{ type: "TEXT", text: "" }]);
      toast("Your reply was posted.", "success");
    } catch {
      toast("Could not post your reply. Try again.", "error");
    }
  }

  if (isLoading) return <div className="card flex min-h-56 items-center justify-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Loading discussion</div>;
  if (isError || !topic) return <div className="card p-8"><Link href="/forum" className="action-button"><ArrowLeft className="h-4 w-4" /> Back to forum</Link><p className="mt-5 text-sm text-slate-500">This discussion could not be found.</p></div>;

  return (
    <section className="min-w-0 space-y-5">
      <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition-colors hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> All discussions</Link>
      <article className="card min-w-0 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge">{category?.label || topic.categoryLabel || "General"}</span>
            <span className="text-xs text-slate-500">{topic.viewCount} views</span>
            {original && <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Share2 className="h-3.5 w-3.5" /> Shared discussion</span>}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setShareOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-blue-300">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <ForumTopicMenu topic={topic} onDeleted={() => router.push("/forum")} />
          </div>
        </div>
        <h1 className="mt-4 break-words text-2xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">{topic.title}</h1>
        <div className="mt-4 flex items-center gap-3 border-b border-slate-100 pb-5 dark:border-slate-800">
          <Avatar name={topic.authorUsername} src={topic.authorAvatarUrl || undefined} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">@{topic.authorUsername}</div>
            <time className="text-xs text-slate-500" dateTime={topic.createdAt}>{new Date(topic.createdAt).toLocaleString()}</time>
          </div>
        </div>
        {original ? (
          <div className="space-y-4 pt-5">
            {topic.blocks?.length ? <ForumContentRenderer blocks={topic.blocks} /> : null}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40 sm:p-5">
              <div className="flex items-center gap-3">
                <Avatar name={original.authorUsername} src={original.authorAvatarUrl || undefined} size="sm" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">@{original.authorUsername}</div>
                  <time className="text-xs text-slate-500" dateTime={original.createdAt}>{new Date(original.createdAt).toLocaleString()}</time>
                </div>
              </div>
              <div className="pt-4">
                {original.blocks?.length ? <ForumContentRenderer blocks={original.blocks} /> : original.summary ? <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{original.summary}</p> : null}
              </div>
              <Link href={`/forum/${original.id}`} className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400">
                View original discussion <ArrowLeft className="h-4 w-4 rotate-180" />
              </Link>
            </div>
          </div>
        ) : topic.blocks?.length ? <div className="pt-5"><ForumContentRenderer blocks={topic.blocks} /></div> : topic.summary ? <p className="pt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">{topic.summary}</p> : null}
      </article>

      <ForumShareDialog open={shareOpen} onClose={() => setShareOpen(false)} topic={topic} />

      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Join the discussion</h2>
        </div>
        <form onSubmit={submitReply} className="mt-4 space-y-4">
          <ForumContentEditor blocks={blocks} onChange={setBlocks} />
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="button-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Posting..." : "Post reply"}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3" aria-label="Discussion replies">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-black text-slate-950 dark:text-slate-100">Replies <span className="text-slate-400">({repliesPage?.totalElements ?? topic.replyCount})</span></h2>
          {repliesLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-label="Loading replies" />}
        </div>
        {replies.length ? replies.map((reply) => <ForumReplyCard key={reply.id} reply={reply} />) : !repliesLoading ? (
          <div className="card p-7 text-center text-sm text-slate-500">Be the first to add a useful reply.</div>
        ) : null}
        {repliesPage && replyPage + 1 < repliesPage.totalPages && (
          <button type="button" onClick={() => setReplyPage((current) => current + 1)} disabled={repliesFetching} className="button-secondary mx-auto flex items-center gap-2 disabled:opacity-60">
            {repliesFetching && <Loader2 className="h-4 w-4 animate-spin" />} Load older replies
          </button>
        )}
      </section>
    </section>
  );
}
