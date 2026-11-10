"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2 } from "lucide-react";

import { useResetPasswordMutation } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { useToast } from "@/components/ui/Toast";

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";
  const { toast } = useToast();
  const [reset, { isLoading }] = useResetPasswordMutation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [problem, setProblem] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setProblem(null);

    if (password.length < 6) return setProblem("Use at least 6 characters.");
    if (password !== confirm) return setProblem("The two passwords do not match.");

    try {
      await reset({ token, newPassword: password }).unwrap();
      toast("Password changed. Please sign in.", "success");
      router.replace("/login");
    } catch {
      setProblem("This reset link is invalid or has expired. Ask for a new one.");
    }
  }

  if (!token) {
    return (
      <AuthShell title="Link not valid">
        <p className="text-sm text-slate-500">This page needs the link from your reset e-mail.</p>
        <Link href="/forgot-password" className="mt-6 block text-center text-sm font-bold text-blue-600">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you have not used before.">
      <form onSubmit={submit} className="space-y-4">
        <label className="field">
          New password
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        <label className="field">
          Repeat the new password
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>

        {problem && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {problem}{" "}
            {problem.includes("expired") && (
              <Link href="/forgot-password" className="font-bold underline">
                Request a new link
              </Link>
            )}
          </p>
        )}

        <button type="submit" disabled={isLoading} className="button-primary flex w-full items-center justify-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Change password
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
