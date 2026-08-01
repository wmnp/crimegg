import { BADGE_DEFS } from "@/lib/themes";

/** Renders a badge icon; chroma badges get an animated rainbow hue shift. */
export function BadgeIcon({ badge, size = 20 }: { badge: string; size?: number }) {
  const def = BADGE_DEFS[badge];
  if (!def) return null;
  const Icon = def.icon;
  const icon = <Icon size={size} color={def.color} aria-label={def.label} />;
  if (!def.chroma) return icon;
  return <span className="badge-chroma inline-flex" title={def.label}>{icon}</span>;
}
