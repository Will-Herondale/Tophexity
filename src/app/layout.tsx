import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tophexity - Find Your Perfect Career",
  description: "AI-powered career recommendations based on your unique profile, skills, interests, and goals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var d=document.documentElement;try{var t=JSON.parse(localStorage.getItem("tophexity_settings")||"{}").theme;var dk=t==="dark"||(t!=="light"&&(t==="system"||!t)&&window.matchMedia("(prefers-color-scheme:dark)").matches);d.classList.add(dk?"dark":"light");d.style.background=dk?"#0a0a0f":"#f8f9fc"}catch(e){d.classList.add("dark");d.style.background="#0a0a0f"}})()`,
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
