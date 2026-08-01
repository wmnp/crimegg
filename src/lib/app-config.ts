import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DISCORD_INVITE } from "@/lib/themes";

export const CONFIG_DEFAULTS: Record<string, string> = {
  discord_invite: DISCORD_INVITE,
  role_verified: "Verified",
  role_og: "OG",
  role_staff: "Staff",
  role_vip: "VIP",
  role_admin: "Admin",
  role_content_creator: "Content Creator",
  role_famous: "Famous",
  famous_followers: "5000",
  famous_views: "1000",
};

export type AppConfig = Record<string, string>;

let cache: AppConfig | null = null;

export async function fetchAppConfig(): Promise<AppConfig> {
  const { data } = await supabase.from("app_config").select("key, value");
  const rows = (data ?? []) as { key: string; value: string }[];
  cache = { ...CONFIG_DEFAULTS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };
  return cache;
}

export function useAppConfig() {
  const [config, setConfig] = useState<AppConfig>(cache ?? CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(!cache);

  const reload = useCallback(async () => {
    setLoading(true);
    const next = await fetchAppConfig();
    setConfig(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  return { config, loading, reload };
}

export function useDiscordInvite(): string {
  const { config } = useAppConfig();
  return config.discord_invite || DISCORD_INVITE;
}
