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

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id es obligatorio" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Recalculate total from DB — never trust the client-submitted amount
    const { data: dbOrder, error: orderErr } = await supabase
      .from("orders")
      .select("subtotal, shipping_cost, total, status")
      .eq("id", order_id)
      .single();

    if (orderErr || !dbOrder) {
      return new Response(JSON.stringify({ error: "Pedido no encontrado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the server-stored total — prevents client from manipulating the amount
    const serverTotal = Number(dbOrder.total);
    if (!serverTotal || serverTotal <= 0) {
      return new Response(JSON.stringify({ error: "Importe del pedido no válido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log if client amount doesn't match (don't block, just use server value)
    if (amount && Math.abs(Number(amount) - serverTotal) > 0.01) {
      console.warn(`Amount mismatch for order ${order_id}: client=${amount}, server=${serverTotal}`);
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(serverTotal * 100),
      currency: "eur",
      payment_method_types: ["card", "bizum", "link"],
      description: `Pedido ${order_id}`,
      receipt_email: email || undefined,
      // Idempotency key prevents duplicate PI creation on retries
      metadata: {
        order_id,
        customer_name: name || "",
        customer_phone: phone || "",
      },
    }, {
      idempotencyKey: `pi_order_${order_id}`,
    });

    await supabase.from("orders").update({
      payment_status: "processing",
      status: dbOrder.status === 'draft' ? 'draft' : "awaiting_payment",
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
