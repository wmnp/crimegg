import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admins")({
  head: () => ({ meta: [{ title: "Admin Access — crime.gg" }, { name: "robots", content: "noindex" }] }),
  component: AdminsGate,
});

function AdminsGate() {
  const navigate = useNavigate();
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function grant() {
    const h = handle.trim().toLowerCase().replace(/^@/, "");
    if (!h || !password) return toast.error("Handle and password required");
    setBusy(true);
    const { data, error } = await supabase.rpc("grant_admin" as never, { _handle: h, _password: password } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data) return toast.error("Wrong password or handle not found");
    toast.success(`@${h} is now admin. Sign in to use the panel.`);
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="glass w-full max-w-md rounded-2xl p-8">
        <div className="mb-6 flex items-center gap-3">
          <Shield className="h-7 w-7 text-amber-400" />
          <h1 className="text-2xl font-black uppercase">Admin Access</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter a handle and the admin password to grant admin powers on that account.
        </p>
        <div className="mt-6 space-y-3">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Handle</Label>
            <Input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1" />
          </div>
          <Button onClick={grant} disabled={busy} className="glow-crime w-full font-bold uppercase">
            {busy ? "Granting..." : "Grant admin"}
          </Button>
        </div>
        <Link to="/" className="mt-6 block text-center text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">← back home</Link>
      </div>
    </div>
  );
}
