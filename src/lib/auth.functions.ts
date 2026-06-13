import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const startSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  handle: z.string().regex(/^[a-z0-9_]{1,20}$/),
  inviteCode: z.string().min(1).max(64),
});

/**
 * Step 1: validate invite + handle, store pending signup keyed by email.
 * The client then triggers `supabase.auth.signInWithOtp` to actually
 * deliver the 6-digit code via Supabase's built-in auth email.
 */
export const startSignup = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => startSchema.parse(d))
  .handler(async ({ data }) => {
    const handle = data.handle.toLowerCase();
    const email = data.email.toLowerCase();

    const { data: invite } = await supabaseAdmin
      .from("invite_codes")
      .select("code, uses_remaining")
      .eq("code", data.inviteCode)
      .maybeSingle();
    if (!invite || invite.uses_remaining <= 0) {
      throw new Error("Invalid or exhausted invite code");
    }

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles").select("id").eq("handle", handle).maybeSingle();
    if (existingProfile) throw new Error("Handle already taken");

    // Make sure the email isn't already a real account
    const { data: listed } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listed?.users?.some((u) => u.email?.toLowerCase() === email)) {
      throw new Error("Email already registered — sign in instead");
    }

    const { error } = await supabaseAdmin
      .from("pending_signups")
      .upsert({ email, password: data.password, handle, invite_code: data.inviteCode });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * Step 2: called AFTER the user verifies their OTP and is signed in.
 * Promotes the just-created auth user into a real account: sets their
 * chosen password, creates their profile, decrements invite, clears pending.
 */
export const finishSignup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!user?.email) throw new Error("No verified email on session");
    const email = user.email.toLowerCase();

    const { data: pending } = await supabaseAdmin
      .from("pending_signups")
      .select("email, password, handle, invite_code")
      .eq("email", email)
      .maybeSingle();
    if (!pending) throw new Error("No pending signup for this email");
    const { password, handle, invite_code } = pending;

    // Re-check handle (race-safe)
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles").select("id").eq("handle", handle).maybeSingle();
    if (existingProfile && existingProfile.id !== userId) {
      throw new Error("Handle was just claimed by someone else");
    }

    // Set their chosen password
    const { error: pwErr } = await supabaseAdmin.auth.admin.updateUserById(userId, { password });
    if (pwErr) throw new Error(pwErr.message);

    // Create their profile
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, handle, display_name: handle });
    if (profErr && !profErr.message.includes("duplicate")) throw new Error(profErr.message);

    // Decrement invite
    const { data: invite } = await supabaseAdmin
      .from("invite_codes").select("uses_remaining").eq("code", invite_code).maybeSingle();
    if (invite) {
      await supabaseAdmin.from("invite_codes")
        .update({ uses_remaining: Math.max(0, invite.uses_remaining - 1) })
        .eq("code", invite_code);
    }

    // Clean up pending row
    await supabaseAdmin.from("pending_signups")
      .delete().eq("email", email);

    return { ok: true, handle };
  });
