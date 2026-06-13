import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { startSignup, finishSignup } from "@/lib/auth.functions";
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
            {mode === "signup" ? "Invite code + email verification required." : "Sign in to run your profile."}
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

type Step = "form" | "verify";

function SignUp() {
  const navigate = useNavigate();
  const startFn = useServerFn(startSignup);
  const finishFn = useServerFn(finishSignup);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [code, setCode] = useState("");
  const [form, setForm] = useState({ handle: "", email: "", password: "", inviteCode: "" });

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await startFn({ data: { ...form, handle: form.handle.toLowerCase(), email: form.email.toLowerCase() } });
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email.toLowerCase(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      toast.success(`Code sent to ${form.email}`);
      setStep("verify");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyAndFinish(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 6) return toast.error("Enter the 6-digit code");
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: form.email.toLowerCase(),
        token: code,
        type: "email",
      });
      if (error) throw error;
      await finishFn({});
      toast.success(`Welcome, @${form.handle}`);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email.toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("New code sent");
  }

  if (step === "verify") {
    return (
      <form onSubmit={verifyAndFinish} className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            We emailed a 6-digit code to
          </p>
          <p className="font-mono text-sm font-bold">{form.email}</p>
        </div>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0,1,2,3,4,5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-12 w-10 text-lg font-bold" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button type="submit" disabled={loading || code.length < 6} className="glow-crime w-full font-bold uppercase tracking-wider">
          {loading ? "Verifying..." : "Verify & claim"}
        </Button>
        <div className="flex justify-between text-xs">
          <button type="button" onClick={() => setStep("form")} className="text-muted-foreground hover:text-foreground">← back</button>
          <button type="button" onClick={resend} disabled={loading} className="text-primary hover:underline">resend code</button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendCode} className="space-y-4">
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
        {loading ? "Sending code..." : "Send verification code"}
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
