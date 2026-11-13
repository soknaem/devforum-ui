import { api } from "@/lib/api";
import type { AppDispatch } from "@/store";
import type { RealtimeEvent } from "@/lib/realtime";
import { resourceRemoved, resourceRestored } from "@/features/realtime/realtimeSlice";

/** Applies shared resource events and updates the RTK Query cache for connected clients. */
export function applyRealtimeEvent(dispatch: AppDispatch, event: RealtimeEvent, me?: string) {
  const type = event.type?.toUpperCase() ?? "";
  const actor = event.actor ?? event.actorUsername;
  const id = event.resourceId != null ? String(event.resourceId) : null;

  // RESOURCE_DELETED and status changes must reach every connected client, including
  // another tab owned by the actor. List components filter against this shared state.
  if (id && type === "RESOURCE_DELETED") {
    dispatch(resourceRemoved({ id, reason: "deleted" }));
    dispatch(api.util.invalidateTags(["Resource", "MyResources"]));
  } else if (id && type.startsWith("RESOURCE") && event.resource?.status) {
    if (event.resource.status.toUpperCase() === "PUBLISHED") {
      dispatch(resourceRestored(id));
    } else {
      dispatch(resourceRemoved({ id, reason: "unpublished" }));
    }
  }

  // Resource changes above are shared across tabs; other event kinds caused by
  // this user need no second local update.
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
