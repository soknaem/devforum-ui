"use client";

import Link from "next/link";
import { useState } from "react";

import {
  useAdminReportsQuery,
  useAdminResolveReportMutation,
  type AdminReport,
  type ReportStatus,
} from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { EmptyRow, fmtDate, Loading, Pager, Pill } from "@/components/admin/AdminUI";

const FILTERS: { id: ReportStatus | ""; label: string }[] = [
  { id: "OPEN", label: "Open" },
  { id: "RESOLVED", label: "Resolved" },
  { id: "DISMISSED", label: "Dismissed" },
  { id: "", label: "All" },
];

/** What an admin can do to the reported item while closing the report. */
const ACTIONS: Record<AdminReport["targetType"], { value: string; label: string }[]> = {
  RESOURCE: [
    { value: "NONE", label: "No action on the post" },
    { value: "ARCHIVE", label: "Archive the post" },
    { value: "DELETE", label: "Delete the post" },
  ],
  COMMENT: [
    { value: "NONE", label: "No action on the comment" },
    { value: "DELETE", label: "Delete the comment" },
  ],
  USER: [
    { value: "NONE", label: "No action on the user" },
    { value: "SUSPEND", label: "Suspend the user" },
  ],
};

function targetHref(report: AdminReport): string | null {
  if (report.targetType === "RESOURCE") return report.resourceId ? `/resources/${report.resourceId}` : null;
  if (report.targetType === "COMMENT") {
    return report.resourceId ? `/resources/${report.resourceId}?comment=${report.targetId}` : null;
  }
  return report.targetOwner ? `/users/${report.targetOwner}` : null;
}

const STATUS_TONE = { OPEN: "red", RESOLVED: "green", DISMISSED: "slate" } as const;

function ReportCard({ report }: { report: AdminReport }) {
  const { toast } = useToast();
  const [resolve, { isLoading }] = useAdminResolveReportMutation();
  const [action, setAction] = useState("NONE");
  const [note, setNote] = useState("");
  const href = targetHref(report);

  async function close(status: ReportStatus) {
    try {
      await resolve({ id: report.id, status, note: note.trim() || undefined, action: status === "RESOLVED" ? action : undefined }).unwrap();
      toast(status === "RESOLVED" ? "Report resolved" : "Report dismissed", "success");
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast(message || "Could not update the report.", "error");
    }
  }

  return (
    <article className="card space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={STATUS_TONE[report.status]}>{report.status}</Pill>
        <Pill tone="amber">{report.reason}</Pill>
        <span className="text-xs text-slate-400">
          {report.targetType} · reported by @{report.reporter} · {fmtDate(report.createdAt)}
        </span>
      </div>

      <div>
        {href ? (
          <Link href={href} className="font-bold text-slate-800 hover:text-blue-600">
            {report.targetLabel}
          </Link>
        ) : (
          <span className="font-bold text-slate-500">{report.targetLabel}</span>
        )}
        {report.targetOwner && report.targetType !== "USER" && (
          <span className="ml-2 text-sm text-slate-400">by @{report.targetOwner}</span>
        )}
      </div>

      {report.details && (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">&ldquo;{report.details}&rdquo;</p>
      )}

      {report.status === "OPEN" ? (
        <div className="space-y-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap gap-2">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              aria-label="Action on the reported item"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {ACTIONS[report.targetType].map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={300}
              placeholder="Note (optional)"
              aria-label="Note"
              className="min-w-[160px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button disabled={isLoading} onClick={() => close("DISMISSED")} className="button-secondary">
              Dismiss
            </button>
            <button disabled={isLoading} onClick={() => close("RESOLVED")} className="button-primary">
              Resolve
            </button>
          </div>
        </div>
      ) : (
        <p className="border-t border-slate-100 pt-3 text-xs text-slate-400">
          {report.status === "RESOLVED" ? "Resolved" : "Dismissed"} by @{report.reviewedBy} on {fmtDate(report.reviewedAt)}
          {report.reviewNote ? ` · ${report.reviewNote}` : ""}
        </p>
      )}
    </article>
  );
}

export default function AdminReportsPage() {
  const [status, setStatus] = useState<ReportStatus | "">("OPEN");
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useAdminReportsQuery({ status: status || undefined, page });
  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 sm:w-fit">
        {FILTERS.map((f) => (
          <button
            key={f.label}
            aria-pressed={status === f.id}
            onClick={() => {
              setStatus(f.id);
              setPage(0);
            }}
            className={`flex-1 rounded-xl px-4 py-1.5 text-sm font-bold ${
              status === f.id ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>{status === "OPEN" ? "No open reports. All clear." : "No reports here."}</EmptyRow>
      ) : (
        <div className={`space-y-3 ${isFetching ? "opacity-70" : ""}`}>
          {rows.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}

      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />
    </div>
  );
}
