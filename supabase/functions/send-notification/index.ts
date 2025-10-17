// deno-lint-ignore-file no-import-prefix

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { GoogleAuth } from "google-auth-library";

const FIREBASE_PROJECT_ID = "software-escolar";
const FCM_API_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  try {
    const { userId, title, body } = await req.json();
    const serviceAccountKey = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_KEY")!);

    const auth = new GoogleAuth({
      credentials: {
        client_email: serviceAccountKey.client_email,
        private_key: serviceAccountKey.private_key,
      },
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    const { data: tokens, error } = await supabaseAdmin
      .from("push_tokens")
      .select("token")
      .eq("user_id", userId);

    if (error || !tokens || tokens.length === 0) {
      throw new Error(`No se encontraron tokens para el usuario: ${userId}`);
    }

    for (const { token } of tokens) {
      const notificationPayload = {
        message: { token, notification: { title, body } },
      };
      await fetch(FCM_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notificationPayload),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
