import { useEffect, useMemo, useRef } from "react";

type Effect = "none" | "snow" | "rain" | "hearts" | "sparkles" | "matrix";

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
    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    type P = { x: number; y: number; vy: number; vx: number; s: number; a: number };
    const count = effect === "matrix" ? 40 : 80;
    const particles: P[] = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vy: 1 + Math.random() * 2, vx: (Math.random() - 0.5) * 0.5,
      s: 2 + Math.random() * 4, a: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.y += p.vy; p.x += p.vx; p.a += 0.05;
        if (p.y > h + 10) { p.y = -10; p.x = Math.random() * w; }
        if (effect === "snow") {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.arc(p.x + Math.sin(p.a) * 6, p.y, p.s * 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (effect === "rain") {
          ctx.strokeStyle = "rgba(160,200,255,0.6)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x, p.y + p.s * 3);
          ctx.stroke();
        } else if (effect === "hearts") {
          ctx.fillStyle = color;
          drawHeart(ctx, p.x + Math.sin(p.a) * 8, p.y, p.s);
        } else if (effect === "sparkles") {
          ctx.fillStyle = `hsla(${(p.a * 60) % 360},90%,70%,0.9)`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 0.6, 0, Math.PI * 2);
          ctx.fill();
        } else if (effect === "matrix") {
          ctx.fillStyle = color;
          ctx.font = "16px monospace";
          ctx.fillText(String.fromCharCode(0x30a0 + Math.floor(Math.random() * 96)), p.x, p.y);
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
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x, y - s, x - s * 2, y - s, x - s * 2, y + s * 0.3);
  ctx.bezierCurveTo(x - s * 2, y + s * 1.2, x, y + s * 1.8, x, y + s * 2.2);
  ctx.bezierCurveTo(x, y + s * 1.8, x + s * 2, y + s * 1.2, x + s * 2, y + s * 0.3);
  ctx.bezierCurveTo(x + s * 2, y - s, x, y - s, x, y);
  ctx.fill();
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

export const EFFECT_OPTIONS: Effect[] = ["none", "snow", "rain", "hearts", "sparkles", "matrix"];
export type { Effect };
