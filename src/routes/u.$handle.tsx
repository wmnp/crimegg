import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  EffectsLayer, CustomFontInjector, CustomCursorInjector,
  CursorTrail, ScanlinesOverlay, MusicVisualizer, type Effect,
} from "@/components/profile-effects";
import { THEMES, BADGE_DEFS } from "@/lib/themes";
import { Volume2, VolumeX, Share2, MessageSquare, Eye, Tag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FollowButton } from "@/components/follow-button";

export const Route = createFileRoute("/u/$handle")({
  loader: async ({ params }) => {
    const handle = params.handle.toLowerCase();
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("handle", handle).maybeSingle();
    if (!profile) throw notFound();
    const [{ data: links }, { data: guestbook }] = await Promise.all([
      supabase.from("links").select("*").eq("profile_id", profile.id).order("sort_order"),
      supabase.from("guestbook").select("*").eq("profile_id", profile.id).order("created_at", { ascending: false }).limit(30),
    ]);
    return { profile, links: links ?? [], guestbook: guestbook ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const name = p?.display_name || p?.handle || "profile";
    const title = p?.custom_title || `@${p?.handle ?? "user"} — crime.gg`;
    return {
      meta: [
        { title },
        { name: "description", content: p?.bio || `${name} on crime.gg` },
        { property: "og:title", content: title },
        { property: "og:description", content: p?.bio || `${name} on crime.gg` },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-7xl font-black text-gradient-crime">404</h1>
        <p className="mt-3 text-muted-foreground">Handle not found.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">go home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">{error.message}</div>
  ),
  component: ProfileView,
});

type Profile = {
  id: string; handle: string; display_name: string | null; bio: string | null;
  avatar_url: string | null; background_url: string | null; background_type: string;
  music_url: string | null; cursor_url: string | null;
  font_url: string | null; font_family: string | null;
  accent_color: string | null; effect: string; card_opacity: number;
  intro_enabled: boolean; intro_text: string | null;
  theme: string; glow_text: boolean; cursor_trail: boolean; scanlines: boolean;
  badges: string[]; visualizer: boolean; blur_amount: number; views: number;
  for_sale?: boolean; sale_price?: number | null;
  avatar_shape?: string; link_style?: string; bg_blur?: number;
  tilt_card?: boolean; hide_views?: boolean; text_align?: string;
  custom_title?: string | null;
};
type LinkRow = { id: string; label: string; url: string };
type GuestEntry = { id: string; author_name: string; message: string; created_at: string };

function ProfileView() {
  const { profile, links, guestbook: initialGb } =
    Route.useLoaderData() as { profile: Profile; links: LinkRow[]; guestbook: GuestEntry[] };
  const accent = profile.accent_color || "#ef4444";
  const theme = useMemo(() => THEMES.find((t) => t.id === profile.theme), [profile.theme]);
  const [entered, setEntered] = useState(!profile.intro_enabled);
  const [muted, setMuted] = useState(false);
  const [showGb, setShowGb] = useState(false);
  const [guestbook, setGuestbook] = useState<GuestEntry[]>(initialGb);
  const audioRef = useRef<HTMLAudioElement>(null);

  // increment view count once
  useEffect(() => {
    supabase.rpc("increment_profile_views", { _handle: profile.handle }).then(() => {}, () => {});
  }, [profile.handle]);

  function enter() {
    setEntered(true);
    if (profile.music_url && audioRef.current) audioRef.current.play().catch(() => {});
  }

  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  const fontStack = profile.font_family
    ? `"${profile.font_family.replace(/[^a-zA-Z0-9_-]/g, "")}", system-ui, sans-serif`
    : undefined;

  const cardBg = `rgba(0,0,0,${profile.card_opacity ?? 0.5})`;
  const blur = profile.blur_amount ?? 20;
  const glow = profile.glow_text ? { textShadow: `0 0 18px ${accent}, 0 0 40px ${accent}88` } : undefined;

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: `@${profile.handle} on crime.gg`, url }); } catch { /* canceled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: fontStack }}>
      <CustomFontInjector url={profile.font_url} family={profile.font_family} />
      <CustomCursorInjector url={profile.cursor_url} />

      {/* Background */}
      <div className="fixed inset-0 -z-10" style={{ filter: profile.bg_blur ? `blur(${profile.bg_blur}px)` : undefined }}>
        {profile.background_type === "video" && profile.background_url ? (
          <video src={profile.background_url} autoPlay loop muted playsInline
            className="h-full w-full object-cover" />
        ) : profile.background_url ? (
          <img src={profile.background_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full"
            style={{ background: theme?.bgGradient || `radial-gradient(circle at 50% 50%, ${accent}33, #0a0a0a 70%)` }} />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {profile.music_url && <audio ref={audioRef} src={profile.music_url} loop preload="auto" crossOrigin="anonymous" />}

      {entered && <EffectsLayer effect={(profile.effect as Effect) || "none"} color={accent} />}
      {entered && profile.cursor_trail && <CursorTrail color={accent} />}
      {entered && profile.scanlines && <ScanlinesOverlay />}
      {entered && profile.visualizer && profile.music_url && <MusicVisualizer audio={audioRef.current} color={accent} />}

      {/* Intro splash */}
      {!entered && (
        <button onClick={enter}
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-2xl transition hover:backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto h-24 w-24 animate-pulse overflow-hidden rounded-full border-2"
              style={{ borderColor: accent, boxShadow: `0 0 80px ${accent}` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center bg-black text-3xl font-black text-white">
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>}
            </div>
            <p className="mt-8 text-3xl font-black uppercase tracking-[0.3em] text-white"
              style={{ textShadow: `0 0 30px ${accent}` }}>
              {profile.intro_text || "click to enter"}
            </p>
            <p className="mt-3 text-xs uppercase tracking-[0.4em] text-white/50">@{profile.handle}</p>
          </div>
        </button>
      )}

      {/* Profile content */}
      {entered && (
        <div className="relative z-20 mx-auto flex max-w-md flex-col items-center px-6 pt-16 pb-12 text-center text-white animate-fade-in">
          <div className="w-full rounded-3xl border p-8 shadow-2xl"
            style={{ backgroundColor: cardBg, borderColor: `${accent}55`, backdropFilter: `blur(${blur}px)` }}>
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 shadow-2xl"
              style={{ borderColor: accent, boxShadow: `0 0 60px -10px ${accent}` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.handle} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center bg-black text-5xl font-black">
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>}
            </div>
            <h1 className="mt-5 text-3xl font-black" style={glow}>{profile.display_name || profile.handle}</h1>
            <p className="text-sm opacity-70">@{profile.handle}</p>

            {profile.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {profile.badges.map((b) => {
                  const def = BADGE_DEFS[b]; if (!def) return null;
                  return (
                    <span key={b}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white animate-fade-in"
                      style={{ backgroundColor: def.color, boxShadow: `0 0 18px -3px ${def.color}` }}>
                      {def.emoji} {def.label}
                    </span>
                  );
                })}
              </div>
            )}

            {profile.bio && (
              <p className="mt-4 whitespace-pre-wrap text-sm opacity-90" style={profile.glow_text ? { textShadow: `0 0 8px ${accent}66` } : undefined}>
                {profile.bio}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                  className="block rounded-xl border px-5 py-3 font-bold uppercase tracking-wide transition hover:scale-[1.03] hover:shadow-[0_0_30px_-5px_var(--tw-shadow-color)]"
                  style={{
                    borderColor: `${accent}66`,
                    background: `linear-gradient(135deg, ${accent}22, transparent)`,
                    ["--tw-shadow-color" as any]: accent,
                  }}>
                  {l.label}
                </a>
              ))}
              {links.length === 0 && <p className="text-sm opacity-60">No links yet.</p>}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs opacity-80">
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" />{profile.views.toLocaleString()}</span>
              <FollowButton profileId={profile.id} accent={accent} />
              <button onClick={share} className="inline-flex items-center gap-1 hover:opacity-100">
                <Share2 className="h-3 w-3" /> share
              </button>
              <button onClick={() => setShowGb((s) => !s)} className="inline-flex items-center gap-1 hover:opacity-100">
                <MessageSquare className="h-3 w-3" /> guestbook ({guestbook.length})
              </button>
            </div>

            {profile.for_sale && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-wider animate-pulse"
                style={{ borderColor: accent, backgroundColor: `${accent}22`, color: accent, boxShadow: `0 0 24px -6px ${accent}` }}>
                <Tag className="h-3 w-3" /> handle for sale {profile.sale_price != null ? `· $${Number(profile.sale_price).toLocaleString()}` : "· make offer"}
              </div>
            )}
          </div>

          {showGb && (
            <Guestbook
              profileId={profile.id}
              accent={accent}
              entries={guestbook}
              cardBg={cardBg}
              blur={blur}
              onPost={(g) => setGuestbook([g, ...guestbook])}
            />
          )}

          <Link to="/" className="mt-10 text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white">
            powered by crime.gg
          </Link>
        </div>
      )}

      {entered && profile.music_url && (
        <button onClick={() => setMuted((m) => !m)}
          className="fixed bottom-4 right-4 z-40 rounded-full border border-white/20 bg-black/60 p-3 text-white backdrop-blur transition hover:scale-110"
          style={{ borderColor: `${accent}88` }}
          aria-label={muted ? "Unmute" : "Mute"}>
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function Guestbook({
  profileId, accent, entries, cardBg, blur, onPost,
}: {
  profileId: string; accent: string; entries: GuestEntry[];
  cardBg: string; blur: number; onPost: (g: GuestEntry) => void;
}) {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim() || !msg.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("guestbook")
      .insert({ profile_id: profileId, author_name: name.slice(0, 32), message: msg.slice(0, 500) })
      .select().single();
    setBusy(false);
    if (error) return toast.error(error.message);
    onPost(data as GuestEntry);
    setMsg("");
    toast.success("Posted!");
  }

  return (
    <div className="mt-6 w-full rounded-3xl border p-5 text-left text-white animate-fade-in"
      style={{ backgroundColor: cardBg, borderColor: `${accent}55`, backdropFilter: `blur(${blur}px)` }}>
      <h3 className="mb-3 text-sm font-black uppercase tracking-wider" style={{ textShadow: `0 0 12px ${accent}` }}>Guestbook</h3>
      <div className="space-y-2">
        <Input placeholder="your name" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
        <Textarea placeholder="leave a message..." value={msg} maxLength={500} rows={2} onChange={(e) => setMsg(e.target.value)} />
        <Button onClick={submit} disabled={busy || !name.trim() || !msg.trim()}
          className="w-full font-bold uppercase" style={{ backgroundColor: accent }}>
          {busy ? "Posting..." : "Sign guestbook"}
        </Button>
      </div>
      <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
        {entries.length === 0 && <li className="text-xs opacity-60">No messages yet. Be the first.</li>}
        {entries.map((g) => (
          <li key={g.id} className="rounded-lg border border-white/10 bg-black/30 p-2 text-sm">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>{g.author_name}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm opacity-90">{g.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
