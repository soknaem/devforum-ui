"use client";

import { Archive, FilePen, RotateCcw } from "lucide-react";
import { ResourceCard } from "@/components/resource/ResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useGetMyResourcesQuery, type ResourceStatus } from "@/lib/api";

export function MyResourcesPage({ status }: { status: ResourceStatus }) {
  const isDraft = status === "DRAFT";
  const { data, isLoading, isError } = useGetMyResourcesQuery({ status, size: 20 });
  const resources = data?.content ?? [];
  const title = isDraft ? "Drafts" : "Archived";
  const description = isDraft
    ? "Resources you are still working on."
    : "Resources you archived. They are kept here until restored or permanently removed.";
  const Icon = isDraft ? FilePen : Archive;

  return (
    <section className="space-y-5">
      <header className="card flex items-start gap-4 p-5 sm:p-6">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${isDraft ? "bg-slate-100 text-slate-600" : "bg-amber-100 text-amber-700"}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </header>

      {isLoading && <div className="card p-8 text-center text-sm text-slate-500">Loading {title.toLowerCase()}...</div>}
      {isError && <div className="card p-8 text-center text-sm text-red-600">Could not load your {title.toLowerCase()}. Please try again.</div>}
      {!isLoading && !isError && resources.length === 0 && (
        <EmptyState
          title={isDraft ? "No drafts yet" : "Nothing archived"}
          description={isDraft ? "Save a resource as a draft and it will appear here." : "Archived resources will appear here."}
        />
      )}
      {!isLoading && !isError && resources.length > 0 && (
        <div className="space-y-4">
          {resources.map((resource) => <ResourceCard key={resource.id} resource={resource} />)}
        </div>
      )}

      {status === "ARCHIVED" && resources.length > 0 && (
        <p className="flex items-center justify-center gap-2 text-xs text-slate-400"><RotateCcw className="h-3.5 w-3.5" /> You can restore archived resources from their menu.</p>
      )}
    </section>
  );
}
