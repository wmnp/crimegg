import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export function FollowButton({ profileId, accent }: { profileId: string; accent: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
      const { count: c } = await supabase.from("followers" as never)
        .select("*", { count: "exact", head: true })
        .eq("profile_id" as never, profileId as never);
      setCount(c ?? 0);
      if (user) {
        const { data } = await supabase.from("followers" as never)
          .select("follower_id").eq("profile_id" as never, profileId as never)
          .eq("follower_id" as never, user.id as never).maybeSingle();
        setFollowing(!!data);
      }
    })();
  }, [profileId]);

  async function toggle() {
    if (!userId) { toast("Sign in to follow"); return; }
    setBusy(true);
    if (following) {
      await supabase.from("followers" as never).delete()
        .eq("profile_id" as never, profileId as never)
        .eq("follower_id" as never, userId as never);
      setFollowing(false); setCount((c) => c - 1);
    } else {
      const { error } = await supabase.from("followers" as never)
        .insert({ profile_id: profileId, follower_id: userId } as never);
      if (!error) { setFollowing(true); setCount((c) => c + 1); }
    }
    setBusy(false);
  }

  return (
    <button onClick={toggle} disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider transition hover:scale-105"
      style={{
        borderColor: `${accent}66`,
        backgroundColor: following ? accent : "transparent",
        color: following ? "white" : accent,
        boxShadow: following ? `0 0 18px -3px ${accent}` : undefined,
      }}>
      <Heart className={`h-3 w-3 ${following ? "fill-current" : ""}`} />
      {following ? "following" : "follow"} · {count}
    </button>
  );
}
