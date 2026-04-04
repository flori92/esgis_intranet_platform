/**
 * Supabase Edge Function — Envoi de SMS via Twilio
 *
 * Variables d'environnement requises (à configurer dans Supabase Dashboard > Edge Functions):
 *   TWILIO_ACCOUNT_SID   - SID du compte Twilio
 *   TWILIO_AUTH_TOKEN     - Token d'authentification Twilio
 *   TWILIO_PHONE_NUMBER   - Numéro Twilio expéditeur (format: +1234567890)
 *
 * Alternative: MessageBird
 *   MESSAGEBIRD_API_KEY   - Clé API MessageBird
 *   MESSAGEBIRD_ORIGINATOR - Nom ou numéro expéditeur
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(
        JSON.stringify({ error: 'Paramètres "to" et "message" requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === TWILIO ===
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (accountSid && authToken && fromNumber) {
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        },
        body: new URLSearchParams({
          To: to,
          From: fromNumber,
          Body: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur Twilio');
      }

      return new Response(
        JSON.stringify({ success: true, sid: result.sid }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === MESSAGEBIRD (alternative) ===
    const messageBirdKey = Deno.env.get('MESSAGEBIRD_API_KEY');
    const originator = Deno.env.get('MESSAGEBIRD_ORIGINATOR') || 'ESGIS';

    if (messageBirdKey) {
      const response = await fetch('https://rest.messagebird.com/messages', {
        method: 'POST',
        headers: {
          Authorization: `AccessKey ${messageBirdKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originator,
          recipients: [to],
          body: message,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.errors?.[0]?.description || 'Erreur MessageBird');
      }

      return new Response(
        JSON.stringify({ success: true, id: result.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Aucun service SMS configuré. Ajoutez TWILIO_ACCOUNT_SID ou MESSAGEBIRD_API_KEY.',
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
