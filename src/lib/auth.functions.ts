import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  handle: z.string().regex(/^[a-z0-9_]{2,20}$/),
  inviteCode: z.string().min(1).max(64),
});

export const signupWithInvite = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signupSchema.parse(d))
  .handler(async ({ data }) => {
    const handle = data.handle.toLowerCase();

    // Validate invite
    const { data: invite } = await supabaseAdmin
      .from("invite_codes")
      .select("code, uses_remaining")
      .eq("code", data.inviteCode)
      .maybeSingle();
    if (!invite || invite.uses_remaining <= 0) {
      throw new Error("Invalid or exhausted invite code");
    }

    // Handle uniqueness
    const { data: existing } = await supabaseAdmin
      .from("profiles").select("id").eq("handle", handle).maybeSingle();
    if (existing) throw new Error("Handle already taken");

    // Create user (auto-confirm)
    const { data: created, error: signErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (signErr || !created.user) throw new Error(signErr?.message ?? "Failed to create account");

    // Create profile
    const { error: profErr } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      handle,
      display_name: handle,
    });
    if (profErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(profErr.message);
    }

    // Decrement invite
    await supabaseAdmin
      .from("invite_codes")
      .update({ uses_remaining: invite.uses_remaining - 1 })
      .eq("code", invite.code);

    return { ok: true };
  });
