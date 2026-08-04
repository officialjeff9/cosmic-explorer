"use client";

import { useRef, useEffect } from "react";
import { clsx } from "clsx";
import type { TelemetryEntry } from "@/hooks/useObservatorySocket";

const LEVEL_CLASS: Record<string, string> = {
  info:    "console-line info",
  success: "console-line success",
  warn:    "console-line warn",
  error:   "console-line error",
  data:    "console-line data",
};

export default function TelemetryFeed({ entries }: { entries: TelemetryEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      {/* Terminal chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5"
           style={{
             borderBottom: "1px solid rgba(255,255,255,0.06)",
             background:   "rgba(255,255,255,0.025)",
           }}>
        {/* Traffic-light dots with neon glow */}
        <span className="h-2.5 w-2.5 rounded-full"
              style={{ background: "#FF0055", boxShadow: "0 0 6px #FF005599" }} />
        <span className="h-2.5 w-2.5 rounded-full"
              style={{ background: "#fbbf24", boxShadow: "0 0 6px #fbbf2499" }} />
        <span className="h-2.5 w-2.5 rounded-full"
              style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade8099" }} />
        <span className="ml-2 font-mono text-[11px] text-slate-500">
          telescope-telemetry.log
        </span>
        <span className="ml-auto font-mono text-[10px]"
              style={{ color: "#00F0FF", textShadow: "0 0 8px rgba(0,240,255,0.6)" }}>
          {entries.length} lines
        </span>
      </div>

      {/* Log lines */}
      <div className="h-48 overflow-y-auto p-4 space-y-0.5">
        {entries.length === 0 ? (
          <p className="font-mono text-xs text-slate-600 italic">Awaiting telescope stream…</p>
        ) : (
          entries.map((e, i) => (
            <p key={i} className={clsx(LEVEL_CLASS[e.level] ?? "console-line info")}>
              <span className="text-slate-600 select-none mr-2">{e.timestamp}</span>
              <span className="text-slate-500 select-none mr-2">[{e.source}]</span>
              {e.message}
            </p>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
