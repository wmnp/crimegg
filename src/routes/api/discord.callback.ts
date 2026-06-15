import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const userId = url.searchParams.get("state");
        if (!code || !userId) {
          return new Response("Missing code/state", { status: 400 });
        }
        const clientId = process.env.DISCORD_CLIENT_ID;
        const clientSecret = process.env.DISCORD_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
          return new Response("Discord OAuth not configured", { status: 500 });
        }

        const redirect = `${url.origin}/api/discord/callback`;
        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: "authorization_code",
            code,
            redirect_uri: redirect,
          }),
        });
        if (!tokenRes.ok) {
          return new Response(`Discord token exchange failed: ${tokenRes.status}`, { status: 500 });
        }
        const token = await tokenRes.json() as { access_token: string };

        const meRes = await fetch("https://discord.com/api/users/@me", {
          headers: { Authorization: `Bearer ${token.access_token}` },
        });
        if (!meRes.ok) {
          return new Response("Discord identity fetch failed", { status: 500 });
        }
        const me = await meRes.json() as { id: string; username: string };

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        // ensure uniqueness — if this discord_id already belongs to someone else, reject
        const { data: existing } = await supabaseAdmin
          .from("profiles").select("id").eq("discord_id", me.id).maybeSingle();
        if (existing && existing.id !== userId) {
          return new Response(
            `<html><body style="font-family:system-ui;background:#0a0a0a;color:#fff;padding:40px;text-align:center"><h1>Already linked</h1><p>That Discord account is already linked to a different crime.gg user.</p><a href="/dashboard" style="color:#ef4444">← back</a></body></html>`,
            { status: 409, headers: { "Content-Type": "text/html" } },
          );
        }
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({ discord_id: me.id, discord_username: me.username })
          .eq("id", userId);
        if (error) {
          return new Response(`Could not save: ${error.message}`, { status: 500 });
        }

        return new Response(null, {
          status: 302,
          headers: { Location: "/dashboard?discord=linked" },
        });
      },
    },
  },
});
