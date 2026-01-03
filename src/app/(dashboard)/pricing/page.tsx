"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Check, Loader2, X, ExternalLink, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PLANS, formatPrice, getYearlyDiscount } from "@/lib/plans";
import { PlanType } from "@prisma/client";

interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  isLimitReached: boolean;
  percentUsed: number;
}

interface UsageInfo {
  plan: PlanType;
  prompts: UsageStatus;
  images: UsageStatus;
  figmaExports: UsageStatus;
  htmlExports: UsageStatus;
  periodStart: string;
  periodEnd: string;
}

// Re-export PlanType for use in this file
export type { PlanType };

const planNumbers: Record<PlanType, string> = {
  FREE: "01",
  PRO: "02",
  MAX: "03",
  ULTRA: "04",
};

const planColors: Record<PlanType, { bg: string; text: string; border: string }> = {
  FREE: {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    text: "text-slate-600 dark:text-slate-400",
    border: "border-slate-200 dark:border-slate-800",
  },
  PRO: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  MAX: {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  ULTRA: {
    bg: "bg-orange-50 dark:bg-orange-900/20",
    text: "text-orange-600 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
};

// Feature comparison data
const featureCategories = [
  {
    name: "Limites de Uso",
    features: [
      {
        name: "Prompts por mes",
        FREE: "5",
        PRO: "120",
        MAX: "240",
        ULTRA: "560",
      },
      {
        name: "Imagens AI por mes",
        FREE: "0",
        PRO: "30",
        MAX: "60",
        ULTRA: "140",
      },
      {
        name: "Paginas por projeto",
        FREE: "2",
        PRO: "100",
        MAX: "100",
        ULTRA: "Ilimitado",
      },
    ],
  },
  {
    name: "Exportacao",
    features: [
      {
        name: "Export HTML",
        FREE: "2/mes",
        PRO: "Ilimitado",
        MAX: "Ilimitado",
        ULTRA: "Ilimitado",
      },
      {
        name: "Export Figma",
        FREE: false,
        PRO: "20/mes",
        MAX: "50/mes",
        ULTRA: "100/mes",
      },
    ],
  },
  {
    name: "Recursos",
    features: [
      {
        name: "Componentes e Templates PRO",
        FREE: false,
        PRO: true,
        MAX: true,
        ULTRA: true,
      },
      {
        name: "Uso comercial",
        FREE: false,
        PRO: true,
        MAX: true,
        ULTRA: true,
      },
      {
        name: "Suporte prioritario",
        FREE: false,
        PRO: false,
        MAX: true,
        ULTRA: true,
      },
    ],
  },
];

// FAQ data
const faqItems = [
  {
    question: "O que sao prompts?",
    answer:
      "Prompts sao solicitacoes de geracao ou edicao de conteudo usando nossa IA. Cada vez que voce pede para a IA criar ou modificar algo, conta como 1 prompt.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Voce pode cancelar sua assinatura a qualquer momento. Voce continuara tendo acesso ate o fim do periodo pago.",
  },
  {
    question: "O que acontece se eu atingir o limite?",
    answer:
      "Quando voce atinge o limite do seu plano, voce pode fazer upgrade ou aguardar o proximo periodo de cobranca para continuar usando.",
  },
  {
    question: "Os limites sao renovados mensalmente?",
    answer:
      "Sim! Seus limites sao renovados todo mes no inicio do novo periodo de cobranca, independente de quando voce se inscreveu.",
  },
  {
    question: "Posso mudar de plano depois?",
    answer:
      "Sim! Voce pode fazer upgrade ou downgrade do seu plano a qualquer momento. As mudancas serao aplicadas proporcionalmente.",
  },
  {
    question: "Qual a diferenca entre planos mensais e anuais?",
    answer:
      "Planos anuais oferecem 17% de desconto em relacao ao valor mensal. Voce paga antecipadamente por 12 meses e economiza.",
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<PlanType | null>(null);
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/user/usage");
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (session?.user) {
      fetchUsage();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const handleSubscribe = async (planId: PlanType) => {
    if (!session?.user) {
      window.location.href = "/login";
      return;
    }

    setCheckoutLoading(planId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, interval: billingInterval }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Portal error:", error);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--buildix-primary))]" />
      </div>
    );
  }

  const currentPlan = usage?.plan || "FREE";
  const planOrder: PlanType[] = ["FREE", "PRO", "MAX", "ULTRA"];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Escolha o plano{" "}
          <span className="italic text-[hsl(var(--buildix-primary))]">ideal</span>{" "}
          para voce
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Comece gratuitamente e evolua conforme suas necessidades crescem.
          Todos os planos incluem acesso a nossa IA de ponta.
        </p>
      </div>

      {/* Current Usage (if logged in) */}
      {usage && (
        <div className="max-w-5xl mx-auto mb-8 px-4">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-semibold",
                  planColors[currentPlan].bg,
                  planColors[currentPlan].text
                )}>
                  {PLANS[currentPlan].name}
                </div>
                <span className="text-sm text-muted-foreground">Seu plano atual</span>
              </div>
              {currentPlan !== "FREE" && (
                <Button variant="outline" size="sm" onClick={handleManageSubscription}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Gerenciar Assinatura
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <UsageBar
                label="Prompts"
                used={usage.prompts.used}
                limit={usage.prompts.limit}
                percent={usage.prompts.percentUsed}
              />
              <UsageBar
                label="Imagens AI"
                used={usage.images.used}
                limit={usage.images.limit}
                percent={usage.images.percentUsed}
              />
              <UsageBar
                label="Export Figma"
                used={usage.figmaExports.used}
                limit={usage.figmaExports.limit}
                percent={usage.figmaExports.percentUsed}
              />
              <UsageBar
                label="Export HTML"
                used={usage.htmlExports.used}
                limit={usage.htmlExports.limit}
                percent={usage.htmlExports.percentUsed}
              />
            </div>

            <p className="mt-4 text-xs text-muted-foreground text-center">
              Periodo: {new Date(usage.periodStart).toLocaleDateString("pt-BR")} -{" "}
              {new Date(usage.periodEnd).toLocaleDateString("pt-BR")}
            </p>
          </div>
        </div>
      )}

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-2 mb-10">
        <div className="inline-flex items-center rounded-full border bg-muted/50 p-1">
          <button
            onClick={() => setBillingInterval("monthly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200",
              billingInterval === "monthly"
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingInterval("yearly")}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
              billingInterval === "yearly"
                ? "bg-white dark:bg-slate-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Anual
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
              -17%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planOrder.map((planId) => {
            const plan = PLANS[planId];
            const isCurrentPlan = currentPlan === planId;
            const isPopular = planId === "PRO";
            const canUpgrade = planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);
            const price =
              billingInterval === "yearly" ? plan.priceYearly : plan.price;
            const monthlyEquivalent =
              billingInterval === "yearly" && plan.priceYearly > 0
                ? Math.round(plan.priceYearly / 12)
                : plan.price;

            return (
              <div
                key={planId}
                className={cn(
                  "relative rounded-2xl border bg-card transition-all duration-300 hover:shadow-lg",
                  isPopular && "ring-2 ring-[hsl(var(--buildix-primary))] shadow-lg",
                  isCurrentPlan && !isPopular && "ring-2 ring-green-500",
                  planColors[planId].border
                )}
              >
                {/* Plan Number */}
                <div className="absolute -top-3 -left-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-md",
                      planColors[planId].bg,
                      planColors[planId].text,
                      "border-2 border-white dark:border-slate-900"
                    )}
                  >
                    {planNumbers[planId]}
                  </div>
                </div>

                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[hsl(var(--buildix-primary))] text-white shadow-md px-3">
                      Mais Popular
                    </Badge>
                  </div>
                )}

                {/* Current Plan Badge */}
                {isCurrentPlan && !isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline" className="bg-green-50 border-green-500 text-green-700 dark:bg-green-900/50 dark:text-green-400 shadow-md px-3">
                      Seu Plano
                    </Badge>
                  </div>
                )}

                <div className="p-6 pt-8">
                  {/* Plan Name & Description */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {plan.price === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">Gratis</span>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">
                            {formatPrice(monthlyEquivalent)}
                          </span>
                          <span className="text-muted-foreground">/mes</span>
                        </div>
                        {billingInterval === "yearly" && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatPrice(price)} cobrado anualmente
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  {planId === "FREE" ? (
                    <Button
                      variant="outline"
                      className="w-full h-11"
                      disabled={isCurrentPlan}
                    >
                      {isCurrentPlan ? "Plano Atual" : "Comecar Gratis"}
                    </Button>
                  ) : isCurrentPlan ? (
                    <Button variant="outline" className="w-full h-11" disabled>
                      Plano Atual
                    </Button>
                  ) : canUpgrade ? (
                    <Button
                      variant={isPopular ? "default" : "outline"}
                      className={cn(
                        "w-full h-11",
                        isPopular && "bg-[hsl(var(--buildix-primary))] hover:bg-[hsl(var(--buildix-primary))]/90"
                      )}
                      onClick={() => handleSubscribe(planId)}
                      disabled={checkoutLoading === planId}
                    >
                      {checkoutLoading === planId ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Fazer Upgrade"
                      )}
                    </Button>
                  ) : (
                    <Button variant="outline" className="w-full h-11" disabled>
                      Incluido
                    </Button>
                  )}

                  {/* Features List */}
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={cn(
                            "text-sm",
                            !feature.included && "text-muted-foreground/50"
                          )}
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Compare os planos em detalhe</h2>
          <p className="text-muted-foreground mt-2">
            Veja todas as funcionalidades disponiveis em cada plano
          </p>
        </div>

        <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
          {/* Table Header */}
          <div className="grid grid-cols-5 border-b bg-muted/30">
            <div className="p-4 font-medium">Funcionalidade</div>
            {planOrder.map((planId) => (
              <div
                key={planId}
                className={cn(
                  "p-4 text-center font-semibold",
                  planId === "PRO" && "bg-[hsl(var(--buildix-primary))]/5"
                )}
              >
                {PLANS[planId].name}
              </div>
            ))}
          </div>

          {/* Table Body */}
          {featureCategories.map((category, catIdx) => (
            <div key={catIdx}>
              {/* Category Header */}
              <div className="grid grid-cols-5 border-b bg-muted/20">
                <div className="col-span-5 p-3 px-4 font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  {category.name}
                </div>
              </div>

              {/* Category Features */}
              {category.features.map((feature, featIdx) => (
                <div
                  key={featIdx}
                  className={cn(
                    "grid grid-cols-5 border-b last:border-b-0",
                    featIdx % 2 === 0 ? "bg-transparent" : "bg-muted/10"
                  )}
                >
                  <div className="p-4 text-sm">{feature.name}</div>
                  {planOrder.map((planId) => {
                    const value = feature[planId as keyof typeof feature];
                    return (
                      <div
                        key={planId}
                        className={cn(
                          "p-4 text-center text-sm",
                          planId === "PRO" && "bg-[hsl(var(--buildix-primary))]/5"
                        )}
                      >
                        {typeof value === "boolean" ? (
                          value ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-muted-foreground/30 mx-auto" />
                          )
                        ) : (
                          <span className={cn(
                            value === "Ilimitado" && "text-green-600 dark:text-green-400 font-medium"
                          )}>
                            {value}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">Perguntas Frequentes</h2>
          <p className="text-muted-foreground mt-2">
            Tire suas duvidas sobre nossos planos
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border bg-card overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
              >
                <span className="font-medium">{item.question}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform duration-200",
                    expandedFaq === idx && "rotate-180"
                  )}
                />
              </button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  expandedFaq === idx ? "max-h-40" : "max-h-0"
                )}
              >
                <p className="px-4 pb-4 text-sm text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  used,
  limit,
  percent,
}: {
  label: string;
  used: number;
  limit: number;
  percent: number;
}) {
  const isUnlimited = limit === -1;

  return (
    <div className="p-3 rounded-xl bg-muted/30">
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-muted-foreground font-medium">{label}</span>
        <span className="font-semibold">
          {isUnlimited ? (
            <span className="text-green-600 dark:text-green-400">Ilimitado</span>
          ) : (
            `${used}/${limit}`
          )}
        </span>
      </div>
      {isUnlimited ? (
        <div className="h-2 rounded-full bg-green-100 dark:bg-green-900/30">
          <div className="h-full w-full rounded-full bg-green-500" />
        </div>
      ) : (
        <Progress
          value={percent}
          className={cn(
            "h-2",
            percent >= 90 && "bg-red-100 dark:bg-red-900/30",
            percent >= 90 && "[&>div]:bg-red-500"
          )}
        />
      )}
    </div>
  );
}
