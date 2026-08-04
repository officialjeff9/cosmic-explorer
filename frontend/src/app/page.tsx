"use client";

import { useEffect, useState } from "react";
import AgentStatusCard from "@/components/AgentStatusCard";
import TelemetryFeed from "@/components/TelemetryFeed";
import DiscoveryTimeline from "@/components/DiscoveryTimeline";
import SkyMapMini from "@/components/SkyMapMini";
import { useObservatorySocket } from "@/hooks/useObservatorySocket";

export default function ObservatoryPage() {
  const { agents, discoveries, telemetry, connected } = useObservatorySocket();
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setUptime((u) => u + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${ss}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero header */}
      <div className="text-center space-y-3">
        <p className="font-mono text-xs tracking-[0.3em] uppercase"
           style={{ color: "#2DD4BF", textShadow: "0 0 10px rgba(45,212,191,0.5)" }}>
          Deep Space Multi-Agent System
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight glow-text">
          Cosmic Explorer
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Autonomous AI agents scanning deep-space telescope feeds for exoplanets,
          black hole signals, and galaxy morphology in real time.
        </p>

        {/* System stats bar */}
        <div className="flex flex-wrap justify-center gap-6 pt-2 font-mono text-xs text-slate-500">
          <span>
            UPTIME <span className="text-star-white">{fmt(uptime)}</span>
          </span>
          <span>
            WS{" "}
            <span className={connected ? "text-green-400" : "text-red-400"}>
              {connected ? "CONNECTED" : "DISCONNECTED"}
            </span>
          </span>
          <span>
            AGENTS ACTIVE{" "}
            <span style={{ color: "#2DD4BF" }}>
              {agents.filter((a) => a.status === "active").length}/{agents.length}
            </span>
          </span>
          <span>
            DISCOVERIES{" "}
            <span className="text-star-yellow">{discoveries.length}</span>
          </span>
        </div>
      </div>

      {/* Agent cards grid */}
      <section>
        <h2 className="font-mono text-xs tracking-widest text-slate-500 uppercase mb-4">
          ── Agent Fleet
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentStatusCard key={agent.id} agent={agent} />
          ))}
        </div>
      </section>

      {/* Main panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sky map occupies 2 cols */}
        <div className="lg:col-span-2">
          <h2 className="font-mono text-xs tracking-widest text-slate-500 uppercase mb-4">
            ── Live Sky Map
          </h2>
          <SkyMapMini discoveries={discoveries} />
        </div>

        {/* Discovery timeline */}
        <div>
          <h2 className="font-mono text-xs tracking-widest text-slate-500 uppercase mb-4">
            ── Discovery Feed
          </h2>
          <DiscoveryTimeline discoveries={discoveries} />
        </div>
      </div>

      {/* Telemetry feed */}
      <section>
        <h2 className="font-mono text-xs tracking-widest text-slate-500 uppercase mb-4">
          ── Telescope Telemetry
        </h2>
        <TelemetryFeed entries={telemetry} />
      </section>
    </div>
  );
}
