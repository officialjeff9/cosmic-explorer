"use client";

import { useObservatorySocket } from "@/hooks/useObservatorySocket";
import AgentStatusCard from "@/components/AgentStatusCard";

export default function AgentsPage() {
  const { agents, discoveries } = useObservatorySocket();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <p className="font-mono text-xs text-nebula-cyan tracking-[0.3em] uppercase mb-1">
          Fleet Overview
        </p>
        <h1 className="text-3xl font-bold text-star-white">Agent Control Panel</h1>
        <p className="text-slate-400 text-sm mt-1">
          Real-time status and metrics for each autonomous observation agent.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {agents.map((agent) => (
          <AgentStatusCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Per-agent discovery breakdown */}
      <section>
        <h2 className="font-mono text-xs tracking-widest text-slate-500 uppercase mb-4">
          ── Agent Discovery Breakdown
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {agents.map((agent) => {
            const agentDiscoveries = discoveries.filter(
              (d) => d.agentId === agent.id
            );
            return (
              <div
                key={agent.id}
                className="rounded-xl border border-white/5 bg-cosmos-900/80 p-4"
              >
                <p className="text-sm font-semibold text-star-white mb-1">
                  {agent.icon} {agent.name}
                </p>
                <p className="font-mono text-2xl text-nebula-cyan font-bold">
                  {agentDiscoveries.length}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">detections</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
