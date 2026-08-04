"use client";

import { useObservatorySocket } from "@/hooks/useObservatorySocket";
import TelemetryFeed from "@/components/TelemetryFeed";

export default function TelemetryPage() {
  const { telemetry, connected } = useObservatorySocket();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-nebula-cyan tracking-[0.3em] uppercase mb-1">
            Instruments
          </p>
          <h1 className="text-3xl font-bold text-star-white">Telescope Telemetry</h1>
          <p className="text-slate-400 text-sm mt-1">
            Live stream from the simulated telescope pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-green-400 animate-pulse-slow" : "bg-red-500"
            }`}
          />
          <span className={connected ? "text-green-400" : "text-red-400"}>
            {connected ? "STREAMING" : "OFFLINE"}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-cosmos-950/80 overflow-hidden">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-cosmos-900/60">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
          <span className="ml-2 font-mono text-[11px] text-slate-500">
            /var/log/telescope/stream.log — {telemetry.length} entries
          </span>
        </div>

        {/* Full-height scrollable log */}
        <div className="h-[60vh] overflow-y-auto p-4 space-y-0.5 font-mono text-xs">
          {telemetry.length === 0 ? (
            <p className="text-slate-600">Awaiting stream…</p>
          ) : (
            telemetry.map((e, i) => (
              <p
                key={i}
                className={`console-line ${e.level === "error" ? "error" : e.level === "warn" ? "warn" : e.level === "success" ? "success" : e.level === "data" ? "data" : "info"}`}
              >
                <span className="text-slate-600 select-none mr-2">{e.timestamp}</span>
                <span className="text-slate-500 select-none mr-2">[{e.source}]</span>
                {e.message}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
