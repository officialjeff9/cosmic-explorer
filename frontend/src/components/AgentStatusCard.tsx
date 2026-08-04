"use client";

import { clsx } from "clsx";

export interface AgentState {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "processing" | "alert";
  tasksCompleted: number;
  currentTarget: string | null;
  confidence: number;
  lastEvent: string;
  icon: string;
}

// Maps to the CSS modifier classes defined in globals.css
const statusCardClass: Record<AgentState["status"], string> = {
  active:     "agent-card--active",
  idle:       "agent-card--idle",
  processing: "agent-card--processing",
  alert:      "agent-card--alert",
};

const badgeClass: Record<AgentState["status"], string> = {
  active:     "badge-active",
  idle:       "badge-idle",
  processing: "badge-processing",
  alert:      "badge-alert",
};

// Colour for the confidence bar gradient stop — cinematic palette
const barColor: Record<AgentState["status"], string> = {
  active:     "#4ade80",
  idle:       "#475569",
  processing: "#7c3aed",
  alert:      "#F59E0B",   // Accretion Disk Gold for alert state
};

export default function AgentStatusCard({ agent }: { agent: AgentState }) {
  return (
    <div className={clsx("agent-card transition-all duration-300", statusCardClass[agent.status])}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <span className="text-2xl" aria-hidden="true">{agent.icon}</span>
          <h3 className="font-semibold text-sm text-star-white mt-1">{agent.name}</h3>
          <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
            {agent.role}
          </p>
        </div>
        <span className={badgeClass[agent.status]}>
          {agent.status.toUpperCase()}
        </span>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-slate-500">Confidence</span>
          <span style={{ color: barColor[agent.status], textShadow: `0 0 8px ${barColor[agent.status]}99` }}>
            {agent.confidence}%
          </span>
        </div>
        {/* Track */}
        <div className="h-1.5 rounded-full overflow-hidden"
             style={{ background: "rgba(255,255,255,0.05)" }}>
          {/* Fill — colour matches status */}
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${agent.confidence}%`,
              background: `linear-gradient(90deg, ${barColor[agent.status]}88, ${barColor[agent.status]})`,
              boxShadow: `0 0 8px 1px ${barColor[agent.status]}66`,
            }}
          />
        </div>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="rounded-md px-2 py-1.5"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Tasks</p>
          <p className="text-star-white font-medium mt-0.5">{agent.tasksCompleted}</p>
        </div>
        <div className="rounded-md px-2 py-1.5"
             style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <p className="text-slate-500 text-[10px] uppercase tracking-wider">Target</p>
          <p className="text-star-white font-medium truncate mt-0.5">
            {agent.currentTarget ?? "—"}
          </p>
        </div>
      </div>

      {/* Last event */}
      <p className="mt-3 text-[11px] font-mono text-slate-500 line-clamp-2 leading-relaxed">
        {agent.lastEvent}
      </p>
    </div>
  );
}
