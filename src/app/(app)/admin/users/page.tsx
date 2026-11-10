"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

import {
  useAdminSetRoleMutation,
  useAdminSuspendMutation,
  useAdminUnsuspendMutation,
  useAdminUsersQuery,
  useMeQuery,
  type AdminUser,
} from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyRow, fmtDate, Loading, Pager, Pill, PromptDialog, SearchBox } from "@/components/admin/AdminUI";

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { data: me } = useMeQuery();
  const myName = me?.data?.username;

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<"" | "active" | "suspended">("");
  const [page, setPage] = useState(0);

  const { data, isLoading, isFetching } = useAdminUsersQuery({
    search,
    role: role || undefined,
    suspended: status === "" ? undefined : status === "suspended",
    page,
  });

  const [setRoleOf] = useAdminSetRoleMutation();
  const [suspend, { isLoading: suspending }] = useAdminSuspendMutation();
  const [unsuspend] = useAdminUnsuspendMutation();

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  const onSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
  }, []);

  async function run(action: Promise<unknown>, ok: string) {
    try {
      await action;
      toast(ok, "success");
    } catch (error) {
      const message = (error as { data?: { message?: string } })?.data?.message;
      toast(message || "Action failed.", "error");
    }
  }

  const rows = data?.content ?? [];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <SearchBox onSearch={onSearch} placeholder="Search username or e-mail" />
        <select value={role} onChange={(e) => { setRole(e.target.value); setPage(0); }} aria-label="Role" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">All roles</option>
          <option value="ROLE_USER">Users</option>
          <option value="ROLE_ADMIN">Admins</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }} aria-label="Status" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
          <option value="">Any status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {isLoading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyRow>No users match.</EmptyRow>
      ) : (
        <div className={`card overflow-x-auto ${isFetching ? "opacity-70" : ""}`}>
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Posts / comments</th>
                <th className="p-4">Joined</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((user) => {
                const self = user.username === myName;
                const admin = user.role === "ROLE_ADMIN";
                return (
                  <tr key={user.id}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={user.username} src={user.avatarUrl ?? undefined} size="sm" />
                        <div className="min-w-0">
                          <Link href={`/users/${user.username}`} className="block truncate font-bold text-slate-800 hover:text-blue-600">
                            {user.fullName || user.username}
                          </Link>
                          <div className="truncate text-xs text-slate-400">@{user.username} · {user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">{admin ? <Pill tone="blue">Admin</Pill> : <Pill>User</Pill>}</td>
                    <td className="p-4 text-slate-500">{user.resourceCount} / {user.commentCount}</td>
                    <td className="p-4 text-slate-500">{fmtDate(user.createdAt)}</td>
                    <td className="p-4">
                      {user.suspended ? (
                        <span title={user.suspendedReason ?? ""}><Pill tone="red">Suspended</Pill></span>
                      ) : (
                        <Pill tone="green">Active</Pill>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-1.5">
                        <button
                          disabled={self}
                          title={self ? "You cannot change your own role" : ""}
                          onClick={() => setRoleTarget(user)}
                          className="button-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
                        >
                          {admin ? "Remove admin" : "Make admin"}
                        </button>
                        {user.suspended ? (
                          <button
                            onClick={() => run(unsuspend(user.id).unwrap(), `@${user.username} reactivated`)}
                            className="button-secondary !px-3 !py-1.5 text-xs"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            disabled={self || admin}
                            title={self ? "You cannot suspend yourself" : admin ? "Remove the admin role first" : ""}
                            onClick={() => setSuspendTarget(user)}
                            className="rounded-xl px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-40"
                          >
                            Suspend
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} setPage={setPage} isLast={data?.isLast} total={data?.totalElements} />

      <ConfirmDialog
        open={Boolean(roleTarget)}
        title={roleTarget?.role === "ROLE_ADMIN" ? `Remove admin from @${roleTarget?.username}?` : `Make @${roleTarget?.username} an admin?`}
        description={
          roleTarget?.role === "ROLE_ADMIN"
            ? "They will lose access to the admin panel."
            : "Admins can manage users, posts, comments and reports."
        }
        confirmLabel="Confirm"
        danger={roleTarget?.role !== "ROLE_ADMIN"}
        onConfirm={async () => {
          if (!roleTarget) return;
          await run(
            setRoleOf({ id: roleTarget.id, role: roleTarget.role === "ROLE_ADMIN" ? "ROLE_USER" : "ROLE_ADMIN" }).unwrap(),
            "Role updated",
          );
          setRoleTarget(null);
        }}
        onClose={() => setRoleTarget(null)}
      />

      <PromptDialog
        open={Boolean(suspendTarget)}
        title={`Suspend @${suspendTarget?.username}?`}
        description="They are signed out immediately and cannot sign in until you reactivate the account."
        placeholder="Reason (optional, shown only to admins)"
        confirmLabel="Suspend"
        danger
        loading={suspending}
        onConfirm={async (reason) => {
          if (!suspendTarget) return;
          await run(suspend({ id: suspendTarget.id, reason: reason || undefined }).unwrap(), `@${suspendTarget.username} suspended`);
          setSuspendTarget(null);
        }}
        onClose={() => setSuspendTarget(null)}
      />
    </div>
  );
}
