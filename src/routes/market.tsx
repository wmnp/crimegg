import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Eye, Tag } from "lucide-react";

export const Route = createFileRoute("/market")({
  head: () => ({
    meta: [
      { title: "Handle marketplace — crime.gg" },
      { name: "description", content: "Buy and sell custom crime.gg handles." },
      { property: "og:title", content: "Handle marketplace — crime.gg" },
      { property: "og:description", content: "Buy and sell custom crime.gg handles." },
    ],
  }),
  component: Market,
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">{error.message}</div>
  ),
});

type Listing = {
  id: string; handle: string; display_name: string | null; avatar_url: string | null;
  accent_color: string | null; sale_price: number | null; views: number; bio: string | null;
};

function Market() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,handle,display_name,avatar_url,accent_color,sale_price,views,bio")
        .eq("for_sale" as never, true as never)
        .order("sale_price", { ascending: true })
        .limit(200);
      setListings((data as Listing[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = listings.filter((l) =>
    !q ||
    l.handle.toLowerCase().includes(q.toLowerCase()) ||
    (l.display_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-black sm:text-2xl">crime<span className="text-gradient-crime">.gg</span></Link>
          <nav className="flex gap-3 text-sm">
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground">pricing</Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-black uppercase sm:text-6xl">
            handle <span className="text-gradient-crime">market</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Buy a rare handle straight from its owner. Contact the seller via their profile.</p>
        </div>

        <div className="mx-auto mb-8 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="search handle..." className="pl-9" />
          </div>
        </div>

        {loading && <p className="text-center text-muted-foreground">loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <Tag className="mx-auto mb-3 h-8 w-8 opacity-50" />
            <p>No handles for sale right now. List yours from the dashboard.</p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => {
            const accent = l.accent_color || "#ef4444";
            return (
              <Link key={l.id} to="/u/$handle" params={{ handle: l.handle }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition hover:scale-[1.02] hover:border-primary"
                style={{ boxShadow: `0 0 0 1px transparent` }}>
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2"
                    style={{ borderColor: accent, boxShadow: `0 0 24px -6px ${accent}` }}>
                    {l.avatar_url
                      ? <img src={l.avatar_url} alt="" className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center bg-black text-xl font-black text-white">{l.handle.charAt(0).toUpperCase()}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-black uppercase">@{l.handle}</p>
                    {l.display_name && <p className="truncate text-xs text-muted-foreground">{l.display_name}</p>}
                  </div>
                </div>
                {l.bio && <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{l.bio}</p>}
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3 w-3" /> {l.views.toLocaleString()}
                  </span>
                  <span className="rounded-full px-3 py-1 text-sm font-black"
                    style={{ backgroundColor: `${accent}22`, color: accent, border: `1px solid ${accent}66` }}>
                    {l.sale_price != null ? `$${Number(l.sale_price).toLocaleString()}` : "make offer"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
