"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register as apiRegister } from "@/lib/api";
import { APP_NAME } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { UserPlus } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

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
      await apiRegister({ email, password });
      setSuccess("Account created! Redirecting to login...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { detail?: string | Array<{ msg: string }> } } };
      if (axiosErr.response?.status === 409) {
        setError("Email already registered");
      } else if (axiosErr.response?.status === 422) {
        const detail = axiosErr.response.data?.detail;
        if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg).join(", "));
        } else if (typeof detail === "string") {
          setError(detail);
        } else {
          setError("Validation failed. Please check your inputs.");
        }
      } else if (axiosErr.response?.data?.detail) {
        setError(typeof axiosErr.response.data.detail === "string" ? axiosErr.response.data.detail : "Registration failed");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "border-border bg-background/50 text-foreground placeholder:text-text-muted focus:border-accent focus:ring-accent/30";

  return (
    <div className="w-full max-w-md">
      <div className="mb-2 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-widest text-accent">
          {APP_NAME}
        </h2>
      </div>

      <div className="rounded-2xl border border-border bg-surface/30 p-8 shadow-2xl shadow-black/20 backdrop-blur-sm">
        <div className="mb-8 text-center">
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-text-secondary">Get started with your career journey.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              {success}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
          />

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={inputClass}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </span>
            )}
          </Button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent transition-colors hover:text-accent-light">
          Sign in
        </Link>
      </p>
    </div>
  );
}
