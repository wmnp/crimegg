import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signupNow } from "@/lib/auth.functions";
import { Header, Footer } from "./index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — crime.gg" },
      { name: "description", content: "Sign in or claim your handle on crime.gg. Invite code required." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase">
            {mode === "signup" ? "claim your handle" : "welcome back"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signup" ? "Invite code required." : "Sign in to run your profile."}
          </p>
        </div>
        <div className="glass rounded-2xl p-6">
          {mode === "signup" ? <SignUp /> : <SignIn />}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>Already have an account?{" "}
                <button onClick={() => setMode("signin")} className="font-semibold text-primary hover:underline">Sign in</button>
              </>
            ) : (
              <>Got an invite?{" "}
                <button onClick={() => setMode("signup")} className="font-semibold text-primary hover:underline">Claim handle</button>
              </>
            )}
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Don't have a code? Ask in our <Link to="/" className="underline">discord</Link>.
        </p>
      </main>
      <Footer />
    </div>
  );
}

function SignUp() {
  const navigate = useNavigate();
  const signupFn = useServerFn(signupNow);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ handle: "", email: "", password: "", inviteCode: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const email = form.email.toLowerCase();
      const handle = form.handle.toLowerCase();
      await signupFn({ data: { ...form, handle, email } });
      const { error } = await supabase.auth.signInWithPassword({ email, password: form.password });
      if (error) throw error;
      toast.success(`Welcome, @${handle}`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="handle">Handle</Label>
        <div className="mt-1 flex items-center rounded-md border border-input bg-input/50 focus-within:ring-2 focus-within:ring-ring">
          <span className="pl-3 text-sm text-muted-foreground">crime.gg/</span>
          <Input id="handle" required value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })}
            pattern="[a-zA-Z0-9_]{1,20}" placeholder="x"
            className="border-0 bg-transparent focus-visible:ring-0" />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">1–20 chars · letters, numbers, underscores · single-letter handles allowed</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={6} value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="invite">Invite code</Label>
        <Input id="invite" required value={form.inviteCode}
          onChange={(e) => setForm({ ...form, inviteCode: e.target.value })}
          placeholder="enter your code" className="mt-1 font-mono uppercase" />
      </div>
      <Button type="submit" disabled={loading} className="glow-crime w-full font-bold uppercase tracking-wider">
        {loading ? "Creating account..." : "Claim handle"}
      </Button>
    </form>
  );
}

function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(form);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="si-email">Email</Label>
        <Input id="si-email" type="email" required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="si-pw">Password</Label>
        <Input id="si-pw" type="password" required value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1" />
      </div>
      <Button type="submit" disabled={loading} className="glow-crime w-full font-bold uppercase tracking-wider">
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
