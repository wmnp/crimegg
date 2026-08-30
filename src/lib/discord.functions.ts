import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ConfigMap = Record<string, string>;

async function loadConfig(supabase: {
  from: (t: string) => { select: (c: string) => Promise<{ data: unknown }> };
}): Promise<ConfigMap> {
  const { data } = await supabase.from("app_config").select("key, value");
  const rows = (data ?? []) as { key: string; value: string }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** badge key -> app_config key holding the required Discord role name */
const BADGE_ROLE_KEYS: Record<string, string> = {
  owner: "role_owner",
  verified: "role_verified",
  og: "role_og",
  staff: "role_staff",
  vip: "role_vip",
  admin: "role_admin",
  creator: "role_content_creator",
  famous: "role_famous",
};

const DEFAULT_ROLES: ConfigMap = {
  role_owner: "Owner",
  role_verified: "Verified",
  role_og: "OG",
  role_staff: "Staff",
  role_vip: "VIP",
  role_admin: "Admin",
  role_content_creator: "Content Creator",
  role_famous: "Famous",
};

async function discordRoleNames(discordId: string): Promise<Set<string>> {
  const botToken = process.env["DISCORD_BOT_TOKEN"];
  const guildId = process.env["DISCORD_GUILD_ID"];
  if (!botToken || !guildId) throw new Error("Discord bot/guild not configured");

  const memberRes = await fetch(
    `https://discord.com/api/v10/guilds/${guildId}/members/${discordId}`,
    { headers: { Authorization: `Bot ${botToken}` } },
  );
  if (memberRes.status === 404) throw new Error("You're not in the Discord server — join it and try again");
  if (!memberRes.ok) throw new Error(`Discord error ${memberRes.status}`);
  const member = (await memberRes.json()) as { roles: string[] };

  const rolesRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}/roles`, {
    headers: { Authorization: `Bot ${botToken}` },
  });
  if (!rolesRes.ok) throw new Error(`Discord roles fetch ${rolesRes.status}`);
  const allRoles = (await rolesRes.json()) as Array<{ id: string; name: string }>;

  return new Set(
    member.roles
      .map((rid) => allRoles.find((r) => r.id === rid)?.name?.trim().toLowerCase())
      .filter(Boolean) as string[],
  );
}

/**
 * Build Discord OAuth URL. Caller (browser) opens it; Discord redirects to
 * /api/discord/callback?code=...&state=<userId> which finishes the link.
 */
export const buildDiscordOAuthUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const clientId = process.env["DISCORD_CLIENT_ID"];
    if (!clientId) throw new Error("Discord not configured (missing DISCORD_CLIENT_ID)");
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
 * Sync badge *unlocks* from Discord roles + auto milestones.
 * Equipped badges are kept, minus any that are no longer unlocked.
 */
export const syncDiscordBadges = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("id, discord_id, badges, unlocked_badges, views")
      .eq("id", userId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prof) throw new Error("Profile not found");
    if (!prof.discord_id) throw new Error("Link your Discord account first");

    const config = { ...DEFAULT_ROLES, ...(await loadConfig(supabase as never)) };
    const roleNames = await discordRoleNames(prof.discord_id);

    const unlocked = new Set<string>(
      ((prof.unlocked_badges ?? []) as string[]).filter((b) => !(b in BADGE_ROLE_KEYS)),
    );

    for (const [badge, key] of Object.entries(BADGE_ROLE_KEYS)) {
      const needed = (config[key] ?? "").trim().toLowerCase();
      if (needed && roleNames.has(needed)) unlocked.add(badge);
    }

    // Famous: also unlocked by milestones
    const { count: followerCount } = await supabase
      .from("followers")
      .select("follower_id", { count: "exact", head: true })
      .eq("profile_id", prof.id);
    const needFollowers = Number(config["famous_followers"] ?? 5000);
    const needViews = Number(config["famous_views"] ?? 1000);
    if ((followerCount ?? 0) >= needFollowers || (prof.views ?? 0) >= needViews) unlocked.add("famous");

    const unlockedList = [...unlocked];
    const equipped = ((prof.badges ?? []) as string[]).filter(
      (b) => unlockedList.includes(b) || !(b in BADGE_ROLE_KEYS),
    );

    const { error: upErr } = await supabase
      .from("profiles")
      .update({ unlocked_badges: unlockedList, badges: equipped })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    return {
      badges: equipped,
      unlocked: unlockedList,
      granted: unlockedList.filter((b) => b in BADGE_ROLE_KEYS),
      followers: followerCount ?? 0,
    };
  });

/**
 * Grant admin by Discord role — replaces the old password gate.
 * The required role name lives in app_config.role_admin.
 */
export const syncDiscordAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: prof, error } = await supabase
      .from("profiles")
      .select("handle, discord_id, is_admin")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!prof) throw new Error("Profile not found");
    if (!prof.discord_id) throw new Error("Link your Discord account in the dashboard first");

    const config = { ...DEFAULT_ROLES, ...(await loadConfig(supabase as never)) };
    const needed = (config["role_admin"] ?? "Admin").trim().toLowerCase();
    const roleNames = await discordRoleNames(prof.discord_id);
    const isAdmin = needed.length > 0 && roleNames.has(needed);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: upErr } = await supabaseAdmin
      .from("profiles")
      .update({ is_admin: isAdmin })
      .eq("id", userId);
    if (upErr) throw new Error(upErr.message);

    return { isAdmin, handle: prof.handle as string, role: config["role_admin"] ?? "Admin" };
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
