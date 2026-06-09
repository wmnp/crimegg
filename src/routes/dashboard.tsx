import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Trash2, Plus, ExternalLink, LogOut } from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — crime.gg" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

type Profile = {
  id: string; handle: string; display_name: string | null; bio: string | null;
  avatar_url: string | null; background_url: string | null; accent_color: string | null; plan: string;
};
type Link = { id: string; profile_id: string; label: string; url: string; sort_order: number };

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
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
      setProfile(prof as Profile); setLinks((lks as Link[]) ?? []); setLoading(false);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function saveProfile() {
    if (!profile) return;
    const { error } = await supabase.from("profiles").update({
      display_name: profile.display_name, bio: profile.bio,
      avatar_url: profile.avatar_url, background_url: profile.background_url,
      accent_color: profile.accent_color,
    }).eq("id", profile.id);
    if (error) toast.error(error.message); else toast.success("Saved");
  }

  async function addLink() {
    if (!profile) return;
    const { data, error } = await supabase.from("links").insert({
      profile_id: profile.id, label: "New link", url: "https://", sort_order: links.length,
    }).select().single();
    if (error) return toast.error(error.message);
    setLinks([...links, data as Link]);
  }

  async function updateLink(id: string, patch: Partial<Link>) {
    setLinks(links.map((l) => l.id === id ? { ...l, ...patch } : l));
  }
  async function commitLink(link: Link) {
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
                View profile <ExternalLink className="ml-2 h-3.5 w-3.5" />
              </a>
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="glass rounded-2xl p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase">Profile</h2>
                <p className="text-sm text-muted-foreground">crime.gg/{profile.handle}</p>
              </div>
              <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-bold uppercase text-primary">
                {profile.plan}
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <Input value={profile.display_name ?? ""} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
              </Field>
              <Field label="Accent color">
                <Input type="color" value={profile.accent_color ?? "#ef4444"} className="h-10 p-1"
                  onChange={(e) => setProfile({ ...profile, accent_color: e.target.value })} />
              </Field>
              <Field label="Avatar URL" full>
                <Input value={profile.avatar_url ?? ""} placeholder="https://..."
                  onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })} />
              </Field>
              <Field label="Background URL" full>
                <Input value={profile.background_url ?? ""} placeholder="https://..."
                  onChange={(e) => setProfile({ ...profile, background_url: e.target.value })} />
              </Field>
              <Field label="Bio" full>
                <Textarea rows={3} value={profile.bio ?? ""} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              </Field>
            </div>
            <Button onClick={saveProfile} className="glow-crime mt-6 font-bold uppercase tracking-wider">
              Save profile
            </Button>
          </section>

          <section className="glass rounded-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-black uppercase">Links</h2>
              <Button onClick={addLink} size="sm"><Plus className="mr-1 h-4 w-4" /> Add link</Button>
            </div>
            <div className="space-y-3">
              {links.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No links yet. Add one above.
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
          </section>
        </div>

        <aside className="glass rounded-2xl p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Live preview</h3>
          <ProfilePreview profile={profile} links={links} />
        </aside>
      </main>
    </div>
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

function ProfilePreview({ profile, links }: { profile: Profile; links: Link[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-border"
      style={{
        backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center",
        backgroundColor: "oklch(0.12 0.015 20)",
      }}>
      <div className="bg-black/50 p-6 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2"
            style={{ borderColor: profile.accent_color ?? "#ef4444" }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center bg-muted text-2xl font-black">
                  {profile.handle.charAt(0).toUpperCase()}
                </div>}
          </div>
          <h3 className="mt-3 text-xl font-bold">{profile.display_name || profile.handle}</h3>
          <p className="text-xs text-muted-foreground">@{profile.handle}</p>
          {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
          <div className="mt-4 w-full space-y-2">
            {links.map((l) => (
              <div key={l.id} className="rounded-lg border border-white/20 bg-white/10 p-2 text-sm font-medium">
                {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
