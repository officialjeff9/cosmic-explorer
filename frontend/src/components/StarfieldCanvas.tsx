"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  delta: number;
  speed: number;
}

export default function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const stars: Star[] = [];
    const STAR_COUNT = 320;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const init = () => {
      stars.length = 0;
      for (let i = 0; i < STAR_COUNT; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.6 + 0.2,
          alpha: Math.random(),
          delta: (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1),
          speed: Math.random() * 0.08 + 0.01,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Nebula gradient overlay
      const nebula = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.4, 0,
        canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.6
      );
      nebula.addColorStop(0, "rgba(124,58,237,0.05)");
      nebula.addColorStop(0.5, "rgba(37,99,235,0.03)");
      nebula.addColorStop(1, "transparent");
      ctx.fillStyle = nebula;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      for (const star of stars) {
        star.alpha += star.delta;
        if (star.alpha <= 0 || star.alpha >= 1) star.delta *= -1;
        star.y += star.speed;
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,244,255,${star.alpha.toFixed(2)})`;
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    init();
    draw();

    window.addEventListener("resize", () => { resize(); init(); });
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      id="starfield-canvas"
      ref={canvasRef}
      aria-hidden="true"
    />
  );
}
