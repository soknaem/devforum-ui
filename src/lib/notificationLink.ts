import type { Notification } from "@/lib/api";

/**
 * Where clicking a notification should go, or null when the content is gone.
 * A reply opens its top-level comment's thread (parentCommentId).
 */
export function notificationHref(
  n: Pick<
    Notification,
    "type" | "targetType" | "targetId" | "actorUsername" | "resourceId" | "commentId" | "parentCommentId"
  >,
): string | null {
  if (n.type === "FOLLOW" || n.targetType === "USER") {
    return n.actorUsername ? `/users/${encodeURIComponent(n.actorUsername)}` : null;
  }
  if (n.resourceId == null) return null;

  const base = `/resources/${n.resourceId}`;
  const comment = n.parentCommentId ?? n.commentId;
  return comment != null ? `${base}#comment-${comment}` : base;
}
