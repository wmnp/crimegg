import { BadgeCheck, Hammer, Crown, Star, Diamond, type LucideIcon } from "lucide-react";

export type ThemePreset = {
  id: string;
  name: string;
  accent: string;
  bgGradient: string;
  description: string;
};

export const THEMES: ThemePreset[] = [
  { id: "crime", name: "Crime", accent: "#ef4444", bgGradient: "radial-gradient(circle at 50% 30%, #7f1d1d, #0a0a0a 70%)", description: "blood red, mob boss" },
  { id: "matrix", name: "Matrix", accent: "#22c55e", bgGradient: "radial-gradient(circle at 50% 50%, #052e16, #000 70%)", description: "green code rain" },
  { id: "neon", name: "Neon", accent: "#ec4899", bgGradient: "linear-gradient(135deg, #1e1b4b, #831843 100%)", description: "pink/purple synthwave" },
  { id: "cyberpunk", name: "Cyberpunk", accent: "#facc15", bgGradient: "linear-gradient(180deg, #0f172a, #4c1d95 100%)", description: "yellow on midnight" },
  { id: "ice", name: "Ice", accent: "#38bdf8", bgGradient: "radial-gradient(circle at 30% 20%, #0c4a6e, #020617 70%)", description: "frozen blue" },
  { id: "void", name: "Void", accent: "#a78bfa", bgGradient: "radial-gradient(circle at 50% 50%, #1e1b4b, #000 70%)", description: "pure dark" },
  { id: "gold", name: "Gold", accent: "#f59e0b", bgGradient: "linear-gradient(135deg, #422006, #0a0a0a 100%)", description: "luxury" },
  { id: "vapor", name: "Vapor", accent: "#22d3ee", bgGradient: "linear-gradient(180deg, #581c87, #155e75 100%)", description: "vaporwave" },
];

// Badges are pure icons (no filled background). `source: discord` = synced from role; user CAN unequip locally but next sync will re-grant if the role is still there.
export const BADGE_DEFS: Record<string, { label: string; icon: LucideIcon; color: string; source: "discord" | "self" }> = {
  verified: { label: "Verified", icon: BadgeCheck, color: "#1d8bf8", source: "discord" },
  og:       { label: "OG",       icon: Star,       color: "#f59e0b", source: "discord" },
  staff:    { label: "Staff",    icon: Hammer,     color: "#7c8aff", source: "discord" },
  vip:      { label: "VIP",      icon: Crown,      color: "#f59e0b", source: "discord" },
  rare:     { label: "Rare",     icon: Diamond,    color: "#ec4899", source: "self" },
};

export const DISCORD_INVITE = "https://discord.gg/MmkRt6mYV";
