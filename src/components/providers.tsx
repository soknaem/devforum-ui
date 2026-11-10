"use client";

import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import { store } from "@/store";
import { useMeQuery } from "@/lib/api";
import { setUser } from "@/features/auth/authSlice";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

function AuthHydrator({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useDispatch();

  const {
    data,
    isSuccess,
    isError,
  } = useMeQuery();

  useEffect(() => {
    if (isSuccess && data?.data) {
      dispatch(
        setUser({
          id: Number(data.data.id),
          username: data.data.username,
          email: data.data.email || "",
          followerCount: data.data.followerCount ?? 0,
          followingCount: data.data.followingCount ?? 0,
          resourceCount: data.data.resourceCount ?? 0,
          joinedAt: data.data.joinedAt ?? "",
        }),
      );
    } else if (isError) {
      dispatch(setUser(null));
    }
  }, [
    isSuccess,
    isError,
    data,
    dispatch,
  ]);

  return <>{children}</>;
}

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <ToastProvider>
          <AuthHydrator>
            {children}
          </AuthHydrator>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  );
}