import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBudgetStore } from "../store/budgetStore";
import { useNotificationStore } from "../store/notificationStore";
import type { BudgetItem, BudgetStatus } from "../types/budget";
import { STATUS_LABELS, STATUS_ORDER } from "../types/budget";
import {
  formatCurrency,
  formatNumber,
  parseInputNumber,
} from "../utils/format";
import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import {
  Pencil,
  Trash2,
  RefreshCw,
  CalendarClock,
  Check,
  ArrowLeft,
} from "lucide-react";

interface Props {
  items: BudgetItem[];
  onEdit: (item: BudgetItem) => void;
  onDelete: (item: BudgetItem) => void;
}

// ── Status picker popover ─────────────────────────────────────────────────────
const STATUS_OPTION_CLS: Record<BudgetStatus, string> = {
  "chua-coc": "hover:bg-zinc-100 text-zinc-600",
  "da-coc-mot-phan": "hover:bg-amber-50 text-amber-700",
  "hoan-thanh": "hover:bg-emerald-50 text-emerald-700",
};
const STATUS_DOT_CLS: Record<BudgetStatus, string> = {
  "chua-coc": "bg-zinc-400",
  "da-coc-mot-phan": "bg-amber-500",
  "hoan-thanh": "bg-emerald-500",
};

interface StatusPickerProps {
  current: BudgetStatus;
  estimatedCost: number;
  currentDeposit: number;
  onSelect: (s: BudgetStatus, depositPaid?: number) => void;
}

