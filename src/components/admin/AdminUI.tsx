"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Search } from "lucide-react";

export const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-";

/** Search box that waits for a pause in typing before it tells the page (one request, not one per key). */
export function SearchBox({
  onSearch,
  placeholder,
}: {
  onSearch: (value: string) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => onSearch(value.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <label className="relative block min-w-[220px] flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
      />
    </label>
  );
}

export function Pager({
  page,
  setPage,
  isLast,
  total,
}: {
  page: number;
  setPage: (page: number) => void;
  isLast?: boolean;
  total?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-3 text-sm text-slate-500">
      <span>{total !== undefined ? `${total} total` : ""}</span>
      <div className="flex gap-2">
        <button className="button-secondary !px-3 !py-1.5" disabled={page === 0} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span className="self-center">Page {page + 1}</span>
        <button className="button-secondary !px-3 !py-1.5" disabled={isLast ?? true} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}

const TONES: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
  slate: "bg-slate-100 text-slate-600",
};

export function Pill({ children, tone = "slate" }: { children: React.ReactNode; tone?: keyof typeof TONES }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${TONES[tone]}`}>{children}</span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "slate",
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-3xl font-black text-slate-900">{value}</div>
      {hint && <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{hint}</div>}
    </div>
  );
}

export function Loading() {
  return <Loader2 className="mx-auto my-16 animate-spin text-blue-600" />;
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="card p-10 text-center text-sm text-slate-500">{children}</div>;
}

/** Small modal that asks for one line of text (for example a suspension reason). */
export function PromptDialog({
  open,
  title,
  description,
  placeholder,
  confirmLabel,
  danger,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState("");
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1500] grid place-items-center bg-slate-950/40 p-4" onMouseDown={() => !loading && onClose()}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <h2 className="text-lg font-black">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder={placeholder}
          className="mt-3 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-blue-400"
        />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="button-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              onConfirm(value.trim());
              setValue("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
