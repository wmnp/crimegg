import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/u/$handle")({
  loader: async ({ params }) => {
    const { data: profile } = await supabase
      .from("profiles").select("*").eq("handle", params.handle.toLowerCase()).maybeSingle();
    if (!profile) throw notFound();
    const { data: links } = await supabase
      .from("links").select("*").eq("profile_id", profile.id).order("sort_order");
    return { profile, links: links ?? [] };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const name = p?.display_name || p?.handle || "profile";
    return {
      meta: [
        { title: `@${p?.handle ?? "user"} — crime.gg` },
        { name: "description", content: p?.bio || `${name} on crime.gg` },
        { property: "og:title", content: `@${p?.handle} on crime.gg` },
        { property: "og:description", content: p?.bio || `${name} on crime.gg` },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center px-4 text-center">
      <div>
        <h1 className="text-7xl font-black text-gradient-crime">404</h1>
        <p className="mt-3 text-muted-foreground">Handle not found.</p>
        <Link to="/" className="mt-6 inline-block text-primary underline">go home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="flex min-h-screen items-center justify-center text-muted-foreground">{error.message}</div>
  ),
  component: ProfileView,
});

function ProfileView() {
  const { profile, links } = Route.useLoaderData();
  const accent = profile.accent_color || "#ef4444";

  return (
    <div className="min-h-screen"
      style={{
        backgroundImage: profile.background_url ? `url(${profile.background_url})` : undefined,
        backgroundSize: "cover", backgroundPosition: "center", backgroundAttachment: "fixed",
      }}>
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md flex-col items-center px-6 pt-20 pb-12 text-center">
          <div className="h-32 w-32 overflow-hidden rounded-full border-4 shadow-2xl"
            style={{ borderColor: accent, boxShadow: `0 0 60px -10px ${accent}` }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={profile.handle} className="h-full w-full object-cover" />
              : <div className="flex h-full w-full items-center justify-center bg-muted text-5xl font-black">
                  {profile.handle.charAt(0).toUpperCase()}
                </div>}
          </div>
          <h1 className="mt-5 text-3xl font-black">{profile.display_name || profile.handle}</h1>
          <p className="text-sm text-muted-foreground">@{profile.handle}</p>
          {profile.bio && <p className="mt-4 max-w-sm text-foreground/90">{profile.bio}</p>}

          <div className="mt-8 w-full space-y-3">
            {links.map((l) => (
              <a key={l.id} href={l.url} target="_blank" rel="noreferrer noopener"
                className="block rounded-xl border border-white/15 bg-white/5 px-5 py-4 font-bold uppercase tracking-wide backdrop-blur transition hover:scale-[1.02] hover:bg-white/10"
                style={{ borderColor: `${accent}55` }}>
                {l.label}
              </a>
            ))}
            {links.length === 0 && (
              <p className="text-sm text-muted-foreground">No links yet.</p>
            )}
          </div>

          <Link to="/" className="mt-12 text-xs uppercase tracking-[0.3em] text-muted-foreground hover:text-foreground">
            powered by crime.gg
          </Link>
        </div>
      </div>
    </div>
  );
}
