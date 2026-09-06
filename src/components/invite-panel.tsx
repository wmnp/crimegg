import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, Copy, Trash2, RefreshCw, Plus, Link2, Users } from "lucide-react";

type Invite = { code: string; uses_remaining: number; created_at: string };
type Redemption = { code: string; handle: string; created_at: string };

function inviteLink(code: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/auth?mode=signup&code=${encodeURIComponent(code)}`;
}

export function InvitePanel() {
  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [uses, setUses] = useState("1");
  const [busy, setBusy] = useState(false);
  const [uses_, setUsed] = useState<Redemption[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const [inv, red] = await Promise.all([
      supabase.rpc("admin_list_invites" as never),
      supabase.rpc("admin_list_invite_redemptions" as never),
    ]);
    setLoading(false);
    if (inv.error) return toast.error(inv.error.message);
    setRows((inv.data ?? []) as Invite[]);
    if (!red.error) setUsed((red.data ?? []) as Redemption[]);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function create() {
    setBusy(true);
    const { data, error } = await supabase.rpc("admin_create_invite" as never, {
      _code: code.trim() || null,
      _uses: Math.max(1, Number(uses) || 1),
    } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    setCode("");
    await load();
    const made = String(data);
    await navigator.clipboard?.writeText(inviteLink(made)).catch(() => {});
    toast.success(`Invite ${made} created — sign-up link copied`);
  }

  async function setUsesFor(c: string, n: number) {
    const { error } = await supabase.rpc("admin_set_invite_uses" as never, { _code: c, _uses: n } as never);
    if (error) return toast.error(error.message);
    await load();
  }

  async function remove(c: string) {
    const { error } = await supabase.rpc("admin_delete_invite" as never, { _code: c } as never);
    if (error) return toast.error(error.message);
    toast.success(`Deleted ${c}`);
    await load();
  }

  return (
    <section className="glass space-y-5 rounded-2xl p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider">
          <Ticket className="h-4 w-4 text-primary" /> Invite codes
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Generate codes people need to sign up. Leave the code blank for a random one.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[180px] flex-1">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Code (optional)</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="random" className="mt-1" />
          </div>
          <div className="w-28">
            <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Uses</Label>
            <Input value={uses} inputMode="numeric" onChange={(e) => setUses(e.target.value)} className="mt-1" />
          </div>
          <Button onClick={create} disabled={busy} className="glow-crime font-bold uppercase">
            <Plus className="h-4 w-4" /> {busy ? "..." : "Generate"}
          </Button>
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="border-t border-border pt-4">
        {loading && rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">loading...</p>
        ) : rows.length === 0 ? (
          <p className="text-xs text-muted-foreground">No invite codes yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.code} className="flex flex-wrap items-center gap-2 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                <span className="font-mono text-sm font-bold">{r.code}</span>
                <span className={`rounded px-1.5 text-[10px] font-bold uppercase ${r.uses_remaining > 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                  {r.uses_remaining} uses left
                </span>
                <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {uses_.filter((u) => u.code === r.code).length} signed up
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" title="Copy code"
                    onClick={() => { void navigator.clipboard?.writeText(r.code); toast.success("Code copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" title="Copy sign-up link"
                    onClick={() => { void navigator.clipboard?.writeText(inviteLink(r.code)); toast.success("Link copied"); }}>
                    <Link2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" title="+10 uses"
                    onClick={() => void setUsesFor(r.code, r.uses_remaining + 10)}>+10</Button>
                  <Button size="sm" variant="ghost" title="Disable"
                    onClick={() => void setUsesFor(r.code, 0)}>Disable</Button>
                  <Button size="sm" variant="ghost" className="text-red-400" title="Delete"
                    onClick={() => void remove(r.code)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
          <Users className="h-3.5 w-3.5 text-primary" /> Who used which code
        </p>
        {uses_.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Nobody has signed up with a code yet.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {uses_.map((u, i) => (
              <li key={`${u.code}-${i}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-border/50 bg-background/30 px-3 py-1.5 text-xs">
                <span className="font-semibold">@{u.handle}</span>
                <span className="text-muted-foreground">used</span>
                <span className="font-mono text-primary">{u.code}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
