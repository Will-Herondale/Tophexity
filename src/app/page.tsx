"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  ArrowRight, Target, BarChart3, Map, Compass,
  Brain, TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <nav className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">CareerPath AI</h1>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h2 className="text-5xl font-bold leading-tight text-gray-900 dark:text-gray-100">
          Find Your <span className="text-indigo-600 dark:text-indigo-400">Perfect Career</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
          AI-powered career recommendations based on your unique profile, skills, interests, and goals.
          Get a personalized roadmap to your dream career.
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href={user ? "/profile" : "/register"}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-md hover:bg-indigo-700"
          >
            Start Your Journey
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              icon: <Compass className="h-6 w-6" />,
              title: "Discover Careers",
              desc: "Get personalized career recommendations scored by match percentage based on your complete profile.",
            },
            {
              icon: <Brain className="h-6 w-6" />,
              title: "AI Analysis",
              desc: "Our AI analyzes your skills, personality, interests, and goals to find careers that truly fit you.",
            },
            {
              icon: <TrendingUp className="h-6 w-6" />,
              title: "Detailed Roadmap",
              desc: "Get timelines, required skills, colleges, exams, scholarships, and backup plans for each career.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                {f.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="text-center text-xl font-bold text-gray-900 dark:text-gray-100">How It Works</h3>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              { step: "1", icon: <Target className="h-5 w-5" />, title: "Build Profile", desc: "Share your academics, skills, interests, and goals" },
              { step: "2", icon: <Brain className="h-5 w-5" />, title: "AI Analysis", desc: "Our AI matches you with the best career options" },
              { step: "3", icon: <BarChart3 className="h-5 w-5" />, title: "Compare", desc: "Compare top career recommendations side by side" },
              { step: "4", icon: <Map className="h-5 w-5" />, title: "Get Roadmap", desc: "Follow a step-by-step plan to reach your goals" },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-sm">
                  {s.step}
                </div>
                <div className="mx-auto mt-3 flex h-8 w-8 items-center justify-center text-indigo-600 dark:text-indigo-400">
                  {s.icon}
                </div>
                <h4 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">{s.title}</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-200 bg-white py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
        CareerPath AI &mdash; Powered by AI, Built for Your Future
      </footer>
    </div>
  );
}
