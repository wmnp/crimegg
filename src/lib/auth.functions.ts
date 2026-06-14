import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  handle: z.string().regex(/^[a-z0-9_]{1,20}$/),
  inviteCode: z.string().min(1).max(64),
});

/**
 * One-shot signup: validate invite + handle, create the auth user
 * (auto-confirmed), create their profile, decrement invite.
 * No email verification step.
 */
export const signupNow = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => signupSchema.parse(d))
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

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (createErr || !created.user) {
      throw new Error(createErr?.message || "Could not create account");
    }
    const userId = created.user.id;

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, handle, display_name: handle });
    if (profErr && !profErr.message.includes("duplicate")) {
      // rollback the auth user so they can retry
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(profErr.message);
    }

    await supabaseAdmin.from("invite_codes")
      .update({ uses_remaining: Math.max(0, invite.uses_remaining - 1) })
      .eq("code", data.inviteCode);

    return { ok: true, handle };
  });
