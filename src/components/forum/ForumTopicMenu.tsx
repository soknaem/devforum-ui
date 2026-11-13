"use client";

import { useEffect, useRef, useState } from "react";
import { Link2, MoreHorizontal, Trash2 } from "lucide-react";

import { useDeleteForumTopicMutation, type ForumTopic } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

type ItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
};

function MenuItem({ icon: Icon, children, onClick, danger }: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

/**
 * The "..." menu of a discussion.
 *  - everyone:               Copy link
 *  - the author or an admin: Delete post (with confirmation). The API says who that is (topic.canDelete).
 */
export function ForumTopicMenu({
  topic,
  onDeleted,
  direction = "down",
}: {
  topic: ForumTopic;
  onDeleted?: () => void;
  /** "up" opens the menu above the button (use it at the bottom of a card). */
  direction?: "down" | "up";
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [deleteTopic, { isLoading: deleting }] = useDeleteForumTopicMutation();

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/forum/${topic.id}`);
      toast("Link copied", "success");
    } catch {
      toast("Could not copy the link.", "error");
    }
  }

  async function confirmRemove() {
    try {
      await deleteTopic(String(topic.id)).unwrap();
      setConfirmDelete(false);
      toast("Discussion deleted", "success");
      onDeleted?.();
    } catch {
      toast("Could not delete this discussion.", "error");
    }
  }

  return (
    <div ref={wrapperRef} className="relative z-10">
      <button
        type="button"
        className="icon-button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute right-0 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900 ${
            direction === "up" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <MenuItem icon={Link2} onClick={copyLink}>
            Copy link
          </MenuItem>

          {topic.canDelete && (
            <>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <MenuItem
                icon={Trash2}
                danger
                onClick={() => {
                  setOpen(false);
                  setConfirmDelete(true);
                }}
              >
                Delete post
              </MenuItem>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this discussion?"
        description="This permanently removes the discussion together with its replies and any shares of it. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmRemove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
