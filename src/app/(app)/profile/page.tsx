"use client";
import { useEffect, useState } from "react";
import { Loader2, Camera, Save, History } from "lucide-react";
import Link from "next/link";
import {
  useGetHistoryQuery,
  useMeQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useUploadCoverMutation,
} from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ResourceCard } from "@/components/resource/ResourceCard";
export default function Page() {
  const { data, isLoading } = useMeQuery();
  const u = data?.data;
  const [update, { isLoading: saving }] = useUpdateProfileMutation();
  const [avatar] = useUploadAvatarMutation();
  const [cover] = useUploadCoverMutation();
  const { data: history } = useGetHistoryQuery({ page: 0, size: 6 });
  const [form, setForm] = useState({
    fullName: "",
    bio: "",
    location: "",
    website: "",
  });
  useEffect(() => {
    if (u)
      setForm({
        fullName: u.fullName || "",
        bio: u.bio || "",
        location: u.location || "",
        website: u.website || "",
      });
  }, [u]);
  if (isLoading || !u)
    return <Loader2 className="mx-auto my-16 animate-spin" />;
  return (
    <section className="space-y-5">
      <div className="card overflow-hidden">
        <div className="relative h-40 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600">
          {u.coverUrl && (
            <img
              src={u.coverUrl}
              className="h-full w-full object-cover"
              alt="Cover"
            />
          )}
          <label className="absolute right-4 top-4 cursor-pointer rounded-xl bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
            <Camera className="mr-1 inline h-4 w-4" /> Cover
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) cover(f);
              }}
            />
          </label>
        </div>
        <div className="p-6">
          <div className="-mt-16 flex items-end justify-between">
            <div className="relative">
              <Avatar name={u.username} src={u.avatarUrl} size="lg" />
              <label className="absolute -bottom-1 -right-1 cursor-pointer rounded-full border-2 border-white bg-white p-2 shadow">
                <Camera className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) avatar(f);
                  }}
                />
              </label>
            </div>
            <Link href={`/users/${u.username}`} className="button-secondary">
              View public profile
            </Link>
          </div>
          <div className="mt-4">
            <h1 className="text-2xl font-black">{u.fullName || u.username}</h1>
            <p className="text-sm text-slate-500">
              @{u.username} · joined {new Date(u.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-xl font-black">{u.resourceCount}</div>
              <div className="text-xs text-slate-500">Resources</div>
            </div>
            <div>
              <div className="text-xl font-black">{u.followerCount}</div>
              <div className="text-xs text-slate-500">Followers</div>
            </div>
            <div>
              <div className="text-xl font-black">{u.followingCount}</div>
              <div className="text-xs text-slate-500">Following</div>
            </div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <div className="flex items-center gap-2">
          <Save className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-black">Edit profile</h2>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="field">
            Full name
            <input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>
          <label className="field">
            Location
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </label>
          <label className="field sm:col-span-2">
            Website
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://..."
            />
          </label>
          <label className="field sm:col-span-2">
            Bio
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </label>
        </div>
        <button
          disabled={saving}
          onClick={() => update(form)}
          className="mt-5 button-primary"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black flex items-center gap-2">
            <History className="h-5 w-5" /> Recently viewed
          </h2>
          <p className="text-sm text-slate-500">
            Your latest resource history.
          </p>
        </div>
      </div>
      {history?.content?.length ? (
        <div className="space-y-4">
          {history.content.map((r) => (
            <ResourceCard key={r.id} resource={r} compact />
          ))}
        </div>
      ) : (
        <div className="card p-6 text-sm text-slate-500">No history yet.</div>
      )}
    </section>
  );
}
