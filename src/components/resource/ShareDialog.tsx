"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useShareResourceMutation, type Resource } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

/**
 * Facebook-style "Share" dialog: the person adds an optional caption, the API creates a new
 * post that embeds the original, and we then take them straight to that new shared post.
 */
export function ShareDialog({
  open,
  onClose,
  resource,
}: {
  open: boolean;
  onClose: () => void;
  resource: Resource;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [share, { isLoading }] = useShareResourceMutation();
  const [caption, setCaption] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLoading, onClose]);

  if (!open || typeof document === "undefined") return null;

  // Sharing a share re-shares the original post (the API does the same).
  const original = resource.sharedFrom ?? resource;

  async function submit() {
    try {
      const result = await share({
        id: String(resource.id),
        comment: caption.trim() || undefined,
      }).unwrap();

      const newId = result.data?.id;

      setCaption("");
      onClose();
      toast("Shared successfully", "success");

      // Go to the post that was just created instead of staying on the old page.
      router.push(newId ? `/resources/${newId}` : "/");
    } catch {
      toast("Could not share this resource.", "error");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1500] grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share resource"
      >
        <h2 className="text-lg font-black text-slate-900">Share resource</h2>
        <p className="mt-1 text-sm text-slate-500">
          Add an optional caption before sharing.
        </p>

        <textarea
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          rows={4}
          maxLength={500}
          autoFocus
          className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
          placeholder="Say something about this resource..."
        />

        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="text-xs font-bold text-slate-500">
            @{original.authorUsername}
          </div>
          <div className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-800">
            {original.title}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="button-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isLoading}
            className="button-primary gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Share
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
