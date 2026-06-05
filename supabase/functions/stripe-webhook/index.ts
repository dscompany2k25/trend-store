import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) {
    console.error("STRIPE_SECRET_KEY not configured");
    return new Response("Server error", { status: 500, headers: corsHeaders });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      // Use constructEventAsync for Deno edge runtime
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      console.log("Webhook signature verified successfully");
    } else {
      console.warn("No webhook secret or signature - parsing body directly");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400, headers: corsHeaders });
  }

  console.log("Received event type:", event.type);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.order_id;
    console.log("Payment succeeded for order:", orderId);

    if (orderId) {
      const { error } = await supabase.from("orders").update({
        payment_status: "completed",
        status: "paid",
      }).eq("id", orderId);

      if (error) {
        console.error("Error updating order:", error);
      } else {
        console.log("Order updated to paid:", orderId);
      }

      // Send TikTok purchase event server-side to ALL active pixels
      try {
        const { data: order } = await supabase.from("orders").select("*").eq("id", orderId).single();
        if (order?.tiktok_purchase_sent) {
          console.log("TikTok CompletePayment already sent for order:", orderId);
          return new Response(JSON.stringify({ received: true }), {
            status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { data: pixelSettings } = await supabase
          .from("pixel_settings")
          .select("*")
          .eq("platform", "tiktok")
          .eq("enabled", true);

        const validPixels = (pixelSettings || []).filter((p: any) => p.pixel_id && p.access_token);

        if (validPixels.length > 0 && order) {
          // Hash PII (SHA-256) — required by TikTok Events API
          const sha256 = async (v: string) => {
            const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(v.trim().toLowerCase()));
            return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
          };
          const emailHash = order.customer_email ? await sha256(order.customer_email) : undefined;
          const phoneHash = order.customer_phone ? await sha256(String(order.customer_phone).replace(/\s+/g, "")) : undefined;

          await Promise.all(validPixels.map(async (pixel: any) => {
            try {
              const res = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Access-Token": pixel.access_token },
                body: JSON.stringify({
                  event_source: "web",
                  event_source_id: pixel.pixel_id,
                  data: [{
                    event: "CompletePayment",
                    event_time: Math.floor(Date.now() / 1000),
                    event_id: orderId,
                    user: { ...(emailHash ? { email: emailHash } : {}), ...(phoneHash ? { phone: phoneHash } : {}) },
                    properties: {
                      contents: [{ content_type: "product", content_id: order.id, content_name: `Order ${order.order_number ?? order.id}` }],
                      value: order.total,
                      currency: "EUR",
                    },
                  }],
                }),
              });
              console.log(`TikTok CompletePayment to ${pixel.pixel_id}:`, await res.text());
            } catch (e) {
              console.error(`Error sending CompletePayment to ${pixel.pixel_id}:`, e);
            }
          }));
          // Mark as sent so verify-payment / retries don't double-fire
          await supabase.from("orders").update({ tiktok_purchase_sent: true }).eq("id", orderId);
        }
      } catch (e) {
        console.error("TikTok event error:", e);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderId = pi.metadata?.order_id;
    console.log("Payment failed for order:", orderId);
    if (orderId) {
      await supabase.from("orders").update({
        payment_status: "failed",
        status: "payment_failed",
      }).eq("id", orderId);
    }
  }

  // Also handle charge.succeeded as fallback
  if (event.type === "charge.succeeded") {
    const charge = event.data.object as any;
    const orderId = charge.metadata?.order_id || charge.payment_intent?.metadata?.order_id;
    console.log("Charge succeeded, order:", orderId);
    if (orderId) {
      const { data: order } = await supabase.from("orders").select("payment_status").eq("id", orderId).single();
      if (order && order.payment_status !== "completed") {
        await supabase.from("orders").update({
          payment_status: "completed",
          status: "paid",
        }).eq("id", orderId);
        console.log("Order updated to paid via charge.succeeded:", orderId);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
