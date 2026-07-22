"use client";

import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

function LoginContent() {
  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
