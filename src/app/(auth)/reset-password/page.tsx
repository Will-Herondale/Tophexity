"use client";

import { useState, type FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Lock, CheckCircle2, Eye, EyeOff, AlertCircle } from "lucide-react";

function ResetPasswordContent() {
  usePageTitle("Reset Password");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosErr.response?.status === 400) {
        setError("Invalid or expired reset token. Please request a new one.");
      } else {
        setError(axiosErr?.response?.data?.detail || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
            <AlertCircle className="h-7 w-7 text-red-400" />
          </div>
          <h1 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-foreground">Invalid reset link</h1>
          <p className="mb-6 text-sm text-text-secondary">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="text-sm font-medium text-accent hover:text-accent-light">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-2 text-center">
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-widest text-accent">
            {APP_NAME}
          </h2>
        </div>

        <div className="rounded-2xl border border-border bg-surface/30 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>
              <h1 className="mb-2 font-[family-name:var(--font-display)] text-xl font-bold text-foreground">Password reset!</h1>
              <p className="text-sm text-text-secondary">Redirecting to sign in...</p>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center">
                <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">Reset your password</h1>
                <p className="mt-2 text-sm text-text-secondary">Choose a new password for your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    className="border-border bg-background/50 text-foreground placeholder:text-text-muted focus:border-accent focus:ring-accent/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] text-text-muted hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <Input
                  label="Confirm New Password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="border-border bg-background/50 text-foreground placeholder:text-text-muted focus:border-accent focus:ring-accent/30"
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Reset Password
                    </span>
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-border-light border-t-accent" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
