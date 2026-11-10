"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Ban,
  Flag,
  Check,
  EyeOff,
  FilePen,
  Globe,
  Link2,
  MoreHorizontal,
  Pencil,
  ThumbsUp,
  Trash2,
  UserRound,
} from "lucide-react";

import {
  useBlockUserMutation,
  useChangeResourceStatusMutation,
  useClearPreferenceMutation,
  useDeleteResourceMutation,
  useMeQuery,
  useSetPreferenceMutation,
  type Resource,
  type ResourcePreference,
  type ResourceStatus,
} from "@/lib/api";
import { resourceRemoved, resourceRestored } from "@/features/realtime/realtimeSlice";
import { useAppDispatch } from "@/store/hooks";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReportDialog } from "@/components/resource/ReportDialog";
import { useToast } from "@/components/ui/Toast";

type ItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  checked?: boolean;
  disabled?: boolean;
};

function MenuItem({ icon: Icon, children, onClick, danger, checked, disabled }: ItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition disabled:opacity-50 ${
        danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <span className="min-w-0 flex-1">{children}</span>
      {checked && <Check className="h-4 w-4 text-blue-600" />}
    </button>
  );
}

/**
 * The "..." menu in the top-right corner of a post.
 *
 *  - your own post (or an admin):  Edit, Delete (with confirmation), Copy link
 *  - somebody else's post:         Interested, Not interested (hides it), View profile, Copy link
 */
