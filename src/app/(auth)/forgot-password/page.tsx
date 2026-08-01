"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  usePageTitle("Forgot Password");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-2 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-widest text-accent">
            {APP_NAME}
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-surface/30 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h1 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-foreground">Check your email</h1>
              <p className="mb-6 text-sm text-text-secondary">
                If an account with <strong className="text-foreground">{email}</strong> exists, we&apos;ve sent a password reset link.
              </p>
              <Link href="/login" className="text-sm font-medium text-accent hover:text-accent-light transition-colors">
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Forgot password?</h1>
                <p className="mt-2 text-sm text-text-secondary">Enter your email and we&apos;ll send you a reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="border-border bg-background/50 text-foreground placeholder:text-text-muted focus:border-accent focus:ring-accent/30"
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Send Reset Link
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary">
          <Link href="/login" className="inline-flex items-center gap-1 font-medium text-accent hover:text-accent-light transition-colors">
            <ArrowLeft className="h-3 w-3" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
