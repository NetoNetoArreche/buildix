import Stripe from "stripe";

// Initialize Stripe client (server-side only)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
  typescript: true,
});

// Get Stripe configuration
export function getStripeConfig() {
  return {
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
    secretKey: process.env.STRIPE_SECRET_KEY!,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  };
}

// Utility to format amount for Stripe (converts BRL to centavos)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100);
}

// Utility to format amount from Stripe (converts centavos to BRL)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100;
}