export function ResourceMenu({
  resource,
  onEdit,
  onDeleted,
  onNotInterested,
  onStatusChanged,
}: {
  resource: Resource;
  /** Detail page edits inline; elsewhere we open the detail page in edit mode. */
  onEdit?: () => void;
  onDeleted?: () => void;
  onNotInterested?: () => void;
  /** Called after the status changed (the feed card disappears, the detail page updates). */
  onStatusChanged?: (status: ResourceStatus) => void;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const { data: me } = useMeQuery();

  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blockUser, { isLoading: blocking }] = useBlockUserMutation();
  const [preference, setPreferenceState] = useState<ResourcePreference | null>(
    resource.myPreference ?? null,
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [deleteResource, { isLoading: deleting }] = useDeleteResourceMutation();
  const [setPreference, { isLoading: saving }] = useSetPreferenceMutation();
  const [clearPreference] = useClearPreferenceMutation();
  const [changeStatus, { isLoading: changingStatus }] = useChangeResourceStatusMutation();

  const id = String(resource.id);
  const isOwner = me?.data?.id != null && String(me.data.id) === String(resource.authorId);
  // The API flag covers admins; lists that don't compute it send false, so also trust the owner check.
  const canEdit = Boolean(resource.canEdit) || isOwner;
  const canDelete = Boolean(resource.canDelete) || isOwner;
  const canManage = canEdit || canDelete;

  useEffect(() => {
    setPreferenceState(resource.myPreference ?? null);
  }, [resource.myPreference]);

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

  function edit() {
    setOpen(false);
    if (onEdit) onEdit();
    else router.push(`/resources/${id}?edit=1`);
  }

  async function copyLink() {
    setOpen(false);
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/resources/${id}`);
      toast("Link copied", "success");
    } catch {
      toast("Could not copy the link.", "error");
    }
  }

  async function toggleInterested() {
    setOpen(false);
    try {
      if (preference === "INTERESTED") {
        await clearPreference(id).unwrap();
        setPreferenceState(null);
        toast("Removed from your interests", "info");
      } else {
        await setPreference({ id, type: "INTERESTED" }).unwrap();
        setPreferenceState("INTERESTED");
        toast("Marked as interested", "success");
      }
    } catch {
      toast("Could not save your choice. Please try again.", "error");
    }
  }

  async function notInterested() {
    setOpen(false);
    try {
      await setPreference({ id, type: "NOT_INTERESTED" }).unwrap();
      setPreferenceState("NOT_INTERESTED");
      onNotInterested?.();
    } catch {
      toast("Could not save your choice. Please try again.", "error");
    }
  }

  const status: ResourceStatus = resource.status ?? "PUBLISHED";

  async function moveTo(next: ResourceStatus, message: string) {
    setOpen(false);
    try {
      await changeStatus({ id, status: next }).unwrap();
      // Other people lose / regain access instantly; keep this client's lists in line too.
      if (next === "PUBLISHED") dispatch(resourceRestored(id));
      else dispatch(resourceRemoved({ id, reason: "unpublished" }));
      toast(message, "success");
      onStatusChanged?.(next);
    } catch {
      toast("Could not change the status. Please try again.", "error");
    }
  }

  async function confirmBlockUser() {
    try {
      await blockUser(resource.authorUsername).unwrap();
      setConfirmBlock(false);
      toast(`Blocked @${resource.authorUsername}. Their posts are hidden from now on.`, "success");
      // Same effect as "Not interested" for this card / page.
      onNotInterested?.();
    } catch {
      toast("Could not block this user. Please try again.", "error");
    }
  }

  async function confirmRemove() {
    try {
      await deleteResource(id).unwrap();
      dispatch(resourceRemoved({ id, reason: "deleted" }));
      setConfirmDelete(false);
      toast("Resource deleted", "success");
      onDeleted?.();
    } catch {
      toast("Could not delete this resource.", "error");
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="icon-button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 w-60 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl"
        >
          {canManage ? (
            <>
              {canEdit && (
                <MenuItem icon={Pencil} onClick={edit}>
                  Edit post
                </MenuItem>
              )}
              {canEdit && (
                <>
                  <div className="my-1 border-t border-slate-100" />
                  <div className="px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Status: {status === "PUBLISHED" ? "Public" : status === "DRAFT" ? "Draft" : "Archived"}
                  </div>
                  {status !== "PUBLISHED" && (
                    <MenuItem icon={Globe} disabled={changingStatus} onClick={() => moveTo("PUBLISHED", "Published. Everyone can see it now.")}>
                      Publish
                    </MenuItem>
                  )}
                  {status === "PUBLISHED" && (
                    <MenuItem icon={FilePen} disabled={changingStatus} onClick={() => moveTo("DRAFT", "Moved to Drafts. Only you can see it.")}>
                      Move to draft
                    </MenuItem>
                  )}
                  {status === "ARCHIVED" && (
                    <MenuItem icon={ArchiveRestore} disabled={changingStatus} onClick={() => moveTo("DRAFT", "Restored to Drafts.")}>
                      Restore to draft
                    </MenuItem>
                  )}
                  {status !== "ARCHIVED" && (
                    <MenuItem icon={Archive} disabled={changingStatus} onClick={() => moveTo("ARCHIVED", "Archived. It is deleted automatically after 30 days.")}>
                      Archive
                    </MenuItem>
                  )}
                  <div className="my-1 border-t border-slate-100" />
                </>
              )}
              {canDelete && (
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
              )}
            </>
          ) : (
            <>
              <MenuItem
                icon={ThumbsUp}
                checked={preference === "INTERESTED"}
                disabled={saving}
                onClick={toggleInterested}
              >
                Interested
              </MenuItem>
              <MenuItem icon={EyeOff} disabled={saving} onClick={notInterested}>
                Not interested
              </MenuItem>
            </>
          )}

          <div className="my-1 border-t border-slate-100" />

          <MenuItem icon={Link2} onClick={copyLink}>
            Copy link
          </MenuItem>

          {!canManage && (
            <Link
              href={`/users/${resource.authorUsername}`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              <UserRound className="h-[18px] w-[18px] shrink-0" />
              <span className="min-w-0 flex-1 truncate">View @{resource.authorUsername}</span>
            </Link>
          )}

          {!canManage && (
            <MenuItem
              icon={Flag}
              onClick={() => {
                setOpen(false);
                setReporting(true);
              }}
            >
              Report post
            </MenuItem>
          )}

          {!canManage && (
            <MenuItem
              icon={Ban}
              danger
              onClick={() => {
                setOpen(false);
                setConfirmBlock(true);
              }}
            >
              Block @{resource.authorUsername}
            </MenuItem>
          )}
        </div>
      )}

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="RESOURCE"
        targetId={resource.id}
        label="this post"
      />

      <ConfirmDialog
        open={confirmBlock}
        title={`Block @${resource.authorUsername}?`}
        description="You will no longer see their posts, comments or notifications, and they cannot follow you or comment on your posts. You can unblock them in Settings."
        confirmLabel="Block"
        danger
        loading={blocking}
        onConfirm={confirmBlockUser}
        onClose={() => setConfirmBlock(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this post?"
        description="This permanently removes the post together with its comments and reactions. This cannot be undone."
        confirmLabel="Delete"
        danger
        loading={deleting}
        onConfirm={confirmRemove}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
