import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY no configurada");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const { order_id, amount, email, name, phone } = await req.json();

    if (!order_id || !amount) {
      return new Response(JSON.stringify({ error: "Faltan campos requeridos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: "eur",
      payment_method_types: ["card", "bizum", "link"],
      description: `Pedido ${order_id}`,
      receipt_email: email || undefined,
      metadata: {
        order_id,
        customer_name: name || "",
        customer_phone: phone || "",
      },
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    await supabase.from("orders").update({
      payment_status: "processing",
      status: "awaiting_payment",
    }).eq("id", order_id);

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
      publishable_key: Deno.env.get("STRIPE_PUBLISHABLE_KEY") || "",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    console.error("create-payment-intent error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
