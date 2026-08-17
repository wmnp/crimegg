import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useDiscordInvite } from "@/lib/app-config";
import { Hash, AtSign, Clock, Sparkles } from "lucide-react";
import { CrimeLogo } from "@/components/crime-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/reveal";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Rare shop — low UIDs & rare handles | crime.gg" },
      { name: "description", content: "Grab a rare low UID or a one-of-a-kind short handle on crime.gg. Stock refreshes every 3 days." },
      { property: "og:title", content: "Rare shop — low UIDs & rare handles | crime.gg" },
      { property: "og:description", content: "Low UIDs from 5 EUR and rare symbol handles. New drop every 3 days." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Market,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">{error.message}</div>
  ),
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">Not found</div>
  ),
});

const PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

function mulberry(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function uidPrice(uid: number): number {
  if (uid < 50) return 20;
  if (uid <= 100) return 10;
  return 5;
}

const SYMBOLS = ["%", "$", "!", "?", "*", "#", "~", "^", "&", "+", "=", "_", "@", "-"];
const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");
const COOL_PAIRS = ["vx", "zk", "qq", "xo", "yz", "kx", "vv", "nx", "zx", "jk", "ph", "tw", "ez", "op", "iq", "rx", "sz", "dm", "gg", "ww"];

function handlePrice(h: string): number {
  if (h.length === 1) return 25;
  if (SYMBOLS.includes(h[0])) return 20;
  return 12;
}

type UidItem = { kind: "uid"; value: number; price: number };
type HandleItem = { kind: "handle"; value: string; price: number };
type Item = UidItem | HandleItem;

function pick<T>(rand: () => number, arr: T[], n: number): T[] {
  const pool = [...arr];
  const out: T[] = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

function Market() {
  const invite = useDiscordInvite();
  const [takenUids, setTakenUids] = useState<Set<number>>(new Set());
  const [takenHandles, setTakenHandles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("uid,handle").limit(5000);
      const rows = (data as { uid: number | null; handle: string }[] | null) ?? [];
      setTakenUids(new Set(rows.map((r) => r.uid).filter((u): u is number => u != null)));
      setTakenHandles(new Set(rows.map((r) => r.handle.toLowerCase())));
      setLoading(false);
    })();
  }, []);

  const period = Math.floor(now / PERIOD_MS);
  const nextDrop = (period + 1) * PERIOD_MS;

  const items = useMemo<Item[]>(() => {
    const rand = mulberry(period * 7919 + 13);
    const uidPool = Array.from({ length: 400 }, (_, i) => i + 2).filter((u) => !takenUids.has(u));
    const uids = pick(rand, uidPool, 9)
      .sort((a, b) => a - b)
      .map<UidItem>((u) => ({ kind: "uid", value: u, price: uidPrice(u) }));

    const handlePool = [
      ...SYMBOLS,
      ...LETTERS,
      ...COOL_PAIRS,
      ...SYMBOLS.flatMap((s) => LETTERS.slice(0, 8).map((l) => s + l)),
    ].filter((h) => !takenHandles.has(h.toLowerCase()));
    const handles = pick(rand, handlePool, 8).map<HandleItem>((h) => ({ kind: "handle", value: h, price: handlePrice(h) }));

    return [...uids, ...handles];
  }, [period, takenUids, takenHandles]);

  const remaining = nextDrop - now;
  const hh = Math.floor(remaining / 3600000);
  const mm = Math.floor((remaining % 3600000) / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  const uids = items.filter((i): i is UidItem => i.kind === "uid");
  const handles = items.filter((i): i is HandleItem => i.kind === "handle");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center"><CrimeLogo size={26} withWordmark /></Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/pricing" className="underline-sweep text-muted-foreground hover:text-foreground">pricing</Link>
            <Link to="/dashboard" className="underline-sweep text-muted-foreground hover:text-foreground">dashboard</Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="reveal-in mb-8 text-center">
          <h1 className="text-4xl font-black uppercase sm:text-6xl">
            rare <span className="text-gradient-crime">shop</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Low UIDs and one-character handles, straight from crime.gg. Stock rotates every 3 days — once it's gone, it's gone.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-bold tabular-nums">
            <Clock className="h-4 w-4 text-primary" />
            {now === 0 ? "next drop soon" : `next drop in ${hh}h ${mm}m ${ss}s`}
          </div>
        </div>

        {loading && <p className="text-center text-muted-foreground">loading stock...</p>}

        {!loading && (
          <>
            <SectionHeader icon={<Hash className="h-4 w-4" />} title="Low UIDs" note="under 50 · 20 EUR — 50 to 100 · 10 EUR — above 100 · 5 EUR" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uids.map((u, i) => (
                <Reveal key={`uid-${u.value}`} delay={i * 70}><Card label={`UID #${u.value}`} sub={u.value < 50 ? "ultra rare" : u.value <= 100 ? "rare" : "collector"} price={u.price} invite={invite} /></Reveal>
              ))}
            </div>

            <SectionHeader icon={<AtSign className="h-4 w-4" />} title="Rare handles" note="1 char · 25 EUR — symbol combos · 20 EUR — 2 char · 12 EUR" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {handles.map((h, i) => (
                <Reveal key={`h-${h.value}`} delay={i * 70}><Card label={`@${h.value}`} sub={h.value.length === 1 ? "single character" : "short handle"} price={h.price} invite={invite} /></Reveal>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function SectionHeader({ icon, title, note }: { icon: React.ReactNode; title: string; note: string }) {
  return (
    <div className="mb-4 mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border/60 pb-2">
      <h2 className="inline-flex items-center gap-2 text-lg font-black uppercase tracking-wide">{icon}{title}</h2>
      <span className="text-xs text-muted-foreground">{note}</span>
    </div>
  );
}

function Card({ label, sub, price, invite }: { label: string; sub: string; price: number; invite: string }) {
  return (
    <div className="lift group relative h-full overflow-hidden rounded-2xl border border-border bg-card p-5 hover:border-primary">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-2xl font-black">{label}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-widest text-muted-foreground">
            <Sparkles className="h-3 w-3" /> {sub}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-sm font-black text-primary">
          €{price}
        </span>
      </div>
      <Button asChild size="sm" variant="outline" className="mt-4 w-full">
        <a href={invite} target="_blank" rel="noreferrer">Claim in Discord</a>
      </Button>
    </div>
  );
}
