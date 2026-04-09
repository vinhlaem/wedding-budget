import type { BudgetStatus } from "../types/budget";
import { STATUS_LABELS } from "../types/budget";

interface Props {
  status: BudgetStatus;
}

const styles: Record<BudgetStatus, string> = {
  "chua-coc": "bg-zinc-100 text-zinc-500 border border-zinc-200",
  "da-coc-mot-phan": "bg-amber-50 text-amber-700 border border-amber-200",
  "hoan-thanh": "bg-emerald-50 text-emerald-700 border border-emerald-200",
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${styles[status]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "chua-coc"
            ? "bg-zinc-400"
            : status === "da-coc-mot-phan"
              ? "bg-amber-500"
              : "bg-emerald-500"
        }`}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
