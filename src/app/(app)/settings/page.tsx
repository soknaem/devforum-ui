"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BellRing, KeyRound, Loader2, Monitor, Moon, Plus, Sun, X } from "lucide-react";

import {
  useGetBlockedUsersQuery,
  useChangePasswordMutation,
  useGetInterestsQuery,
  useSaveInterestsMutation,
  useUnblockUserMutation,
} from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import {
  useTheme,
  type FontSize,
  type ThemeChoice,
} from "@/components/theme/ThemeProvider";

const MAX_INTERESTS = 30;

const THEMES: { id: ThemeChoice; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "light", label: "Light", Icon: Sun },
  { id: "dark", label: "Dark", Icon: Moon },
  { id: "system", label: "System", Icon: Monitor },
];

const FONT_SIZES: { id: FontSize; label: string; sample: string }[] = [
  { id: "small", label: "Small", sample: "text-sm" },
  { id: "medium", label: "Default", sample: "text-base" },
  { id: "large", label: "Large", sample: "text-xl" },
];

const segment = (active: boolean) =>
  `flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${
    active
      ? "border-blue-600 bg-blue-50 text-blue-600"
      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
  }`;

function normalise(raw: string) {
  return raw.trim().replace(/^#/, "").toLowerCase();
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: interests, isLoading } = useGetInterestsQuery();
  const [save, { isLoading: saving }] = useSaveInterestsMutation();
  const { data: blocked = [], isLoading: loadingBlocked } = useGetBlockedUsersQuery();
  const [unblock, { isLoading: unblocking }] = useUnblockUserMutation();

  const { prefs, setPrefs } = useTheme();

  const [changePassword, { isLoading: changing }] = useChangePasswordMutation();
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwProblem, setPwProblem] = useState<string | null>(null);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwProblem(null);
    if (pw.next.length < 6) return setPwProblem("The new password needs at least 6 characters.");
    if (pw.next !== pw.confirm) return setPwProblem("The two new passwords do not match.");
    try {
      await changePassword({ currentPassword: pw.current, newPassword: pw.next }).unwrap();
      setPw({ current: "", next: "", confirm: "" });
      toast("Password changed.", "success");
    } catch {
      setPwProblem("Could not change the password. Check that your current password is correct.");
    }
  }
  const [tags, setTags] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (interests) setTags(interests.tags);
  }, [interests]);

  const dirty =
    interests !== undefined &&
    (tags.length !== interests.tags.length || tags.some((t) => !interests.tags.includes(t)));

  function add(raw: string) {
    const tag = normalise(raw);
    if (!tag || tag.length > 50) return;
    if (tags.includes(tag)) return;
    if (tags.length >= MAX_INTERESTS) {
      toast(`You can pick at most ${MAX_INTERESTS} interests.`, "error");
      return;
    }
    setTags([...tags, tag]);
  }

  function submitInput() {
    input.split(",").forEach(add);
    setInput("");
  }

  async function toggleDesktopNotifications(enabled: boolean) {
    if (!enabled) {
      setPrefs({ desktopNotifications: false });
      return;
    }
    if (typeof Notification === "undefined") {
      toast("This browser does not support desktop notifications.", "error");
      return;
    }
    // The browser asks the user for permission; it can only be requested from a click.
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setPrefs({ desktopNotifications: true });
      toast("Desktop notifications are on.", "success");
    } else {
      toast("Notifications are blocked. Allow them in your browser's site settings.", "error");
    }
  }

  async function saveInterests() {
    try {
      await save(tags).unwrap();
      toast("Interests saved. Your feed will use them.", "success");
    } catch {
      toast("Could not save your interests.", "error");
    }
  }

  async function doUnblock(username: string) {
    try {
      await unblock(username).unwrap();
      toast(`Unblocked @${username}`, "success");
    } catch {
      toast("Could not unblock this user.", "error");
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black">Settings</h1>
        <p className="text-sm text-slate-500">Control what you see.</p>
      </div>

      {/* ---------------- appearance ---------------- */}
      <div className="card space-y-5 p-6">
        <div>
          <h2 className="text-lg font-black">Appearance</h2>
          <p className="text-sm text-slate-500">Saved in this browser. System follows your device (for example automatic dark mode at night).</p>
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Theme</div>
          <div className="flex gap-2" role="group" aria-label="Theme">
            {THEMES.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={prefs.theme === id}
                onClick={() => setPrefs({ theme: id })}
                className={segment(prefs.theme === id)}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Text size</div>
          <div className="flex gap-2" role="group" aria-label="Text size">
            {FONT_SIZES.map(({ id, label, sample }) => (
              <button
                key={id}
                type="button"
                aria-pressed={prefs.fontSize === id}
                onClick={() => setPrefs({ fontSize: id })}
                className={segment(prefs.fontSize === id)}
              >
                <span className={sample}>Aa</span> {label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={prefs.desktopNotifications}
            onChange={(e) => void toggleDesktopNotifications(e.target.checked)}
            className="mt-1 h-4 w-4 accent-blue-600"
          />
          <span>
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <BellRing className="h-4 w-4" /> Desktop notifications
            </span>
            <span className="block text-sm text-slate-500">
              Show a system notification when something new arrives while DevForum is in the background.
            </span>
          </span>
        </label>

        <p className="text-xs text-slate-400">
          Tip: press <kbd className="rounded border border-slate-300 px-1.5 py-0.5 font-mono text-[11px]">/</kbd> anywhere to jump to search.
        </p>
      </div>

      {/* ---------------- security ---------------- */}
      <form onSubmit={submitPassword} className="card space-y-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black">
            <KeyRound className="h-5 w-5" /> Password
          </h2>
          <p className="text-sm text-slate-500">Change the password you use to sign in.</p>
        </div>

        <label className="field">
          Current password
          <input
            type="password"
            required
            autoComplete="current-password"
            value={pw.current}
            onChange={(e) => setPw({ ...pw, current: e.target.value })}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field">
            New password
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={pw.next}
              onChange={(e) => setPw({ ...pw, next: e.target.value })}
            />
          </label>
          <label className="field">
            Repeat new password
            <input
              type="password"
              required
              autoComplete="new-password"
              value={pw.confirm}
              onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
            />
          </label>
        </div>

        {pwProblem && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{pwProblem}</p>}

        <div className="flex justify-end">
          <button type="submit" disabled={changing} className="button-primary inline-flex items-center gap-2">
            {changing && <Loader2 className="h-4 w-4 animate-spin" />}
            Change password
          </button>
        </div>
      </form>

      {/* ---------------- interests ---------------- */}
      <div className="card space-y-4 p-6">
        <div>
          <h2 className="text-lg font-black">Your interests</h2>
          <p className="text-sm text-slate-500">
            Posts with these tags are shown first in <b>For you</b>. The feed also learns from what you
            read, save, react to and mark as Interested.
          </p>
        </div>

        {isLoading ? (
          <Loader2 className="animate-spin text-blue-600" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 && <span className="text-sm text-slate-400">No interests picked yet.</span>}
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 py-1.5 pl-3 pr-2 text-sm font-bold text-blue-700"
                >
                  #{tag}
                  <button
                    type="button"
                    aria-label={`Remove ${tag}`}
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="rounded-full p-0.5 hover:bg-blue-100"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    submitInput();
                  }
                }}
                placeholder="Add a topic, e.g. spring-boot"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-400"
              />
              <button type="button" onClick={submitInput} className="button-secondary inline-flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Add
              </button>
            </div>

            {(interests?.suggestions ?? []).filter((t) => !tags.includes(t)).length > 0 && (
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Popular topics</div>
                <div className="flex flex-wrap gap-2">
                  {interests!.suggestions
                    .filter((t) => !tags.includes(t))
                    .slice(0, 14)
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => add(tag)}
                        className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {(interests?.learned ?? []).filter((t) => !tags.includes(t)).length > 0 && (
              <div>
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Learned from your activity
                </div>
                <div className="flex flex-wrap gap-2">
                  {interests!.learned
                    .filter((t) => !tags.includes(t))
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => add(tag)}
                        title="Add to your interests"
                        className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-50"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end border-t pt-4">
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={saveInterests}
                className="button-primary inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Save interests
              </button>
            </div>
          </>
        )}
      </div>

      {/* ---------------- blocked users ---------------- */}
      <div className="card space-y-3 p-6">
        <div>
          <h2 className="text-lg font-black">Blocked users</h2>
          <p className="text-sm text-slate-500">
            You do not see their posts, comments or notifications, and they cannot follow you or comment on
            your posts.
          </p>
        </div>

        {loadingBlocked ? (
          <Loader2 className="animate-spin text-blue-600" />
        ) : blocked.length === 0 ? (
          <p className="text-sm text-slate-400">You have not blocked anybody.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {blocked.map((user) => (
              <li key={user.id} className="flex items-center gap-3 py-3">
                <Avatar name={user.username} src={user.avatarUrl ?? undefined} size="sm" />
                <Link href={`/users/${user.username}`} className="min-w-0 flex-1 truncate font-bold text-slate-800">
                  {user.fullName || user.username}
                  <span className="ml-1.5 font-medium text-slate-400">@{user.username}</span>
                </Link>
                <button
                  type="button"
                  disabled={unblocking}
                  onClick={() => doUnblock(user.username)}
                  className="button-secondary !px-3 !py-1.5 text-sm"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
