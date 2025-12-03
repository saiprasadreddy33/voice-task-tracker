import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// This function has been deprecated in favor of the backend Fastify parser.
// Keep a small handler that returns 410 Gone to avoid accidental usage.
serve(() => {
  return new Response(
    JSON.stringify({
      error: 'deprecated',
      message: 'parse-voice-task function is deprecated. Use the backend endpoint POST /api/voice-notes/parse',
    }),
    {
      status: 410,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});