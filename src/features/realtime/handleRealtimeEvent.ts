import { api } from "@/lib/api";
import type { AppDispatch } from "@/store";
import type { RealtimeEvent } from "@/lib/realtime";

/**
 * Applies one /topic/resources event to the RTK Query cache.
 * Events caused by the current user are skipped: their own screen is already up to date.
 */
export function applyRealtimeEvent(dispatch: AppDispatch, event: RealtimeEvent, me?: string) {
  const type = event.type?.toUpperCase() ?? "";
  const actor = event.actor ?? event.actorUsername;
  const id = event.resourceId != null ? String(event.resourceId) : null;

  // The current client already receives the mutation response, but other tabs/users
  // must always revalidate. The old code also skipped events using actorUsername,
  // while the Spring payload uses actor, so the event contract was mismatched.
  if (actor === me) {
    return;
  }

  if (id && (event.commentCount != null || event.reactionCount != null)) {
    dispatch(
      api.util.updateQueryData("getResource", id, (draft) => {
        const resource = draft?.data;
        if (!resource) return;
        if (event.commentCount != null) resource.commentCount = event.commentCount;
        if (event.reactionCount != null) resource.reactionCount = event.reactionCount;
      }),
    );
  }

  // Invalidate every affected collection. This is intentionally broader than the
  // old single-tag invalidation because comments and reactions are rendered by
  // multiple active queries (resource summary, paginated comments, and counts).
  if (type.startsWith("COMMENT")) {
    dispatch(api.util.invalidateTags(["Comment", "Resource"]));
  } else if (type.startsWith("REACTION")) {
    dispatch(api.util.invalidateTags(["Reaction", "Resource"]));
  } else if (type.startsWith("RESOURCE") || type.startsWith("POST")) {
    dispatch(api.util.invalidateTags(["Resource"]));
  }
}
