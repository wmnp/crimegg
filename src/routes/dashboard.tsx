import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  Trash2, Plus, ExternalLink, LogOut, Upload, Download, Eye,
  User, Image as ImageIcon, Palette, Sparkles, AtSign, Wrench, TrendingUp, Tag, Hash, MessageCircle, BadgeCheck, Shield,
} from "lucide-react";
import { uploadProfileMedia } from "@/lib/storage";
import { EFFECT_OPTIONS, type Effect } from "@/components/profile-effects";
import { THEMES, BADGE_DEFS, DISCORD_INVITE } from "@/lib/themes";
import { ANIMATED_BG_PRESETS } from "@/components/emoji-rain";

import { buildDiscordOAuthUrl, syncDiscordBadges, unlinkDiscord } from "@/lib/discord.functions";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — crime.gg" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Profile = {
  id: string; handle: string; display_name: string | null; bio: string | null;
  avatar_url: string | null; background_url: string | null; background_type: string;
  music_url: string | null; cursor_url: string | null;
  font_url: string | null; font_family: string | null;
  accent_color: string | null; plan: string;
  effect: string; card_opacity: number;
  intro_enabled: boolean; intro_text: string | null;
  theme: string; glow_text: boolean; cursor_trail: boolean; scanlines: boolean;
  badges: string[]; visualizer: boolean; blur_amount: number; views: number;
  for_sale: boolean; sale_price: number | null;
  avatar_shape: string; link_style: string; bg_blur: number;
  tilt_card: boolean; hide_views: boolean; text_align: string;
  particle_density: number; custom_title: string | null;
  uid: number | null; custom_css: string | null;
  animated_bg: string; emoji_rain: string | null;
  discord_id: string | null; discord_username: string | null;
  is_admin?: boolean;
};
type LinkRow = { id: string; profile_id: string; label: string; url: string; sort_order: number; accent_color: string | null; icon: string | null };

