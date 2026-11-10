"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { useGetBookmarksQuery, type Resource } from "@/lib/api";
import { ResourceCard } from "@/components/resource/ResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";

const PAGE_SIZE = 20;
const TYPES = ["ALL", "ARTICLE", "VIDEO", "LINK", "CODE", "BOOK"] as const;

export default function Page() {
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<Resource[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [activeType, setActiveType] = useState<(typeof TYPES)[number]>("ALL");
  const [category, setCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestedPages = useRef(new Set<number>([0]));

  const { data, isLoading, isFetching, isError } = useGetBookmarksQuery(
    { page, size: PAGE_SIZE },
    { refetchOnMountOrArgChange: true },
  );

  useEffect(() => {
    if (!data) return;
    setItems((current) => {
      if (page === 0) return data.content ?? [];
      const seen = new Set(current.map((item) => String(item.id)));
      return [...current, ...(data.content ?? []).filter((item) => !seen.has(String(item.id)))];
    });
    setHasMore(!data.isLast);
  }, [data, page]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries[0]?.isIntersecting || isFetching) return;
      const next = page + 1;
      if (requestedPages.current.has(next)) return;
      requestedPages.current.add(next);
      setPage(next);
    }, { rootMargin: "350px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [page, hasMore, isFetching]);

  const categories = useMemo(() => {
    const values = new Set(items.map((item) => item.categoryName).filter(Boolean) as string[]);
    return ["ALL", ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const typeOk = activeType === "ALL" || String(item.type || "").toUpperCase() === activeType;
      const categoryOk = category === "ALL" || item.categoryName === category;
      const searchOk = !q || [item.title, item.description, item.authorUsername, item.categoryName, ...(item.tags || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(q);
      return typeOk && categoryOk && searchOk;
    });
  }, [items, activeType, category, search]);

  function removeBookmark(id: string | number) {
    setItems((current) => current.filter((item) => String(item.id) !== String(id)));
  }

  return (
    <section className="space-y-5">
      <div className="feed-intro">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-600">
              <Bookmark className="h-5 w-5" fill="currentColor" />
            </span>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Bookmarks</h1>
              <p className="text-sm text-slate-500">Your saved resources, organized for quick access.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-3 p-3 sm:p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
          {TYPES.map((type) => (
            <button key={type} type="button" onClick={() => setActiveType(type)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${activeType === type ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {type === "ALL" ? "All" : type.charAt(0) + type.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search your bookmarks..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:bg-white" />
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 sm:w-52">
            {categories.map((value) => <option key={value} value={value}>{value === "ALL" ? "All categories" : value}</option>)}
          </select>
        </div>
      </div>

      {isError && !items.length ? (
        <div className="card p-8 text-center text-sm text-red-500">Could not load bookmarks. Please refresh and try again.</div>
      ) : isLoading && !items.length ? (
        <Loader2 className="mx-auto my-16 animate-spin text-slate-400" />
      ) : filtered.length ? (
        <div className="space-y-4">
          {filtered.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} initialSaved onBookmarkChange={(saved) => { if (!saved) removeBookmark(resource.id); }} />
          ))}
          <div ref={sentinelRef} className="flex min-h-16 items-center justify-center">
            {isFetching && <Loader2 className="h-5 w-5 animate-spin text-slate-400" />}
            {!hasMore && <span className="text-xs font-semibold text-slate-400">You reached the end of your bookmarks.</span>}
          </div>
        </div>
      ) : (
        <EmptyState
          title={items.length ? "No matching bookmarks" : "No bookmarks"}
          description={items.length ? "Try another type, category, or search term." : "Save useful resources and they will appear here."}
        />
      )}
    </section>
  );
}
