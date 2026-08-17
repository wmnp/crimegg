import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useDiscordInvite } from "@/lib/app-config";
import { CrimeLogo } from "@/components/crime-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Reveal } from "@/components/reveal";

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
          <div className="absolute inset-0 -z-10 animate-pulse opacity-40 [animation-duration:6s]"
            style={{ background: "radial-gradient(circle at 50% 0%, var(--crime-glow), transparent 60%)" }} />
          <CrimeLogo size={72} className="animate-float-soft mb-8" />
          <p className="reveal-in mb-6 inline-block rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
            Invite-only · v1.0
          </p>
          <h1 className="reveal-in mx-auto max-w-4xl [animation-delay:120ms] text-5xl font-black leading-[0.95] sm:text-7xl md:text-8xl">
            built for the <span className="text-gradient-crime">notorious</span>.
          </h1>
          <p className="reveal-in mx-auto mt-8 max-w-xl text-lg text-muted-foreground [animation-delay:240ms]">
            Claim your handle. Drop your links. Run the scene. crime.gg gives you a customizable profile page that hits different.
          </p>
          <div className="reveal-in mt-10 flex flex-wrap [animation-delay:360ms] items-center justify-center gap-3">
            <Button asChild size="lg" className="animate-glow-breathe press h-12 px-8 text-base font-bold uppercase tracking-wider">
              <Link to="/auth">Claim handle</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="press h-12 px-8 text-base hover:border-primary">
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-4 text-sm text-muted-foreground">
            {[
              ["12.4K", "handles claimed"],
              ["320K", "profile views"],
              ["99.9%", "uptime"],
            ].map(([n, l], i) => (
              <Reveal key={l} delay={480 + i * 120}>
                <div className="glass lift rounded-xl p-4">
                  <div className="text-2xl font-black text-foreground">{n}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider">{l}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="px-6 pb-32">
          <div className="mx-auto max-w-5xl">
            <Reveal><h2 className="mb-12 text-center text-4xl font-black uppercase tracking-tight">
              everything you need to <span className="text-gradient-crime">run it up</span>
            </h2></Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <Reveal key={f.title} delay={i * 90}>
                  <div className="glass lift group h-full rounded-2xl p-6 hover:border-primary/40">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110">
                      {f.icon}
                    </div>
                    <h3 className="text-lg font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </Reveal>
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
  const invite = useDiscordInvite();
  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <CrimeLogo size={30} withWordmark />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground sm:flex">
          <Link to="/pricing" className="underline-sweep hover:text-foreground">Pricing</Link>
          <Link to="/market" className="underline-sweep hover:text-foreground">Rare shop</Link>
          <a href={invite} target="_blank" rel="noreferrer" className="underline-sweep hover:text-foreground">Discord</a>
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex border-[#5865F2]/40 text-[#7e8aff] hover:bg-[#5865F2]/10">
            <a href={invite} target="_blank" rel="noreferrer">Discord</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth" search={{ mode: "signin" }}>Log in</Link>
          </Button>
          <Button asChild size="sm" className="press animate-glow-breathe">
            <Link to="/auth" search={{ mode: "signup" }}>Get in</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  const invite = useDiscordInvite();
  return (
    <footer className="border-t border-border/40 px-6 py-10 text-center text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} crime.gg — handle responsibly.</p>
      <p className="mt-2">
        Join the family on{" "}
        <a href={invite} target="_blank" rel="noreferrer" className="text-[#7e8aff] hover:underline">Discord</a>
      </p>
    </footer>
  );
}
