"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import { useAdminCommentsQuery, useAdminDeleteCommentMutation, type AdminComment } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyRow, fmtDate, Loading, Pager, SearchBox } from "@/components/admin/AdminUI";

export default function AdminCommentsPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAdminCommentsQuery({ search, page });
  const [remove, { isLoading: removing }] = useAdminDeleteCommentMutation();
  const [toDelete, setToDelete] = useState<AdminComment | null>(null);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex">
        <SearchBox onSearch={onSearch} placeholder="Search comment text" />
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>No comments match.</EmptyRow>
      ) : (
        <div className={`card divide-y divide-slate-100 ${isFetching ? "opacity-70" : ""}`}>
          {rows.map((comment) => (
            <div key={comment.id} className="flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{comment.content}</p>
                <div className="mt-1.5 text-xs text-slate-400">
                  <Link href={`/users/${comment.authorUsername}`} className="font-bold text-slate-500 hover:text-blue-600">
                    @{comment.authorUsername}
                  </Link>{" "}
                  on{" "}
                  <Link href={`/resources/${comment.resourceId}?comment=${comment.id}`} className="font-bold text-slate-500 hover:text-blue-600">
                    {comment.resourceTitle}
                  </Link>{" "}
                  · {fmtDate(comment.createdAt)}
                </div>
              </div>
              <button onClick={() => setToDelete(comment)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this comment?"
        description="Its replies are deleted with it."
        confirmLabel="Delete"
        danger
        loading={removing}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove(toDelete.id).unwrap();
            toast("Comment deleted", "success");
          } catch {
            toast("Could not delete the comment.", "error");
          }
          setToDelete(null);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
