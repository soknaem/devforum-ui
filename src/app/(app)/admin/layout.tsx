"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";

import { useAdminStatsQuery, useMeQuery } from "@/lib/api";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/resources", label: "Resources" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/audit", label: "Audit log" },
];

/**
 * Admin area. The menu entry is only shown to administrators, this layout shows "no access" to
 * anybody else, and - the part that actually protects the data - every /api/v1/admin endpoint
 * requires ROLE_ADMIN on the server.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data, isLoading } = useMeQuery();
  const isAdmin = data?.data?.role === "ROLE_ADMIN";
  const { data: stats } = useAdminStatsQuery(undefined, { skip: !isAdmin });

  if (isLoading) return <Loader2 className="mx-auto my-24 animate-spin text-blue-600" />;

  if (!isAdmin) {
    return (
      <div className="card mx-auto max-w-lg p-10 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-red-500" />
        <h1 className="mt-4 text-xl font-black">Administrators only</h1>
        <p className="mt-2 text-sm text-slate-500">You do not have access to this area.</p>
        <Link href="/" className="button-primary mt-6 inline-block">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-black">Admin panel</h1>
        <p className="text-sm text-slate-500">Manage users, content and reports. Every change is recorded in the audit log.</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1" aria-label="Admin sections">
        {TABS.map(({ href, label }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                active ? "bg-blue-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {label}
              {label === "Reports" && (stats?.openReports ?? 0) > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-[11px] leading-5 text-white">{stats?.openReports}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {children}
    </section>
  );
}
