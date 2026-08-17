import { useCallback, useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const KEY = "crime-theme";

export function useCrimeTheme() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(KEY);
    const isLight = stored === "light";
    setLight(isLight);
    document.documentElement.classList.toggle("light", isLight);
  }, []);

  const toggle = useCallback((x?: number, y?: number) => {
    setLight((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("light", next);
      window.localStorage.setItem(KEY, next ? "light" : "dark");
      const flare = document.createElement("div");
      flare.className = "theme-flare";
      if (x != null && y != null) {
        flare.style.setProperty("--flare-x", `${x}px`);
        flare.style.setProperty("--flare-y", `${y}px`);
      }
      document.body.appendChild(flare);
      window.setTimeout(() => flare.remove(), 950);
      return next;
    });
  }, []);

  return { light, toggle };
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { light, toggle } = useCrimeTheme();

  return (
    <button
      type="button"
      aria-label={light ? "Switch to dark mode" : "Switch to light mode"}
      onClick={(e) => toggle(e.clientX, e.clientY)}
      className={`press relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card/70 backdrop-blur transition-all duration-500 hover:border-primary hover:shadow-[0_0_26px_-8px_var(--crime-glow)] ${className}`}
    >
      <span
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 hover:opacity-100"
        style={{ background: "radial-gradient(circle, var(--crime-glow), transparent 70%)" }}
        aria-hidden
      />
      <Sun
        className={`absolute h-[18px] w-[18px] text-primary transition-all duration-500 ${
          light ? "rotate-0 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100 animate-spin-slow"
        }`}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] text-primary transition-all duration-500 ${
          light ? "scale-100 rotate-0 opacity-100" : "-rotate-90 scale-0 opacity-0"
        }`}
      />
    </button>
  );
}
