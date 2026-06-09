import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, LogOut, Upload } from "lucide-react";
import { uploadProfileMedia } from "@/lib/storage";
import { EFFECT_OPTIONS, type Effect } from "@/components/profile-effects";

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
};
type LinkRow = { id: string; profile_id: string; label: string; url: string; sort_order: number };

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);

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
      setProfile(prof as Profile); setLinks((lks as LinkRow[]) ?? []); setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  function patch<K extends keyof Profile>(key: K, value: Profile[K]) {
    if (!profile) return;
    setProfile({ ...profile, [key]: value });
  }

  async function saveProfile() {
    if (!profile) return;
    const { id, handle, plan, ...rest } = profile;
    const { error } = await supabase.from("profiles").update(rest).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Saved");
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
      .update({ label: link.label, url: link.url }).eq("id", link.id);
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

  if (loading || !profile) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">loading...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-black">crime<span className="text-gradient-crime">.gg</span></Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={`/u/${profile.handle}`} target="_blank" rel="noreferrer">
                View <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button onClick={saveProfile} size="sm" className="glow-crime font-bold uppercase">Save</Button>
            <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase">@{profile.handle}</h1>
            <p className="text-sm text-muted-foreground">crime.gg/u/{profile.handle}</p>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
            {profile.plan}
          </span>
        </div>

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
              <Textarea rows={3} value={profile.bio ?? ""} onChange={(e) => patch("bio", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Media">
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
              <FileSlot label={profile.background_type === "video" ? "Background video (mp4, webm)" : "Background image"}
                accept={profile.background_type === "video" ? "video/*" : "image/*"}
                userId={profile.id} kind="background"
                currentUrl={profile.background_url} onUploaded={(u) => patch("background_url", u)}
                preview={profile.background_type === "video" ? "video" : "image"} />
            </div>
            <FileSlot label="Background music (mp3, ogg)" accept="audio/*" userId={profile.id} kind="music"
              currentUrl={profile.music_url} onUploaded={(u) => patch("music_url", u)} preview="audio" />
            <FileSlot label="Custom cursor (png, 32×32 recommended)" accept="image/png,image/gif" userId={profile.id} kind="cursor"
              currentUrl={profile.cursor_url} onUploaded={(u) => patch("cursor_url", u)} preview="image" />
            <FileSlot label="Custom font (woff2, ttf, otf)" accept=".woff2,.woff,.ttf,.otf,font/*"
              userId={profile.id} kind="font"
              currentUrl={profile.font_url} onUploaded={(u) => patch("font_url", u)} />
            <Field label="Font family name (any name)">
              <Input value={profile.font_family ?? ""} placeholder="MyFont"
                onChange={(e) => patch("font_family", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Effects">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Profile effect</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {EFFECT_OPTIONS.map((e) => (
                  <button key={e} type="button" onClick={() => patch("effect", e)}
                    className={`rounded-md border px-3 py-2 text-sm font-bold uppercase tracking-wider ${profile.effect === e ? "border-primary bg-primary/20 text-primary glow-crime" : "border-border text-muted-foreground hover:border-primary/40"}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Card transparency · {Math.round(profile.card_opacity * 100)}%
              </Label>
              <Slider min={0} max={1} step={0.05} value={[profile.card_opacity]}
                onValueChange={(v) => patch("card_opacity", v[0])} className="mt-3" />
              <p className="mt-1 text-xs text-muted-foreground">0% = fully see-through · 100% = solid</p>
            </div>
          </div>
        </Section>

        <Section title="Intro splash">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-bold">Show click-to-enter screen</p>
              <p className="text-xs text-muted-foreground">Required for music autoplay on most browsers.</p>
            </div>
            <Switch checked={profile.intro_enabled} onCheckedChange={(v) => patch("intro_enabled", v)} />
          </div>
          <Field label="Intro text" full>
            <Input value={profile.intro_text ?? ""} onChange={(e) => patch("intro_text", e.target.value)}
              placeholder="click to enter" />
          </Field>
        </Section>

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
              <div key={l.id} className="flex gap-2 rounded-xl border border-border bg-input/30 p-3">
                <div className="grid flex-1 gap-2 sm:grid-cols-[200px_1fr]">
                  <Input value={l.label} onChange={(e) => updateLink(l.id, { label: e.target.value })}
                    onBlur={() => commitLink(l)} placeholder="Label" />
                  <Input value={l.url} onChange={(e) => updateLink(l.id, { url: e.target.value })}
                    onBlur={() => commitLink(l)} placeholder="https://" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteLink(l.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button onClick={saveProfile} size="lg" className="glow-crime font-bold uppercase tracking-wider">
            Save all changes
          </Button>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-xl font-black uppercase tracking-tight">{title}</h2>
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

function FileSlot({
  label, accept, userId, kind, currentUrl, onUploaded, preview,
}: {
  label: string; accept: string;
  userId: string;
  kind: "avatar" | "background" | "music" | "cursor" | "font";
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  preview?: "image" | "video" | "audio";
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1 flex items-center gap-3 rounded-md border border-border bg-input/30 p-2">
        {currentUrl && preview === "image" && (
          <img src={currentUrl} alt="" className="h-12 w-12 rounded object-cover" />
        )}
        {currentUrl && preview === "video" && (
          <video src={currentUrl} className="h-12 w-20 rounded object-cover" muted />
        )}
        {currentUrl && preview === "audio" && (
          <audio src={currentUrl} controls className="h-8 flex-1" />
        )}
        {!currentUrl && <div className="h-12 w-12 rounded bg-muted" />}
        <input ref={ref} type="file" accept={accept} className="hidden" onChange={onPick} />
        <Button type="button" variant="outline" size="sm" disabled={busy}
          onClick={() => ref.current?.click()}>
          <Upload className="mr-2 h-3.5 w-3.5" /> {busy ? "Uploading..." : currentUrl ? "Replace" : "Upload"}
        </Button>
      </div>
    </div>
  );
}
