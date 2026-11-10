"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  useAdminDeleteResourceMutation,
  useAdminResourcesQuery,
  useAdminSetResourceStatusMutation,
  type Resource,
  type ResourceStatus,
} from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyRow, fmtDate, Loading, Pager, Pill, SearchBox } from "@/components/admin/AdminUI";

const TONE = { PUBLISHED: "green", DRAFT: "slate", ARCHIVED: "amber" } as const;

export default function AdminResourcesPage() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"" | ResourceStatus>("");
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAdminResourcesQuery({ search, status: status || undefined, page });
  const [setResourceStatus] = useAdminSetResourceStatusMutation();
  const [remove, { isLoading: removing }] = useAdminDeleteResourceMutation();
  const [toDelete, setToDelete] = useState<Resource | null>(null);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  async function changeStatus(resource: Resource, next: ResourceStatus) {
    try {
      await setResourceStatus({ id: resource.id, status: next }).unwrap();
      toast(`Moved to ${next.toLowerCase()}`, "success");
    } catch {
      toast("Could not change the status.", "error");
    }
  }

  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBox onSearch={onSearch} placeholder="Search title or description" />
        <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }} aria-label="Status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Any status</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>No resources match.</EmptyRow>
      ) : (
        <div className={`card overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-4">Title</th>
                <th className="p-4">Author</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((resource) => (
                <tr key={resource.id}>
                  <td className="max-w-[280px] p-4">
                    <Link href={`/resources/${resource.id}`} className="block truncate font-bold text-slate-800 hover:text-blue-600">
                      {resource.title}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Link href={`/users/${resource.authorUsername}`} className="text-slate-500 hover:text-blue-600">
                      @{resource.authorUsername}
                    </Link>
                  </td>
                  <td className="p-4 text-slate-500">{resource.type}</td>
                  <td className="p-4">
                    <Pill tone={TONE[resource.status ?? "PUBLISHED"]}>{resource.status}</Pill>
                  </td>
                  <td className="p-4 text-slate-500">{fmtDate(resource.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <select
                        aria-label={`Change status of ${resource.title}`}
                        value={resource.status}
                        onChange={(e) => changeStatus(resource, e.target.value as ResourceStatus)}
                        className="rounded-xl border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold"
                      >
                        <option value="PUBLISHED">Published</option>
                        <option value="DRAFT">Draft</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                      <button onClick={() => setToDelete(resource)} className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
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
        title="Delete this resource?"
        description={`"${toDelete?.title ?? ""}" is removed for good with its comments, reactions and files. Prefer Archived if you may need it again.`}
        confirmLabel="Delete"
        danger
        loading={removing}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove(toDelete.id).unwrap();
            toast("Resource deleted", "success");
          } catch {
            toast("Could not delete the resource.", "error");
          }
          setToDelete(null);
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
