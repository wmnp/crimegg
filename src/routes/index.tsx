import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { DISCORD_INVITE } from "@/lib/themes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "crime.gg — your handle, your rules" },
      { name: "description", content: "Claim your custom handle on crime.gg. Build a notorious profile. Invite-only." },
      { property: "og:title", content: "crime.gg" },
      { property: "og:description", content: "Claim your custom handle on crime.gg. Invite-only." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="relative overflow-hidden px-6 pt-28 pb-32 text-center">
          <div className="absolute inset-0 -z-10 opacity-40"
            style={{ background: "radial-gradient(circle at 50% 0%, var(--crime-glow), transparent 60%)" }} />
          <p className="mb-6 inline-block rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Invite-only · v1.0
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.95] sm:text-7xl md:text-8xl">
            built for the <span className="text-gradient-crime">notorious</span>.
          </h1>
          <p className="mx-auto mt-8 max-w-xl text-lg text-muted-foreground">
            Claim your handle. Drop your links. Run the scene. crime.gg gives you a customizable profile page that hits different.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="glow-crime h-12 px-8 text-base font-bold uppercase tracking-wider">
              <Link to="/auth">Claim handle</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 px-8 text-base">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 text-sm text-muted-foreground">
            {[
              ["12.4K", "handles claimed"],
              ["320K", "profile views"],
              ["99.9%", "uptime"],
            ].map(([n, l]) => (
              <div key={l} className="glass rounded-xl p-4">
                <div className="text-2xl font-black text-foreground">{n}</div>
                <div className="mt-1 text-xs uppercase tracking-wider">{l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-4xl font-black uppercase tracking-tight">
              everything you need to <span className="text-gradient-crime">run it up</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <div key={f.title} className="glass rounded-2xl p-6 transition hover:border-primary/40">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
                    {f.icon}
                  </div>
                  <h3 className="text-lg font-bold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const features = [
  { icon: "🔫", title: "Custom handles", desc: "crime.gg/yourname. Two to twenty characters. First come, first served." },
  { icon: "🎨", title: "Full customization", desc: "Accent colors, backgrounds, avatars. Make it yours." },
  { icon: "🔗", title: "Unlimited links", desc: "Drop every socials, store, discord — all in one place." },
  { icon: "⚡", title: "Lightning fast", desc: "Edge-hosted. Pages load before they finish typing." },
  { icon: "🎟️", title: "Invite-only", desc: "Keeps the riff-raff out. You're already in if you have a code." },
  { icon: "💎", title: "Premium tier", desc: "Animated backgrounds, custom fonts, badges, and more." },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl font-black tracking-tight">crime<span className="text-gradient-crime">.gg</span></span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground sm:flex">
          <Link to="/pricing" className="transition hover:text-foreground">Pricing</Link>
          <Link to="/market" className="transition hover:text-foreground">Market</Link>
          <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="transition hover:text-foreground">Discord</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-[#5865F2]/40 text-[#7e8aff] hover:bg-[#5865F2]/10">
            <a href={DISCORD_INVITE} target="_blank" rel="noreferrer">Discord</a>
          </Button>
          <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
          <Button asChild size="sm" className="glow-crime"><Link to="/auth">Get in</Link></Button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-10 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} crime.gg — handle responsibly.</p>
      <p className="mt-2">
        Join the family on{" "}
        <a href={DISCORD_INVITE} target="_blank" rel="noreferrer" className="text-[#7e8aff] hover:underline">Discord</a>
      </p>
    </footer>
  );
}
