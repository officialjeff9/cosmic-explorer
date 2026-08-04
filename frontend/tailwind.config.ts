/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          950: "#050505",
          900: "#080510",
          800: "#0a0820",
          700: "#0f0a35",
          600: "#160e50",
        },
        nebula: {
          purple: "#7c3aed",
          blue:   "#2563eb",
          cyan:   "#06b6d4",
          pink:   "#db2777",
        },
        // Cinematic palette
        neon: {
          mint:  "#2DD4BF",   // exoplanet — Bioluminescent Mint/Teal
          amber: "#F59E0B",   // black hole — Accretion Disk Gold
          indigo: "#4F46E5",  // galaxy — Deep Indigo/Nebula Blue
        },
        star: {
          white:  "#f0f4ff",
          yellow: "#fbbf24",
          orange: "#f97316",
          red:    "#ef4444",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "starfield":    "radial-gradient(ellipse at top, #0f0a35 0%, #050505 70%)",
        "nebula-glow":  "radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)",
        "scanlines":
          "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.18) 3px, rgba(0,0,0,0.18) 4px)",
      },
      animation: {
        "pulse-slow":   "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "twinkle":      "twinkle 3s ease-in-out infinite",
        "orbit":        "orbit 20s linear infinite",
        "scan":         "scan 2s ease-in-out infinite",
        // New sci-fi animations
        "radar-ping":   "radar-ping 1.8s ease-out infinite",
        "bh-pulse":     "bh-pulse 2.4s ease-in-out infinite",
        "scanline-drift":"scanline-drift 8s linear infinite",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.2" },
        },
        orbit: {
          from: { transform: "rotate(0deg) translateX(80px) rotate(0deg)" },
          to:   { transform: "rotate(360deg) translateX(80px) rotate(-360deg)" },
        },
        scan: {
          "0%, 100%": { transform: "translateY(-100%)", opacity: "0" },
          "50%":      { opacity: "1" },
          "100%":     { transform: "translateY(100%)", opacity: "0" },
        },
        // Expanding concentric ring for exoplanet radar pings
        "radar-ping": {
          "0%":   { transform: "scale(0.6)", opacity: "0.9" },
          "100%": { transform: "scale(3.2)", opacity: "0" },
        },
        // Black hole pulsing halo — Accretion Disk Gold
        "bh-pulse": {
          "0%, 100%": {
            boxShadow:
              "0 0 0 2px #F59E0B88, 0 0 10px 4px #F59E0B44, 0 0 22px 6px #92610022",
          },
          "50%": {
            boxShadow:
              "0 0 0 3px #F59E0Bcc, 0 0 18px 7px #F59E0B66, 0 0 36px 10px #92610044",
          },
        },
        "scanline-drift": {
          "0%":   { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100px" },
        },
      },
      boxShadow: {
        // Original
        "glow-purple": "0 0 20px rgba(124,58,237,0.4)",
        "glow-cyan":   "0 0 20px rgba(6,182,212,0.4)",
        "glow-blue":   "0 0 20px rgba(37,99,235,0.4)",
        // Cinematic palette glows
        "glow-neon-mint":  "0 0 18px 2px rgba(45,212,191,0.55), 0 0 6px 1px rgba(45,212,191,0.8)",
        "glow-neon-amber": "0 0 18px 2px rgba(245,158,11,0.55), 0 0 6px 1px rgba(245,158,11,0.8)",
        "glow-neon-indigo":"0 0 18px 2px rgba(79,70,229,0.55),  0 0 6px 1px rgba(79,70,229,0.8)",
        "glow-green":     "0 0 14px 2px rgba(74,222,128,0.45), 0 0 4px 1px rgba(74,222,128,0.6)",
        "glow-alert":     "0 0 14px 2px rgba(239,68,68,0.45),  0 0 4px 1px rgba(239,68,68,0.6)",
        // Glassmorphism panel
        "glass": "0 4px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
      },
    },
  },
  plugins: [],
};
