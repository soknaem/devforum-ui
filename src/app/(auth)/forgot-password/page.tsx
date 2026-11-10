"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import { useForgotPasswordMutation } from "@/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [forgot, { isLoading, isError }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const result = await forgot({ email: email.trim() });
    // The API answers the same whether or not the e-mail exists, so we do too.
    if ("data" in result) setSent(true);
  }

  if (sent) {
    return (
      <AuthShell title="Check your e-mail">
        <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>
            If <b>{email}</b> is registered, we sent a link to reset the password. It works once and expires
            in 30 minutes.
          </p>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Nothing arrived? Check the spam folder, wait a minute, and try again.
        </p>
        <Link href="/login" className="mt-6 block text-center text-sm font-bold text-blue-600">
          Back to sign in
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter the e-mail of your account and we will send you a link to choose a new one."
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="field">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </label>

        {isError && (
          <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            Something went wrong. Check the e-mail address and try again.
          </p>
        )}

        <button type="submit" disabled={isLoading} className="button-primary flex w-full items-center justify-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset link
        </button>

        <Link href="/login" className="block text-center text-sm font-bold text-blue-600">
          Back to sign in
        </Link>
      </form>
    </AuthShell>
  );
}
