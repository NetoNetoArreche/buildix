import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, formatAmountForStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { PLANS } from "@/lib/plans";
import { PlanType } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, billingPeriod } = await req.json();

    // Validate plan
    const plan = PLANS[planId as PlanType];
    if (!plan || planId === "FREE") {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get or create Stripe customer
    let subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    let customerId = subscription?.stripeCustomerId;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Create or update subscription record with customer ID
      if (subscription) {
        await prisma.subscription.update({
          where: { userId: user.id },
          data: { stripeCustomerId: customerId },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId: user.id,
            stripeCustomerId: customerId,
            plan: "FREE",
            status: "ACTIVE",
          },
        });
      }
    }

    // Get the appropriate price ID
    const priceId =
      billingPeriod === "yearly"
        ? plan.stripePriceIdYearly
        : plan.stripePriceIdMonthly;

    // If no price ID is configured, create a checkout session with inline price
    const amount =
      billingPeriod === "yearly" ? plan.priceYearly : plan.price;

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      metadata: {
        userId: user.id,
        planId: planId,
        billingPeriod: billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          planId: planId,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: "required",
      locale: "pt-BR",
    };

    // Use configured price ID if available, otherwise create inline price
    if (priceId) {
      sessionConfig.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    } else {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Buildix ${plan.name}`,
              description: plan.description,
            },
            unit_amount: formatAmountForStripe(amount),
            recurring: {
              interval: billingPeriod === "yearly" ? "year" : "month",
            },
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
