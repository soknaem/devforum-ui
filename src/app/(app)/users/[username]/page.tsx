"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetBlockStatusQuery,
  useFollowMutation,
  useFollowersQuery,
  useFollowingQuery,
  useGetProfileQuery,
  useGetUserResourcesQuery,
  useMeQuery,
  useUnfollowMutation,
} from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { ResourceCard } from "@/components/resource/ResourceCard";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReportDialog } from "@/components/resource/ReportDialog";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
export default function Page() {
  const { username } = useParams<{ username: string }>();
  const { data, isLoading } = useGetProfileQuery(username);
  const { data: resources } = useGetUserResourcesQuery({
    username,
    page: 0,
    size: 20,
  });
  const { data: followers } = useFollowersQuery({ username });
  const { data: following } = useFollowingQuery({ username });
  const { data: me } = useMeQuery();
  const { toast } = useToast();
  const [follow, { isLoading: followPending }] = useFollowMutation();
  const [unfollow, { isLoading: unfollowing }] = useUnfollowMutation();
  // Instant feedback while the request runs; the real value comes from the API (u.following)
  // so it survives a page refresh.
  const [followOverride, setFollowOverride] = useState<boolean | null>(null);
  const u = data?.data;

  // Blocking: hides their posts, comments and notifications for me, both directions.
  const { data: blockedByMe = false } = useGetBlockStatusQuery(username, {
    skip: !me?.data || me.data.username === username,
  });
  const [blockUser, { isLoading: blocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: unblocking }] = useUnblockUserMutation();
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    setFollowOverride(null);
  }, [u?.following, username]);

  if (isLoading || !u)
    return <Loader2 className="mx-auto my-16 animate-spin" />;

  const isSelf = !!me?.data && me.data.username === u.username;
  const isFollowing = followOverride ?? Boolean(u.following);
  const followBusy = followPending || unfollowing;

  async function confirmBlockUser() {
    try {
      await blockUser(username).unwrap();
      setFollowOverride(false);
      setConfirmBlock(false);
      toast(`Blocked @${username}`, "success");
    } catch {
      toast("Could not block this user.", "error");
    }
  }

  async function doUnblock() {
    try {
      await unblockUser(username).unwrap();
      toast(`Unblocked @${username}`, "success");
    } catch {
      toast("Could not unblock this user.", "error");
    }
  }

  async function toggleFollow() {
    if (!u) return;
    const next = !isFollowing;
    setFollowOverride(next);
    try {
      if (next) await follow(u.username).unwrap();
      else await unfollow(u.username).unwrap();
    } catch {
      setFollowOverride(null);
      toast("Could not update follow status. Please try again.", "error");
    }
  }
  return (
    <section className="space-y-5">
      <div className="card overflow-hidden">
        <div className="h-36 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600">
          {u.coverUrl && (
            <img
              src={u.coverUrl}
              className="h-full w-full object-cover"
              alt="Cover"
            />
          )}
        </div>
        <div className="p-6">
          <div className="-mt-14 flex items-end justify-between">
            <Avatar name={u.username} src={u.avatarUrl} size="lg" />
            {isSelf ? (
              <Link href="/profile" className="button-secondary">
                Edit profile
              </Link>
            ) : blockedByMe ? (
              <button
                type="button"
                disabled={unblocking}
                onClick={doUnblock}
                className="button-secondary"
              >
                Unblock
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setReporting(true)}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100"
                >
                  Report
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmBlock(true)}
                  className="rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  Block
                </button>
                <button
                  type="button"
                  disabled={followBusy}
                  onClick={toggleFollow}
                  className="button-primary"
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            )}
          </div>
          <h1 className="mt-4 text-2xl font-black">
            {u.fullName || u.username}
          </h1>
          <div className="text-sm text-slate-500">@{u.username}</div>
          {u.bio && (
            <p className="mt-3 max-w-2xl leading-6 text-slate-700">{u.bio}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-6 text-sm">
            <span>
              <b>{u.resourceCount}</b> resources
            </span>
            <span>
              <b>{u.followerCount}</b> followers
            </span>
            <span>
              <b>{u.followingCount}</b> following
            </span>
          </div>
          {(u.location || u.website) && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              {u.location && <span>📍 {u.location}</span>}
              {u.website && (
                <a
                  href={u.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600"
                >
                  🔗 Website
                </a>
              )}
            </div>
          )}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-black">Resources by @{u.username}</h2>
        <p className="mb-4 text-sm text-slate-500">
          Published posts and shared resources.
        </p>
        {blockedByMe ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
            You blocked @{u.username}. Their posts are hidden from you.{" "}
            <button type="button" className="font-bold text-blue-600" onClick={doUnblock}>
              Unblock
            </button>
          </div>
        ) : resources?.length ? (
          <div className="space-y-4">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        ) : (
          <div className="card p-6 text-sm text-slate-500">
            No resources yet.
          </div>
        )}
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-5">
          <h3 className="font-black">Followers</h3>
          <div className="mt-3 space-y-2">
            {followers?.content?.slice(0, 8).map((x) => (
              <div key={x.id} className="flex items-center gap-2">
                <Avatar name={x.username} src={x.avatarUrl} size="sm" />
                <span className="text-sm font-semibold">@{x.username}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-5">
          <h3 className="font-black">Following</h3>
          <div className="mt-3 space-y-2">
            {following?.content?.slice(0, 8).map((x) => (
              <div key={x.id} className="flex items-center gap-2">
                <Avatar name={x.username} src={x.avatarUrl} size="sm" />
                <span className="text-sm font-semibold">@{x.username}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="USER"
        targetId={u.id}
        label={`@${u.username}`}
      />

      <ConfirmDialog
        open={confirmBlock}
        title={`Block @${u.username}?`}
        description="You will no longer see their posts, comments or notifications, and they cannot follow you or comment on your posts. You can unblock them anytime in Settings."
        confirmLabel="Block"
        danger
        loading={blocking}
        onConfirm={confirmBlockUser}
        onClose={() => setConfirmBlock(false)}
      />
    </section>
  );
}
