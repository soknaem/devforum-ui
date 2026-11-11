"use client";
import type { ResourceStatus } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  Download,
  Edit3,
  ExternalLink,
  FileText,
  MessageCircle,
  Send,
  Share2,
  Trash2,
} from "lucide-react";

import {
  useAddCommentMutation,
  useBookmarkMutation,
  useDeleteCommentMutation,
  useEditCommentMutation,
  useDeleteResourceMutation,
  useGetCommentsQuery,
  useGetMediaQuery,
  useGetResourceQuery,
  useGetRepliesQuery,
  useMeQuery,
  useReactionSummaryQuery,
  useReactMutation,
  useRemoveReactionMutation,
  useUnbookmarkMutation,
  useUpdateResourceMutation,
} from "@/lib/api";

import { Avatar } from "@/components/ui/Avatar";
import type { Comment } from "@/lib/api";
import { ReactionControl, reactionInfo } from "@/components/resource/ReactionControl";
import { ImageGallery, SharedPostEmbed } from "@/components/resource/ResourceContent";
import { ShareDialog } from "@/components/resource/ShareDialog";
import { useToast } from "@/components/ui/Toast";

function CommentItem({
  c,
  resourceId,
}: {
  c: Comment;
  resourceId: string;
}) {
  const [reply, setReply] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(c.content);
  const [add] = useAddCommentMutation();
  const [edit] = useEditCommentMutation();
  const [del] = useDeleteCommentMutation();
  const { toast } = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: me } = useMeQuery();

  // The API decides (owner or admin) and tells us per comment; fall back to the owner check
  // so the buttons stay hidden for everybody else.
  const isOwner = me?.data?.id != null && String(me.data.id) === String(c.authorId);
  const canEdit = c.canEdit ?? isOwner;
  const canDelete = c.canDelete ?? isOwner;

  const { data: replies } = useGetRepliesQuery(String(c.id), {
    skip: !open,
  });

  async function saveEdit() {
    if (!editText.trim()) return;
    try {
      await edit({ id: String(c.id), content: editText.trim() }).unwrap();
      setEditing(false);
      toast("Comment updated", "success");
    } catch {
      toast("Could not update the comment.", "error");
    }
  }

  async function deleteComment() {
    try {
      await del(String(c.id)).unwrap();
      setConfirmDelete(false);
      toast("Comment deleted", "success");
    } catch {
      toast("Could not delete the comment.", "error");
    }
  }

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <div className="flex gap-3">
        <Avatar name={c.authorUsername} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[15px] font-bold text-slate-900">
              @{c.authorUsername}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(c.createdAt).toLocaleString()}
            </span>
          </div>

          {editing && canEdit ? (
            <div className="mt-2 flex gap-2">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button type="button" className="button-primary" onClick={saveEdit}>
                Save
              </button>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6 text-slate-700">
              {c.content}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <button type="button" onClick={() => setOpen((value) => !value)}>
              {c.replyCount ? `${c.replyCount} replies` : "Reply"}
            </button>
            {canEdit && (
              <button type="button" onClick={() => setEditing((value) => !value)}>
                {editing ? "Cancel" : "Edit"}
              </button>
            )}
            {canDelete &&
              (confirmDelete ? (
                <span className="flex items-center gap-2">
                  <button type="button" onClick={deleteComment} className="font-bold text-red-500">Confirm delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)}>Cancel</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="text-red-500">Delete</button>
              ))}
          </div>

          {open && (
            <div className="mt-3 ml-1 border-l-2 border-slate-100 pl-4">
              {replies?.content?.map((replyItem) => (
                <div key={replyItem.id} className="mb-3 last:mb-0">
                  <div className="text-xs font-bold text-slate-800">
                    @{replyItem.authorUsername}
                  </div>
                  <div className="mt-0.5 text-sm leading-6 text-slate-600">
                    {replyItem.content}
                  </div>
                </div>
              ))}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reply.trim()) return;
                  await add({
                    resourceId,
                    content: reply.trim(),
                    parentId: String(c.id),
                  });
                  setReply("");
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  placeholder="Write a reply..."
                />
                <button type="submit" className="rounded-xl bg-slate-900 px-3 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data, isLoading } = useGetResourceQuery(id);
  const r = data?.data;
  const { data: me } = useMeQuery();
  const { data: comments } = useGetCommentsQuery(id);
  const { data: media } = useGetMediaQuery(id);
  const { data: summary } = useReactionSummaryQuery({
    targetType: "RESOURCE",
    targetId: id,
  });

  const [add] = useAddCommentMutation();
  const [del] = useDeleteResourceMutation();
  const [react] = useReactMutation();
  const [removeReact] = useRemoveReactionMutation();
  const [bookmark] = useBookmarkMutation();
  const [unbookmark] = useUnbookmarkMutation();
  const [update, { isLoading: updating }] = useUpdateResourceMutation();

  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [confirmResourceDelete, setConfirmResourceDelete] = useState(false);
  const { toast } = useToast();
  const [myReaction, setMyReaction] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    type: "ARTICLE",
    status: "PUBLISHED" as ResourceStatus,
    tags: "",
  });

  useEffect(() => {
    setMyReaction(summary?.data?.myReaction || r?.myReaction || null);
  }, [summary, r?.myReaction]);

  useEffect(() => {
    if (r) setSaved(Boolean(r.bookmarked));
  }, [r]);

  useEffect(() => {
    if (!r) return;
    setForm({
      title: r.title,
      description: r.description || "",
      url: r.url || "",
      type: r.type || "ARTICLE",
      status: r.status || "PUBLISHED",
      tags: r.tags?.join(", ") || "",
    });
  }, [r]);

  if (isLoading) {
    return <div className="card p-8 text-[15px] text-slate-500">Loading resource...</div>;
  }

  if (!r) {
    return (
      <div className="card p-8">
        <button type="button" onClick={() => router.back()} className="action-button">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="mt-5 text-[15px] text-slate-500">Resource not found.</p>
      </div>
    );
  }

  const owner = String(me?.data?.id) === String(r.authorId);
  const original = r.sharedFrom ?? null;
  const isShare = Boolean(original);
  const commentCount = comments?.totalElements ?? r.commentCount;
  const counts = summary?.data?.countsByType || {};

  async function reactTo(type: string) {
    try {
      if (myReaction === type) {
        const result = await removeReact({ targetType: "RESOURCE", targetId: id }).unwrap();
        setMyReaction(result.data?.myReaction ?? null);
        toast("Reaction removed", "info");
        return;
      }
      const result = await react({ targetType: "RESOURCE", targetId: id, type }).unwrap();
      setMyReaction(result.data?.myReaction ?? type);
      toast("Reaction saved", "success");
    } catch {
      toast("Could not update reaction.", "error");
    }
  }

  async function remove() {
    try {
      await del(id).unwrap();
      toast("Resource deleted", "success");
      router.replace("/");
    } catch {
      toast("Could not delete this resource.", "error");
    }
  }

  function goBack() {
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  return (
    <article className="space-y-5">
      <div className="flex items-center justify-between px-1">
        <button type="button" onClick={goBack} className="action-button">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xs font-semibold text-slate-400">Resource</span>
      </div>

      <div className="card overflow-visible p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <Avatar name={r.authorUsername} src={r.authorUsername === me?.data?.username ? me?.data?.avatarUrl : undefined} />
          <div className="min-w-0 flex-1">
            <a href={`/users/${r.authorUsername}`} className="text-[15px] font-black text-slate-900">
              @{r.authorUsername}
            </a>
            {isShare && <span className="ml-1.5 text-[14px] font-medium text-slate-500">shared a post</span>}
            <div className="mt-0.5 text-[13px] text-slate-500">
              {new Date(r.createdAt).toLocaleString()}
            </div>
          </div>
          {!isShare && <span className="badge">{r.type || "RESOURCE"}</span>}
        </div>

        {editing && owner && isShare ? (
          <div className="mt-6 grid gap-4">
            <label className="field">
              Caption
              <textarea
                rows={4}
                maxLength={500}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </label>
          </div>
        ) : editing && owner ? (
          <div className="mt-6 grid gap-4">
            <label className="field">
              Title
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </label>
            <label className="field">
              Description
              <textarea rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </label>
            <label className="field">
              URL
              <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="field">
                Type
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["BOOK", "CODE", "LINK", "VIDEO", "ARTICLE"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                Status
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ResourceStatus })}>
                  {["DRAFT", "PUBLISHED", "ARCHIVED"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Tags
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
            </label>
          </div>
        ) : original ? (
          <>
            {r.description && (
              <p className="mt-5 whitespace-pre-wrap break-words text-[17px] leading-7 text-slate-800">
                {r.description}
              </p>
            )}
            <SharedPostEmbed original={original} />
          </>
        ) : (
          <>
            <h1 className="mt-6 text-[30px] font-black leading-tight tracking-tight sm:text-[38px]">
              {r.title}
            </h1>
            {r.description && (
              <p className="mt-4 whitespace-pre-wrap text-[16px] leading-7 text-slate-700">
                {r.description}
              </p>
            )}
          </>
        )}

        {!isShare && r.tags?.length > 0 && !editing && (
          <div className="mt-5 flex flex-wrap gap-2">
            {r.tags.map((tag) => (
              <a
                key={tag}
                href={`/?search=${encodeURIComponent(tag)}`}
                className="tag-link"
              >
                #{tag}
              </a>
            ))}
          </div>
        )}

        {!isShare && r.url && (
          <a
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="link-preview mt-6"
          >
            <div className="min-w-0 flex-1">
              <div className="text-[12px] font-bold uppercase tracking-wide text-slate-400">
                External link
              </div>
              <div className="mt-1 text-[16px] font-extrabold text-slate-900">{r.title}</div>
              <div className="mt-1 truncate text-sm text-slate-500">{r.url}</div>
            </div>
            <ExternalLink className="h-5 w-5 shrink-0 text-slate-400" />
          </a>
        )}

        {!isShare && media?.data?.length ? (
          <div className="mt-6 space-y-3">
            <ImageGallery
              images={media.data.filter((item) => item.contentType?.startsWith("image/"))}
              title={r.title}
            />
            {media.data.filter((item) => !item.contentType?.startsWith("image/")).map((item) => {
              const video = item.contentType?.startsWith("video/");

              if (video) {
                return (
                  <video key={item.id} src={item.url} controls preload="metadata" className="max-h-[680px] w-full rounded-2xl bg-black" />
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-blue-600">
                    <FileText className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{item.fileName}</span>
                  <Download className="h-4 w-4 shrink-0 text-slate-400" />
                </a>
              );
            })}
          </div>
        ) : null}

        <div className="mt-7 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <ReactionControl selected={myReaction} onReact={reactTo} />

            <button
              type="button"
              onClick={async () => {
                if (saved) {
                  await unbookmark(id);
                  setSaved(false);
                } else {
                  await bookmark(id);
                  setSaved(true);
                }
              }}
              className={`action-button ${saved ? "bg-blue-50 text-blue-600" : ""}`}
            >
              <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
              Save
            </button>

            <button type="button" onClick={() => setShareOpen(true)} className="action-button">
              <Share2 className="h-4 w-4" /> Share
            </button>

            {owner && (
              <div className="ml-auto flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => setEditing((value) => !value)} className="action-button">
                  <Edit3 className="h-4 w-4" /> {editing ? "Cancel" : "Edit"}
                </button>
                {editing && (
                  <button
                    type="button"
                    disabled={updating}
                    onClick={async () => {
                      await update({
                        id,
                        body: {
                          ...form,
                          categoryId: r.categoryId,
                          tags: form.tags.split(",").map((value) => value.trim()).filter(Boolean),
                        },
                      });
                      setEditing(false);
                    }}
                    className="button-primary"
                  >
                    {updating ? "Saving..." : "Save"}
                  </button>
                )}
                {confirmResourceDelete ? (
                  <span className="flex items-center gap-2 rounded-xl bg-red-50 px-2 py-1">
                    <button type="button" onClick={remove} className="text-xs font-bold text-red-600">Confirm delete</button>
                    <button type="button" onClick={() => setConfirmResourceDelete(false)} className="text-xs font-semibold text-slate-500">Cancel</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmResourceDelete(true)} className="action-button text-red-500">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>{summary?.data?.totalCount ?? r.reactionCount} reactions</span>
            {Object.entries(counts).map(([type, count]) => (
              <span key={type}>{reactionInfo(type).emoji} {count}</span>
            ))}
          </div>
        </div>
      </div>

      <ShareDialog open={shareOpen} onClose={() => setShareOpen(false)} resource={r} />

      <section id="discussion" className="card p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-[21px] font-black">Discussion</h2>
              <p className="text-sm text-slate-500">{commentCount} {commentCount === 1 ? "comment" : "comments"}</p>
            </div>
          </div>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!content.trim()) return;
            await add({ resourceId: id, content: content.trim() });
            setContent("");
          }}
          className="mt-5 flex gap-2"
        >
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[15px] outline-none focus:border-blue-500 focus:bg-white"
            placeholder="Share your thoughts..."
          />
          <button type="submit" className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white">
            <Send className="h-5 w-5" />
          </button>
        </form>

        <div className="mt-4">
          {comments?.content?.length ? (
            comments.content.map((comment) => (
              <CommentItem key={comment.id} c={comment} resourceId={id} />
            ))
          ) : (
            <div className="rounded-2xl bg-slate-50 px-5 py-8 text-center">
              <MessageCircle className="mx-auto h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-semibold text-slate-600">Start the discussion</p>
              <p className="mt-1 text-sm text-slate-400">Be the first person to share a thought about this resource.</p>
            </div>
          )}
        </div>
      </section>
    </article>
  );
}
