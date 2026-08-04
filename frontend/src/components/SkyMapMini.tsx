"use client";

import { useRef, useEffect, useMemo } from "react";
import type { Discovery } from "@/hooks/useObservatorySocket";

// ── Cinematic palette ──────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  exoplanet:  "#2DD4BF",   // Bioluminescent Mint/Teal
  black_hole: "#F59E0B",   // Accretion Disk Gold/Amber
  galaxy:     "#4F46E5",   // Deep Indigo/Nebula Blue
  unknown:    "#64748b",   // Muted slate
};

// ── Legend metadata ────────────────────────────────────────────────────────
const LEGEND_LABELS: Record<string, string> = {
  exoplanet:  "Exoplanet",
  black_hole: "Black Hole",
  galaxy:     "Galaxy",
  unknown:    "Unknown",
};

// ── How many most-recent exoplanets get radar rings ────────────────────────
const RADAR_COUNT = 5;

// ── Deterministic pseudo-random helper ────────────────────────────────────
const seed = (n: number) => ((Math.sin(n) * 43758.5453) % 1 + 1) / 2;

// ── Canvas dimensions (intrinsic, scaled by CSS) ──────────────────────────
const W = 780;
const H = 340;

export default function SkyMapMini({ discoveries }: { discoveries: Discovery[] }) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const rafRef      = useRef<number>(0);
  const tickRef     = useRef<number>(0);

  // Split discoveries into typed groups once per render
  const { exoplanets, blackHoles, others } = useMemo(() => {
    const exoplanets:  Discovery[] = [];
    const blackHoles:  Discovery[] = [];
    const others:      Discovery[] = [];
    discoveries.forEach(d => {
      if (d.type === "exoplanet")  exoplanets.push(d);
      else if (d.type === "black_hole") blackHoles.push(d);
      else others.push(d);
    });
    return { exoplanets, blackHoles, others };
  }, [discoveries]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── coordinate helper ─────────────────────────────────────
    const toXY = (d: Discovery) => ({
      x: (d.ra / 24) * W,
      y: ((90 - d.dec) / 180) * H,
    });

    // ── static background layer (painted once) ────────────────
    const bg = document.createElement("canvas");
    bg.width = W; bg.height = H;
    const bgCtx = bg.getContext("2d")!;

    // Deep black fill
    bgCtx.fillStyle = "#050505";
    bgCtx.fillRect(0, 0, W, H);

    // Subtle deep-indigo nebula vignette
    const nebula = bgCtx.createRadialGradient(W * 0.35, H * 0.45, 0, W * 0.35, H * 0.45, W * 0.65);
    nebula.addColorStop(0,   "rgba(45,30,120,0.12)");
    nebula.addColorStop(0.5, "rgba(20,15,70,0.05)");
    nebula.addColorStop(1,   "transparent");
    bgCtx.fillStyle = nebula;
    bgCtx.fillRect(0, 0, W, H);

    // Grid lines — very dim
    bgCtx.strokeStyle = "rgba(255,255,255,0.035)";
    bgCtx.lineWidth = 0.5;
    for (let x = 0; x <= W; x += W / 12) {
      bgCtx.beginPath(); bgCtx.moveTo(x, 0); bgCtx.lineTo(x, H); bgCtx.stroke();
    }
    for (let y = 0; y <= H; y += H / 6) {
      bgCtx.beginPath(); bgCtx.moveTo(0, y); bgCtx.lineTo(W, y); bgCtx.stroke();
    }

    // Axis tick labels
    bgCtx.fillStyle = "rgba(255,255,255,0.10)";
    bgCtx.font = "9px JetBrains Mono, monospace";
    for (let i = 0; i <= 12; i++) bgCtx.fillText(`${i * 2}h`, (i * W) / 12 + 2, H - 4);
    for (let i = 0; i <= 6;  i++) bgCtx.fillText(`${90 - i * 30}°`, 3, (i * H) / 6 + 10);

    // Background stars (deterministic)
    for (let i = 0; i < 240; i++) {
      const sx = seed(i * 7.3) * W;
      const sy = seed(i * 3.7) * H;
      const sr = seed(i * 1.1) * 0.9 + 0.15;
      const sa = seed(i * 2.2) * 0.55 + 0.08;
      bgCtx.beginPath();
      bgCtx.arc(sx, sy, sr, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(240,244,255,${sa.toFixed(2)})`;
      bgCtx.fill();
    }

    // ── animation loop ────────────────────────────────────────
    const RADAR_PERIOD = 1.8;   // seconds per radar ring cycle
    const BH_PERIOD    = 2.4;   // seconds per BH halo cycle

    const draw = (now: number) => {
      tickRef.current = now / 1000;  // seconds
      const t = tickRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(bg, 0, 0);

      // ── others (galaxy / unknown) ─────────────────────────
      others.forEach(d => {
        const { x, y } = toXY(d);
        const color = TYPE_COLORS[d.type] ?? TYPE_COLORS.unknown;

        // Soft radial glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, 12);
        grd.addColorStop(0, color + "55");
        grd.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = color + "cc";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.fillText(d.name, x + 6, y - 4);
      });

      // ── exoplanets — Electric Cyan with radar pings ───────
      const radarTargets = exoplanets.slice(-RADAR_COUNT);

      exoplanets.forEach(d => {
        const { x, y } = toXY(d);
        const isRadar = radarTargets.includes(d);

        // Outer atmosphere glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, isRadar ? 20 : 14);
        grd.addColorStop(0,   "rgba(45,212,191,0.28)");
        grd.addColorStop(0.5, "rgba(45,212,191,0.07)");
        grd.addColorStop(1,   "transparent");
        ctx.beginPath();
        ctx.arc(x, y, isRadar ? 20 : 14, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        // Radar concentric rings (3 rings, staggered phase)
        if (isRadar) {
          for (let ring = 0; ring < 3; ring++) {
            const phase = ((t / RADAR_PERIOD) + ring * 0.37) % 1;
            const radius   = 6  + phase * 34;           // 6 → 40 px
            const opacity  = (1 - phase) * 0.75;

            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(45,212,191,${opacity.toFixed(3)})`;
            ctx.lineWidth   = 1.2 * (1 - phase * 0.5);
            ctx.stroke();
          }
        }

        // Core bright dot with inner spark
        ctx.save();
        ctx.shadowColor = "#2DD4BF";
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#2DD4BF";
        ctx.fill();
        // Specular highlight
        ctx.beginPath();
        ctx.arc(x - 1.2, y - 1.2, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fill();
        ctx.restore();

        // Label
        ctx.fillStyle = "#2DD4BFcc";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.fillText(d.name, x + 6, y - 5);
      });

      // ── black holes — gravitational anomaly with warped halo
      blackHoles.forEach(d => {
        const { x, y } = toXY(d);
        const bhPhase = (t / BH_PERIOD) % 1;

        // Outer distortion field — 35% smaller radii, amber colour
        // baseR was 12/19/26; now 8/13/18 (~35% reduction)
        for (let ring = 0; ring < 3; ring++) {
          const baseR   = 8 + ring * 5;
          const shimmer = Math.sin(t * 2.8 + ring * 2.1) * 1.2;
          const alpha   = (0.55 - ring * 0.15) *
                          (0.75 + 0.25 * Math.sin(t * (1.8 + ring * 0.4)));

          const haloGrd = ctx.createRadialGradient(x, y, baseR - 1.5, x, y, baseR + shimmer + 2);
          haloGrd.addColorStop(0,   `rgba(245,158,11,${(alpha * 0.9).toFixed(3)})`);
          haloGrd.addColorStop(0.6, `rgba(180,110,0,${(alpha * 0.4).toFixed(3)})`);
          haloGrd.addColorStop(1,   "transparent");

          ctx.beginPath();
          ctx.arc(x, y, baseR + shimmer + 3, 0, Math.PI * 2);
          ctx.fillStyle = haloGrd;
          ctx.fill();
        }

        // Pulsing outer ring stroke — radius was 14, now 9
        const ringAlpha = 0.5 + 0.4 * Math.sin(t * Math.PI * 2 / BH_PERIOD);
        ctx.beginPath();
        ctx.arc(x, y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245,158,11,${ringAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Central void — pure black disk (was 5.5, now 3.5)
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = "#000000";
        ctx.fill();

        // Thin accretion ring edge on void
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(245,158,11,0.85)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.fillStyle = "#F59E0Bcc";
        ctx.font = "9px JetBrains Mono, monospace";
        ctx.fillText(d.name, x + 6, y - 5);
      });

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(rafRef.current);
  }, [exoplanets, blackHoles, others]);

  return (
    <div className="relative rounded-xl overflow-hidden glass-panel">
      {/* Axis labels */}
      <div className="absolute top-2 left-3 font-mono text-[10px] text-slate-600 pointer-events-none z-10">
        RA →
      </div>
      <div className="absolute top-2 right-3 font-mono text-[10px] text-slate-600 pointer-events-none z-10">
        Dec ↑
      </div>

      {/* The animated canvas */}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto block"
        aria-label="Sky map showing discovered celestial objects"
      />

      {/* Legend — glassmorphism bar */}
      <div className="flex flex-wrap gap-5 px-4 py-3 border-t border-white/5"
           style={{ background: "rgba(0,0,8,0.70)", backdropFilter: "blur(12px)" }}>
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2 text-xs font-mono"
               style={{ color }}>
            {/* Swatch with matching glow */}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: color,
                boxShadow: `0 0 6px 2px ${color}88`,
              }}
            />
            <span style={{ textShadow: `0 0 8px ${color}77` }}>
              {LEGEND_LABELS[type]}
            </span>
          </div>
        ))}
        {/* Total count */}
        <div className="ml-auto font-mono text-[10px] text-slate-600">
          {discoveries.length} objects
        </div>
      </div>
    </div>
  );
}
