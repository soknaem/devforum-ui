"use client";

import { useState } from "react";

import { useAdminAuditQuery } from "@/lib/api";
import { EmptyRow, fmtDate, Loading, Pager } from "@/components/admin/AdminUI";

export default function AdminAuditPage() {
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAdminAuditQuery({ page });
  const rows = data?.content ?? [];

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">Every administrator action, newest first.</p>
      {rows.length === 0 ? (
        <EmptyRow>Nothing has been logged yet.</EmptyRow>
      ) : (
        <div className={`card overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-4">When</th>
                <th className="p-4">Admin</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap p-4 text-slate-500">{fmtDate(row.createdAt)}</td>
                  <td className="p-4 font-bold text-slate-700">@{row.admin}</td>
                  <td className="p-4">
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-slate-600">{row.action}</code>
                  </td>
                  <td className="p-4 text-slate-500">{row.targetType ? `${row.targetType} #${row.targetId ?? ""}` : "-"}</td>
                  <td className="p-4 text-slate-500">{row.details ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />
    </div>
  );
}
