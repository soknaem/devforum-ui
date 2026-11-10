"use client";

import type { NotificationScope } from "@/lib/api";

export type NotificationGroup = "COMMENTS" | "REACTIONS" | "SHARES" | "FOLLOWS" | "MENTIONS" | "POSTS";

export type NotificationFilterState = {
  groups: NotificationGroup[];
  scope: NotificationScope;
  unreadOnly: boolean;
};

export const DEFAULT_FILTERS: NotificationFilterState = {
  groups: [],
  scope: "ALL",
  unreadOnly: false,
};

const GROUPS: { id: NotificationGroup; label: string; types: string[] }[] = [
  { id: "COMMENTS", label: "Comments", types: ["COMMENT", "COMMENT_REPLY"] },
  { id: "REACTIONS", label: "Reactions", types: ["REACTION"] },
  { id: "SHARES", label: "Shares", types: ["SHARE"] },
  { id: "FOLLOWS", label: "Follows", types: ["FOLLOW"] },
  { id: "MENTIONS", label: "Mentions", types: ["MENTION"] },
  { id: "POSTS", label: "New posts", types: ["NEW_POST"] },
];

const SCOPES: { id: NotificationScope; label: string }[] = [
  { id: "ALL", label: "Everyone" },
  { id: "FOLLOWING", label: "People I follow" },
  { id: "INTERESTING", label: "My interests" },
];

/** Turns the selected groups into the notification types the API expects (empty = all). */
export function typesOf(groups: NotificationGroup[]): string[] {
  return GROUPS.filter((g) => groups.includes(g.id)).flatMap((g) => g.types);
}

const chip = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs font-bold transition ${
    active
      ? "border-blue-600 bg-blue-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
  }`;

export function NotificationFilters({
  value,
  onChange,
}: {
  value: NotificationFilterState;
  onChange: (next: NotificationFilterState) => void;
}) {
  const dirty = value.groups.length > 0 || value.scope !== "ALL" || value.unreadOnly;

  function toggle(id: NotificationGroup) {
    const groups = value.groups.includes(id)
      ? value.groups.filter((g) => g !== id)
      : [...value.groups, id];
    onChange({ ...value, groups });
  }

  return (
    <div className="card space-y-3 p-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Notification types">
        {GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={value.groups.includes(g.id)}
            onClick={() => toggle(g.id)}
            className={chip(value.groups.includes(g.id))}
          >
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Notification source">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={value.scope === s.id}
              onClick={() => onChange({ ...value, scope: s.id })}
              className={chip(value.scope === s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-600">
          <input
            type="checkbox"
            checked={value.unreadOnly}
            onChange={(e) => onChange({ ...value, unreadOnly: e.target.checked })}
            className="accent-blue-600"
          />
          Unread only
        </label>

        {dirty && (
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