const TABS = [
  { id: "profile", label: "Profile", icon: User, adminOnly: false },
  { id: "badges", label: "Badges", icon: BadgeCheck, adminOnly: false },
  { id: "media", label: "Media", icon: ImageIcon, adminOnly: false },
  { id: "style", label: "Style", icon: Palette, adminOnly: false },
  { id: "effects", label: "Effects", icon: Sparkles, adminOnly: false },
  { id: "discord", label: "Discord", icon: MessageCircle, adminOnly: false },
  { id: "handle", label: "Handle", icon: AtSign, adminOnly: false },
  { id: "market", label: "Market", icon: Tag, adminOnly: false },
  { id: "views", label: "Views", icon: TrendingUp, adminOnly: true },
  { id: "tools", label: "Tools", icon: Wrench, adminOnly: false },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [original, setOriginal] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("profile");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/auth" });
    });
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/auth" }); return; }
      const [{ data: prof }, { data: lks }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("links").select("*").eq("profile_id", user.id).order("sort_order"),
      ]);
      setProfile(prof as Profile);
      setOriginal(prof as Profile);
      setLinks((lks as LinkRow[]) ?? []);
      setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const dirty = useMemo(() => JSON.stringify(profile) !== JSON.stringify(original), [profile, original]);

  function patch<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  }

  async function saveProfile() {
    if (!profile) return;
    const { id, handle, plan, views, ...rest } = profile;
    const { error } = await supabase.from("profiles").update(rest as never).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Saved!"); setOriginal(profile); }
  }

  function undoChanges() {
    if (!original) return;
    setProfile(original);
    toast("Reverted to last save");
  }

  function downloadJSON() {
    if (!profile) return;
    const blob = new Blob([JSON.stringify({ profile, links }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${profile.handle}-crime-gg.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function addLink() {
    if (!profile) return;
    const { data, error } = await supabase.from("links").insert({
      profile_id: profile.id, label: "New link", url: "https://", sort_order: links.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setLinks([...links, data as LinkRow]);
  }
  function updateLink(id: string, patch: Partial<LinkRow>) {
    setLinks(links.map((l) => l.id === id ? { ...l, ...patch } : l));
  }
  async function commitLink(link: LinkRow) {
    const { error } = await supabase.from("links")
      .update({ label: link.label, url: link.url, accent_color: link.accent_color, icon: link.icon }).eq("id", link.id);
    if (error) toast.error(error.message);
  }
  async function deleteLink(id: string) {
    const { error } = await supabase.from("links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setLinks(links.filter((l) => l.id !== id));
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  function toggleBadge(b: string) {
    if (!profile) return;
    const has = profile.badges.includes(b);
    patch("badges", has ? profile.badges.filter((x) => x !== b) : [...profile.badges, b]);
  }

  function applyTheme(id: string) {
    if (!profile) return;
    const t = THEMES.find((x) => x.id === id);
    if (!t) return;
    setProfile({ ...profile, theme: id, accent_color: t.accent });
    toast.success(`Theme: ${t.name}`);
  }

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-black sm:text-2xl">crime<span className="text-gradient-crime">.gg</span></Link>
          <div className="flex items-center gap-2">
            {dirty && <span className="hidden text-xs uppercase tracking-wider text-amber-400 sm:inline">● unsaved</span>}
            <Button asChild variant="outline" size="sm">
              <a href={`/u/${profile.handle}`} target="_blank" rel="noreferrer">
                <Eye className="h-3.5 w-3.5" /> <span className="hidden sm:inline">View</span>
              </a>
            </Button>
            <Button onClick={saveProfile} size="sm" className="glow-crime font-bold uppercase" disabled={!dirty}>Save</Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[260px_1fr_360px]">
        {/* Sidebar Tabs */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-4">
            <h1 className="truncate text-2xl font-black uppercase">@{profile.handle}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {profile.uid != null && <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-bold text-primary"><Hash className="inline h-3 w-3 -mt-0.5" />UID {profile.uid}</span>}
              <span>{profile.views} views</span>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 lg:flex-col">
            {TABS.filter((t) => !t.adminOnly || profile.is_admin).map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`group flex flex-1 items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-bold uppercase tracking-wider transition lg:flex-none ${active
                    ? "border-primary bg-primary/15 text-primary shadow-[0_0_20px_-5px_var(--crime)]"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                  <Icon className="h-4 w-4" /> {t.label}
                </button>
              );
            })}
            {profile.is_admin && (
              <Link to="/admin" className="mt-2 flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-amber-400 hover:border-amber-500">
                <Shield className="h-4 w-4" /> Admin Panel
              </Link>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {tab === "profile" && (
            <Section title="Identity">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Display name">
                  <Input value={profile.display_name ?? ""} onChange={(e) => patch("display_name", e.target.value)} />
                </Field>
                <Field label="Accent color">
                  <Input type="color" value={profile.accent_color ?? "#ef4444"} className="h-10 p-1"
                    onChange={(e) => patch("accent_color", e.target.value)} />
                </Field>
                <Field label="Bio" full>
                  <Textarea rows={4} value={profile.bio ?? ""} onChange={(e) => patch("bio", e.target.value)} />
                </Field>
              </div>
            </Section>
          )}

          {tab === "badges" && (
            <Section title="Badges">
              <p className="text-sm text-muted-foreground">
                Click to equip or unequip. Verified / OG / Staff / VIP are granted by your <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-primary underline">Discord</a> role — re-syncing will re-grant them if you still have the role.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(BADGE_DEFS).map(([key, b]) => {
                  const on = profile.badges.includes(key);
                  const I = b.icon;
                  return (
                    <button key={key} type="button" onClick={() => toggleBadge(key)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition ${on ? "border-primary bg-primary/10" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      <I size={20} color={b.color} />
                      <span style={on ? { color: b.color } : undefined}>{b.label}</span>
                      <span className="text-[10px] opacity-60">{b.source === "discord" ? "discord" : "free"}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 rounded-xl border border-border bg-input/30 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Equipped order (left → right on profile)</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {profile.badges.length === 0 && <span className="text-sm text-muted-foreground">none equipped</span>}
                  {profile.badges.map((b) => {
                    const def = BADGE_DEFS[b]; if (!def) return null;
                    const I = def.icon;
                    return <I key={b} size={22} color={def.color} aria-label={def.label} />;
                  })}
                </div>
              </div>
            </Section>
          )}

          {tab === "media" && (
            <Section title="Media uploads">
              <div className="grid gap-4 sm:grid-cols-2">
                <FileSlot label="Avatar (jpg, png, gif)" accept="image/*" userId={profile.id} kind="avatar"
                  currentUrl={profile.avatar_url} onUploaded={(u) => patch("avatar_url", u)} preview="image" />
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Background type</Label>
                  <div className="flex gap-2">
                    {(["image", "video"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => patch("background_type", t)}
                        className={`flex-1 rounded-md border px-3 py-2 text-sm font-bold uppercase tracking-wider ${profile.background_type === t ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  <FileSlot label={profile.background_type === "video" ? "Background video (mp4)" : "Background image"}
                    accept={profile.background_type === "video" ? "video/*" : "image/*"}
                    userId={profile.id} kind="background"
                    currentUrl={profile.background_url} onUploaded={(u) => patch("background_url", u)}
                    preview={profile.background_type === "video" ? "video" : "image"} />
                </div>
                <FileSlot label="Background music (mp3, ogg)" accept="audio/*" userId={profile.id} kind="music"
                  currentUrl={profile.music_url} onUploaded={(u) => patch("music_url", u)} preview="audio" />
                <FileSlot label="Custom cursor (png 32×32)" accept="image/png,image/gif" userId={profile.id} kind="cursor"
                  currentUrl={profile.cursor_url} onUploaded={(u) => patch("cursor_url", u)} preview="image" />
                <FileSlot label="Custom font (woff2, ttf, otf)" accept=".woff2,.woff,.ttf,.otf,font/*"
                  userId={profile.id} kind="font"
                  currentUrl={profile.font_url} onUploaded={(u) => patch("font_url", u)} />
                <Field label="Font family name">
                  <Input value={profile.font_family ?? ""} placeholder="MyFont"
                    onChange={(e) => patch("font_family", e.target.value)} />
                </Field>
              </div>
            </Section>
          )}

          {tab === "style" && (
            <>
              <Section title="Theme presets">
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {THEMES.map((t) => {
                    const active = profile.theme === t.id;
                    return (
                      <button key={t.id} type="button" onClick={() => applyTheme(t.id)}
                        className={`group relative overflow-hidden rounded-xl border p-4 text-left transition ${active ? "border-primary shadow-[0_0_30px_-8px_var(--crime)]" : "border-border hover:border-primary/40"}`}
                        style={{ background: t.bgGradient }}>
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: t.accent, boxShadow: `0 0 12px ${t.accent}` }} />
                          <span className="font-black uppercase text-white">{t.name}</span>
                        </div>
                        <p className="mt-1 text-xs text-white/70">{t.description}</p>
                        {active && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase text-black">active</span>}
                      </button>
                    );
                  })}
                </div>
              </Section>

              <Section title="Card style">
                <div className="space-y-5">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Card transparency · {Math.round(profile.card_opacity * 100)}%
                    </Label>
                    <Slider min={0} max={1} step={0.05} value={[profile.card_opacity]}
                      onValueChange={(v) => patch("card_opacity", v[0])} className="mt-3" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Glass blur · {profile.blur_amount}px
                    </Label>
                    <Slider min={0} max={40} step={1} value={[profile.blur_amount]}
                      onValueChange={(v) => patch("blur_amount", v[0])} className="mt-3" />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Background blur · {profile.bg_blur}px
                    </Label>
                    <Slider min={0} max={30} step={1} value={[profile.bg_blur]}
                      onValueChange={(v) => patch("bg_blur", v[0])} className="mt-3" />
                  </div>
                  <Toggle label="Neon glow text" hint="Makes your name + bio glow in your accent color."
                    checked={profile.glow_text} onChange={(v) => patch("glow_text", v)} />
                  <Toggle label="3D tilt on hover" hint="Card tilts in 3D when you hover over it."
                    checked={profile.tilt_card} onChange={(v) => patch("tilt_card", v)} />
                  <Toggle label="Hide view counter" hint="Don't show the public view count."
                    checked={profile.hide_views} onChange={(v) => patch("hide_views", v)} />
                </div>
              </Section>

              <Section title="Layout & text">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Avatar shape">
                    <div className="flex gap-2">
                      {(["circle", "square", "hex"] as const).map((s) => (
                        <button key={s} type="button" onClick={() => patch("avatar_shape", s)}
                          className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold uppercase ${profile.avatar_shape === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Text alignment">
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((a) => (
                        <button key={a} type="button" onClick={() => patch("text_align", a)}
                          className={`flex-1 rounded-md border px-3 py-2 text-xs font-bold uppercase ${profile.text_align === a ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                          {a}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Link button style" full>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {(["glass", "filled", "outline", "gradient"] as const).map((s) => (
                        <button key={s} type="button" onClick={() => patch("link_style", s)}
                          className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${profile.link_style === s ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="Custom browser tab title (leaves blank = default)" full>
                    <Input value={profile.custom_title ?? ""} maxLength={60}
                      onChange={(e) => patch("custom_title", e.target.value || null)}
                      placeholder="@you — crime.gg" />
                  </Field>
                </div>
              </Section>

              <Section title="Animated background">
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {ANIMATED_BG_PRESETS.map((p) => (
                    <button key={p.id} type="button" onClick={() => patch("animated_bg", p.id)}
                      className={`rounded-md border px-3 py-2 text-xs font-bold uppercase ${profile.animated_bg === p.id ? "border-primary bg-primary/20 text-primary" : "border-border text-muted-foreground"}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Plays over your background image/video. Pick "None" to disable.
                </p>
              </Section>

              <Section title="Emoji rain">
                <Field label="Emoji that rains down (1 character — clear to disable)">
                  <Input value={profile.emoji_rain ?? ""} maxLength={4}
                    onChange={(e) => patch("emoji_rain", e.target.value || null)}
                    placeholder="🩸  💵  🔥  💎" />
                </Field>
              </Section>

              <Section title="Custom CSS (advanced)">
                <p className="text-xs text-muted-foreground">
                  Injected into your public profile inside a &lt;style&gt; tag. Use this to push past the presets — at your own risk.
                </p>
                <Textarea rows={8} className="mt-3 font-mono text-xs" value={profile.custom_css ?? ""}
                  maxLength={8000}
                  onChange={(e) => patch("custom_css", e.target.value)}
                  placeholder=":root { --crime: #ff0044; }\nh1 { letter-spacing: 0.2em; }" />
              </Section>
            </>
          )}

          {tab === "discord" && (
            <DiscordPanel profile={profile} onUpdate={(p) => { setProfile(p); setOriginal(p); }} />
          )}

          {tab === "effects" && (
            <>
              <Section title="Particle effect">
                <div className="flex flex-wrap gap-2">
                  {EFFECT_OPTIONS.map((e) => (
                    <button key={e} type="button" onClick={() => patch("effect", e)}
                      className={`rounded-md border px-3 py-2 text-sm font-bold uppercase tracking-wider ${profile.effect === e ? "border-primary bg-primary/20 text-primary glow-crime" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </Section>
              <Section title="Overlays">
                <div className="space-y-3">
                  <Toggle label="Cursor trail" hint="Glowing trail that follows the cursor."
                    checked={profile.cursor_trail} onChange={(v) => patch("cursor_trail", v)} />
                  <Toggle label="VHS scanlines" hint="Retro scanline overlay."
                    checked={profile.scanlines} onChange={(v) => patch("scanlines", v)} />
                  <Toggle label="Music visualizer" hint="Audio-reactive bars at the bottom (needs music)."
                    checked={profile.visualizer} onChange={(v) => patch("visualizer", v)} />
                </div>
              </Section>
              <Section title="Intro splash">
                <div className="space-y-3">
                  <Toggle label="Show click-to-enter screen" hint="Required for music autoplay."
                    checked={profile.intro_enabled} onChange={(v) => patch("intro_enabled", v)} />
                  <Field label="Intro text">
                    <Input value={profile.intro_text ?? ""} onChange={(e) => patch("intro_text", e.target.value)}
                      placeholder="click to enter" />
                  </Field>
                </div>
              </Section>
            </>
          )}

          {tab === "handle" && (
            <HandlePanel profile={profile} onChanged={(h) => { setProfile({ ...profile, handle: h }); setOriginal((o) => o ? { ...o, handle: h } : o); }} />
          )}

          {tab === "views" && profile.is_admin && <ViewBooster ownHandle={profile.handle} onBoosted={(h, total) => { if (h === profile.handle.toLowerCase()) { setProfile({ ...profile, views: total }); setOriginal((o) => o ? { ...o, views: total } : o); } }} />}

          {tab === "market" && (
            <Section title="List your handle for sale">
              <p className="text-sm text-muted-foreground">
                Toggle this on to put your handle on the public <Link to="/market" className="text-primary underline">marketplace</Link>. Buyers contact you through your profile links.
              </p>
              <div className="mt-4 space-y-4">
                <Toggle label={`List @${profile.handle} on the marketplace`}
                  hint="Your profile gets a 'for sale' badge and appears at /market."
                  checked={profile.for_sale} onChange={(v) => patch("for_sale", v)} />
                <Field label="Asking price (USD) — leave blank for 'make offer'">
                  <Input type="number" min={0} step="1"
                    value={profile.sale_price ?? ""}
                    onChange={(e) => patch("sale_price", e.target.value === "" ? null : Number(e.target.value))}
                    placeholder="e.g. 100" />
                </Field>
              </div>
            </Section>
          )}

          {tab === "tools" && (
            <Section title="Tools">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadJSON}>
                  <Download className="h-4 w-4" /> Export profile JSON
                </Button>
                <Button variant="outline" onClick={undoChanges} disabled={!dirty}>
                  Undo unsaved changes
                </Button>
              </div>
            </Section>
          )}

          {/* Links live below the active tab on every screen */}
          <Section title="Links">
            <div className="mb-4 flex justify-end">
              <Button onClick={addLink} size="sm"><Plus className="mr-1 h-4 w-4" /> Add link</Button>
            </div>
            <div className="space-y-3">
              {links.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No links yet.
                </p>
              )}
              {links.map((l) => (
                <div key={l.id} className="flex flex-col gap-2 rounded-xl border border-border bg-input/30 p-3 sm:flex-row sm:items-center">
                  <div className="grid flex-1 gap-2 sm:grid-cols-[160px_1fr]">
                    <Input value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })}
                      onBlur={() => commitLink(l)} placeholder="Label" />
                    <Input value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })}
                      onBlur={() => commitLink(l)} placeholder="https://" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      Color
                      <input type="color" value={l.accent_color ?? "#ef4444"}
                        onChange={(e) => updateLink(l.id, { accent_color: e.target.value })}
                        onBlur={() => commitLink(l)}
                        className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                    </label>
                    <Input value={l.icon ?? ""} maxLength={2} placeholder="🔥"
                      onChange={(e) => updateLink(l.id, { icon: e.target.value })}
                      onBlur={() => commitLink(l)}
                      className="w-14 text-center" />
                    <Button variant="ghost" size="icon" onClick={() => deleteLink(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>

        {/* Live preview */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live preview</h3>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">updates instantly</span>
          </div>
          <LivePreview profile={profile} links={links} />
        </aside>
      </main>

      <div className="sticky bottom-4 z-20 mx-auto flex max-w-7xl justify-end px-4">
        <Button onClick={saveProfile} size="lg" disabled={!dirty}
          className="glow-crime font-bold uppercase tracking-wider shadow-2xl">
          {dirty ? "Save all changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
}

function LivePreview({ profile, links }: { profile: Profile; links: LinkRow[] }) {
  const accent = profile.accent_color || "#ef4444";
  const theme = THEMES.find((t) => t.id === profile.theme);
  const bg = theme?.bgGradient || `radial-gradient(circle at 50%, ${accent}33, #0a0a0a 70%)`;
  const cardBg = `rgba(0,0,0,${profile.card_opacity ?? 0.5})`;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border" style={{ background: bg, minHeight: 460 }}>
      {profile.background_url && profile.background_type === "image" && (
        <img src={profile.background_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80" />
      )}
      {profile.scanlines && (
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.4) 0, rgba(0,0,0,0.4) 1px, transparent 1px, transparent 3px)" }} />
      )}
      <div className="relative z-10 p-5">
        <div className="rounded-2xl border p-5 text-center text-white shadow-xl"
          style={{ backgroundColor: cardBg, borderColor: `${accent}55`, backdropFilter: `blur(${profile.blur_amount}px)` }}>
          <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border-2"
            style={{ borderColor: accent, boxShadow: `0 0 40px -5px ${accent}` }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center bg-black text-3xl font-black">{profile.handle.charAt(0).toUpperCase()}</div>}
          </div>
          <h2 className="mt-3 text-xl font-black"
            style={profile.glow_text ? { textShadow: `0 0 18px ${accent}` } : undefined}>
            {profile.display_name || profile.handle}
          </h2>
          <p className="text-xs opacity-70">@{profile.handle}</p>
          {profile.badges.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 items-center">
              {profile.badges.map((b) => {
                const def = BADGE_DEFS[b]; if (!def) return null;
                const I = def.icon;
                return <I key={b} size={16} color={def.color} aria-label={def.label} />;
              })}
            </div>
          )}
          {profile.bio && <p className="mt-3 whitespace-pre-wrap text-xs opacity-90">{profile.bio}</p>}
          <div className="mt-4 space-y-2">
            {links.slice(0, 5).map((l) => (
              <div key={l.id} className="truncate rounded-lg border px-3 py-1.5 text-xs font-bold uppercase"
                style={{ borderColor: `${accent}66`, background: `linear-gradient(135deg, ${accent}22, transparent)` }}>
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-5 animate-fade-in">
      <h2 className="mb-4 text-lg font-black uppercase tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-input/30 p-3">
      <div>
        <p className="text-sm font-bold">{label}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function FileSlot({
  label, accept, userId, kind, currentUrl, onUploaded, preview,
}: {
  label: string; accept: string; userId: string;
  kind: "avatar" | "background" | "music" | "cursor" | "font";
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  preview?: "image" | "video" | "audio";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (file.size > 25 * 1024 * 1024) { toast.error("Max 25MB"); return; }
    setBusy(true);
    try {
      const url = await uploadProfileMedia(userId, file, kind);
      onUploaded(url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragOver(false);
          const f = e.dataTransfer.files?.[0]; if (f) handleFile(f);
        }}
        className={`mt-1 flex items-center gap-3 rounded-md border-2 border-dashed p-2 transition ${dragOver ? "border-primary bg-primary/10" : "border-border bg-input/30"}`}>
        {currentUrl && preview === "image" && (
          <img src={currentUrl} alt="" className="h-12 w-12 rounded object-cover" />
        )}
        {currentUrl && preview === "video" && (
          <video src={currentUrl} className="h-12 w-20 rounded object-cover" muted />
        )}
        {currentUrl && preview === "audio" && (
          <audio src={currentUrl} controls className="h-8 flex-1" />
        )}
        {!currentUrl && <div className="grid h-12 w-12 place-items-center rounded bg-muted text-muted-foreground"><Upload className="h-4 w-4" /></div>}
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={onPick} />
        <Button type="button" variant="outline" size="sm" disabled={busy}
          onClick={() => ref.current?.click()} className="ml-auto">
          <Upload className="mr-2 h-3.5 w-3.5" /> {busy ? "Uploading..." : currentUrl ? "Replace" : "Drop / Upload"}
        </Button>
      </div>
    </div>
  );
}

function ViewBooster({ ownHandle, onBoosted }: { ownHandle: string; onBoosted: (handle: string, total: number) => void }) {
  const [handle, setHandle] = useState(ownHandle);
  const [amount, setAmount] = useState(1000);
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<{ handle: string; total: number } | null>(null);

  async function boost() {
    const h = handle.trim().toLowerCase().replace(/^@/, "");
    if (!h) return toast.error("Enter a handle");
    if (amount <= 0) return toast.error("Pick a positive amount");
    setBusy(true);
    const { data, error } = await supabase.rpc("add_profile_views" as never, { _handle: h, _amount: amount } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    const total = (data as unknown as number) ?? 0;
    if (!total) return toast.error(`No profile @${h} found`);
    setLast({ handle: h, total });
    onBoosted(h, total);
    toast.success(`Added ${amount.toLocaleString()} views to @${h}`);
  }

  return (
    <Section title="View booster">
      <p className="text-sm text-muted-foreground">
        Inflate the view counter on any handle. Drop in a number and watch it climb.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Handle</Label>
          <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="someone" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Views to add</Label>
          <Input type="number" min={1} value={amount}
            onChange={(e) => setAmount(Number(e.target.value) || 0)} className="mt-1" />
        </div>
        <Button onClick={boost} disabled={busy} className="self-end glow-crime font-bold uppercase">
          {busy ? "Boosting..." : "Boost"}
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[1000, 10000, 100000, 1000000, 10000000].map((n) => (
          <button key={n} type="button" onClick={() => setAmount(n)}
            className="rounded-full border border-border px-3 py-1 text-xs font-bold uppercase tracking-wider hover:border-primary hover:text-primary">
            +{n.toLocaleString()}
          </button>
        ))}
      </div>
      {last && (
        <div className="mt-4 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm">
          <span className="font-bold">@{last.handle}</span> now has{" "}
          <span className="text-gradient-crime font-black">{last.total.toLocaleString()}</span> views.
        </div>
      )}
    </Section>
  );
}

function DiscordPanel({ profile, onUpdate }: { profile: Profile; onUpdate: (p: Profile) => void }) {
  const buildUrl = useServerFn(buildDiscordOAuthUrl);
  const sync = useServerFn(syncDiscordBadges);
  const unlink = useServerFn(unlinkDiscord);
  const [busy, setBusy] = useState<string | null>(null);

  async function link() {
    setBusy("link");
    try { const { url } = await buildUrl(); window.location.href = url; }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); setBusy(null); }
  }
  async function doSync() {
    setBusy("sync");
    try {
      const { badges, granted } = await sync();
      onUpdate({ ...profile, badges });
      toast.success(granted.length ? `Synced: ${granted.join(", ")}` : "No matching roles found");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }
  async function doUnlink() {
    setBusy("unlink");
    try { await unlink(); onUpdate({ ...profile, discord_id: null, discord_username: null }); toast.success("Discord unlinked"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(null); }
  }

  return (
    <>
      <Section title="Discord">
        <p className="text-sm text-muted-foreground">
          Link your Discord account and we'll grant the matching badges based on your roles in our server.
        </p>
        <div className="mt-4 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/5 p-4">
          {profile.discord_id ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Linked as</p>
                <p className="font-bold">@{profile.discord_username || profile.discord_id}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={doSync} disabled={busy === "sync"} className="bg-[#5865F2] text-white hover:bg-[#4752c4]">
                  <BadgeCheck size={16} /> {busy === "sync" ? "Syncing..." : "Sync badges"}
                </Button>
                <Button variant="outline" onClick={doUnlink} disabled={busy === "unlink"}>Unlink</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm">Not linked yet.</p>
              <Button onClick={link} disabled={busy === "link"} className="bg-[#5865F2] text-white hover:bg-[#4752c4]">
                {busy === "link" ? "Opening Discord..." : "Link Discord"}
              </Button>
            </div>
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Need a role? Join the server: <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-[#7e8aff] underline">{DISCORD_INVITE}</a>
        </p>
      </Section>
    </>
  );
}

function HandlePanel({ profile, onChanged }: { profile: Profile; onChanged: (h: string) => void }) {
  const [next, setNext] = useState(profile.handle);
  const [busy, setBusy] = useState(false);

  async function change() {
    const clean = next.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!clean) return toast.error("Enter a handle");
    if (clean === profile.handle) return toast.info("That's already your handle");
    setBusy(true);
    const { data, error } = await supabase.rpc("change_my_handle" as never, { _new: clean } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    const newHandle = data as unknown as string;
    onChanged(newHandle);
    toast.success(`Handle changed to @${newHandle}`);
  }

  return (
    <Section title="Your handle">
      <p className="text-sm text-muted-foreground">
        Public URL:{" "}
        <a href={`/u/${profile.handle}`} target="_blank" rel="noreferrer" className="font-bold text-primary underline">
          crime.gg/u/{profile.handle}
        </a>
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Stat label="Total views" value={profile.views.toLocaleString()} />
        <Stat label="Plan" value={profile.plan} />
      </div>
      <div className="mt-6 space-y-3">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Change handle (1–24 chars, a–z 0–9 _)</Label>
        <div className="flex gap-2">
          <span className="grid place-items-center rounded-md border border-border bg-muted px-3 text-sm text-muted-foreground">@</span>
          <Input value={next} maxLength={24} onChange={(e) => setNext(e.target.value)} placeholder="newhandle" />
          <Button onClick={change} disabled={busy} className="glow-crime font-bold uppercase">
            {busy ? "Saving..." : "Save"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Heads up — old URLs stop working immediately.</p>
      </div>
    </Section>
  );
}
