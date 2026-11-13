"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, SearchX, Sparkles } from "lucide-react";
import { useGetFeedQuery, useGetResourcesQuery, type Resource } from "@/lib/api";
import { ResourceCard } from "@/components/resource/ResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShareSiteButton } from "@/components/layout/ShareSiteButton";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";

function HomeFeed() {
  const params = useSearchParams();
  const search = (params.get("search") || "").trim();
  const removedIds = useAppSelector((state) => state.realtime.removedIds);

  const [feedItems, setFeedItems] = useState<Resource[]>([]);
  const [feedCursor, setFeedCursor] = useState<string | undefined>(undefined);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [searchItems, setSearchItems] = useState<Resource[]>([]);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestedFeedCursors = useRef(new Set<string>(["__initial__"]));
  const processedFeedCursors = useRef(new Set<string>());
  const requestedPages = useRef(new Set<number>([0]));
  const stoppedSearchRef = useRef(false);
  const hasScrolledRef = useRef(false);

  const feed = useGetFeedQuery(
    { cursor: feedCursor, limit: 20 },
    { skip: Boolean(search) },
  );

  const resources = useGetResourcesQuery(
    { page, size: 20, search: search || undefined },
    { skip: !search },
  );

  // Reset only when switching between search and the normal home feed.
  // The old implementation also used mutable loading refs here, which could
  // race with RTK Query's first response and leave the initial feed stuck.
  useEffect(() => {
    if (search) {
      setFeedItems([]);
      setFeedCursor(undefined);
      setFeedHasMore(true);
      setFeedLoadingMore(false);
      requestedFeedCursors.current = new Set(["__initial__"]);
      processedFeedCursors.current = new Set();
      return;
    }

    setSearchItems([]);
    setPage(0);
    stoppedSearchRef.current = false;
    requestedPages.current = new Set([0]);
  }, [search]);

  // Process each cursor response exactly once. The first request uses the
  // special "__initial__" key; every later request uses the cursor returned by
  // the previous response.
  useEffect(() => {
    if (search || feed.isFetching || !feed.data) return;

    const key = feedCursor ?? "__initial__";
    if (processedFeedCursors.current.has(key)) return;
    processedFeedCursors.current.add(key);

    const incoming = feed.data.content ?? [];
    setFeedItems((previous) => {
      if (key === "__initial__") return incoming;
      const existing = new Set(previous.map((item) => String(item.id)));
      return [
        ...previous,
        ...incoming.filter((item) => !existing.has(String(item.id))),
      ];
    });

    const next = feed.data.nextCursor != null ? String(feed.data.nextCursor) : undefined;
    const more = Boolean(feed.data.hasMore && next && !requestedFeedCursors.current.has(next));
    setFeedHasMore(more);
    setFeedLoadingMore(false);
  }, [feed.data, feed.isFetching, feedCursor, search]);

  useEffect(() => {
    if (!search || resources.isFetching || !resources.data) return;

    const incoming = resources.data.content ?? [];
    if (!incoming.length) {
      stoppedSearchRef.current = true;
      return;
    }

    setSearchItems((previous) => {
      if (page === 0) return incoming;
      const existing = new Set(previous.map((item) => String(item.id)));
      return [
        ...previous,
        ...incoming.filter((item) => !existing.has(String(item.id))),
      ];
    });

    if (
      resources.data.isLast ||
      incoming.length < resources.data.pageSize ||
      page + 1 >= resources.data.totalPages
    ) {
      stoppedSearchRef.current = true;
    }
  }, [resources.data, resources.isFetching, search, page]);

  const loadMore = useCallback(() => {
    // Search pagination is page based and is intentionally kept separate from
    // the cursor based home feed.
    if (search) {
      if (stoppedSearchRef.current || resources.isFetching || !resources.data) return;

      const nextPage = page + 1;
      if (
        resources.data.isLast ||
        resources.data.content.length < resources.data.pageSize ||
        nextPage >= resources.data.totalPages ||
        requestedPages.current.has(nextPage)
      ) {
        stoppedSearchRef.current = true;
        return;
      }

      requestedPages.current.add(nextPage);
      setPage(nextPage);
      return;
    }

    // Home feed uses the cursor returned by the LAST completed request.
    // Do not depend on the observer alone: on some layouts the sentinel can
    // remain outside the observer's effective viewport. The scroll/interval
    // checks below call this same function as a reliable fallback.
    if (
      feedLoadingMore ||
      feed.isFetching ||
      feed.isUninitialized ||
      !feed.data ||
      !feedHasMore
    ) {
      return;
    }

    const rawNextCursor = feed.data.nextCursor;
    if (rawNextCursor == null || rawNextCursor === "") {
      setFeedHasMore(false);
      return;
    }

    const nextCursor = String(rawNextCursor);
    if (requestedFeedCursors.current.has(nextCursor)) {
      setFeedHasMore(false);
      setFeedLoadingMore(false);
      return;
    }

    // Lock before changing state so IntersectionObserver + scroll + interval
    // cannot start the same cursor twice.
    requestedFeedCursors.current.add(nextCursor);
    setFeedLoadingMore(true);
    setFeedCursor(nextCursor);
  }, [
    feed.data,
    feed.isFetching,
    feed.isUninitialized,
    feedHasMore,
    feedLoadingMore,
    page,
    resources.data,
    resources.isFetching,
    search,
  ]);

  // Infinite scroll should only start after the user actually scrolls.
  // This prevents the sentinel from firing immediately on the initial render
  // when the first page is short enough to put the sentinel inside the
  // viewport.
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasScrolledRef.current) {
          loadMore();
        }
      },
      { root: null, rootMargin: "350px 0px 350px 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore]);

  // Use the real document position as the primary fallback. The threshold is
  // intentionally small so another page is requested only when the user is
  // close to the bottom, not immediately after the first page renders.
  useEffect(() => {
    const checkPosition = () => {
      if (!hasScrolledRef.current) return;

      const distance =
        document.documentElement.scrollHeight -
        (window.scrollY + window.innerHeight);

      if (distance > 350) return;

      if (search) {
        if (stoppedSearchRef.current || resources.isFetching || !resources.data) return;
        loadMore();
        return;
      }

      if (feed.isFetching || feedLoadingMore || !feed.data || !feedHasMore) return;
      loadMore();
    };

    let raf = 0;
    const onScroll = () => {
      hasScrolledRef.current = true;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        checkPosition();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [
    feed.data,
    feed.isFetching,
    feedHasMore,
    feedLoadingMore,
    loadMore,
    resources.data,
    resources.isFetching,
    search,
  ]);

  const items = (search ? searchItems : feedItems).filter(
    (item) => !removedIds.includes(String(item.id)),
  );
  const firstLoading = search
    ? resources.isLoading && page === 0
    : feed.isLoading && feedItems.length === 0;
  const fetching = search ? resources.isFetching : feed.isFetching || feedLoadingMore;
  const hasMore = search
    ? Boolean(resources.data && !resources.data.isLast && !stoppedSearchRef.current)
    : feedHasMore;

  return (
    <section className="space-y-5 min-w-0">
      {search ? (
        <div className="flex items-end justify-between gap-4 px-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-bold text-blue-600">
              <SearchX className="h-4 w-4" /> Search
            </div>
            <h1 className="mt-1 break-words text-[28px] font-black tracking-tight text-slate-950">
              Results for “{search}”
            </h1>
            <p className="mt-1 text-[16px] text-slate-500">Browse matching resources.</p>
          </div>
          <Link href="/" className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Clear search
          </Link>
        </div>
      ) : (
        <div className="feed-intro min-w-0">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-600">
              <Sparkles className="h-3.5 w-3.5" /> Developer community
            </div>
            <h1 className="mt-3 break-words text-[29px] font-black leading-tight tracking-tight text-slate-950 sm:text-[34px]">
              Build. Share. Learn.
            </h1>
            <p className="mt-2 max-w-2xl break-words text-[16px] leading-7 text-slate-500">
              A simple developer feed for useful resources, ideas and conversations.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <ShareSiteButton />
            <Link href="/forum" className="button-secondary">
              Explore forum
            </Link>
            <Link href="/resources/new" className="button-primary">
              Share a resource
            </Link>
          </div>
        </div>
      )}

      {firstLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      ) : items.length ? (
        <>
          <div className="space-y-3 sm:space-y-4 min-w-0">
            {items.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>

          <div ref={sentinelRef} className="min-h-24 py-5" aria-live="polite">
            {fetching && (
              <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading more
              </div>
            )}
            {!fetching && hasMore && <div className="h-4" />}
            {!fetching && !hasMore && (
              <p className="text-center text-xs font-medium text-slate-400">You&apos;re all caught up.</p>
            )}
          </div>
        </>
      ) : (
        <>
          <EmptyState
            title={search ? "No results" : "No posts yet"}
            description={search ? "Try a different search term." : "Be the first developer to share something useful."}
          />
          {hasMore && (
            <button type="button" onClick={loadMore} className="button-secondary mx-auto block">
              Load more resources
            </button>
          )}
        </>
      )}
    </section>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
        </div>
      }
    >
      <HomeFeed />
    </Suspense>
  );
}
