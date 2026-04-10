"use client";

import { useBudgetStore } from "../store/budgetStore";
import { formatCurrency } from "../utils/format";
import { Wallet, CreditCard, PiggyBank, TrendingUp } from "lucide-react";

export default function SummaryCards() {
  const items = useBudgetStore((s) => s.items);

  const totalEstimated = items.reduce((sum, i) => sum + i.estimatedCost, 0);
  const totalDeposit = items.reduce((sum, i) => sum + i.depositPaid, 0);
  const totalRemaining = totalEstimated - totalDeposit;
  const completedCount = items.filter((i) => i.status === "hoan-thanh").length;
  const completionPct =
    items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const cards = [
    {
      label: "Tổng ngân sách",
      value: formatCurrency(totalEstimated),
      icon: Wallet,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      valueColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      label: "Tổng đã cọc",
      value: formatCurrency(totalDeposit),
      icon: CreditCard,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
      valueColor: "text-rose-600",
      border: "border-rose-100",
    },
    {
      label: "Tổng còn lại",
      value: formatCurrency(totalRemaining),
      icon: PiggyBank,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-500",
      valueColor: "text-amber-600",
      border: "border-amber-100",
    },
    {
      label: "Hoàn thành",
      value: `${completionPct}%`,
      icon: TrendingUp,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-500",
      valueColor: "text-emerald-600",
      border: "border-emerald-100",
      sub: `${completedCount} / ${items.length} hạng mục`,
      progress: completionPct,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div
          key={card.label}
          className={`animate-fade-in bg-white rounded-2xl border ${card.border} p-5 shadow-sm hover:shadow-md transition-all duration-200`}
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">
                {card.label}
              </p>
              <p
                className={`text-2xl font-bold ${card.valueColor} leading-tight`}
              >
                {card.value}
              </p>
              {card.sub && (
                <p className="text-xs text-zinc-400 mt-1">{card.sub}</p>
              )}
            </div>
            <div
              className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}
            >
              <card.icon size={19} className={card.iconColor} />
            </div>
          </div>
          {card.progress !== undefined && (
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full progress-bar-fill"
                style={{ width: `${card.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
