"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AtSign,
  Bell,
  FilePlus2,
  Heart,
  MessageCircle,
  Share2,
  UserPlus,
} from "lucide-react";

import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  type Notification,
} from "@/lib/api";
import { notificationHref } from "@/lib/notificationLink";
import { Avatar } from "@/components/ui/Avatar";
import {
  DEFAULT_FILTERS,
  NotificationFilters,
  typesOf,
  type NotificationFilterState,
} from "./NotificationFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  FOLLOW: UserPlus,
  COMMENT: MessageCircle,
  COMMENT_REPLY: MessageCircle,
  REACTION: Heart,
  SHARE: Share2,
  MENTION: AtSign,
  NEW_POST: FilePlus2,
};

export default function Page() {
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<NotificationFilterState>(DEFAULT_FILTERS);
  const { data, isLoading } = useGetNotificationsQuery({
    page,
    size: 30,
    types: typesOf(filters.groups),
    scope: filters.scope,
    unreadOnly: filters.unreadOnly,
  });

  function changeFilters(next: NotificationFilterState) {
    setPage(0); // a different filter is a different list
    setFilters(next);
  }
  const [markAll, { isLoading: marking }] = useMarkAllNotificationsReadMutation();
  const [markRead] = useMarkNotificationReadMutation();

  // Applied instantly on click; the server value (refetched right after) takes over.
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [allRead, setAllRead] = useState(false);

  const isRead = (n: Notification) => allRead || n.isRead || readIds.has(String(n.id));
  const unread = data?.content?.filter((n) => !isRead(n)).length ?? 0;

  async function markAsRead(n: Notification) {
    if (isRead(n)) return;
    const key = String(n.id);
    setReadIds((previous) => new Set(previous).add(key));
    try {
      await markRead(key).unwrap();
    } catch {
      setReadIds((previous) => {
        const next = new Set(previous);
        next.delete(key);
        return next;
      });
      toast("Could not mark the notification as read.", "error");
    }
  }

  async function markEverythingRead() {
    setAllRead(true);
    try {
      await markAll().unwrap();
    } catch {
      setAllRead(false);
      toast("Could not mark all as read.", "error");
    }
  }

  function row(n: Notification) {
    const read = isRead(n);
    const Icon = ICONS[n.type] ?? Bell;

    return (
      <>
        <div className="relative shrink-0">
          <Avatar name={n.actorUsername} src={n.actorAvatarUrl ?? undefined} size="sm" />
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-blue-600 text-white ring-2 ring-white">
            <Icon className="h-3 w-3" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className={read ? "text-slate-500" : "font-semibold text-slate-900"}>{n.message}</div>
          <div className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</div>
        </div>
        {!read && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" aria-label="Unread" />}
      </>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black">
            Notifications
            {unread > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 align-middle text-xs font-bold text-white">
                {unread} new
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500">Stay up to date with your community.</p>
        </div>
        <button
          disabled={marking || unread === 0}
          onClick={markEverythingRead}
          className="button-secondary"
        >
          Mark all read
        </button>
      </div>

      <NotificationFilters value={filters} onChange={changeFilters} />

      {isLoading ? (
        <ListSkeleton />
      ) : data?.content?.length ? (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {data.content.map((n) => {
            const href = notificationHref(n);
            const read = isRead(n);
            const className = `flex w-full gap-4 p-5 text-left transition hover:bg-slate-50 ${
              read ? "bg-white" : "bg-blue-50/60"
            }`;

            // Clicking marks it as read AND goes to the thing it is about.
            return href ? (
              <Link key={n.id} href={href} onClick={() => markAsRead(n)} className={className}>
                {row(n)}
              </Link>
            ) : (
              <button
                key={n.id}
                type="button"
                className={className}
                onClick={() => {
                  markAsRead(n);
                  toast("This content is no longer available.", "info");
                }}
              >
                {row(n)}
              </button>
            );
          })}
          <div className="flex justify-center gap-2 p-4">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="button-secondary"
            >
              Previous
            </button>
            <button
              disabled={data.isLast ?? true}
              onClick={() => setPage((p) => p + 1)}
              className="button-secondary"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <EmptyState
          title={
            filters.groups.length || filters.scope !== "ALL" || filters.unreadOnly
              ? "No notifications match these filters"
              : "You're all caught up"
          }
          description={
            filters.groups.length || filters.scope !== "ALL" || filters.unreadOnly
              ? "Try a different filter, or clear them to see everything."
              : "New follows, comments, reactions and shares will appear here."
          }
        />
      )}
    </section>
  );
}
