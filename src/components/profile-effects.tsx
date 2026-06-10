import { useEffect, useMemo, useRef } from "react";

type Effect =
  | "none" | "snow" | "rain" | "hearts" | "sparkles" | "matrix"
  | "stars" | "bubbles" | "fireflies" | "confetti" | "lightning";

export function EffectsLayer({ effect, color }: { effect: Effect; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (effect === "none") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);

    type P = { x: number; y: number; vy: number; vx: number; s: number; a: number; c?: string };
    const count = effect === "matrix" ? 50 : effect === "lightning" ? 1 : 80;
    const palette = ["#ef4444", "#22c55e", "#3b82f6", "#facc15", "#ec4899", "#a78bfa"];
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: 0.5 + Math.random() * 2.5, vx: (Math.random() - 0.5) * 0.8,
      s: 1.5 + Math.random() * 4, a: Math.random() * Math.PI * 2,
      c: palette[Math.floor(Math.random() * palette.length)],
    }));

    let lightningTimer = 0;
    let raf = 0;
    const tick = () => {
      if (effect === "lightning") {
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(0, 0, w, h);
        lightningTimer--;
        if (lightningTimer <= 0 && Math.random() < 0.02) {
          ctx.fillStyle = `${color}33`;
          ctx.fillRect(0, 0, w, h);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 20; ctx.shadowColor = color;
          ctx.beginPath();
          let x = Math.random() * w, y = 0;
          ctx.moveTo(x, y);
          while (y < h) { x += (Math.random() - 0.5) * 40; y += 20 + Math.random() * 30; ctx.lineTo(x, y); }
          ctx.stroke();
          ctx.shadowBlur = 0;
          lightningTimer = 30;
        }
        raf = requestAnimationFrame(tick); return;
      }

      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.a += 0.05;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;

        if (effect === "snow") {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath(); ctx.arc(p.x + Math.sin(p.a) * 6, p.y, p.s * 0.5, 0, Math.PI * 2); ctx.fill();
        } else if (effect === "rain") {
          ctx.strokeStyle = "rgba(160,200,255,0.6)"; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.s * 3); ctx.stroke();
        } else if (effect === "hearts") {
          ctx.fillStyle = color; drawHeart(ctx, p.x + Math.sin(p.a) * 8, p.y, p.s);
        } else if (effect === "sparkles") {
          ctx.fillStyle = `hsla(${(p.a * 60) % 360},90%,70%,0.9)`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.6, 0, Math.PI * 2); ctx.fill();
        } else if (effect === "matrix") {
          ctx.fillStyle = color; ctx.font = "16px monospace";
          ctx.fillText(String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)), p.x, p.y);
        } else if (effect === "stars") {
          const alpha = 0.4 + Math.abs(Math.sin(p.a)) * 0.6;
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.4, 0, Math.PI * 2); ctx.fill();
          p.y -= p.vy * 0.9; if (p.y < -10) p.y = h + 10;
        } else if (effect === "bubbles") {
          ctx.strokeStyle = `${color}aa`; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.arc(p.x + Math.sin(p.a) * 10, p.y, p.s, 0, Math.PI * 2); ctx.stroke();
          p.y -= p.vy; if (p.y < -20) p.y = h + 20;
        } else if (effect === "fireflies") {
          const a = 0.3 + Math.abs(Math.sin(p.a * 2)) * 0.7;
          ctx.shadowBlur = 15; ctx.shadowColor = "#fde047";
          ctx.fillStyle = `rgba(253,224,71,${a})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 0.5, 0, Math.PI * 2); ctx.fill();
          ctx.shadowBlur = 0;
          p.x += Math.sin(p.a) * 1.5; p.y += Math.cos(p.a) * 1.2;
          if (p.y > h) p.y = 0; if (p.y < 0) p.y = h;
        } else if (effect === "confetti") {
          ctx.save();
          ctx.translate(p.x, p.y); ctx.rotate(p.a);
          ctx.fillStyle = p.c || color;
          ctx.fillRect(-p.s, -p.s * 0.4, p.s * 2, p.s * 0.8);
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, [effect, color]);

  if (effect === "none") return null;
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-30" />;
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath(); ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y - s, x - s * 2, y - s, x - s * 2, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 2, y + s * 1.2, x, y + s * 1.8, x, y + s * 2.2);
  ctx.bezierCurveTo(x, y + s * 1.8, x + s * 2, y + s * 1.2, x + s * 2, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 2, y - s, x, y - s, x, y);
  ctx.fill();
}

export function CursorTrail({ color }: { color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);
    const onResize = () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    const trail: { x: number; y: number; a: number }[] = [];
    const onMove = (e: MouseEvent) => { trail.push({ x: e.clientX, y: e.clientY, a: 1 }); if (trail.length > 30) trail.shift(); };
    window.addEventListener("mousemove", onMove);
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < trail.length; i++) {
        const p = trail[i]; p.a *= 0.95;
        ctx.fillStyle = color; ctx.globalAlpha = p.a * (i / trail.length);
        ctx.shadowBlur = 12; ctx.shadowColor = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); window.removeEventListener("mousemove", onMove); };
  }, [color]);
  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" />;
}

export function ScanlinesOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 opacity-20"
      style={{
        backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0px, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)",
        mixBlendMode: "overlay",
      }} />
  );
}

export function MusicVisualizer({ audio, color }: { audio: HTMLAudioElement | null; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!audio) return;
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let ac: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let src: MediaElementAudioSourceNode | null = null;
    let raf = 0;
    const setup = () => {
      try {
        ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        src = ac.createMediaElementSource(audio);
        analyser = ac.createAnalyser();
        analyser.fftSize = 128;
        src.connect(analyser); analyser.connect(ac.destination);
      } catch { /* ignore — element may already be wired */ }
    };
    setup();
    const data = new Uint8Array(64);
    const tick = () => {
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      if (analyser) {
        analyser.getByteFrequencyData(data);
        const bw = w / data.length;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] / 255) * h;
          ctx.fillStyle = color;
          ctx.fillRect(i * bw, h - v, bw - 1, v);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); ac?.close().catch(() => {}); };
  }, [audio, color]);
  return <canvas ref={canvasRef} className="pointer-events-none fixed bottom-0 left-0 right-0 z-20 h-16 w-full opacity-60" />;
}

export function CustomFontInjector({ url, family }: { url?: string | null; family?: string | null }) {
  const css = useMemo(() => {
    if (!url || !family) return null;
    const safe = family.replace(/[^a-zA-Z0-9_-]/g, "");
    return `@font-face { font-family: "${safe}"; src: url("${url}"); font-display: swap; }`;
  }, [url, family]);
  if (!css) return null;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export function CustomCursorInjector({ url }: { url?: string | null }) {
  if (!url) return null;
  const css = `* { cursor: url("${url}") 4 4, auto !important; }`;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

export const EFFECT_OPTIONS: Effect[] = [
  "none", "snow", "rain", "hearts", "sparkles", "matrix",
  "stars", "bubbles", "fireflies", "confetti", "lightning",
];
export type { Effect };
