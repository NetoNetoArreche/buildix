import { prisma } from "@/lib/prisma";
import { PLANS, formatPrice } from "@/lib/plans";
import { PlanType, SubscriptionStatus } from "@prisma/client";
import {
  DollarSign,
  Users,
  TrendingUp,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

async function getBillingStats() {
  const [subscriptions, totalUsers] = await Promise.all([
    prisma.subscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]);

  // Filtrar apenas assinaturas pagas (não FREE)
  const paidSubscriptions = subscriptions.filter((s) => s.plan !== "FREE");

  // Calcular MRR (apenas assinaturas ativas)
  const mrr = paidSubscriptions
    .filter((s) => s.status === "ACTIVE")
    .reduce((total, s) => {
      const plan = PLANS[s.plan];
      const isYearly = s.stripePriceId === plan.stripePriceIdYearly;
      return total + (isYearly ? plan.priceYearly / 12 : plan.price);
    }, 0);

  // Contagem por plano (apenas ativos)
  const byPlan: Record<string, number> = { PRO: 0, MAX: 0, ULTRA: 0 };
  paidSubscriptions
    .filter((s) => s.status === "ACTIVE")
    .forEach((s) => {
      if (s.plan in byPlan) byPlan[s.plan]++;
    });

  // Contagem por status
  const byStatus: Record<string, number> = {
    ACTIVE: 0,
    CANCELED: 0,
    PAST_DUE: 0,
    INCOMPLETE: 0,
    TRIALING: 0,
  };
  paidSubscriptions.forEach((s) => {
    if (s.status in byStatus) byStatus[s.status]++;
  });

  // Total de assinantes pagos ativos
  const totalPaidActive = paidSubscriptions.filter(
    (s) => s.status === "ACTIVE"
  ).length;

  // Taxa de conversão
  const conversionRate = totalUsers > 0 ? (totalPaidActive / totalUsers) * 100 : 0;

  return {
    subscriptions: paidSubscriptions,
    mrr,
    byPlan,
    byStatus,
    totalPaidActive,
    totalUsers,
    conversionRate,
  };
}

function getStatusBadge(status: SubscriptionStatus) {
  const config: Record<
    SubscriptionStatus,
    { label: string; color: string; icon: typeof CheckCircle }
  > = {
    ACTIVE: { label: "Ativo", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
    CANCELED: { label: "Cancelado", color: "bg-red-500/20 text-red-400", icon: XCircle },
    PAST_DUE: { label: "Vencido", color: "bg-yellow-500/20 text-yellow-400", icon: AlertCircle },
    INCOMPLETE: { label: "Incompleto", color: "bg-orange-500/20 text-orange-400", icon: Clock },
    TRIALING: { label: "Teste", color: "bg-blue-500/20 text-blue-400", icon: Clock },
  };

  const { label, color, icon: Icon } = config[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${color}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function getPlanBadge(plan: PlanType) {
  const colors: Record<string, string> = {
    PRO: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    MAX: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    ULTRA: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold ${colors[plan] || "bg-zinc-500/20 text-zinc-400"}`}>
      {plan}
    </span>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getMonthlyValue(plan: PlanType, stripePriceId: string | null) {
  const planConfig = PLANS[plan];
  if (!planConfig) return 0;

  const isYearly = stripePriceId === planConfig.stripePriceIdYearly;
  return isYearly ? planConfig.priceYearly / 12 : planConfig.price;
}

export default async function BillingPage() {
  const stats = await getBillingStats();

  const statCards = [
    {
      title: "MRR",
      subtitle: "Receita Mensal Recorrente",
      value: formatPrice(stats.mrr),
      icon: DollarSign,
      color: "bg-green-500",
    },
    {
      title: "Assinantes Ativos",
      subtitle: "Planos pagos",
      value: stats.totalPaidActive.toString(),
      icon: Users,
      color: "bg-violet-500",
    },
    {
      title: "Taxa de Conversão",
      subtitle: `${stats.totalPaidActive} de ${stats.totalUsers} usuários`,
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: "bg-blue-500",
    },
    {
      title: "ARR Projetado",
      subtitle: "Receita Anual",
      value: formatPrice(stats.mrr * 12),
      icon: CreditCard,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Faturamento</h1>
        <p className="text-zinc-400">
          Visão geral de receita e assinaturas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{stat.title}</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{stat.subtitle}</p>
              </div>
              <div className={`rounded-lg ${stat.color} p-3`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plan Distribution */}
      <div className="grid gap-4 md:grid-cols-3">
        {Object.entries(stats.byPlan).map(([plan, count]) => (
          <div
            key={plan}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center gap-3">
              {getPlanBadge(plan as PlanType)}
              <span className="text-sm text-zinc-400">assinantes</span>
            </div>
            <span className="text-2xl font-bold text-white">{count}</span>
          </div>
        ))}
      </div>

      {/* Subscribers Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 p-6">
          <h2 className="text-lg font-semibold text-white">Assinantes</h2>
          <p className="text-sm text-zinc-400">
            Lista de todos os usuários com planos pagos
          </p>
        </div>

        {stats.subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <DollarSign className="mx-auto h-12 w-12 text-zinc-600" />
            <p className="mt-4 text-lg font-medium text-zinc-400">
              Nenhum assinante ainda
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Os assinantes aparecerão aqui quando houver.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800 text-left text-sm text-zinc-400">
                  <th className="px-6 py-4 font-medium">Usuário</th>
                  <th className="px-6 py-4 font-medium">Plano</th>
                  <th className="px-6 py-4 font-medium">Valor/mês</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Período</th>
                  <th className="px-6 py-4 font-medium">Desde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {stats.subscriptions.map((subscription) => (
                  <tr
                    key={subscription.id}
                    className="transition-colors hover:bg-zinc-800/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-sm font-medium text-white">
                          {subscription.user?.name?.[0]?.toUpperCase() ||
                            subscription.user?.email?.[0]?.toUpperCase() ||
                            "?"}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {subscription.user?.name || "Sem nome"}
                          </p>
                          <p className="text-sm text-zinc-400">
                            {subscription.user?.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getPlanBadge(subscription.plan)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-white">
                        {formatPrice(
                          getMonthlyValue(subscription.plan, subscription.stripePriceId)
                        )}
                      </span>
                      {subscription.stripePriceId ===
                        PLANS[subscription.plan]?.stripePriceIdYearly && (
                        <span className="ml-2 text-xs text-zinc-500">(anual)</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-sm text-zinc-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(subscription.currentPeriodStart)} -{" "}
                          {formatDate(subscription.currentPeriodEnd)}
                        </span>
                      </div>
                      {subscription.cancelAtPeriodEnd && (
                        <span className="mt-1 block text-xs text-yellow-500">
                          Cancela ao final do período
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {formatDate(subscription.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Summary */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Status das Assinaturas</h2>
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <div
              key={status}
              className="flex items-center justify-between rounded-lg bg-zinc-800/50 p-3"
            >
              {getStatusBadge(status as SubscriptionStatus)}
              <span className="text-lg font-bold text-white">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
