import { useEffect, useState } from "react";

export function EmojiRain({ emoji, density = 25 }: { emoji: string; density?: number }) {
  const [drops, setDrops] = useState<Array<{ id: number; left: number; delay: number; dur: number; size: number }>>([]);
  useEffect(() => {
    if (!emoji) return;
    setDrops(
      Array.from({ length: density }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        dur: 6 + Math.random() * 8,
        size: 18 + Math.random() * 22,
      })),
    );
  }, [emoji, density]);

  if (!emoji) return null;
  const ch = [...emoji][0] ?? "";
  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      <style>{`@keyframes em-fall { to { transform: translateY(110vh) rotate(360deg); opacity: 0; } }`}</style>
      {drops.map((d) => (
        <span
          key={d.id}
          style={{
            position: "absolute",
            top: "-10vh",
            left: `${d.left}%`,
            fontSize: d.size,
            animation: `em-fall ${d.dur}s linear ${d.delay}s infinite`,
            opacity: 0.85,
          }}
        >
          {ch}
        </span>
      ))}
    </div>
  );
}

export const ANIMATED_BG_PRESETS = [
  { id: "none", label: "None", css: "" },
  { id: "aurora", label: "Aurora", css: "bg-anim-aurora" },
  { id: "pulse", label: "Pulse", css: "bg-anim-pulse" },
  { id: "shift", label: "Shift", css: "bg-anim-shift" },
  { id: "noise", label: "Static noise", css: "bg-anim-noise" },
];

// Inject animated-background CSS once on the public profile when used.
export function AnimatedBgStyles() {
  return (
    <style>{`
      @keyframes bg-aurora { 0%,100%{background-position:0% 50%}50%{background-position:100% 50%} }
      .bg-anim-aurora{background:linear-gradient(120deg,#7f1d1d,#1e1b4b,#052e16,#831843);background-size:300% 300%;animation:bg-aurora 18s ease infinite;}
      @keyframes bg-pulse { 0%,100%{filter:hue-rotate(0deg) brightness(1)} 50%{filter:hue-rotate(40deg) brightness(1.15)} }
      .bg-anim-pulse{animation:bg-pulse 6s ease-in-out infinite;}
      @keyframes bg-shift { 0%{transform:scale(1.05) translate(0,0)} 50%{transform:scale(1.15) translate(-2%,-2%)} 100%{transform:scale(1.05) translate(0,0)} }
      .bg-anim-shift{animation:bg-shift 20s ease-in-out infinite;}
      .bg-anim-noise{position:relative;}
      .bg-anim-noise::after{content:"";position:absolute;inset:0;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence baseFrequency='0.9'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='0.5'/></svg>");opacity:.15;mix-blend-mode:overlay;animation:bg-pulse 2s steps(6) infinite;}
    `}</style>
  );
}
