import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAppConfig } from "@/lib/app-config";
import { BadgeIcon } from "@/components/badge-icon";
import { Eye, Hash } from "lucide-react";

type FeaturedProfile = {
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  avatar_shape: string;
  background_type: string;
  background_url: string | null;
  accent_color: string | null;
  badges: string[];
  uid: number | null;
  views: number;
  hide_views: boolean;
};

const COLS =
  "handle, display_name, bio, avatar_url, avatar_shape, background_type, background_url, accent_color, badges, uid, views, hide_views";

export function parseHandles(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((h) => h.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

export function FeaturedProfiles() {
  const { config } = useAppConfig();
  const handles = parseHandles(config.featured_handles ?? "");
  const [profiles, setProfiles] = useState<FeaturedProfile[]>([]);

  useEffect(() => {
    if (handles.length === 0) { setProfiles([]); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase.from("profiles").select(COLS).in("handle", handles).eq("banned", false);
      if (!alive) return;
      const rows = (data ?? []) as FeaturedProfile[];
      rows.sort((a, b) => handles.indexOf(a.handle) - handles.indexOf(b.handle));
      setProfiles(rows);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.featured_handles]);

  if (profiles.length === 0) return null;

  return (
    <div className="mx-auto mt-14 max-w-5xl">
      <div className="mb-4 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
        </span>
        live on crime.gg
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Link
            key={p.handle}
            to="/u/$handle"
            params={{ handle: p.handle }}
            className="lift group relative min-h-[280px] overflow-hidden rounded-2xl border border-border/40 text-left hover:border-primary/40"
          >
            {/* full-card background */}
            <div className="absolute inset-0 -z-10">
              {p.background_type === "video" && p.background_url ? (
                <video src={p.background_url} muted loop autoPlay playsInline
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
              ) : p.background_url ? (
                <img src={p.background_url} alt={`${p.handle} profile background`} loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
              ) : (
                <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${p.accent_color ?? "var(--primary)"}44 0%, var(--card) 100%)` }} />
              )}
            </div>
            {/* bottom-heavy scrim so text stays readable over busy backgrounds while the top stays visible */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-card via-card/60 to-transparent" />

            <div className="relative z-10 flex h-full flex-col justify-end p-5 pt-28">
              <div className={`h-16 w-16 overflow-hidden border-2 border-background/80 bg-muted shadow-lg ${p.avatar_shape === "square" ? "rounded-xl" : "rounded-full"}`}>
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={`${p.handle} avatar`} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-lg font-black text-muted-foreground">
                    {p.handle.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="truncate font-bold">{p.display_name || `@${p.handle}`}</span>
                {p.badges.slice(0, 5).map((b) => <BadgeIcon key={b} badge={b} size={15} />)}
              </div>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                {p.bio || `crime.gg/${p.handle}`}
              </p>
              <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-wider text-muted-foreground">
                {p.uid !== null && <span className="inline-flex items-center gap-1"><Hash className="h-3 w-3" />UID {p.uid}</span>}
                {!p.hide_views && <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{p.views.toLocaleString()}</span>}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
