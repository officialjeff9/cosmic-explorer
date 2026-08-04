"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { AgentState } from "@/components/AgentStatusCard";

// ── Types ──────────────────────────────────────────────────────────────────

export interface Discovery {
  id: string;
  name: string;
  type: "exoplanet" | "black_hole" | "galaxy" | "unknown";
  ra: number;        // Right Ascension 0-24h
  dec: number;       // Declination -90..90°
  confidence: number;
  description: string;
  detectedAt: string;
  agentId: string;
}

export interface TelemetryEntry {
  timestamp: string;
  source: string;
  level: "info" | "success" | "warn" | "error" | "data";
  message: string;
}

interface WSMessage {
  event: "agent_update" | "discovery" | "telemetry" | "snapshot";
  payload: unknown;
}

// ── Default placeholder agents ─────────────────────────────────────────────

const DEFAULT_AGENTS: AgentState[] = [
  {
    id: "coordinator",
    name: "Coordinator",
    role: "ORCHESTRATOR",
    status: "active",
    tasksCompleted: 0,
    currentTarget: null,
    confidence: 100,
    lastEvent: "System initialised. Awaiting WebSocket stream…",
    icon: "🛰️",
  },
  {
    id: "exoplanet-hunter",
    name: "Exoplanet Hunter",
    role: "TRANSIT DETECTION",
    status: "idle",
    tasksCompleted: 0,
    currentTarget: null,
    confidence: 0,
    lastEvent: "Standing by for photometry data…",
    icon: "🪐",
  },
  {
    id: "blackhole-hunter",
    name: "BH Signal Hunter",
    role: "GW / X-RAY ANALYSIS",
    status: "idle",
    tasksCompleted: 0,
    currentTarget: null,
    confidence: 0,
    lastEvent: "Standing by for gravitational wave feed…",
    icon: "🕳️",
  },
  {
    id: "galaxy-classifier",
    name: "Galaxy Classifier",
    role: "MORPHOLOGY CNN",
    status: "idle",
    tasksCompleted: 0,
    currentTarget: null,
    confidence: 0,
    lastEvent: "Standing by for imaging pipeline…",
    icon: "🌌",
  },
];

const MAX_TELEMETRY = 200;

// ── Hook ───────────────────────────────────────────────────────────────────

export function useObservatorySocket() {
  const [agents, setAgents] = useState<AgentState[]>(DEFAULT_AGENTS);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryEntry[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushTelemetry = useCallback((entry: TelemetryEntry) => {
    setTelemetry((prev) => [...prev.slice(-MAX_TELEMETRY + 1), entry]);
  }, []);

  const connect = useCallback(() => {
    const wsUrl =
      (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000") + "/ws/observatory";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        pushTelemetry({
          timestamp: new Date().toISOString().substring(11, 19),
          source: "WS",
          level: "success",
          message: "WebSocket connection established.",
        });
      };

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as WSMessage;
          switch (msg.event) {
            case "agent_update": {
              const update = msg.payload as Partial<AgentState> & { id: string };
              setAgents((prev) =>
                prev.map((a) => (a.id === update.id ? { ...a, ...update } : a))
              );
              break;
            }
            case "discovery": {
              const d = msg.payload as Discovery;
              setDiscoveries((prev) => [...prev, d]);
              pushTelemetry({
                timestamp: new Date().toISOString().substring(11, 19),
                source: "DISCOVERY",
                level: "success",
                message: `[${d.type.toUpperCase()}] ${d.name} — conf ${d.confidence}%`,
              });
              break;
            }
            case "telemetry": {
              pushTelemetry(msg.payload as TelemetryEntry);
              break;
            }
            case "snapshot": {
              const snap = msg.payload as {
                agents: AgentState[];
                discoveries: Discovery[];
              };
              setAgents(snap.agents);
              setDiscoveries(snap.discoveries);
              break;
            }
          }
        } catch {
          // Malformed message – ignore
        }
      };

      ws.onclose = () => {
        setConnected(false);
        pushTelemetry({
          timestamp: new Date().toISOString().substring(11, 19),
          source: "WS",
          level: "warn",
          message: "Connection closed. Reconnecting in 5s…",
        });
        reconnectTimer.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, 5000);
    }
  }, [pushTelemetry]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  return { agents, discoveries, telemetry, connected };
}
