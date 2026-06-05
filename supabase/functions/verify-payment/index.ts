import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// SHA-256 hash for PII (email, phone) as required by TikTok Events API
async function sha256(value: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value.trim().toLowerCase()));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Send a CompletePayment event to all active TikTok pixels (idempotent via order flag + event_id).
async function sendTikTokPurchase(supabase: any, order: any) {
  try {
    const { data: pixelSettings } = await supabase
      .from("pixel_settings").select("*").eq("platform", "tiktok").eq("enabled", true);
    const validPixels = (pixelSettings || []).filter((p: any) => p.pixel_id && p.access_token);
    if (validPixels.length === 0) {
      console.log("No active TikTok pixel configured");
      return;
    }

    const emailHash = order.customer_email ? await sha256(order.customer_email) : undefined;
    const phoneHash = order.customer_phone ? await sha256(String(order.customer_phone).replace(/\s+/g, "")) : undefined;
    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.length > 0
      ? items.map((it: any) => ({
          content_type: "product",
          content_id: String(it.id || order.id),
          content_name: it.name || `Order ${order.order_number ?? order.id}`,
          quantity: it.quantity || 1,
          price: it.price || undefined,
        }))
      : [{ content_type: "product", content_id: order.id, content_name: `Order ${order.order_number ?? order.id}` }];

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
              event_id: order.id, // stable id => TikTok dedups against the browser/webhook event
              user: { ...(emailHash ? { email: emailHash } : {}), ...(phoneHash ? { phone: phoneHash } : {}) },
              properties: { contents, value: order.total, currency: "EUR" },
            }],
          }),
        });
        console.log(`TikTok CompletePayment to ${pixel.pixel_id}:`, await res.text());
      } catch (e) {
        console.error(`Error sending CompletePayment to ${pixel.pixel_id}:`, e);
      }
    }));
  } catch (e) {
    console.error("sendTikTokPurchase error:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const { payment_intent_id, order_id } = await req.json();

    if (!payment_intent_id && !order_id) {
      return new Response(JSON.stringify({ error: "Missing payment_intent_id or order_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Retrieve the PaymentIntent directly from Stripe (source of truth)
    const pi = await stripe.paymentIntents.retrieve(payment_intent_id);
    const resolvedOrderId = (pi.metadata?.order_id as string) || order_id;

    if (!resolvedOrderId) {
      return new Response(JSON.stringify({ error: "No order_id associated with this payment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pi.status === "succeeded") {
      // Idempotent: only update if not already completed
      const { data: existing } = await supabase
        .from("orders").select("*").eq("id", resolvedOrderId).single();

      if (existing && existing.payment_status !== "completed") {
        const { error } = await supabase.from("orders").update({
          payment_status: "completed",
          status: "paid",
        }).eq("id", resolvedOrderId);
        if (error) throw error;
        console.log("Order marked paid via verify-payment:", resolvedOrderId);
      }

      // Fire TikTok CompletePayment exactly once per order
      if (existing && !existing.tiktok_purchase_sent) {
        await sendTikTokPurchase(supabase, existing);
        await supabase.from("orders").update({ tiktok_purchase_sent: true }).eq("id", resolvedOrderId);
      }

      return new Response(JSON.stringify({ paid: true, status: pi.status, order_id: resolvedOrderId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (pi.status === "payment_failed" || pi.status === "canceled") {
      await supabase.from("orders").update({
        payment_status: "failed",
        status: "payment_failed",
      }).eq("id", resolvedOrderId);
    }

    return new Response(JSON.stringify({ paid: false, status: pi.status, order_id: resolvedOrderId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("verify-payment error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});