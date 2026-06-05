import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA-256 hash for PII (email, phone) as required by TikTok Events API
async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { event_name, event_id, properties, user_data, event_source_url } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: pixelSettings } = await supabase
      .from("pixel_settings")
      .select("*")
      .eq("platform", "tiktok")
      .eq("enabled", true);

    const validPixels = (pixelSettings || []).filter(
      (p) => p.pixel_id && p.access_token
    );

    if (validPixels.length === 0) {
      console.log("No active pixel configured");
      return new Response(JSON.stringify({ success: false, reason: "No pixel configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Capture context from the HTTP request
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    // Build user object — hash any PII before sending
    const user: Record<string, any> = { ...(user_data || {}) };
    if (user.email && typeof user.email === "string" && !user.email.match(/^[a-f0-9]{64}$/)) {
      user.email = await sha256(user.email);
    }
    if (user.phone && typeof user.phone === "string" && !user.phone.match(/^[a-f0-9]{64}$/)) {
      user.phone = await sha256(user.phone.replace(/\s+/g, ""));
    }
    if (ip) user.ip = ip;
    if (userAgent) user.user_agent = userAgent;

    // Send the event to ALL active pixels in parallel
    const results = await Promise.all(
      validPixels.map(async (pixel) => {
        const payload = {
          event_source: "web",
          event_source_id: pixel.pixel_id,
          data: [
            {
              event: event_name,
              event_time: Math.floor(Date.now() / 1000),
              event_id: event_id || `${event_name}_${Date.now()}`,
              user,
              properties: properties || {},
              page: event_source_url ? { url: event_source_url } : undefined,
            },
          ],
        };

        try {
          const response = await fetch(
            "https://business-api.tiktok.com/open_api/v1.3/event/track/",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Access-Token": pixel.access_token,
              },
              body: JSON.stringify(payload),
            }
          );
          const result = await response.json();
          console.log(`TikTok pixel ${pixel.pixel_id} response:`, JSON.stringify(result));
          if (result.code !== 0) {
            console.error(`TikTok rejected event for pixel ${pixel.pixel_id}:`, JSON.stringify(payload));
          }
          return { pixel_id: pixel.pixel_id, success: result.code === 0, result };
        } catch (err: any) {
          console.error(`Error sending to pixel ${pixel.pixel_id}:`, err);
          return { pixel_id: pixel.pixel_id, success: false, error: err.message };
        }
      })
    );

    const allSuccess = results.every((r) => r.success);

    return new Response(JSON.stringify({ success: allSuccess, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("TikTok event error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
