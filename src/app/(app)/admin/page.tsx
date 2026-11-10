"use client";

import Link from "next/link";

import { useAdminStatsQuery } from "@/lib/api";
import { Loading, StatCard } from "@/components/admin/AdminUI";

const SERIES = [
  { key: "users", label: "New users", bar: "bg-blue-500" },
  { key: "resources", label: "New resources", bar: "bg-emerald-500" },
  { key: "comments", label: "New comments", bar: "bg-amber-500" },
] as const;

export default function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStatsQuery();
  if (isLoading || !stats) return <Loading />;

  const max = Math.max(1, ...stats.daily.flatMap((d) => [d.users, d.resources, d.comments]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users" value={stats.users} hint={`${stats.admins} admin${stats.admins === 1 ? "" : "s"}`} tone="blue" />
        <StatCard
          label="Suspended"
          value={stats.suspendedUsers}
          hint={stats.suspendedUsers ? "needs review" : "none"}
          tone={stats.suspendedUsers ? "amber" : "green"}
        />
        <StatCard label="Published posts" value={stats.resourcesPublished} />
        <StatCard label="Drafts" value={stats.resourcesDraft} />
        <StatCard label="Archived" value={stats.resourcesArchived} />
        <StatCard label="Comments" value={stats.comments} />
        <StatCard label="Reactions" value={stats.reactions} />
        <Link href="/admin/reports" className="block">
          <StatCard
            label="Open reports"
            value={stats.openReports}
            hint={stats.openReports ? "review now" : "all clear"}
            tone={stats.openReports ? "red" : "green"}
          />
        </Link>
      </div>

      <div className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-black">Last 14 days</h2>
          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
            {SERIES.map((s) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-sm ${s.bar}`} /> {s.label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 flex h-44 items-end gap-1.5" role="img" aria-label="Activity per day for the last 14 days">
          {stats.daily.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-36 w-full items-end justify-center gap-0.5">
                {SERIES.map((s) => {
                  const value = day[s.key];
                  return (
                    <div
                      key={s.key}
                      title={`${day.date}: ${value} ${s.label.toLowerCase()}`}
                      className={`w-full max-w-[10px] rounded-t ${s.bar}`}
                      style={{ height: `${Math.max(value > 0 ? 6 : 2, (value / max) * 100)}%`, opacity: value > 0 ? 1 : 0.25 }}
                    />
                  );
                })}
              </div>
              <span className="text-[10px] text-slate-400">{day.date.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
