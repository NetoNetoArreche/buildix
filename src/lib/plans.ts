// Buildix Subscription Plans Configuration
// Prices in BRL (Brazilian Reais)

import { PlanType } from "@prisma/client";

export interface PlanLimits {
  promptsPerMonth: number;
  imagesPerMonth: number;
  figmaExportsPerMonth: number;
  htmlExportsPerMonth: number; // -1 = ilimitado
  pagesPerProject: number; // -1 = ilimitado
  imageUploadsLimit: number; // -1 = ilimitado (quantidade máxima de uploads do PC)
}

export interface PlanFeature {
  name: string;
  included: boolean;
  limit?: string;
}

export interface Plan {
  id: PlanType;
  name: string;
  description: string;
  price: number; // Monthly price in BRL
  priceYearly: number; // Yearly price in BRL (with discount)
  stripePriceIdMonthly?: string; // Stripe price ID for monthly billing
  stripePriceIdYearly?: string; // Stripe price ID for yearly billing
  limits: PlanLimits;
  features: PlanFeature[];
  highlighted?: boolean;
  badge?: string;
}

export const PLANS: Record<PlanType, Plan> = {
  FREE: {
    id: "FREE",
    name: "Free",
    description: "Para começar a explorar o Buildix",
    price: 0,
    priceYearly: 0,
    limits: {
      promptsPerMonth: 5,
      imagesPerMonth: 0,
      figmaExportsPerMonth: 0,
      htmlExportsPerMonth: 2,
      pagesPerProject: 2,
      imageUploadsLimit: 20,
    },
    features: [
      { name: "5 prompts por mês", included: true },
      { name: "2 páginas por projeto", included: true },
      { name: "2 exports HTML", included: true },
      { name: "Apenas uso pessoal", included: true },
      { name: "Geração de imagens AI", included: false },
      { name: "Export para Figma", included: false },
      { name: "Componentes e Templates PRO", included: false },
      { name: "Uso comercial", included: false },
    ],
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    description: "Para criadores e freelancers",
    price: 108,
    priceYearly: 1080, // ~17% discount
    stripePriceIdMonthly: "price_1Scb8QJrGZIzeE3NlxOQZlRV",
    stripePriceIdYearly: "price_1Scb8rJrGZIzeE3NCmj2qxwk",
    limits: {
      promptsPerMonth: 120,
      imagesPerMonth: 30,
      figmaExportsPerMonth: 20,
      htmlExportsPerMonth: -1, // ilimitado
      pagesPerProject: 100,
      imageUploadsLimit: 200,
    },
    features: [
      { name: "120 prompts por mês", included: true },
      { name: "30 imagens AI por mês", included: true },
      { name: "100 páginas por projeto", included: true },
      { name: "Export HTML ilimitado", included: true },
      { name: "20 exports Figma", included: true },
      { name: "Componentes e Templates PRO", included: true },
      { name: "Uso comercial", included: true },
      { name: "Suporte prioritário", included: false },
    ],
    highlighted: true,
    badge: "Mais Popular",
  },
  MAX: {
    id: "MAX",
    name: "Max",
    description: "Para agências e equipes",
    price: 217,
    priceYearly: 2170, // ~17% discount
    stripePriceIdMonthly: "price_1ScbBFJrGZIzeE3Najd3GLF3",
    stripePriceIdYearly: "price_1ScbBUJrGZIzeE3NbqOZwosH",
    limits: {
      promptsPerMonth: 240,
      imagesPerMonth: 60,
      figmaExportsPerMonth: 50,
      htmlExportsPerMonth: -1, // ilimitado
      pagesPerProject: 100,
      imageUploadsLimit: 500,
    },
    features: [
      { name: "240 prompts por mês", included: true },
      { name: "60 imagens AI por mês", included: true },
      { name: "100 páginas por projeto", included: true },
      { name: "Export HTML ilimitado", included: true },
      { name: "50 exports Figma", included: true },
      { name: "Componentes e Templates PRO", included: true },
      { name: "Uso comercial", included: true },
      { name: "Suporte prioritário", included: true },
    ],
  },
  ULTRA: {
    id: "ULTRA",
    name: "Ultra",
    description: "Para uso intensivo e empresas",
    price: 543,
    priceYearly: 5430, // ~17% discount
    stripePriceIdMonthly: "price_1ScbC2JrGZIzeE3NPZY7s2hG",
    stripePriceIdYearly: "price_1ScbCQJrGZIzeE3NDsh9Di5T",
    limits: {
      promptsPerMonth: 560,
      imagesPerMonth: 140,
      figmaExportsPerMonth: 100,
      htmlExportsPerMonth: -1, // ilimitado
      pagesPerProject: -1, // ilimitado
      imageUploadsLimit: -1, // ilimitado
    },
    features: [
      { name: "560 prompts por mês", included: true },
      { name: "140 imagens AI por mês", included: true },
      { name: "Páginas ilimitadas por projeto", included: true },
      { name: "Export HTML ilimitado", included: true },
      { name: "100 exports Figma", included: true },
      { name: "Componentes e Templates PRO", included: true },
      { name: "Uso comercial", included: true },
      { name: "Suporte prioritário", included: true },
    ],
    badge: "Melhor Valor",
  },
};

// Helper functions
export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLANS[plan].limits;
}

export function getPlanByStripePriceId(priceId: string): Plan | undefined {
  return Object.values(PLANS).find(
    (plan) =>
      plan.stripePriceIdMonthly === priceId ||
      plan.stripePriceIdYearly === priceId
  );
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function getYearlyDiscount(plan: Plan): number {
  if (plan.price === 0) return 0;
  const monthlyTotal = plan.price * 12;
  const discount = ((monthlyTotal - plan.priceYearly) / monthlyTotal) * 100;
  return Math.round(discount);
}
