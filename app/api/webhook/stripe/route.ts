import { createOrder } from "./../../../../lib/actions/order.actions";
import stripe from "stripe";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.text();

  const sig = request.headers.get(
    "stripe-signature"
  ) as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      endpointSecret
    );
  } catch (err) {
    return NextResponse.json({
      message: "Webhook error",
      error: err,
    });
  }

  // Get the ID and type
  const eventType = event.type;

  // CREATE
  if (eventType === "checkout.session.completed") {
    const session = event.data
      .object as stripe.Checkout.Session;

    const order = {
      stripeId: session.id,
      eventId: session.metadata?.eventId || "",
      buyerId: session.metadata?.buyerId || "",
      totalAmount: session.amount_total
        ? (session.amount_total / 100).toString()
        : "0",
      createdAt: new Date(),
    };

    const newOrder = await createOrder(order);
    return NextResponse.json({
      message: "OK",
      order: newOrder,
    });
  }

  return new Response("", { status: 200 });
}
