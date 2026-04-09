import type { BudgetCategory } from "../types/budget";
import { Heart, Gem } from "lucide-react";

interface Props {
  activeTab: BudgetCategory;
  onChange: (tab: BudgetCategory) => void;
  counts: { "dam-hoi": number; "dam-cuoi": number };
}

const tabs: { key: BudgetCategory; label: string; icon: typeof Heart }[] = [
  { key: "dam-hoi", label: "Đám hỏi", icon: Heart },
  { key: "dam-cuoi", label: "Đám cưới", icon: Gem },
];

export default function TabSelector({ activeTab, onChange, counts }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-zinc-100/80 rounded-2xl w-fit">
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                active
                  ? "bg-zinc-100 text-zinc-600"
                  : "bg-zinc-200/60 text-zinc-400"
              }`}
            >
              {counts[tab.key]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
