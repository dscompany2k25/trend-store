// Seeds the initial admin user. Idempotent.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ADMIN_EMAIL = "scalemarketing.pro@gmail.com";
const ADMIN_PASSWORD = "Picanha123";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let userId: string | null = null;

    // Try to find existing user
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u: any) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

    if (existing) {
      userId = existing.id;
      // Reset password & ensure confirmed
      await supabase.auth.admin.updateUserById(existing.id, {
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
    } else {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = created.user!.id;
    }

    // Assign admin role (idempotent)
    if (userId) {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!existingRole) {
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: "admin" });
        if (roleErr) throw roleErr;
      }
    }

    return new Response(JSON.stringify({ ok: true, user_id: userId, email: ADMIN_EMAIL }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("seed-admin error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
