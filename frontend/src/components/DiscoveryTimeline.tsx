"use client";

import { clsx } from "clsx";
import type { Discovery } from "@/hooks/useObservatorySocket";

const TYPE_ICON: Record<string, string> = {
  exoplanet:  "🪐",
  black_hole: "🕳️",
  galaxy:     "🌌",
  unknown:    "✦",
};

// Cinematic palette
const TYPE_STYLE: Record<string, { border: string; label: string; glow: string }> = {
  exoplanet:  { border: "#2DD4BF", label: "#2DD4BF", glow: "rgba(45,212,191,0.3)"  },
  black_hole: { border: "#F59E0B", label: "#F59E0B", glow: "rgba(245,158,11,0.3)"  },
  galaxy:     { border: "#4F46E5", label: "#818cf8", glow: "rgba(79,70,229,0.3)"   },
  unknown:    { border: "#475569", label: "#64748b", glow: "transparent"             },
};

export default function DiscoveryTimeline({ discoveries }: { discoveries: Discovery[] }) {
  const sorted = [...discoveries].reverse().slice(0, 15);

  return (
    <div className="glass-panel rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b"
           style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        <p className="font-mono text-[11px] tracking-widest uppercase"
           style={{ color: "#2DD4BF", textShadow: "0 0 10px rgba(45,212,191,0.5)" }}>
          ◈ Recent Detections
        </p>
        <p className="font-mono text-[10px] text-slate-600 mt-0.5">
          {discoveries.length} total objects catalogued
        </p>
      </div>

      <div className="overflow-y-auto flex-1 max-h-[360px]">
        {sorted.length === 0 ? (
          <p className="p-4 text-xs font-mono text-slate-600 italic">
            Awaiting agent detections…
          </p>
        ) : (
          sorted.map((d) => {
            const style = TYPE_STYLE[d.type] ?? TYPE_STYLE.unknown;
            return (
              <div
                key={d.id}
                className="flex items-start gap-3 px-4 py-3 transition-colors"
                style={{
                  borderLeft: `2px solid ${style.border}`,
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden="true">
                  {TYPE_ICON[d.type] ?? TYPE_ICON.unknown}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-star-white truncate"
                     style={{ textShadow: `0 0 10px ${style.glow}` }}>
                    {d.name}
                  </p>
                  <p className="text-[11px] font-mono mt-0.5" style={{ color: style.label, opacity: 0.75 }}>
                    RA {d.ra.toFixed(2)}h · Dec {d.dec.toFixed(2)}° · conf {d.confidence}%
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{d.description}</p>
                </div>
                <p className="text-[10px] font-mono text-slate-600 whitespace-nowrap shrink-0 mt-0.5">
                  {d.detectedAt}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