function StatusPicker({
  current,
  estimatedCost,
  currentDeposit,
  onSelect,
}: StatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"menu" | "deposit">("menu");
  const [depositInput, setDepositInput] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setStep("menu");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Recalculate dropdown position on scroll/resize while open
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setDropdownPos({
        top: r.bottom + 4,
        right: window.innerWidth - r.right,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // Focus input when switching to deposit step
  useEffect(() => {
    if (step === "deposit") {
      setTimeout(() => {
        setDepositInput(currentDeposit > 0 ? formatNumber(currentDeposit) : "");
        inputRef.current?.focus();
      }, 0);
    }
  }, [step, currentDeposit]);

  const handleMenuSelect = (s: BudgetStatus) => {
    if (s === "da-coc-mot-phan") {
      setStep("deposit");
      return;
    }
    onSelect(s);
    setOpen(false);
    setStep("menu");
  };

  const handleDepositConfirm = () => {
    const amount = parseInputNumber(depositInput);
    onSelect("da-coc-mot-phan", amount);
    setOpen(false);
    setStep("menu");
  };

  const depositNum = parseInputNumber(depositInput);
  const isValid = depositNum > 0 && depositNum <= estimatedCost;

  return (
    <div ref={ref}>
      <button
        ref={btnRef}
        onClick={() => {
          if (!open && btnRef.current) {
            const r = btnRef.current.getBoundingClientRect();
            setDropdownPos({
              top: r.bottom + 4,
              right: window.innerWidth - r.right,
            });
          }
          setOpen((v) => !v);
          setStep("menu");
        }}
        title="Đổi trạng thái"
        className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
      >
        <RefreshCw size={14} />
      </button>

      {open &&
        step === "menu" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 9999,
            }}
            className="w-48 bg-white rounded-xl border border-zinc-200 shadow-xl py-1 animate-fade-in"
          >
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => handleMenuSelect(s)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${STATUS_OPTION_CLS[s]}`}
              >
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT_CLS[s]}`}
                />
                <span className="flex-1 text-left">{STATUS_LABELS[s]}</span>
                {current === s && (
                  <Check size={12} className="shrink-0 opacity-60" />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {open &&
        step === "deposit" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: dropdownPos.top,
              right: dropdownPos.right,
              zIndex: 9999,
            }}
            className="w-60 bg-white rounded-xl border border-zinc-200 shadow-xl p-3 animate-fade-in"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2.5">
              <button
                onClick={() => setStep("menu")}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} />
              </button>
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  Đã cọc một phần
                </p>
                <p className="text-[10px] text-zinc-400">
                  Dự toán: {formatCurrency(estimatedCost)}
                </p>
              </div>
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={depositInput}
              onChange={(e) =>
                setDepositInput(
                  formatNumber(parseInputNumber(e.target.value)) || "",
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && isValid) handleDepositConfirm();
              }}
              placeholder="Số tiền đã cọc..."
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs text-zinc-800 placeholder-zinc-300 focus:outline-none focus:border-amber-400 focus:bg-white transition-all"
            />
            {depositNum > estimatedCost && (
              <p className="text-[10px] text-red-500 mt-1">Vượt quá dự toán</p>
            )}

            {/* Confirm */}
            <button
              onClick={handleDepositConfirm}
              disabled={!isValid}
              className="mt-2.5 w-full py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Xác nhận
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function getDeadlineWarning(item: BudgetItem): {
  rowBorder: string;
  badge: string | null;
  badgeCls: string;
} {
  if (item.status === "hoan-thanh") {
    return {
      rowBorder: "border-l-2 border-l-emerald-400",
      badge: null,
      badgeCls: "",
    };
  }
  if (!item.deadline) return { rowBorder: "", badge: null, badgeCls: "" };

  const now = new Date();
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const dl = new Date(item.deadline);
  const dlDay = new Date(
    Date.UTC(dl.getUTCFullYear(), dl.getUTCMonth(), dl.getUTCDate()),
  );
  const days = Math.floor((dlDay.getTime() - today.getTime()) / 86_400_000);

  if (days < 0)
    return {
      rowBorder: "border-l-2 border-l-red-500",
      badge: "Quá hạn",
      badgeCls: "bg-red-50 text-red-600 border border-red-200",
    };
  if (days <= 1)
    return {
      rowBorder: "border-l-2 border-l-red-400",
      badge: `Còn ${days === 0 ? "hôm nay" : "1 ngày"}`,
      badgeCls: "bg-red-50 text-red-600 border border-red-200",
    };
  if (days <= 3)
    return {
      rowBorder: "border-l-2 border-l-orange-400",
      badge: `Còn ${days} ngày`,
      badgeCls: "bg-orange-50 text-orange-600 border border-orange-200",
    };
  if (days <= 7)
    return {
      rowBorder: "border-l-2 border-l-amber-400",
      badge: `Còn ${days} ngày`,
      badgeCls: "bg-amber-50 text-amber-600 border border-amber-200",
    };
  return { rowBorder: "", badge: null, badgeCls: "" };
}

export default function BudgetTable({ items, onEdit, onDelete }: Props) {
  const { updateItem } = useBudgetStore();
  const { highlightDeadline } = useNotificationStore();

  const handleStatusChange = (
    id: string,
    status: BudgetStatus,
    depositPaid?: number,
  ) => {
    const target = items.find((i) => i._id === id);
    const extra: Record<string, number> = {};
    if (status === "hoan-thanh" && target) {
      extra.depositPaid = target.estimatedCost;
    } else if (status === "da-coc-mot-phan" && depositPaid !== undefined) {
      extra.depositPaid = depositPaid;
    } else if (status === "chua-coc") {
      extra.depositPaid = 0;
    }
    updateItem(id, { status, ...extra });
  };

  const totalEstimated = items.reduce((s, i) => s + i.estimatedCost, 0);
  const totalDeposit = items.reduce((s, i) => s + i.depositPaid, 0);
  const totalRemaining = totalEstimated - totalDeposit;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60">
              <th className="text-left px-5 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest w-8">
                #
              </th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Hạng mục
              </th>
              <th className="text-right px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Dự toán
              </th>
              <th className="text-right px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Đã cọc
              </th>
              <th className="text-right px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Còn lại
              </th>
              <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest w-36">
                Tiến độ
              </th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                Hạn chốt
              </th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Địa chỉ
              </th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                SĐT
              </th>
              <th className="text-left px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Ghi chú
              </th>
              <th className="text-center px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                Trạng thái
              </th>
              <th className="text-center px-4 py-3.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest w-28"></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={12}
                  className="text-center py-16 text-zinc-400 text-sm"
                >
                  Chưa có hạng mục nào.
                </td>
              </tr>
            )}
            {items.map((item, idx) => {
              const pct =
                item.estimatedCost > 0
                  ? (item.depositPaid / item.estimatedCost) * 100
                  : 0;
              const { rowBorder, badge, badgeCls } = getDeadlineWarning(item);
              const dlStr = item.deadline
                ? new Date(item.deadline).toISOString().split("T")[0]
                : "";
              const isHighlighted = dlStr && dlStr === highlightDeadline;
              return (
                <tr
                  key={item._id}
                  data-deadline={dlStr || undefined}
                  className={`border-b border-zinc-50 hover:bg-zinc-50/40 transition-colors group ${rowBorder} ${isHighlighted ? "ring-2 ring-inset ring-blue-300 bg-blue-50/30" : ""}`}
                >
                  <td className="px-5 py-3.5 text-zinc-300 font-medium text-xs">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-zinc-800">
                    <div className="flex items-center gap-1.5">
                      {item.itemName}
                      {badge && (
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${badgeCls}`}
                        >
                          <CalendarClock size={9} />
                          {badge}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right font-medium text-zinc-600 tabular-nums whitespace-nowrap">
                    {formatCurrency(item.estimatedCost)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-rose-500 tabular-nums whitespace-nowrap">
                    {formatCurrency(item.depositPaid)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-semibold text-amber-600 tabular-nums whitespace-nowrap">
                    {formatCurrency(item.remainingCost)}
                  </td>
                  <td className="px-4 py-3.5 w-36">
                    <ProgressBar percentage={pct} />
                  </td>
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {item.deadline ? (
                      (() => {
                        const { badgeCls } = getDeadlineWarning(item);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-medium ${
                              badgeCls
                                ? `px-2 py-0.5 rounded-lg border ${badgeCls}`
                                : "text-zinc-400"
                            }`}
                          >
                            <CalendarClock size={11} />
                            {new Date(item.deadline).toLocaleDateString(
                              "vi-VN",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              },
                            )}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-zinc-200 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 text-xs max-w-[120px] truncate">
                    {item.address || <span className="text-zinc-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 text-xs whitespace-nowrap">
                    {item.phone || <span className="text-zinc-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-zinc-400 text-xs max-w-[120px] truncate">
                    {item.note || <span className="text-zinc-200">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(item)}
                        title="Sửa"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <StatusPicker
                        current={item.status}
                        estimatedCost={item.estimatedCost}
                        currentDeposit={item.depositPaid}
                        onSelect={(s, deposit) =>
                          handleStatusChange(item._id, s, deposit)
                        }
                      />
                      <button
                        onClick={() => onDelete(item)}
                        title="Xóa"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t border-zinc-200 bg-zinc-50/80">
                <td className="px-5 py-3.5" />
                <td className="px-4 py-3.5 font-semibold text-zinc-600 text-sm">
                  Tổng cộng
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-zinc-700 tabular-nums whitespace-nowrap">
                  {formatCurrency(totalEstimated)}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-rose-500 tabular-nums whitespace-nowrap">
                  {formatCurrency(totalDeposit)}
                </td>
                <td className="px-4 py-3.5 text-right font-bold text-amber-600 tabular-nums whitespace-nowrap">
                  {formatCurrency(totalRemaining)}
                </td>
                <td colSpan={7} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-zinc-100">
        {items.length === 0 && (
          <p className="text-center py-12 text-zinc-400 text-sm">
            Chưa có hạng mục nào.
          </p>
        )}
        {items.map((item, idx) => {
          const pct =
            item.estimatedCost > 0
              ? (item.depositPaid / item.estimatedCost) * 100
              : 0;
          const { rowBorder, badge, badgeCls } = getDeadlineWarning(item);
          const dlStr = item.deadline
            ? new Date(item.deadline).toISOString().split("T")[0]
            : "";
          const isHighlighted = dlStr && dlStr === highlightDeadline;
          return (
            <div
              key={item._id}
              data-deadline={dlStr || undefined}
              className={`p-4 animate-fade-in ${rowBorder} ${isHighlighted ? "ring-2 ring-inset ring-blue-300 bg-blue-50/30" : ""}`}
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-[11px] text-zinc-400 font-medium">
                    #{idx + 1}
                  </span>
                  <p className="font-semibold text-zinc-800 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    {item.itemName}
                    {badge && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${badgeCls}`}
                      >
                        <CalendarClock size={9} />
                        {badge}
                      </span>
                    )}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>
              <ProgressBar percentage={pct} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                    Dự toán
                  </p>
                  <p className="text-sm font-semibold text-zinc-700 tabular-nums">
                    {formatCurrency(item.estimatedCost)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                    Đã cọc
                  </p>
                  <p className="text-sm font-semibold text-rose-500 tabular-nums">
                    {formatCurrency(item.depositPaid)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                    Còn lại
                  </p>
                  <p className="text-sm font-semibold text-amber-600 tabular-nums">
                    {formatCurrency(item.remainingCost)}
                  </p>
                </div>
              </div>
              {(item.address || item.phone || item.note || item.deadline) && (
                <div className="mt-3 text-xs text-zinc-400 space-y-0.5">
                  {item.deadline && (
                    <p className="flex items-center gap-1 font-medium">
                      <CalendarClock size={11} />
                      Hạn chót:{" "}
                      <span
                        className={
                          getDeadlineWarning(item).badgeCls
                            ? `font-semibold ${getDeadlineWarning(item)
                                .badgeCls.split(" ")
                                .filter((c) => c.startsWith("text-"))
                                .join(" ")}`
                            : ""
                        }
                      >
                        {new Date(item.deadline).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </p>
                  )}
                  {item.address && <p>📍 {item.address}</p>}
                  {item.phone && <p>📞 {item.phone}</p>}
                  {item.note && <p>📝 {item.note}</p>}
                </div>
              )}
              <div className="flex gap-1 mt-3">
                <button
                  onClick={() => onEdit(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <Pencil size={13} /> Sửa
                </button>
                <div className="flex-1 relative">
                  <StatusPicker
                    current={item.status}
                    estimatedCost={item.estimatedCost}
                    currentDeposit={item.depositPaid}
                    onSelect={(s, deposit) =>
                      handleStatusChange(item._id, s, deposit)
                    }
                  />
                </div>
                <button
                  onClick={() => onDelete(item)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 size={13} /> Xóa
                </button>
              </div>
            </div>
          );
        })}
        {items.length > 0 && (
          <div className="p-4 bg-zinc-50 grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                Tổng dự toán
              </p>
              <p className="text-sm font-bold text-zinc-700">
                {formatCurrency(totalEstimated)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                Tổng cọc
              </p>
              <p className="text-sm font-bold text-rose-500">
                {formatCurrency(totalDeposit)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                Tổng còn lại
              </p>
              <p className="text-sm font-bold text-amber-600">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
