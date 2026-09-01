import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Ticket, Copy, Trash2, RefreshCw, Plus } from "lucide-react";

type Invite = { code: string; uses_remaining: number; created_at: string };

export function InvitePanel() {
  const [rows, setRows] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [uses, setUses] = useState("1");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("admin_list_invites" as never);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows((data ?? []) as Invite[]);
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
    await navigator.clipboard?.writeText(made).catch(() => {});
    toast.success(`Invite ${made} created — copied to clipboard`);
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
                <div className="ml-auto flex items-center gap-1">
                  <Button size="sm" variant="ghost" title="Copy"
                    onClick={() => { void navigator.clipboard?.writeText(r.code); toast.success("Copied"); }}>
                    <Copy className="h-3.5 w-3.5" />
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
    </section>
  );
}
