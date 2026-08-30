import { BadgeCheck, Hammer, Crown, Star, Diamond, Video, Flame, ShieldCheck, type LucideIcon } from "lucide-react";

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

export type BadgeDef = {
  label: string;
  icon: LucideIcon;
  color: string;
  /** discord = unlocked by a role in the server, auto = unlocked by stats, self = free for everyone */
  source: "discord" | "auto" | "self";
  /** app_config key holding the Discord role name required (discord/auto badges) */
  roleKey?: string;
  /** rainbow animated icon */
  chroma?: boolean;
  hint?: string;
};

// Badges are pure icons (no filled background).
export const BADGE_DEFS: Record<string, BadgeDef> = {
  owner:    { label: "Owner",    icon: Gem,        color: "#ef4444", source: "discord", roleKey: "role_owner", hint: "Owners only" },
  verified: { label: "Verified", icon: BadgeCheck, color: "#1d8bf8", source: "discord", roleKey: "role_verified", hint: "Get the Verified role in Discord" },
  og:       { label: "OG",       icon: Star,       color: "#f59e0b", source: "discord", roleKey: "role_og", hint: "Get the OG role in Discord" },
  staff:    { label: "Staff",    icon: Hammer,     color: "#7c8aff", source: "discord", roleKey: "role_staff", hint: "Staff only" },
  vip:      { label: "VIP",      icon: Crown,      color: "#f59e0b", source: "discord", roleKey: "role_vip", hint: "Get the VIP role in Discord" },
  admin:    { label: "Admin",    icon: ShieldCheck, color: "#fbbf24", source: "discord", roleKey: "role_admin", hint: "Admins only" },
  creator:  { label: "Content Creator", icon: Video, color: "#a855f7", source: "discord", roleKey: "role_content_creator", chroma: true, hint: "Get the Content Creator role in Discord" },
  famous:   { label: "Famous",   icon: Flame,      color: "#f97316", source: "auto", roleKey: "role_famous", hint: "Hit the follower or view milestone (or get the role)" },
  rare:     { label: "Rare",     icon: Diamond,    color: "#ec4899", source: "self" },
};

/** Fallback invite — the live one lives in app_config.discord_invite (editable in the admin panel). */
export const DISCORD_INVITE = "https://discord.gg/EtMy9KMHJ";

/** "self" badges are free for everyone; everything else must be unlocked (Discord role or milestone). */
export function isBadgeUnlocked(key: string, unlocked: string[] | null | undefined): boolean {
  const def = BADGE_DEFS[key];
  if (!def) return false;
  if (def.source === "self") return true;
  return (unlocked ?? []).includes(key);
}
