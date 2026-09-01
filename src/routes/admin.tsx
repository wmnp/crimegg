import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Search, ArrowLeft, RefreshCw, Link2, Sparkles, Users } from "lucide-react";
import { BADGE_DEFS } from "@/lib/themes";
import { BadgeIcon } from "@/components/badge-icon";
import { useAppConfig, CONFIG_DEFAULTS } from "@/lib/app-config";
import { InvitePanel } from "@/components/invite-panel";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — crime.gg" }, { name: "robots", content: "noindex" }] }),
  component: AdminPanel,
});

const PROFILE_COLS =
  "id, handle, uid, views, plan, is_admin, banned, soft_banned, ban_reason, badges, unlocked_badges, for_sale, sale_price, display_name, avatar_url";

type ProfileLite = {
  id: string; handle: string; uid: number | null; views: number; plan: string;
  is_admin: boolean; banned: boolean; soft_banned: boolean; ban_reason: string | null;
  badges: string[]; unlocked_badges: string[]; for_sale: boolean; sale_price: number | null;
  display_name: string | null; avatar_url: string | null;
};

function AdminPanel() {
  const navigate = useNavigate();
  const [me, setMe] = useState<{ handle: string; is_admin: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<ProfileLite | null>(null);
  const [searchBusy, setSearchBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/auth" }); return; }
      const { data } = await supabase.from("profiles").select("handle, is_admin").eq("id", user.id).single();
      setMe(data as never);
      setLoading(false);
    })();
  }, [navigate]);

  async function find() {
    const h = query.trim().toLowerCase().replace(/^@/, "");
    if (!h) return;
    setSearchBusy(true);
    const { data, error } = await supabase.from("profiles").select(PROFILE_COLS).eq("handle", h).maybeSingle();
    setSearchBusy(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error(`No profile @${h}`);
    setTarget(data as ProfileLite);
  }

  async function refresh() {
    if (!target) return;
    const { data } = await supabase.from("profiles").select(PROFILE_COLS).eq("id", target.id).maybeSingle();
    if (data) setTarget(data as ProfileLite);
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">loading...</div>;
  if (!me?.is_admin) {
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center">
        <div className="glass max-w-md rounded-2xl p-8">
          <Shield className="mx-auto h-10 w-10 text-amber-400" />
          <h1 className="mt-4 text-2xl font-black uppercase">Forbidden</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Admin is granted by your Discord role — sync it at{" "}
            <Link to="/admins" className="text-primary underline">/admins</Link>.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← back to dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-amber-400" />
            <h1 className="text-xl font-black uppercase">Admin Panel</h1>
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-400">
              @{me.handle}
            </span>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard"><ArrowLeft className="h-3.5 w-3.5" /> Dashboard</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <ConfigPanel />
        <InvitePanel />


        <section className="glass rounded-2xl p-5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Find profile by handle</Label>
          <div className="mt-2 flex gap-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="handle" onKeyDown={(e) => e.key === "Enter" && find()} />
            <Button onClick={find} disabled={searchBusy} className="glow-crime font-bold uppercase">
              <Search className="h-4 w-4" /> {searchBusy ? "..." : "Find"}
            </Button>
          </div>
        </section>

        {target && <TargetActions target={target} onRefresh={refresh} onCleared={() => setTarget(null)} />}
      </main>
    </div>
  );
}

function ConfigPanel() {
  const { config, reload } = useAppConfig();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const val = (k: string) => draft[k] ?? config[k] ?? CONFIG_DEFAULTS[k] ?? "";

  async function save(keys: string[], label: string) {
    setBusy(label);
    try {
      for (const k of keys) {
        const v = val(k).trim();
        if (v === (config[k] ?? "")) continue;
        const { error } = await supabase.rpc("admin_set_config" as never, { _key: k, _value: v } as never);
        if (error) throw new Error(error.message);
      }
      await reload();
      setDraft({});
      toast.success(`${label} saved`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally { setBusy(null); }
  }

  const roleKeys = Object.entries(BADGE_DEFS)
    .filter(([, b]) => b.roleKey)
    .map(([key, b]) => ({ badge: key, label: b.label, configKey: b.roleKey as string }));

  return (
    <section className="glass space-y-6 rounded-2xl p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Users className="h-4 w-4 text-primary" /> Featured profiles on the front page
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add handles (one per line or comma-separated). Their avatar, background and bio show live on the landing page.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input value={val("featured_handles")} className="min-w-[260px] flex-1"
            onChange={(e) => setDraft({ ...draft, featured_handles: e.target.value })}
            placeholder="crimegg, someoneelse" />
          <Button onClick={() => save(["featured_handles"], "Featured profiles")} disabled={busy === "Featured profiles"}
            className="glow-crime font-bold uppercase">
            {busy === "Featured profiles" ? "Saving..." : "Save profiles"}
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Link2 className="h-4 w-4 text-[#7e8aff]" /> Discord invite link
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Used everywhere on the site (header, footer, dashboard, admin gate). Change it here to refresh it site-wide.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input value={val("discord_invite")} className="min-w-[260px] flex-1"
            onChange={(e) => setDraft({ ...draft, discord_invite: e.target.value })}
            placeholder="https://discord.gg/..." />
          <Button onClick={() => save(["discord_invite"], "Discord link")} disabled={busy === "Discord link"}
            className="glow-crime font-bold uppercase">
            <RefreshCw className={`h-4 w-4 ${busy === "Discord link" ? "animate-spin" : ""}`} /> Refresh link
          </Button>
          <Button variant="outline" onClick={() => reload()}>Reload config</Button>
        </div>
      </div>


      <div className="border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Sparkles className="h-4 w-4 text-primary" /> Discord role names per badge
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Exact role names in the server (case-insensitive). Users unlock a badge when they have the matching role.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {roleKeys.map((r) => (
            <div key={r.configKey}>
              <Label className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                <BadgeIcon badge={r.badge} size={14} /> {r.label} role
              </Label>
              <Input value={val(r.configKey)} className="mt-1"
                onChange={(e) => setDraft({ ...draft, [r.configKey]: e.target.value })} />
            </div>
          ))}
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Famous — followers needed</Label>
            <Input value={val("famous_followers")} className="mt-1"
              onChange={(e) => setDraft({ ...draft, famous_followers: e.target.value })} />
          </div>
          <div>
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Famous — views needed</Label>
            <Input value={val("famous_views")} className="mt-1"
              onChange={(e) => setDraft({ ...draft, famous_views: e.target.value })} />
          </div>
        </div>
        <Button className="glow-crime mt-4 font-bold uppercase" disabled={busy === "Badge roles"}
          onClick={() => save([...roleKeys.map((r) => r.configKey), "famous_followers", "famous_views"], "Badge roles")}>
          {busy === "Badge roles" ? "Saving..." : "Save badge roles"}
        </Button>
      </div>
    </section>
  );
}

function TargetActions({ target, onRefresh, onCleared }: { target: ProfileLite; onRefresh: () => void; onCleared: () => void }) {
  return (
    <section className="glass space-y-5 rounded-2xl p-5">
      <header className="flex items-center gap-4 border-b border-border pb-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-primary/40">
          {target.avatar_url ? <img src={target.avatar_url} alt="" className="h-full w-full object-cover" />
            : <div className="grid h-full w-full place-items-center bg-black text-xl font-black">{target.handle[0]?.toUpperCase()}</div>}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-black">@{target.handle}</h2>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>UID #{target.uid ?? "—"}</span>
            <span>{target.views.toLocaleString()} views</span>
            <span>{target.plan}</span>
            {target.is_admin && <span className="rounded bg-amber-500/20 px-1.5 text-amber-400">ADMIN</span>}
            {target.banned && <span className="rounded bg-red-500/20 px-1.5 text-red-400">BANNED</span>}
            {target.soft_banned && <span className="rounded bg-orange-500/20 px-1.5 text-orange-400">SOFT-BAN</span>}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={`/u/${target.handle}`} target="_blank" rel="noreferrer">View →</a>
        </Button>
      </header>

      <Tool title="Change UID" onRun={async (vals) => {
        const n = parseInt(vals.uid, 10); if (!Number.isFinite(n)) throw new Error("UID must be a number");
        const { error } = await supabase.rpc("admin_set_uid" as never, { _handle: target.handle, _uid: n } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "uid", label: "New UID", placeholder: String(target.uid ?? 1) }]} onDone={onRefresh} />

      <Tool title="Change handle" onRun={async (vals) => {
        const { error } = await supabase.rpc("admin_change_handle" as never, { _old: target.handle, _new: vals.next } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "next", label: "New handle", placeholder: "newhandle" }]} onDone={onRefresh} />

      <Tool title="Set views" onRun={async (vals) => {
        const n = parseInt(vals.views, 10); if (!Number.isFinite(n)) throw new Error("views must be a number");
        const { error } = await supabase.rpc("admin_set_views" as never, { _handle: target.handle, _views: n } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "views", label: "Total views", placeholder: String(target.views) }]} onDone={onRefresh} />

      <Tool title="Set plan" onRun={async (vals) => {
        const { error } = await supabase.rpc("admin_set_plan" as never, { _handle: target.handle, _plan: vals.plan } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "plan", label: "Plan name", placeholder: "premium" }]} onDone={onRefresh} />

      <UnlockedBadgesTool target={target} onDone={onRefresh} />

      <BadgesTool target={target} onDone={onRefresh} />

      <Tool title="Quick: unlock every badge" onRun={async () => {
        const all = Object.keys(BADGE_DEFS);
        const { error } = await supabase.rpc("admin_set_unlocked_badges" as never, { _handle: target.handle, _badges: all } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Unlock all" />

      <Tool title="Quick: strip all badges (equipped + unlocked)" danger onRun={async () => {
        const a = await supabase.rpc("admin_set_unlocked_badges" as never, { _handle: target.handle, _badges: [] } as never);
        if (a.error) throw new Error(a.error.message);
        const b = await supabase.rpc("admin_set_badges" as never, { _handle: target.handle, _badges: [] } as never);
        if (b.error) throw new Error(b.error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Strip badges" />

      <Tool title="Quick: reset views to 0" onRun={async () => {
        const { error } = await supabase.rpc("admin_set_views" as never, { _handle: target.handle, _views: 0 } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Reset views" />

      <Tool title="Quick: grant premium" onRun={async () => {
        const { error } = await supabase.rpc("admin_set_plan" as never, { _handle: target.handle, _plan: "premium" } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Make premium" />

      <Tool title="Quick: downgrade to free" onRun={async () => {
        const { error } = await supabase.rpc("admin_set_plan" as never, { _handle: target.handle, _plan: "free" } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Make free" />

      <Tool title="Add views (booster)" onRun={async (vals) => {
        const n = parseInt(vals.amount, 10);
        if (!Number.isFinite(n) || n <= 0) throw new Error("Enter a positive number");
        const { error } = await supabase.rpc("add_profile_views" as never, { _handle: target.handle, _amount: n } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "amount", label: "Views to add", placeholder: "1000" }]} onDone={onRefresh} buttonLabel="Add views" />

      <Tool title="Nuke: ban + wipe media + clear bio" danger onRun={async (vals) => {
        const a = await supabase.rpc("admin_set_ban" as never, { _handle: target.handle, _hard: true, _soft: false, _reason: vals.reason || "nuked" } as never);
        if (a.error) throw new Error(a.error.message);
        await supabase.rpc("admin_wipe_customization" as never, { _handle: target.handle } as never);
        await supabase.rpc("admin_clear_bio" as never, { _handle: target.handle } as never);
      }} fields={[{ key: "reason", label: "Reason", placeholder: "tos" }]} onDone={onRefresh} buttonLabel="Nuke profile" />


      <Tool title="Hard ban (blocks profile + flagged)" danger onRun={async (vals) => {
        const { error } = await supabase.rpc("admin_set_ban" as never, { _handle: target.handle, _hard: true, _soft: false, _reason: vals.reason } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "reason", label: "Reason", placeholder: "spam" }]} onDone={onRefresh} />

      <Tool title="Soft ban (hides profile, no account block)" onRun={async (vals) => {
        const { error } = await supabase.rpc("admin_set_ban" as never, { _handle: target.handle, _hard: false, _soft: true, _reason: vals.reason } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "reason", label: "Reason", placeholder: "report" }]} onDone={onRefresh} />

      <Tool title="Unban (clear both)" onRun={async () => {
        const { error } = await supabase.rpc("admin_set_ban" as never, { _handle: target.handle, _hard: false, _soft: false, _reason: null } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Unban" />

      <Tool title="Wipe customization (avatar/bg/music/css/cursor)" danger onRun={async () => {
        const { error } = await supabase.rpc("admin_wipe_customization" as never, { _handle: target.handle } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Wipe media" />

      <Tool title="Clear bio + display name" onRun={async () => {
        const { error } = await supabase.rpc("admin_clear_bio" as never, { _handle: target.handle } as never);
        if (error) throw new Error(error.message);
      }} fields={[]} onDone={onRefresh} buttonLabel="Clear" />

      <Tool title="Grant / revoke admin" onRun={async (vals) => {
        const next = vals.admin === "true";
        const { error } = await supabase.rpc("admin_set_admin" as never, { _handle: target.handle, _admin: next } as never);
        if (error) throw new Error(error.message);
      }} fields={[{ key: "admin", label: "true or false", placeholder: target.is_admin ? "false" : "true" }]} onDone={onRefresh} />

      <Tool title="DELETE profile (irreversible)" danger onRun={async (vals) => {
        if (vals.confirm !== target.handle) throw new Error(`Type "${target.handle}" to confirm`);
        const { error } = await supabase.rpc("admin_delete_profile" as never, { _handle: target.handle } as never);
        if (error) throw new Error(error.message);
        toast.success(`Deleted @${target.handle}`);
        onCleared();
      }} fields={[{ key: "confirm", label: `Type "${target.handle}" to confirm`, placeholder: target.handle }]} onDone={() => {}} buttonLabel="Delete forever" />
    </section>
  );
}

function UnlockedBadgesTool({ target, onDone }: { target: ProfileLite; onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>(target.unlocked_badges ?? []);
  const [busy, setBusy] = useState(false);
  function toggle(key: string) {
    setSelected((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));
  }
  async function save() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_unlocked_badges" as never, { _handle: target.handle, _badges: selected } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Unlocked badges updated");
    onDone();
  }
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4">
      <p className="text-sm font-bold uppercase tracking-wider">Unlocked badges (what they're allowed to equip)</p>
      <p className="mt-1 text-xs text-muted-foreground">Discord sync overwrites role-based unlocks on the user's next sync.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(BADGE_DEFS).map(([key, b]) => {
          const on = selected.includes(key);
          return (
            <button key={key} type="button" onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${on ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
              <BadgeIcon badge={key} size={14} /> {b.label}
            </button>
          );
        })}
      </div>
      <Button onClick={save} disabled={busy} className="glow-crime mt-4 font-bold uppercase">{busy ? "Saving..." : "Save unlocks"}</Button>
    </div>
  );
}

function BadgesTool({ target, onDone }: { target: ProfileLite; onDone: () => void }) {
  const [selected, setSelected] = useState<string[]>(target.badges ?? []);
  const [busy, setBusy] = useState(false);
  function toggle(key: string) {
    setSelected((s) => s.includes(key) ? s.filter((x) => x !== key) : [...s, key]);
  }
  async function save() {
    setBusy(true);
    const { error } = await supabase.rpc("admin_set_badges" as never, { _handle: target.handle, _badges: selected } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Badges updated");
    onDone();
  }
  return (
    <div className="rounded-xl border border-border bg-input/30 p-4">
      <p className="text-sm font-bold uppercase tracking-wider">Force-set badges</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {Object.entries(BADGE_DEFS).map(([key, b]) => {
          const on = selected.includes(key);
          return (
            <button key={key} type="button" onClick={() => toggle(key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${on ? "border-primary bg-primary/10" : "border-border text-muted-foreground"}`}>
              <BadgeIcon badge={key} size={14} /> {b.label}
            </button>
          );
        })}
      </div>
      <Button onClick={save} disabled={busy} className="mt-4 glow-crime font-bold uppercase">{busy ? "Saving..." : "Save badges"}</Button>
    </div>
  );
}

function Tool({
  title, fields, onRun, onDone, danger, buttonLabel,
}: {
  title: string;
  fields: { key: string; label: string; placeholder?: string }[];
  onRun: (vals: Record<string, string>) => Promise<void>;
  onDone: () => void;
  danger?: boolean;
  buttonLabel?: string;
}) {
  const [vals, setVals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try { await onRun(vals); toast.success(`${title} ✓`); onDone(); setVals({}); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setBusy(false); }
  }
  return (
    <div className={`rounded-xl border p-4 ${danger ? "border-red-500/30 bg-red-500/5" : "border-border bg-input/30"}`}>
      <p className={`text-sm font-bold uppercase tracking-wider ${danger ? "text-red-400" : ""}`}>{title}</p>
      {fields.length > 0 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.key}>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.label}</Label>
              <Input value={vals[f.key] ?? ""} placeholder={f.placeholder}
                onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} className="mt-1" />
            </div>
          ))}
        </div>
      )}
      <Button onClick={run} disabled={busy}
        className={`mt-3 font-bold uppercase ${danger ? "bg-red-500 hover:bg-red-600" : "glow-crime"}`}>
        {busy ? "Running..." : (buttonLabel ?? "Run")}
      </Button>
    </div>
  );
}
