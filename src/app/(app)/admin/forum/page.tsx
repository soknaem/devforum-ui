"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  useAdminDeleteForumReplyMutation,
  useAdminDeleteForumTopicMutation,
  useAdminForumRepliesQuery,
  useAdminForumTopicsQuery,
  useGetForumCategoriesQuery,
  type AdminForumReply,
  type AdminForumTopic,
} from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyRow, fmtDate, Loading, Pager, Pill, SearchBox } from "@/components/admin/AdminUI";

type View = "topics" | "replies";

export default function AdminForumPage() {
  const [view, setView] = useState<View>("topics");

  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Forum content">
        {(["topics", "replies"] as const).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={view === item}
            onClick={() => setView(item)}
            className={`rounded-lg px-4 py-1.5 text-sm font-bold capitalize transition ${
              view === item ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {view === "topics" ? <TopicsPanel /> : <RepliesPanel />}
    </div>
  );
}

/* ----------------------------------------------------------------- discussions */

function TopicsPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [categoryKey, setCategoryKey] = useState("");
  const [page, setPage] = useState(0);
  const { data: categories } = useGetForumCategoriesQuery();
  const { data, isLoading, isFetching } = useAdminForumTopicsQuery({ search, categoryKey: categoryKey || undefined, page });
  const [remove, { isLoading: removing }] = useAdminDeleteForumTopicMutation();
  const [toDelete, setToDelete] = useState<AdminForumTopic | null>(null);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBox onSearch={onSearch} placeholder="Search title or author" />
        <select
          value={categoryKey}
          onChange={(e) => {
            setCategoryKey(e.target.value);
            setPage(0);
          }}
          aria-label="Category"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
        >
          <option value="">Any category</option>
          {(categories?.data ?? []).map((category) => (
            <option key={category.key} value={category.key}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>No discussions match.</EmptyRow>
      ) : (
        <div className={`card overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Author</th>
                <th className="p-4">Category</th>
                <th className="p-4">Replies</th>
                <th className="p-4">Views</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((topic) => (
                <tr key={topic.id}>
                  <td className="max-w-[300px] p-4">
                    <div className="flex items-center gap-2">
                      <Link href={`/forum/${topic.id}`} className="block truncate font-bold text-slate-800 hover:text-blue-600">
                        {topic.title}
                      </Link>
                      {topic.sharedFromId != null && <Pill tone="blue">Shared</Pill>}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link href={`/users/${topic.authorUsername}`} className="text-slate-500 hover:text-blue-600">
                      @{topic.authorUsername}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Pill>{topic.categoryLabel}</Pill>
                  </td>
                  <td className="p-4 text-slate-500">{topic.replyCount}</td>
                  <td className="p-4 text-slate-500">{topic.viewCount}</td>
                  <td className="p-4 text-slate-500">{fmtDate(topic.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex justify-end">
                      <button onClick={() => setToDelete(topic)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this discussion?"
        description={`"${toDelete?.title ?? ""}" is removed for good with its replies and any shares of it. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={removing}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove(toDelete.id).unwrap();
            toast("Discussion deleted", "success");
          } catch {
            toast("Could not delete the discussion.", "error");
          }
          setToDelete(null);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

/* --------------------------------------------------------------------- replies */

function RepliesPanel() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAdminForumRepliesQuery({ search, page });
  const [remove, { isLoading: removing }] = useAdminDeleteForumReplyMutation();
  const [toDelete, setToDelete] = useState<AdminForumReply | null>(null);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex">
        <SearchBox onSearch={onSearch} placeholder="Search by author or discussion title" />
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>No replies match.</EmptyRow>
      ) : (
        <div className={`card divide-y divide-slate-100 ${isFetching ? "opacity-70" : ""}`}>
          {rows.map((reply) => (
            <div key={reply.id} className="flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{reply.preview}</p>
                <div className="mt-1.5 text-xs text-slate-400">
                  <Link href={`/users/${reply.authorUsername}`} className="font-bold text-slate-500 hover:text-blue-600">
                    @{reply.authorUsername}
                  </Link>{" "}
                  in{" "}
                  <Link href={`/forum/${reply.topicId}`} className="font-bold text-slate-500 hover:text-blue-600">
                    {reply.topicTitle}
                  </Link>{" "}
                  · {fmtDate(reply.createdAt)}
                </div>
              </div>
              <button onClick={() => setToDelete(reply)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this reply?"
        description="The reply is removed for good and the discussion's reply count goes down by one."
        confirmLabel="Delete"
        danger
        loading={removing}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove(toDelete.id).unwrap();
            toast("Reply deleted", "success");
          } catch {
            toast("Could not delete the reply.", "error");
          }
          setToDelete(null);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
