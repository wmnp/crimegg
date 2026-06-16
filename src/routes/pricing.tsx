import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Header, Footer } from "./index";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — crime.gg" },
      { name: "description", content: "One plan, all features. Customize your crime.gg profile with badges, animations, and more." },
    ],
  }),
  component: Pricing,
});

const tier = {
  name: "Premium",
  price: "$5",
  period: "/month",
  blurb: "Everything unlocked. No tiers, no upsells.",
  features: [
    "1-letter handles available",
    "Unlimited links + per-link colors & icons",
    "Custom backgrounds, avatars, fonts & cursors",
    "Profile music + audio visualizer",
    "Animated backgrounds + emoji rain",
    "Custom CSS for full control",
    "Discord-synced badges (Verified / OG / Staff / VIP)",
    "Profile view analytics",
    "No crime.gg branding",
    "Marketplace listing for your handle",
  ],
  cta: "Get Premium",
};

function Pricing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-4xl font-black uppercase tracking-tight md:text-6xl">
            one plan. <span className="text-gradient-crime">everything in.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            No free vs pro vs boss nonsense. One price, every feature.
          </p>
        </div>
        <div className="mt-16 flex justify-center">
          <div className="glass relative w-full max-w-md rounded-2xl border-primary/60 p-8 glow-crime">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
              the only plan
            </div>
            <h3 className="text-3xl font-black uppercase">{tier.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
            <div className="mt-6 flex items-baseline gap-1">
              <span className="text-6xl font-black">{tier.price}</span>
              <span className="text-sm text-muted-foreground">{tier.period}</span>
            </div>
            <ul className="mt-8 space-y-3 text-sm">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="glow-crime mt-8 w-full font-bold uppercase tracking-wider">
              <Link to="/auth">{tier.cta}</Link>
            </Button>
            <p className="mt-3 text-center text-[10px] uppercase tracking-wider text-muted-foreground">cancel anytime</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
