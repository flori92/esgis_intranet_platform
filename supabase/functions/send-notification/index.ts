import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID')
const ONESIGNAL_API_KEY = Deno.env.get('ONESIGNAL_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipient_email, recipient_id, subject, content, channel = 'email', heading } = await req.json()

    if (!ONESIGNAL_API_KEY || !ONESIGNAL_APP_ID) {
      throw new Error('Missing OneSignal configuration in environment variables')
    }

    let payload: any = {
      app_id: ONESIGNAL_APP_ID,
    }

    if (channel === 'email') {
      if (!recipient_email) throw new Error('Recipient email is required for email channel')
      
      payload = {
        ...payload,
        email_subject: subject || "Notification ESGIS Campus",
        email_body: content,
        include_email_tokens: [recipient_email],
      }
    } else {
      // Push notification
      payload = {
        ...payload,
        headings: { "en": heading || "ESGIS Campus" },
        contents: { "en": content },
        include_external_user_ids: [recipient_id],
      }
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`,
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
