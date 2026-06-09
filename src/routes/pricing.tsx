import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { Header, Footer } from "./index";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — crime.gg" },
      { name: "description", content: "Free, Pro, and Boss plans. Customize your crime.gg profile with badges, animations, and more." },
    ],
  }),
  component: Pricing,
});

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    blurb: "Get on the map.",
    features: ["Custom handle", "Unlimited links", "Basic customization", "crime.gg branding"],
    cta: "Get started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$4",
    period: "/month",
    blurb: "Stand out from the pack.",
    features: ["Everything in Free", "Custom backgrounds & avatars", "Animated effects", "Profile views analytics", "No crime.gg branding"],
    cta: "Go pro",
    highlighted: true,
  },
  {
    name: "Boss",
    price: "$12",
    period: "/month",
    blurb: "Run the whole operation.",
    features: ["Everything in Pro", "Verified badge", "Custom fonts & CSS", "Audio on profile", "Priority support", "Early access to features"],
    cta: "Become boss",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-black uppercase tracking-tight md:text-6xl">
            pick your <span className="text-gradient-crime">grind</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start free, upgrade when you're ready to flex. Cancel any time.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div key={t.name}
              className={`glass relative flex flex-col rounded-2xl p-8 ${t.highlighted ? "border-primary/60 glow-crime" : ""}`}>
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                  Most popular
                </div>
              )}
              <h3 className="text-2xl font-black uppercase">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.blurb}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-black">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="mt-8 flex-1 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button asChild className={`mt-8 w-full font-bold uppercase tracking-wider ${t.highlighted ? "glow-crime" : ""}`}
                variant={t.highlighted ? "default" : "outline"}>
                <Link to="/auth">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
