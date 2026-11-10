/** Per-user queue: notifications addressed to the signed-in user. */
export const NOTIFICATIONS_QUEUE = "/user/queue/notifications";
/** Broadcast topic: live changes to posts and comments. */
export const RESOURCES_TOPIC = "/topic/resources";

/**
 * WebSocket endpoint. Derived from NEXT_PUBLIC_API_URL
 * (http://localhost:8085/api/v1 -> ws://localhost:8085/ws).
 * Override with NEXT_PUBLIC_WS_URL if your Spring endpoint is different.
 */
export function realtimeUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_WS_URL;
  if (explicit) return explicit;

  const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api/v1";
  const url = new URL(api);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws";
  url.search = "";
  return url.toString();
}

/** Message pushed on RESOURCES_TOPIC. Every field but `type` is optional. */
export type RealtimeEvent = {
  type: string; // e.g. COMMENT_CREATED, COMMENT_DELETED, REACTION_CHANGED, RESOURCE_UPDATED, RESOURCE_DELETED
  resourceId?: number | string;
  commentId?: number | string;
  /** Spring serializes the actor as `actor`; keep actorUsername for older API builds. */
  actor?: string;
  actorUsername?: string;
  commentCount?: number;
  reactionCount?: number;
  targetType?: "RESOURCE" | "COMMENT" | string;
  targetId?: number | string;
  parentCommentId?: number | string;
};
