import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { syncDiscordAdmin } from "@/lib/discord.functions";
import { useAppConfig } from "@/lib/app-config";

export const Route = createFileRoute("/admins")({
  head: () => ({ meta: [{ title: "Admin Access — crime.gg" }, { name: "robots", content: "noindex" }] }),
  component: AdminsGate,
});

function AdminsGate() {
  const navigate = useNavigate();
  const syncAdmin = useServerFn(syncDiscordAdmin);
  const { config } = useAppConfig();
  const [me, setMe] = useState<{ handle: string; is_admin: boolean; discord_id: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/auth", search: { mode: "signin" } }); return; }
      const { data } = await supabase.from("profiles")
        .select("handle, is_admin, discord_id").eq("id", user.id).maybeSingle();
      setMe(data as never);
      setLoading(false);
    })();
  }, [navigate]);

  async function run() {
    setBusy(true);
    try {
      const res = await syncAdmin();
      setMe((m) => (m ? { ...m, is_admin: res.isAdmin } : m));
      if (res.isAdmin) {
        toast.success(`@${res.handle} is an admin`);
        navigate({ to: "/admin" });
      } else {
        toast.error(`You don't have the "${res.role}" role in the Discord server`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">loading...</div>;

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-black uppercase">Admin Access</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Admin is granted by your Discord role. Link your Discord in the dashboard, make sure you
          have the <span className="font-bold text-foreground">{config.role_admin}</span> role in{" "}
          <a href={config.discord_invite} target="_blank" rel="noreferrer" className="text-[#7e8aff] underline">
            the server
          </a>, then sync.
        </p>

        {me && !me.discord_id && (
          <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
            No Discord linked yet — <Link to="/dashboard" className="underline">link it in the dashboard</Link> first.
          </p>
        )}

        <Button onClick={run} disabled={busy} className="glow-crime mt-6 w-full font-bold uppercase">
          <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
          {busy ? "Syncing roles..." : "Sync admin from Discord"}
        </Button>

        {me?.is_admin && (
          <Button asChild variant="outline" className="mt-3 w-full font-bold uppercase">
            <Link to="/admin">Open admin panel</Link>
          </Button>
        )}

        <Link to="/" className="mt-6 block text-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← back home</Link>
      </div>
    </div>
  );
}
