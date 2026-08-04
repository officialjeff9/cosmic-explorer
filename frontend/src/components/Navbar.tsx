"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const links = [
  { href: "/",            label: "Observatory" },
  { href: "/agents",      label: "Agents"      },
  { href: "/sky-map",     label: "Sky Map"     },
  { href: "/discoveries", label: "Discoveries" },
  { href: "/telemetry",   label: "Telemetry"   },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background:           "rgba(5, 5, 5, 0.75)",
        backdropFilter:       "blur(22px) saturate(180%)",
        WebkitBackdropFilter: "blur(22px) saturate(180%)",
        borderBottom:         "1px solid rgba(45, 212, 191, 0.08)",
        boxShadow:            "0 1px 0 rgba(45,212,191,0.04), 0 4px 24px rgba(0,0,0,0.6)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <span
              className="text-xl transition-all duration-300"
              style={{
                color:      "#2DD4BF",
                textShadow: "0 0 14px rgba(45,212,191,0.9)",
                filter:     "drop-shadow(0 0 6px #2DD4BF)",
              }}
            >
              ✦
            </span>
            <span className="font-mono text-sm font-semibold tracking-[0.2em] text-star-white">
              COSMIC
              <span style={{ color: "#2DD4BF", textShadow: "0 0 10px rgba(45,212,191,0.7)" }}>
                ·
              </span>
              EXPLORER
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="px-3 py-1.5 rounded-md text-xs font-medium font-mono tracking-wide transition-all duration-200"
                  style={
                    active
                      ? {
                          background:   "rgba(45,212,191,0.08)",
                          color:        "#2DD4BF",
                          border:       "1px solid rgba(45,212,191,0.30)",
                          textShadow:   "0 0 10px rgba(45,212,191,0.7)",
                          boxShadow:    "0 0 12px rgba(45,212,191,0.15), inset 0 1px 0 rgba(45,212,191,0.08)",
                        }
                      : {
                          color:  "#64748b",
                          border: "1px solid transparent",
                        }
                  }
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Status pill */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span
              className="h-2 w-2 rounded-full animate-pulse-slow"
              style={{
                background: "#4ade80",
                boxShadow:  "0 0 8px 2px rgba(74,222,128,0.7)",
              }}
            />
            <span className="hidden sm:inline"
                  style={{ color: "#4ade80", textShadow: "0 0 8px rgba(74,222,128,0.6)" }}>
              ONLINE
            </span>
          </div>

        </div>
      </div>
    </header>
  );
}
