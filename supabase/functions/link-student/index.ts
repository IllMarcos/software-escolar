// deno-lint-ignore-file no-import-prefix

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { inviteCode } = await req.json();
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) throw new Error("Token no proporcionado.");

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) throw new Error("Usuario no autenticado.");
    if (!inviteCode) throw new Error("Código de invitación no proporcionado.");

    const { data: student, error: findError } = await supabaseAdmin
      .from("alumnos")
      .select("id, tutor_id")
      .eq("codigo_invitacion", inviteCode)
      .single();

    if (findError) throw new Error("Código de invitación inválido.");
    if (student.tutor_id) throw new Error("Este código ya ha sido utilizado.");

    const { error: updateError } = await supabaseAdmin
      .from("alumnos")
      .update({ tutor_id: user.id, codigo_invitacion: null })
      .eq("id", student.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ message: "Vinculación exitosa" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
