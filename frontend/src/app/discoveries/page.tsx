"use client";

import { useObservatorySocket } from "@/hooks/useObservatorySocket";
import DiscoveryTimeline from "@/components/DiscoveryTimeline";

export default function DiscoveriesPage() {
  const { discoveries } = useObservatorySocket();

  const counts = discoveries.reduce(
    (acc, d) => {
      acc[d.type] = (acc[d.type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const stats = [
    { label: "Exoplanets",   value: counts.exoplanet  ?? 0, color: "text-star-yellow" },
    { label: "Black Holes",  value: counts.black_hole ?? 0, color: "text-red-400" },
    { label: "Galaxies",     value: counts.galaxy     ?? 0, color: "text-nebula-purple" },
    { label: "Unclassified", value: counts.unknown    ?? 0, color: "text-slate-400" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <p className="font-mono text-xs text-nebula-cyan tracking-[0.3em] uppercase mb-1">
          Catalogue
        </p>
        <h1 className="text-3xl font-bold text-star-white">Discoveries</h1>
        <p className="text-slate-400 text-sm mt-1">
          All objects confirmed by agent consensus with confidence ≥ 70%.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/5 bg-cosmos-900/80 p-4 text-center"
          >
            <p className={`font-mono text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 font-mono mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <DiscoveryTimeline discoveries={discoveries} />
    </div>
  );
}
