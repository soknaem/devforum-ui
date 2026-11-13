"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2, MessagesSquare, Plus, SearchX } from "lucide-react";
import { useGetForumCategoriesQuery, useGetForumTopicsQuery } from "@/lib/api";
import { ForumTopicCard } from "@/components/forum/ForumTopicCard";

export function ForumBrowser() {
  const [categoryKey, setCategoryKey] = useState<string | undefined>();
  const [sortBy, setSortBy] = useState<"popular" | "new">("popular");
  const { data: categoriesResponse, isLoading: categoriesLoading } = useGetForumCategoriesQuery();
  const categories = categoriesResponse?.data ?? [];
  const { data, isLoading, isError, refetch } = useGetForumTopicsQuery({ categoryKey, sortBy, page: 0, size: 30 });
  const topics = data?.content ?? [];
  const totalTopics = data?.totalElements ?? topics.length;

  return (
    <section className="min-w-0 space-y-6">
      <header className="relative isolate overflow-hidden rounded-3xl border border-blue-900/20 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-5 text-white shadow-lg shadow-blue-950/10 sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-extrabold text-blue-50">
              <MessagesSquare className="h-4 w-4" /> Developer discussions
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">The forum</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-50/90 sm:text-base">
              Ask questions, share ideas, and build together. Add code, images, links, and files to give every discussion context.
            </p>
          </div>
          <Link href="/forum/new" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-sky-300 px-4 py-2.5 text-sm font-extrabold text-blue-950 shadow-sm transition hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-800">
            <Plus className="h-4 w-4" /> Start a discussion
          </Link>
        </div>
      </header>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            {totalTopics} {totalTopics === 1 ? "discussion" : "discussions"}
          </p>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900" role="group" aria-label="Sort discussions">
            {(["popular", "new"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setSortBy(option)} aria-pressed={sortBy === option} className={`min-h-9 rounded-lg px-3 text-xs font-bold capitalize transition ${sortBy === option ? "bg-blue-600 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
                {option === "popular" ? "Popular" : "Newest"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by forum category">
          <button type="button" aria-pressed={!categoryKey} onClick={() => setCategoryKey(undefined)} className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${!categoryKey ? "bg-blue-600 text-white shadow-sm" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
            All topics
          </button>
          {categoriesLoading && <span className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300">Loading categories…</span>}
          {categories.map((category) => (
            <button key={category.key} type="button" aria-pressed={categoryKey === category.key} onClick={() => setCategoryKey(category.key)} className={`min-h-10 rounded-full px-4 text-sm font-bold transition ${categoryKey === category.key ? "bg-blue-600 text-white shadow-sm" : "border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"}`}>
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="card flex min-h-48 items-center justify-center gap-3 p-6 text-sm font-semibold text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> Loading discussions
        </div>
      ) : isError ? (
        <div className="card flex flex-col items-center p-8 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"><SearchX className="h-5 w-5" /></span>
          <p className="mt-4 font-bold text-slate-900 dark:text-slate-100">The forum could not load</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Check your connection, then try again.</p>
          <button type="button" onClick={() => void refetch()} className="button-secondary mt-4">Try again</button>
        </div>
      ) : topics.length ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {topics.map((topic) => <ForumTopicCard key={topic.id} topic={topic} categories={categories} />)}
        </div>
      ) : (
        <div className="card flex flex-col items-center px-5 py-12 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"><SearchX className="h-6 w-6" /></span>
          <h2 className="mt-4 text-lg font-black text-slate-950 dark:text-slate-100">No discussions here yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-600 dark:text-slate-300">Start a topic with a question, a lesson learned, or a resource the community can build on.</p>
          <Link href="/forum/new" className="button-primary mt-5 inline-flex min-h-11 items-center gap-2"><Plus className="h-4 w-4" /> Start a discussion</Link>
        </div>
      )}
    </section>
  );
}
