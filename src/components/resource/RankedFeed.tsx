"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, SlidersHorizontal } from "lucide-react";

import {
  useGetInterestsQuery,
  useLazyGetFollowingFeedQuery,
  useLazyGetForYouQuery,
  type Resource,
} from "@/lib/api";
import { ResourceCard } from "@/components/resource/ResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { FeedSkeleton } from "@/components/ui/Skeleton";

export type RankedMode = "for-you" | "following";

/**
 * "For you": unseen posts first, ordered by what the viewer is interested in (picked tags plus what
 * they read, save and react to). "Following": only people they follow, newest first.
 *
 * Paging: For you sends the ids it already shows (`exclude`) because the ranking changes while
 * posts are being seen; Following uses the usual cursor.
 */
export function RankedFeed({ mode }: { mode: RankedMode }) {
  const [items, setItems] = useState<Resource[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [initialised, setInitialised] = useState(false);

  const cursor = useRef<string | undefined>(undefined);
  const busy = useRef(false);
  const itemsRef = useRef<Resource[]>([]);
  const sentinel = useRef<HTMLDivElement>(null);

  const [loadForYou] = useLazyGetForYouQuery();
  const [loadFollowing] = useLazyGetFollowingFeedQuery();
  const { data: interests } = useGetInterestsQuery(undefined, { skip: mode !== "for-you" });

  const loadMore = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setFailed(false);

    try {
      const page =
        mode === "for-you"
          ? await loadForYou({ exclude: itemsRef.current.map((r) => String(r.id)), limit: 20 }).unwrap()
          : await loadFollowing({ cursor: cursor.current, limit: 20 }).unwrap();

      const known = new Set(itemsRef.current.map((r) => String(r.id)));
      const fresh = (page.content ?? []).filter((r) => !known.has(String(r.id)));
      itemsRef.current = [...itemsRef.current, ...fresh];
      setItems(itemsRef.current);

      cursor.current = page.nextCursor != null ? String(page.nextCursor) : undefined;
      // A page without anything new would loop forever: stop.
      setHasMore(Boolean(page.hasMore) && fresh.length > 0);
    } catch {
      setFailed(true);
      setHasMore(false);
    } finally {
      busy.current = false;
      setLoading(false);
      setInitialised(true);
    }
  }, [mode, loadForYou, loadFollowing]);

  // First page. (The parent re-mounts this component when the tab changes.)
  useEffect(() => {
    void loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Infinite scroll.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) void loadMore();
      },
      { rootMargin: "500px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  return (
    <section className="min-w-0 space-y-3 sm:space-y-4">
      {mode === "for-you" && interests && interests.tags.length === 0 && (
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-100"
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Pick the topics you like and this feed gets better. It also learns from what you read and react to.
          </span>
          <span className="shrink-0 underline">Choose interests</span>
        </Link>
      )}

      {!initialised ? (
        <FeedSkeleton />
      ) : items.length === 0 ? (
        <EmptyState
          title={mode === "following" ? "Nothing from people you follow yet" : "Nothing to show yet"}
          description={
            mode === "following"
              ? "Follow people to see their posts here."
              : "When people publish resources, the ones you care about show up first."
          }
        />
      ) : (
        <div className="min-w-0 space-y-3 sm:space-y-4">
          {items.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      )}

      {failed && (
        <div className="text-center text-sm text-slate-500">
          Could not load the feed.{" "}
          <button type="button" className="font-bold text-blue-600" onClick={() => void loadMore()}>
            Try again
          </button>
        </div>
      )}

      <div ref={sentinel} className="h-px" />

      {loading && initialised && <Loader2 className="mx-auto my-4 h-5 w-5 animate-spin text-slate-400" />}
      {initialised && !hasMore && items.length > 0 && !failed && (
        <p className="py-4 text-center text-sm text-slate-400">You&apos;re all caught up.</p>
      )}
    </section>
  );
}
