import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getPlanByStripePriceId, PLANS } from "@/lib/plans";
import { PlanType, SubscriptionStatus } from "@prisma/client";

// Disable body parsing, need raw body for webhook signature verification
export const runtime = "nodejs";

async function handleSubscriptionEvent(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const userId = subscription.metadata.userId;

  // Find user by stripe customer ID or metadata
  let user = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeCustomerId: customerId },
        { userId: userId },
      ],
    },
  });

  if (!user && userId) {
    // Create subscription record if it doesn't exist
    user = await prisma.subscription.create({
      data: {
        userId: userId,
        stripeCustomerId: customerId,
        plan: "FREE",
        status: "ACTIVE",
      },
    });
  }

  if (!user) {
    console.error("[Webhook] No user found for subscription:", subscription.id);
    return;
  }

  // Determine plan from price ID
  let plan: PlanType = "FREE";
  const planConfig = getPlanByStripePriceId(priceId);
  if (planConfig) {
    plan = planConfig.id;
  } else {
    // Try to determine plan from metadata
    const metadataPlan = subscription.metadata.planId as PlanType;
    if (metadataPlan && PLANS[metadataPlan]) {
      plan = metadataPlan;
    }
  }

  // Map Stripe status to our status
  const statusMap: Record<string, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    past_due: "PAST_DUE",
    incomplete: "INCOMPLETE",
    trialing: "TRIALING",
    incomplete_expired: "CANCELED",
    unpaid: "PAST_DUE",
    paused: "CANCELED",
  };

  const status = statusMap[subscription.status] || "ACTIVE";

  // Update subscription
  await prisma.subscription.update({
    where: { userId: user.userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      plan: plan,
      status: status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`[Webhook] Updated subscription for user ${user.userId}: ${plan} (${status})`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await prisma.subscription.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("[Webhook] No user found for deleted subscription");
    return;
  }

  // Reset to FREE plan
  await prisma.subscription.update({
    where: { userId: user.userId },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      plan: "FREE",
      status: "ACTIVE",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`[Webhook] Reset subscription for user ${user.userId} to FREE`);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId as PlanType;

  if (!userId || !planId) {
    console.error("[Webhook] Missing metadata in checkout session");
    return;
  }

  // The subscription event will handle the actual update
  console.log(`[Webhook] Checkout completed for user ${userId}, plan ${planId}`);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        // Subscription already handled by subscription events
        console.log("[Webhook] Payment succeeded");
        break;

      case "invoice.payment_failed":
        console.log("[Webhook] Payment failed");
        // Could send notification to user here
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
