"use client";

import Link from "next/link";
import {
  Archive,
  Bell,
  Bookmark,
  FilePen,
  Settings,
  Shield,
  Home,
  MessagesSquare,
  LogOut,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { useAdminStatsQuery, useGetMyResourceCountsQuery, useLogoutMutation, useMeQuery, useUnreadCountQuery } from "@/lib/api";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { BackToTop } from "@/components/layout/BackToTop";
import { Shortcuts } from "@/components/layout/Shortcuts";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAppSelector } from "@/store/hooks";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/forum", label: "Forum", icon: MessagesSquare },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: me } = useMeQuery();
  const { data: unread = 0 } = useUnreadCountQuery();
  const { data: counts } = useGetMyResourceCountsQuery();
  const isAdmin = me?.data?.role === "ROLE_ADMIN";
  const { data: adminStats } = useAdminStatsQuery(undefined, { skip: !isAdmin, pollingInterval: 60000 });
  const live = useAppSelector((state) => state.realtime.connected);
  const [logout, { isLoading }] = useLogoutMutation();
  const [q, setQ] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("search") || "";
    setQ(value);
    setMobileSearchOpen(Boolean(value));
  }, [pathname]);

  useEffect(() => {
    let lastY = window.scrollY;

    const updateForViewport = () => {
      if (window.innerWidth >= 768) {
        setHeaderVisible(true);
      }
    };

    const onScroll = () => {
      // Hide-on-scroll is intentionally a small-screen-only behavior.
      if (window.innerWidth >= 768) {
        setHeaderVisible(true);
        lastY = window.scrollY;
        return;
      }

      const currentY = window.scrollY;
      if (currentY <= 12) {
        setHeaderVisible(true);
      } else if (currentY > lastY + 8) {
        setHeaderVisible(false);
        setProfileOpen(false);
      } else if (currentY < lastY - 8) {
        setHeaderVisible(true);
      }
      lastY = currentY;
    };

    updateForViewport();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateForViewport);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateForViewport);
    };
  }, []);

  async function signOut() {
    await logout();
    router.replace("/login");
  }

  function search(event: React.FormEvent) {
    event.preventDefault();
    const value = q.trim();
    router.push(value ? `/?search=${encodeURIComponent(value)}` : "/");
    setMobileSearchOpen(false);
  }

  function clearSearch() {
    setQ("");
    setMobileSearchOpen(false);
    router.push("/");
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Shortcuts />
      <BackToTop />
      {/* Desktop header */}
      <header className="desktop-header fixed inset-x-0 top-0 z-50 hidden border-b border-slate-200/80 bg-white/95 backdrop-blur md:block">
        <div className="app-width flex h-[72px] items-center gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-3 text-[25px] font-black tracking-tight">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-lg text-white">D</span>
            <span>DevForum</span>
          </Link>

          <form onSubmit={search} className="min-w-0 flex-1">
            <div className="relative mx-auto max-w-[850px]">
              <Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-12 text-[16px] outline-none focus:border-blue-500 focus:bg-white"
                placeholder="Search resources, tags, developers..."
                aria-label="Search resources, tags, developers"
              />
              {q && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          <div className="relative flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <Link
              href="/notifications"
              className="icon-button relative"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              title={live ? "Notifications (live)" : "Notifications (reconnecting...)"}
            >
              <Bell className="h-6 w-6" />
              {unread > 0 && (
                <span className="absolute right-0.5 top-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-[18px] text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
              <span
                className={`absolute bottom-1 right-1 h-2 w-2 rounded-full ring-2 ring-white ${
                  live ? "bg-emerald-500" : "bg-slate-300"
                }`}
              />
            </Link>
            <button
              type="button"
              onClick={() => setProfileOpen((value) => !value)}
              className="flex items-center gap-2.5 rounded-full px-2 py-1.5 hover:bg-slate-50"
              aria-label="Open profile menu"
            >
              <Avatar name={me?.data?.username} src={me?.data?.avatarUrl} size="sm" />
              <span className="max-w-32 truncate text-[16px] font-bold text-slate-800">
                {me?.data?.username || "Profile"}
              </span>
            </button>
            {profileOpen && (
              <ProfileMenu
              isAdmin={isAdmin}
                username={me?.data?.username}
                avatarUrl={me?.data?.avatarUrl}
                isLoading={isLoading}
                onClose={() => setProfileOpen(false)}
                onLogout={signOut}
              />
            )}
          </div>
        </div>
      </header>

      {/* Mobile / Facebook-style compact header */}
      <header className="mobile-header fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white md:hidden">
        <div
          className={`mobile-top-row overflow-hidden transition-all duration-200 ${
            headerVisible
              ? mobileSearchOpen
                ? "max-h-[120px] translate-y-0"
                : "max-h-[58px] translate-y-0"
              : "max-h-0 -translate-y-full"
          }`}
        >
          <div className="flex h-[58px] items-center gap-3 px-3">
            <Link href="/" className="mr-auto text-[23px] font-black tracking-tight text-blue-600">
              DevForum
            </Link>

            <ThemeToggle />

            <button
              type="button"
              className="icon-button"
              aria-label="Search"
              onClick={() => setMobileSearchOpen(true)}
            >
              <Search className="h-6 w-6" />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((value) => !value)}
                className="rounded-full"
                aria-label="Profile menu"
              >
                <Avatar name={me?.data?.username} src={me?.data?.avatarUrl} size="sm" />
              </button>
            </div>
          </div>

          {mobileSearchOpen && (
            <form onSubmit={search} className="border-t border-slate-100 bg-white px-3 py-2.5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  autoFocus
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  placeholder="Search resources, tags, developers..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-[15px] outline-none focus:border-blue-500 focus:bg-white"
                  aria-label="Search resources, tags, developers"
                />
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-400"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {profileOpen && (
          <ProfileMenu
              isAdmin={isAdmin}
            username={me?.data?.username}
            avatarUrl={me?.data?.avatarUrl}
            isLoading={isLoading}
            mobile
            onClose={() => setProfileOpen(false)}
            onLogout={signOut}
          />
        )}

        {/* Keep the feature navigation visible even when the top row hides. */}
        <nav className="grid h-[54px] grid-cols-6 border-t border-slate-100 bg-white" aria-label="Mobile navigation">
          <MobileNav href="/" label="Home" icon={Home} active={isActive("/")} />
          <MobileNav href="/forum" label="Forum" icon={MessagesSquare} active={isActive("/forum")} />
          <MobileNav href="/bookmarks" label="Bookmarks" icon={Bookmark} active={isActive("/bookmarks")} />
          <MobileNav href="/resources/new" label="Create" icon={Plus} active={false} />
          <MobileNav
            href="/notifications"
            label="Notifications"
            icon={Bell}
            active={isActive("/notifications")}
            badge={unread}
          />
          <MobileNav href="/profile" label="Profile" icon={UserRound} active={isActive("/profile")} />
        </nav>
      </header>

      <div
        className={`app-width app-grid gap-8 pb-6 pt-[122px] md:grid-cols-[190px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_270px] md:pt-[88px] ${
          !headerVisible
            ? "max-md:pt-[66px]"
            : mobileSearchOpen
              ? "max-md:pt-[166px]"
              : "max-md:pt-[122px]"
        }`}
      >
        {/* Desktop sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-24 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`side-link ${isActive(href) ? "bg-white text-blue-600 shadow-sm" : ""}`}
              >
                <Icon />
                <span>{label}</span>
                {href === "/notifications" && unread > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </Link>
            ))}
            <Link href="/resources/new" className={`side-link ${isActive("/resources/new") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
              <Plus />
              <span>Create resource</span>
            </Link>
            <div className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-slate-400">My resources</div>
            <Link href="/drafts" className={`side-link ${isActive("/drafts") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
              <FilePen />
              <span>Drafts</span>
              {(counts?.draft ?? 0) > 0 && (
                <span className="ml-auto rounded-full bg-slate-200 px-1.5 text-[11px] font-bold leading-5 text-slate-600">
                  {counts?.draft}
                </span>
              )}
            </Link>
            <Link href="/archived" className={`side-link ${isActive("/archived") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
              <Archive />
              <span>Archived</span>
              {(counts?.archived ?? 0) > 0 && (
                <span className="ml-auto rounded-full bg-amber-100 px-1.5 text-[11px] font-bold leading-5 text-amber-700">
                  {counts?.archived}
                </span>
              )}
            </Link>
            <Link href="/profile" className={`side-link ${isActive("/profile") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
              <UserRound />
              <span>Profile</span>
            </Link>
            <Link href="/settings" className={`side-link ${isActive("/settings") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
              <Settings />
              <span>Settings</span>
            </Link>
            {isAdmin && (
              <Link href="/admin" className={`side-link ${isActive("/admin") ? "bg-white text-blue-600 shadow-sm" : ""}`}>
                <Shield />
                <span>Admin</span>
                {(adminStats?.openReports ?? 0) > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[11px] font-bold leading-5 text-white">
                    {adminStats?.openReports}
                  </span>
                )}
              </Link>
            )}
          </div>
        </aside>

        <main className="min-w-0">{children}</main>

        <aside className="hidden xl:block">
          <div className="sticky top-24 space-y-4">
            <div className="card p-5">
              <h3 className="text-[17px] font-black">DevForum</h3>
              <p className="mt-2 text-[15px] leading-6 text-slate-500">
                Ask questions, share code, publish resources and follow developers.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="text-[17px] font-black">Quick actions</h3>
              <div className="mt-3 space-y-2 text-[15px]">
                <Link className="block text-blue-600" href="/forum/new">Start a discussion →</Link>
                <Link className="block text-blue-600" href="/resources/new">Share a resource →</Link>
                <Link className="block text-blue-600" href="/profile">Edit your profile →</Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MobileNav({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`relative flex items-center justify-center ${active ? "text-blue-600" : "text-slate-500"}`}
    >
      <Icon className="h-[23px] w-[23px]" />
      {badge > 0 && (
        <span className="absolute right-4 top-1 min-w-4 rounded-full bg-red-500 px-1 text-center text-[9px] font-bold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {active && <span className="absolute bottom-0 h-0.5 w-11 rounded-full bg-blue-600" />}
    </Link>
  );
}

function ProfileMenu({
  isAdmin = false,
  username,
  avatarUrl,
  isLoading,
  onClose,
  onLogout,
  mobile = false,
}: {
  isAdmin?: boolean;
  username?: string;
  avatarUrl?: string;
  isLoading: boolean;
  onClose: () => void;
  onLogout: () => void;
  mobile?: boolean;
}) {
  return (
    <div
      className={
        mobile
          ? "fixed right-3 top-[66px] z-[1000] w-[calc(100vw-24px)] max-w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
          : "absolute right-0 top-[calc(100%+10px)] z-[60] w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl"
      }
    >
      <Link href="/profile" onClick={onClose} className="flex items-center gap-3 rounded-xl p-3 hover:bg-slate-50">
        <Avatar name={username} src={avatarUrl} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold">@{username || "profile"}</div>
          <div className="text-xs text-slate-400">View profile</div>
        </div>
      </Link>
      <Link href="/resources/new" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-slate-50">
        <Plus className="h-5 w-5" /> Create resource
      </Link>
      <Link href="/drafts" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-slate-50">
        <FilePen className="h-5 w-5" /> Drafts
      </Link>
      <Link href="/archived" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-slate-50">
        <Archive className="h-5 w-5" /> Archived
      </Link>
      <Link href="/settings" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-slate-50">
        <Settings className="h-5 w-5" /> Settings (interests, blocked)
      </Link>
      {isAdmin && (
        <Link href="/admin" onClick={onClose} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold hover:bg-slate-50">
          <Shield className="h-5 w-5" /> Admin panel
        </Link>
      )}
      <button
        type="button"
        disabled={isLoading}
        onClick={onLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-semibold text-red-600 hover:bg-red-50"
      >
        <LogOut className="h-5 w-5" /> {isLoading ? "Logging out..." : "Log out"}
      </button>
    </div>
  );
}
