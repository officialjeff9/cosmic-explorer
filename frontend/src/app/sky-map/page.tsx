"use client";

import { useObservatorySocket } from "@/hooks/useObservatorySocket";
import SkyMapMini from "@/components/SkyMapMini";

export default function SkyMapPage() {
  const { discoveries } = useObservatorySocket();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <p className="font-mono text-xs text-nebula-cyan tracking-[0.3em] uppercase mb-1">
          Celestial Chart
        </p>
        <h1 className="text-3xl font-bold text-star-white">Interactive Sky Map</h1>
        <p className="text-slate-400 text-sm mt-1">
          Full-sky projection (RA/Dec) showing all agent-confirmed detections.
        </p>
      </div>

      <SkyMapMini discoveries={discoveries} />

      {/* Discovery table */}
      <div className="rounded-xl border border-white/5 overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead className="bg-cosmos-900/80 text-slate-500 border-b border-white/5">
            <tr>
              {["Name", "Type", "RA (h)", "Dec (°)", "Conf (%)", "Agent", "Detected"].map(
                (h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-medium">
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-cosmos-950/60">
            {discoveries.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-600">
                  No discoveries logged yet.
                </td>
              </tr>
            ) : (
              discoveries.map((d) => (
                <tr key={d.id} className="hover:bg-white/3 transition-colors">
                  <td className="px-4 py-2 text-star-white font-semibold">{d.name}</td>
                  <td className="px-4 py-2 text-slate-300">{d.type}</td>
                  <td className="px-4 py-2 text-nebula-cyan">{d.ra.toFixed(4)}</td>
                  <td className="px-4 py-2 text-nebula-cyan">{d.dec.toFixed(4)}</td>
                  <td className="px-4 py-2 text-star-yellow">{d.confidence}</td>
                  <td className="px-4 py-2 text-slate-400">{d.agentId}</td>
                  <td className="px-4 py-2 text-slate-500">{d.detectedAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
