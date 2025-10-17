// supabase/functions/send-bulk-notification/index.ts
// deno-lint-ignore-file no-import-prefix

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const FIREBASE_PROJECT_ID = 'software-escolar'
const FCM_API_URL = `https://fcm.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/messages:send`

// Función para obtener el access token de Google
async function getAccessToken(serviceAccountKey: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const jwtClaimSet = {
    iss: serviceAccountKey.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }
  const jwtClaimSetEncoded = btoa(JSON.stringify(jwtClaimSet))
  
  const signatureInput = `${jwtHeader}.${jwtClaimSetEncoded}`
  
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBinary(serviceAccountKey.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  )
  
  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  
  const data = await response.json()
  return data.access_token
}

function pemToBinary(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryString = atob(pemContents)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { grupo_id, escuela_id, titulo, mensaje } = await req.json()
    
    const serviceAccountKey = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT_KEY')!)
    const accessToken = await getAccessToken(serviceAccountKey)

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    let targetUserIds: string[] = [];

    if (grupo_id) {
      const { data, error } = await supabaseAdmin.from('alumnos').select('tutor_id').eq('grupo_id', grupo_id).not('tutor_id', 'is', null);
      if (error) throw error;
      targetUserIds = data.map(item => item.tutor_id);
    } else if (escuela_id) {
      const { data: grupos, error: groupError } = await supabaseAdmin.from('grupos').select('id').eq('escuela_id', escuela_id);
      if (groupError) throw groupError;
      const groupIds = grupos.map(g => g.id);

      const { data, error } = await supabaseAdmin.from('alumnos').select('tutor_id').in('grupo_id', groupIds).not('tutor_id', 'is', null);
      if (error) throw error;
      targetUserIds = data.map(item => item.tutor_id);
    }

    const uniqueUserIds = [...new Set(targetUserIds)];

    if (uniqueUserIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No hay tutores a quienes notificar.' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: tokens, error: tokenError } = await supabaseAdmin
      .from('push_tokens')
      .select('token')
      .in('user_id', uniqueUserIds);

    if (tokenError || !tokens || tokens.length === 0) {
      throw new Error(`No se encontraron tokens para los tutores.`);
    }

    for (const { token } of tokens) {
      const notificationPayload = {
        message: {
          token: token,
          notification: { title: titulo, body: mensaje },
        },
      }
      fetch(FCM_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationPayload),
      }).catch(console.error);
    }

    return new Response(
      JSON.stringify({ success: true, message: `Notificaciones enviadas a ${tokens.length} dispositivos.` }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})