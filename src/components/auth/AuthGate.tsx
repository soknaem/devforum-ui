"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMeQuery } from "@/lib/api";
import { setUser } from "@/features/auth/authSlice";
import { useDispatch } from "react-redux";

export function AuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useDispatch();

  const {
    data,
    isLoading,
    isError,
  } = useMeQuery();

  useEffect(() => {
    if (data?.data) {
      dispatch(
        setUser({
          id: Number(data.data.id),
          username: data.data.username,
          email: data.data.email || "",

          followerCount: data.data.followerCount ?? 0,
          followingCount: data.data.followingCount ?? 0,
          resourceCount: data.data.resourceCount ?? 0,
          joinedAt: data.data.joinedAt ?? "",
        })
      );
    }

    if (isError) {
      dispatch(setUser(null));

      const next =
        pathname && pathname !== "/"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";

      router.replace(`/login${next}`);
    }
  }, [
    data,
    isError,
    pathname,
    router,
    dispatch,
  ]);

  if (
    isLoading ||
    isError ||
    !data?.data
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return <>{children}</>;
}