"use client";

import Link from "next/link";
import { Bookmark, Eye, MessageCircle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

import {
  useBookmarkMutation,
  useReactMutation,
  useRemoveReactionMutation,
  useUnbookmarkMutation,
  type Resource,
} from "@/lib/api";

import { Avatar } from "@/components/ui/Avatar";
import { ReactionControl } from "@/components/resource/ReactionControl";
import { ResourceMenu } from "@/components/resource/ResourceMenu";
import { ResourceContent, SharedPostEmbed } from "@/components/resource/ResourceContent";
import { ShareDialog } from "@/components/resource/ShareDialog";
import { useToast } from "@/components/ui/Toast";

export function ResourceCard({
  resource,
  compact = false,
  initialSaved = false,
  onBookmarkChange,
}: {
  resource: Resource;
  compact?: boolean;
  initialSaved?: boolean;
  onBookmarkChange?: (saved: boolean) => void;
}) {
  const [bookmark] = useBookmarkMutation();
  const [unbookmark] = useUnbookmarkMutation();
  const [react] = useReactMutation();
  const [removeReaction] = useRemoveReactionMutation();
  const { toast } = useToast();
  const [shareOpen, setShareOpen] = useState(false);

  const [saved, setSaved] = useState(initialSaved || Boolean(resource.bookmarked));
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [reactionCount, setReactionCount] = useState(resource.reactionCount || 0);

  useEffect(() => {
    setSaved(initialSaved || Boolean(resource.bookmarked));
    setMyReaction(resource.myReaction ?? null);
    setReactionCount(resource.reactionCount ?? 0);
  }, [resource.id, resource.bookmarked, resource.myReaction, resource.reactionCount, initialSaved]);

  async function toggleBookmark() {
    const id = String(resource.id);
    try {
      if (saved) {
        await unbookmark(id).unwrap();
        setSaved(false);
        onBookmarkChange?.(false);
        toast("Removed from bookmarks", "info");
      } else {
        await bookmark(id).unwrap();
        setSaved(true);
        onBookmarkChange?.(true);
        toast("Saved to bookmarks", "success");
      }
    } catch {
      toast("Could not update bookmark. Please try again.", "error");
    }
  }

  async function reactTo(type: string) {
    const id = String(resource.id);
    try {
      if (myReaction === type) {
        const result = await removeReaction({ targetType: "RESOURCE", targetId: id }).unwrap();
        setMyReaction(result.data?.myReaction ?? null);
        setReactionCount(result.data?.totalCount ?? 0);
        toast("Reaction removed", "info");
        return;
      }

      const result = await react({ targetType: "RESOURCE", targetId: id, type }).unwrap();
      setMyReaction(result.data?.myReaction ?? type);
      setReactionCount(result.data?.totalCount ?? reactionCount);
      toast("Reaction saved", "success");
    } catch {
      toast("Could not update reaction. Please try again.", "error");
    }
  }

  const original = resource.sharedFrom ?? null;

  return (
    <article className="feed-card">
      <div className="p-4 sm:p-5">
        {/* Author */}
        <div className="flex items-start gap-3">
          <Avatar name={resource.authorUsername} />

          <div className="min-w-0 flex-1">
            <Link
              href={`/users/${resource.authorUsername}`}
              className="text-[16px] font-extrabold text-slate-950"
              onClick={(event) => event.stopPropagation()}
            >
              @{resource.authorUsername}
            </Link>
            {original && (
              <span className="ml-1.5 text-[14px] font-medium text-slate-500">
                shared a post
              </span>
            )}

            <div className="mt-0.5 text-[13px] text-slate-500">
              {new Date(resource.createdAt).toLocaleString()}
            </div>
          </div>

          <ResourceMenu resource={resource} />
        </div>

        {/* Content: a share shows the sharer's caption + the full original post */}
        {original ? (
          <>
            {resource.description && (
              <p className="mt-3 whitespace-pre-wrap break-words text-[16px] leading-7 text-slate-800">
                {resource.description}
              </p>
            )}

            <SharedPostEmbed original={original} compact={compact} />
          </>
        ) : (
          <ResourceContent resource={resource} compact={compact} />
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-1 border-t border-slate-200 pt-3 text-[14px] text-slate-500">
          {/* REACT / LIKE - FIRST ON LEFT */}
          <ReactionControl
            selected={myReaction}
            onReact={reactTo}
            compact
          />

          {/* VIEW COUNT */}
          <span className="ml-1 flex items-center gap-1.5 px-2">
            <Eye className="h-4 w-4" />
            {resource.viewCount || 0}
          </span>

          {/* COMMENT COUNT */}
          <Link
            href={`/resources/${resource.id}#discussion`}
            className="flex items-center gap-1.5 px-2"
          >
            <MessageCircle className="h-4 w-4" />
            {resource.commentCount || 0}
          </Link>

          {/* Push Save + Share to the right */}
          <div className="ml-auto flex items-center gap-1">
            {/* SAVE */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleBookmark();
              }}
              className={`icon-button ${
                saved ? "text-blue-600" : ""
              }`}
              title="Save"
              aria-label="Save"
            >
              <Bookmark
                className="h-4 w-4"
                fill={saved ? "currentColor" : "none"}
              />
            </button>

            {/* SHARE */}
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setShareOpen(true);
              }}
              className="icon-button"
              title="Share"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Reaction count */}
        <div className="mt-1 text-xs text-slate-400">
          {reactionCount}{" "}
          {reactionCount === 1 ? "reaction" : "reactions"}
        </div>
      </div>

      <ShareDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        resource={resource}
      />
    </article>
  );
}
