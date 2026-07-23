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
      className={`${spaceGrotesk.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=JSON.parse(localStorage.getItem("tophexity_settings")||"{}").theme;if(t==="dark"){document.documentElement.classList.add("dark")}else if(t==="light"){document.documentElement.classList.add("light")}else if(t==="system"||!t){if(window.matchMedia("(prefers-color-scheme:dark)").matches){document.documentElement.classList.add("dark")}else{document.documentElement.classList.add("light")}}}catch(e){document.documentElement.classList.add("dark")}})()`,
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
