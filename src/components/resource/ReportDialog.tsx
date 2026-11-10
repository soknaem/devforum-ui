"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

import { useCreateReportMutation, type ReportReason, type ReportTarget } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";

const REASONS: { id: ReportReason; label: string; hint: string }[] = [
  { id: "SPAM", label: "Spam or advertising", hint: "Repeated, irrelevant or promotional" },
  { id: "ABUSE", label: "Harassment or abuse", hint: "Insults, threats or hate" },
  { id: "INAPPROPRIATE", label: "Inappropriate content", hint: "Not suitable for this community" },
  { id: "COPYRIGHT", label: "Copyright", hint: "Content copied without permission" },
  { id: "OTHER", label: "Something else", hint: "Tell us more below" },
];

/** "Report" dialog for a post, a comment or a user. Administrators review reports in the admin panel. */
export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  label,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: number | string;
  /** What is being reported, shown in the title. */
  label: string;
}) {
  const { toast } = useToast();
  const [send, { isLoading }] = useCreateReportMutation();
  const [reason, setReason] = useState<ReportReason>("SPAM");
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, isLoading, onClose]);

  if (!open || typeof document === "undefined") return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await send({ targetType, targetId, reason, details: details.trim() || undefined }).unwrap();
      toast("Report sent. Thank you for keeping DevForum safe.", "success");
      setDetails("");
      onClose();
    } catch {
      toast("Could not send the report. You cannot report your own content.", "error");
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[1500] grid place-items-center bg-slate-950/40 p-4"
      onMouseDown={() => !isLoading && onClose()}
    >
      <form
        onSubmit={submit}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Report"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <h2 className="text-lg font-black">Report {label}</h2>
        <p className="mt-1 text-sm text-slate-500">Why are you reporting this? Only administrators see your report.</p>

        <div className="mt-4 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r.id}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                reason === r.id ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="reason"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
                className="mt-1 accent-blue-600"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">{r.label}</span>
                <span className="block text-xs text-slate-500">{r.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="Details (optional)"
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isLoading} className="button-secondary">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send report
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
