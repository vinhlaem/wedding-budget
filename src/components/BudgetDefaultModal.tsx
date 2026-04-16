"use client";

import { useState } from "react";
import type {
  BudgetItem,
  BudgetCategory,
  BudgetStatus,
  BudgetItemInput,
  BudgetDefaultPayload,
} from "../types/budget";
import { STATUS_ORDER, STATUS_LABELS } from "../types/budget";
import { suggestStatus } from "../store/budgetStore";
import { formatNumber, parseInputNumber } from "../utils/format";
import { X } from "lucide-react";
import { DEFAULT_BUDGETS } from "@/data/DefaultBuget";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetDefaultPayload[]) => void;
  editItem?: BudgetItem | null;
  activeTab: BudgetCategory;
}

const TABS = [
  {
    category: "dam-hoi" as BudgetCategory,
    itemName: "Đám hỏi",
  },
  {
    category: "dam-cuoi" as BudgetCategory,
    itemName: "Đám cưới",
  },
];

export default function BudgetDefaultModal({
  isOpen,
  onClose,
  onSubmit,
  editItem,
  activeTab,
}: Props) {
  const [tab, setTab] = useState<BudgetCategory>("dam-hoi");

  const [defaultBugget, setDefaultBudget] = useState(DEFAULT_BUDGETS);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(defaultBugget);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-slide-up relative bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 flex items-center justify-between px-6 py-4 rounded-t-3xl sm:rounded-t-2xl z-10">
          <div>
            <h3 className="text-base font-bold text-zinc-900">
              Các Hạng Mục Mặc Định
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Item name */}

          <div className="flex items-center gap-2">
            {TABS.map((tabItem) => (
              <button
                key={tabItem.category}
                onClick={() => setTab(tabItem.category)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                  tab === tabItem.category
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {tabItem.itemName}
              </button>
            ))}
          </div>
          <div>
            {defaultBugget
              .filter((item) => item.category === tab)
              .map((item, index) => {
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="text-sm text-zinc-800">{item.itemName}</div>
                    <div className="text-sm text-zinc-500">
                      {formatNumber(item.estimatedCost)} VND
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
            <div className="text-sm font-semibold text-zinc-800">Tổng cộng</div>
            <div className="text-sm font-semibold text-zinc-800">
              {formatNumber(
                defaultBugget
                  .filter((item) => item.category === tab)
                  .reduce((total, item) => total + item.estimatedCost, 0),
              )}{" "}
              VND
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
