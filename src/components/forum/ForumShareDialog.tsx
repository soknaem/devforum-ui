"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Check, Copy, Loader2, Send, Share2 } from "lucide-react";

import { useShareForumTopicMutation, type ForumTopic } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const secondaryButton =
  "flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800";

/**
 * Share dialog for a forum discussion, same idea as the resource one: send the link to other apps,
 * or "Share on DevForum" with an optional caption, which creates a new discussion that embeds the
 * original and then takes the person to it.
 */
export function ForumShareDialog({
  open,
  onClose,
  topic,
}: {
  open: boolean;
  onClose: () => void;
  topic: ForumTopic;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [share, { isLoading }] = useShareForumTopicMutation();
  const [caption, setCaption] = useState("");
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const original = topic.sharedFrom ?? topic;

  const shareUrl =
    typeof window === "undefined" ? "" : new URL(`/forum/${topic.id}`, window.location.origin).toString();
  const shareText = caption.trim() || original.summary || original.title;
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  async function copyLink() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const input = document.createElement("textarea");
      input.value = shareUrl;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setShareStatus("Link copied. Paste it into any app or message.");
    window.setTimeout(() => setCopied(false), 2200);
  }

  async function shareToSystem(destination?: string) {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: original.title, text: shareText, url: shareUrl });
        setShareStatus("");
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          setShareStatus("Sharing is not available here. Copy the link instead.");
        }
      }
      return;
    }
    await copyLink();
    if (destination) setShareStatus(`Link copied. Paste it into ${destination}.`);
  }

  const socialLinks = [
    { name: "Telegram", mark: "T", className: "bg-sky-500", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
    { name: "Facebook", mark: "f", className: "bg-blue-700", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: "WhatsApp", mark: "W", className: "bg-emerald-500", href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}` },
    { name: "X", mark: "X", className: "bg-slate-900", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}` },
    { name: "LinkedIn", mark: "in", className: "bg-sky-700", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
  ];

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLoading, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function submit() {
    try {
      const result = await share({ id: String(topic.id), comment: caption.trim() || undefined }).unwrap();
      const newId = result.data?.id;
      setCaption("");
      onClose();
      toast("Shared successfully", "success");
      // Go to the discussion that was just created.
      router.push(newId ? `/forum/${newId}` : "/forum");
    } catch {
      toast("Could not share this discussion.", "error");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1500] grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={() => !isLoading && onClose()}
    >
      <div
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Share discussion"
      >
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Share discussion</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Send this link to your friends or share it with the DevForum community.
        </p>

        <button
          type="button"
          onClick={() => shareToSystem()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <Share2 className="h-4 w-4" /> Share with apps on this device
        </button>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {socialLinks.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl p-2 text-center text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={`Share on ${item.name}`}
            >
              <span className={`grid h-10 w-10 place-items-center rounded-full text-sm font-black text-white ${item.className}`}>
                {item.mark}
              </span>
              {item.name}
            </a>
          ))}
        </div>

        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => shareToSystem("Messenger")} className={secondaryButton}>
            <Send className="h-4 w-4 text-blue-600" /> Messenger
          </button>
          <button type="button" onClick={() => shareToSystem("TikTok")} className={secondaryButton}>
            <span className="font-black text-slate-900 dark:text-slate-100">♪</span> TikTok
          </button>
          <button type="button" onClick={copyLink} className={secondaryButton}>
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
        {shareStatus && (
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400" role="status">
            {shareStatus}
          </p>
        )}

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">Share to DevForum</p>
          <textarea
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={3}
            maxLength={500}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:bg-slate-800"
            placeholder="Say something about this discussion..."
          />

          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400">@{original.authorUsername}</div>
            <div className="mt-0.5 line-clamp-2 text-sm font-bold text-slate-800 dark:text-slate-100">{original.title}</div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={isLoading} className="button-secondary">
              Cancel
            </button>
            <button type="button" onClick={submit} disabled={isLoading} className="button-primary gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Share on DevForum
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
