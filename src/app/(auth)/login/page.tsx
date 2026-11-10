"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useLoginMutation, useMeQuery } from "@/lib/api";
import { Loader2, ShieldCheck } from "lucide-react";


function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [login, { isLoading, error }] = useLoginMutation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useMeQuery();

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    const result = await login({
      username,
      password,
    });

    if ("data" in result) {
      const next = params.get("next");

      router.replace(next || "/");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-4">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">
        {/* Left panel */}
        <div className="hidden bg-gradient-to-br from-blue-700 to-indigo-800 p-10 text-white md:block">
          <div className="text-2xl font-black">
            DevForum
          </div>

          <h1 className="mt-24 text-4xl font-black leading-tight">
            A better place to build in public.
          </h1>

          <p className="mt-4 leading-7 text-blue-100">
            Share knowledge, discover developer resources,
            follow people and join discussions.
          </p>

          <div className="mt-10 flex items-center gap-2 text-sm text-blue-100">
            <ShieldCheck className="h-5 w-5" />

            JWT authentication stays in an HttpOnly cookie.
          </div>
        </div>

        {/* Login form */}
        <div className="p-7 sm:p-10">
          <div className="text-2xl font-black text-blue-600 md:hidden">
            DevForum
          </div>

          <h2 className="mt-5 text-3xl font-black">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Sign in to continue to your community.
          </p>

          <form
            className="mt-7 space-y-4"
            onSubmit={handleSubmit}
          >
            <label className="field">
              Username

              <input
                autoComplete="username"
                required
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                placeholder="your username"
              />
            </label>

            <label className="field">
              Password

              <input
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="••••••••"
              />
            </label>

            <div className="-mt-1 text-right">
              <Link href="/forgot-password" className="text-sm font-bold text-blue-600">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {"status" in error && error.status === 403
                  ? "This account has been suspended. Contact an administrator."
                  : "Login failed. Please check your username and password."}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="button-primary flex w-full items-center justify-center gap-2"
            >
              {isLoading && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {isLoading
                ? "Signing in..."
                : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm text-slate-500">
            New here?{" "}
            <Link
              className="font-semibold text-blue-600"
              href="/register"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function LoginLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-4">
      <div className="flex items-center justify-center rounded-3xl bg-white p-10 shadow-2xl">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    </main>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}