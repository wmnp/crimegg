export type ThemePreset = {
  id: string;
  name: string;
  accent: string;
  bgGradient: string;
  description: string;
};

export const THEMES: ThemePreset[] = [
  {
    id: "crime",
    name: "Crime",
    accent: "#ef4444",
    bgGradient: "radial-gradient(circle at 50% 30%, #7f1d1d, #0a0a0a 70%)",
    description: "blood red, mob boss",
  },
  {
    id: "matrix",
    name: "Matrix",
    accent: "#22c55e",
    bgGradient: "radial-gradient(circle at 50% 50%, #052e16, #000 70%)",
    description: "green code rain",
  },
  {
    id: "neon",
    name: "Neon",
    accent: "#ec4899",
    bgGradient: "linear-gradient(135deg, #1e1b4b, #831843 100%)",
    description: "pink/purple synthwave",
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    accent: "#facc15",
    bgGradient: "linear-gradient(180deg, #0f172a, #4c1d95 100%)",
    description: "yellow on midnight",
  },
  {
    id: "ice",
    name: "Ice",
    accent: "#38bdf8",
    bgGradient: "radial-gradient(circle at 30% 20%, #0c4a6e, #020617 70%)",
    description: "frozen blue",
  },
  {
    id: "void",
    name: "Void",
    accent: "#a78bfa",
    bgGradient: "radial-gradient(circle at 50% 50%, #1e1b4b, #000 70%)",
    description: "pure dark",
  },
  {
    id: "gold",
    name: "Gold",
    accent: "#f59e0b",
    bgGradient: "linear-gradient(135deg, #422006, #0a0a0a 100%)",
    description: "luxury",
  },
  {
    id: "vapor",
    name: "Vapor",
    accent: "#22d3ee",
    bgGradient: "linear-gradient(180deg, #581c87, #155e75 100%)",
    description: "vaporwave",
  },
];

export const BADGE_DEFS: Record<string, { label: string; emoji: string; color: string }> = {
  verified: { label: "Verified", emoji: "✓", color: "#3b82f6" },
  og: { label: "OG", emoji: "★", color: "#f59e0b" },
  rare: { label: "Rare", emoji: "♦", color: "#ec4899" },
  staff: { label: "Staff", emoji: "⚡", color: "#ef4444" },
  vip: { label: "VIP", emoji: "♛", color: "#a78bfa" },
};
