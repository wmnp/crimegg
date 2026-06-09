import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  EffectsLayer, CustomFontInjector, CustomCursorInjector, type Effect,
} from "@/components/profile-effects";
import { Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/u/$handle")({
  loader: async ({ params }) => {
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("handle", params.handle.toLowerCase()).maybeSingle();
    if (!profile) throw notFound();
    const { data: links } = await supabase
      .from("links").select("*").eq("profile_id", profile.id).order("sort_order");
    return { profile, links: links ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const name = p?.display_name || p?.handle || "profile";
    return {
      meta: [
        { title: `@${p?.handle ?? "user"} — crime.gg` },
        { name: "description", content: p?.bio || `${name} on crime.gg` },
        { property: "og:title", content: `@${p?.handle} on crime.gg` },
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
  handle: string; display_name: string | null; bio: string | null;
  avatar_url: string | null; background_url: string | null; background_type: string;
  music_url: string | null; cursor_url: string | null;
  font_url: string | null; font_family: string | null;
  accent_color: string | null; effect: string; card_opacity: number;
  intro_enabled: boolean; intro_text: string | null;
};
type Link = { id: string; label: string; url: string };

function ProfileView() {
  const { profile, links } = Route.useLoaderData() as { profile: Profile; links: Link[] };
  const accent = profile.accent_color || "#ef4444";
  const [entered, setEntered] = useState(!profile.intro_enabled);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  function enter() {
    setEntered(true);
    if (profile.music_url && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }

  useEffect(() => { if (audioRef.current) audioRef.current.muted = muted; }, [muted]);

  const fontStack = profile.font_family
    ? `"${profile.font_family.replace(/[^a-zA-Z0-9_-]/g, "")}", system-ui, sans-serif`
    : undefined;

  const cardBg = `rgba(0,0,0,${profile.card_opacity ?? 0.5})`;

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: fontStack }}>
      <CustomFontInjector url={profile.font_url} family={profile.font_family} />
      <CustomCursorInjector url={profile.cursor_url} />

      {/* Background */}
      <div className="fixed inset-0 -z-10">
        {profile.background_type === "video" && profile.background_url ? (
          <video src={profile.background_url} autoPlay loop muted playsInline
            className="h-full w-full object-cover" />
        ) : profile.background_url ? (
          <img src={profile.background_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full"
            style={{ background: `radial-gradient(circle at 50% 50%, ${accent}33, #0a0a0a 70%)` }} />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Audio */}
      {profile.music_url && (
        <audio ref={audioRef} src={profile.music_url} loop preload="auto" />
      )}

      {/* Effects */}
      {entered && <EffectsLayer effect={(profile.effect as Effect) || "none"} color={accent} />}

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
        <div className="relative z-20 mx-auto flex max-w-md flex-col items-center px-6 pt-20 pb-12 text-center text-white animate-fade-in">
          <div className="rounded-3xl border border-white/10 p-8 backdrop-blur-xl shadow-2xl w-full"
            style={{ backgroundColor: cardBg, borderColor: `${accent}55` }}>
            <div className="mx-auto h-32 w-32 overflow-hidden rounded-full border-4 shadow-2xl"
              style={{ borderColor: accent, boxShadow: `0 0 60px -10px ${accent}` }}>
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={profile.handle} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center bg-black text-5xl font-black">
                    {profile.handle.charAt(0).toUpperCase()}
                  </div>}
            </div>
            <h1 className="mt-5 text-3xl font-black">{profile.display_name || profile.handle}</h1>
            <p className="text-sm opacity-70">@{profile.handle}</p>
            {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm opacity-90">{profile.bio}</p>}

            <div className="mt-6 space-y-3">
              {links.map((l) => (
                <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                  className="block rounded-xl border px-5 py-3 font-bold uppercase tracking-wide transition hover:scale-[1.03]"
                  style={{
                    borderColor: `${accent}66`,
                    background: `linear-gradient(135deg, ${accent}22, transparent)`,
                    boxShadow: `0 0 0 0 ${accent}`,
                  }}>
                  {l.label}
                </a>
              ))}
              {links.length === 0 && <p className="text-sm opacity-60">No links yet.</p>}
            </div>
          </div>

          <Link to="/" className="mt-10 text-xs uppercase tracking-[0.3em] text-white/40 hover:text-white">
            powered by crime.gg
          </Link>
        </div>
      )}

      {/* Audio control */}
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
