"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { useCreateForumTopicMutation, useGetForumCategoriesQuery, type ForumContentBlock } from "@/lib/api";
import { ForumContentEditor } from "@/components/forum/ForumContentEditor";
import { useToast } from "@/components/ui/Toast";

export function ForumNewTopicPage() {
  const router = useRouter();
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetForumCategoriesQuery();
  const [createTopic, { isLoading: submitting }] = useCreateForumTopicMutation();
  const [title, setTitle] = useState("");
  const [categoryKey, setCategoryKey] = useState("general");
  const [blocks, setBlocks] = useState<ForumContentBlock[]>([{ type: "TEXT", text: "" }]);
  const { toast } = useToast();
  const categories = categoriesResponse?.data ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = blocks.filter((block) => block.type === "IMAGE" || block.type === "FILE" || (block.type === "LINK" && block.url?.trim()) || Boolean(block.text?.trim()));
    if (title.trim().length < 8) {
      toast("Use a clear title with at least 8 characters.", "error");
      return;
    }
    if (!content.length) {
      toast("Add some context before publishing your discussion.", "error");
      return;
    }
    try {
      const response = await createTopic({ title: title.trim(), categoryKey, blocks: content }).unwrap();
      toast("Your discussion is live.", "success");
      router.push(`/forum/${response.data.id}`);
    } catch {
      toast("Could not publish this discussion. Try again.", "error");
    }
  }

  return (
    <section className="min-w-0 space-y-5">
      <Link href="/forum" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /> Back to forum</Link>
      <div className="card p-5 sm:p-7">
        <div className="max-w-2xl">
          <span className="badge">New topic</span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">Start a discussion</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Share a focused question or a useful resource. Add code, images, links, or files to give people enough context to help.</p>
        </div>
        <form onSubmit={submit} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <label htmlFor="forum-topic-title" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Title</label>
              <input id="forum-topic-title" required minLength={8} maxLength={180} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="What do you want to discuss?" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500" />
              <p className="mt-1 text-right text-xs text-slate-500">{title.length}/180</p>
            </div>
            <div>
              <label htmlFor="forum-topic-category" className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
              <select id="forum-topic-category" value={categoryKey} onChange={(event) => setCategoryKey(event.target.value)} disabled={categoriesLoading || !categories.length} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                {categories.map((category) => <option key={category.key} value={category.key}>{category.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-300">Discussion details</h2>
            <ForumContentEditor blocks={blocks} onChange={setBlocks} />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end dark:border-slate-800">
            <Link href="/forum" className="button-secondary text-center">Cancel</Link>
            <button type="submit" disabled={submitting || categoriesLoading || !categories.length} className="button-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? "Publishing..." : "Publish discussion"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
