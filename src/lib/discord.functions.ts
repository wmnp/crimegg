import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GUILD_ROLE_BADGE_MAP: Record<string, string> = {
  // role name (lowercased) -> badge key
  verified: "verified",
  og: "og",
  staff: "staff",
  vip: "vip",
};

/**
 * Build Discord OAuth URL. Caller (browser) opens it; Discord redirects to
 * /api/discord/callback?code=...&state=<userId> which finishes the link.
 */
export const buildDiscordOAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    if (!clientId) throw new Error("Discord not configured (missing DISCORD_CLIENT_ID)");
    // Browser sends us its origin so the redirect works on preview + production
    // We can derive it from the request:
    const { getRequest } = await import("@tanstack/react-start/server");
    const url = new URL(getRequest().url);
    const redirect = `${url.origin}/api/discord/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: "code",
      scope: "identify",
      state: context.userId,
      prompt: "consent",
    });
    return { url: `https://discord.com/api/oauth2/authorize?${params}` };
  });

/**
 * Sync badges from Discord roles. Requires the user has linked their Discord
 * (discord_id set on profile) AND is a member of the configured guild.
 */
export const syncDiscordBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!botToken || !guildId) throw new Error("Discord bot/guild not configured");

    const { supabase, userId } = context;
    const { data: prof, error: pErr } = await supabase
      .from("profiles").select("discord_id, badges").eq("id", userId).maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof?.discord_id) throw new Error("Link your Discord account first");

    // Fetch member from guild
    const memberRes = await fetch(
      `https://discord.com/api/v10/guilds/${guildId}/members/${prof.discord_id}`,
      { headers: { Authorization: `Bot ${botToken}` } },
    );
    if (memberRes.status === 404) throw new Error("You're not in the Discord server. Join discord.gg/MmkRt6mYV");
    if (!memberRes.ok) throw new Error(`Discord error ${memberRes.status}`);
    const member = await memberRes.json() as { roles: string[] };

    // Fetch all guild roles to translate IDs -> names
    const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
      headers: { Authorization: `Bot ${botToken}` },
    });
    if (!rolesRes.ok) throw new Error(`Discord roles fetch ${rolesRes.status}`);
    const allRoles = await rolesRes.json() as Array<{ id: string; name: string }>;

    const userRoleNames = new Set(
      member.roles
        .map((rid) => allRoles.find((r) => r.id === rid)?.name?.toLowerCase())
        .filter(Boolean) as string[],
    );

    // Strip discord-controlled badges, then re-add based on current roles
    const existing = (prof.badges ?? []) as string[];
    const stripped = existing.filter((b) => !(b in GUILD_ROLE_BADGE_MAP));
    const synced = [...stripped];
    for (const [roleName, badgeKey] of Object.entries(GUILD_ROLE_BADGE_MAP)) {
      if (userRoleNames.has(roleName) && !synced.includes(badgeKey)) synced.push(badgeKey);
    }

    const { error: upErr } = await supabase.from("profiles").update({ badges: synced }).eq("id", userId);
    if (upErr) throw new Error(upErr.message);
    return { badges: synced, granted: synced.filter((b) => b in GUILD_ROLE_BADGE_MAP) };
  });

export const unlinkDiscord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({ discord_id: null, discord_username: null })
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const _exportedSchemaForTypecheck = z.object({}); // satisfy zod import
