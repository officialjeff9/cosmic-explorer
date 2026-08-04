import type { Metadata } from "next";
import "./globals.css";
import StarfieldCanvas from "@/components/StarfieldCanvas";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Cosmic Explorer — Multi-Agent System",
  description:
    "Real-time multi-agent deep-space platform: exoplanet hunting, black hole signal detection, and galaxy classification powered by AI agents.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-starfield text-star-white antialiased">
        <StarfieldCanvas />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/5 py-4 text-center text-xs text-slate-600 font-mono">
            COSMIC-EXPLORER · Deep Space Multi-Agent System v0.1.0
          </footer>
        </div>
      </body>
    </html>
  );
}
