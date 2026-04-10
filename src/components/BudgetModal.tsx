"use client";

import { useState } from "react";
import type { BudgetItem, BudgetCategory, BudgetStatus } from "../types/budget";
import { STATUS_ORDER, STATUS_LABELS } from "../types/budget";
import { suggestStatus } from "../store/budgetStore";
import { formatNumber, parseInputNumber } from "../utils/format";
import { X } from "lucide-react";

interface SubmitPayload {
  itemName: string;
  estimatedCost: number;
  depositPaid: number;
  address: string;
  phone: string;
  note: string;
  status: BudgetStatus;
  category: BudgetCategory;
  vendorName: string;
  deadline: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitPayload) => void;
  editItem?: BudgetItem | null;
  activeTab: BudgetCategory;
}

function getInitial(editItem: BudgetItem | null | undefined) {
  if (editItem) {
    return {
      itemName: editItem.itemName,
      estimatedCost:
        editItem.estimatedCost > 0 ? formatNumber(editItem.estimatedCost) : "",
      depositPaid:
        editItem.depositPaid > 0 ? formatNumber(editItem.depositPaid) : "",
      address: editItem.address,
      phone: editItem.phone,
      note: editItem.note,
      status: editItem.status,
      vendorName: editItem.vendorName || "",
      deadline: editItem.deadline ? editItem.deadline.split("T")[0] : "",
    };
  }
  return {
    itemName: "",
    estimatedCost: "",
    depositPaid: "",
    address: "",
    phone: "",
    note: "",
    status: "chua-coc" as BudgetStatus,
    vendorName: "",
    deadline: "",
  };
}

const inputCls =
  "w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-300 focus:outline-none focus:bg-white focus:border-zinc-400 transition-all";
const labelCls =
  "block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1.5";

export default function BudgetModal({
  isOpen,
  onClose,
  onSubmit,
  editItem,
  activeTab,
}: Props) {
  const initial = getInitial(editItem);
  const [itemName, setItemName] = useState(initial.itemName);
  const [estimatedCost, setEstimatedCost] = useState(initial.estimatedCost);
  const [depositPaid, setDepositPaid] = useState(initial.depositPaid);
  const [address, setAddress] = useState(initial.address);
  const [phone, setPhone] = useState(initial.phone);
  const [note, setNote] = useState(initial.note);
  const [status, setStatus] = useState<BudgetStatus>(initial.status);
  const [vendorName, setVendorName] = useState(initial.vendorName);
  const [deadline, setDeadline] = useState(initial.deadline);

  const handleEstimatedChange = (val: string) => {
    const num = parseInputNumber(val);
    setEstimatedCost(num > 0 ? formatNumber(num) : "");
    setStatus(suggestStatus(num, parseInputNumber(depositPaid)));
  };

  const handleDepositChange = (val: string) => {
    const num = parseInputNumber(val);
    setDepositPaid(num > 0 ? formatNumber(num) : "");
    setStatus(suggestStatus(parseInputNumber(estimatedCost), num));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;
    onSubmit({
      itemName: itemName.trim(),
      estimatedCost: parseInputNumber(estimatedCost),
      depositPaid: parseInputNumber(depositPaid),
      address,
      phone,
      note,
      status,
      category: editItem?.category ?? activeTab,
      vendorName: vendorName.trim(),
      deadline: deadline || null,
    });
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
              {editItem ? "Chỉnh sửa hạng mục" : "Thêm hạng mục mới"}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {editItem?.category === "dam-hoi" || activeTab === "dam-hoi"
                ? "Đám hỏi"
                : "Đám cưới"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Item name */}
          <div>
            <label className={labelCls}>
              Hạng mục <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={inputCls}
              placeholder="Tên hạng mục..."
              required
            />
          </div>

          {/* Costs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Dự toán (VND)</label>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => handleEstimatedChange(e.target.value)}
                className={inputCls}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
            <div>
              <label className={labelCls}>Đã đặt cọc (VND)</label>
              <input
                type="text"
                value={depositPaid}
                onChange={(e) => handleDepositChange(e.target.value)}
                className={inputCls}
                placeholder="0"
                inputMode="numeric"
              />
            </div>
          </div>

          {/* Remaining preview */}
          {parseInputNumber(estimatedCost) > 0 && (
            <div className="px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between text-sm">
              <span className="text-zinc-500 font-medium">Còn lại</span>
              <span className="font-bold text-amber-600 tabular-nums">
                {new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                  maximumFractionDigits: 0,
                }).format(
                  Math.max(
                    0,
                    parseInputNumber(estimatedCost) -
                      parseInputNumber(depositPaid),
                  ),
                )}
              </span>
            </div>
          )}

          {/* Vendor info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className={inputCls}
                placeholder="Địa chỉ nhà cung cấp"
              />
            </div>
            <div>
              <label className={labelCls}>Số điện thoại</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputCls}
                placeholder="0900 000 000"
                inputMode="tel"
              />
            </div>
          </div>

          {/* Vendor name + Deadline */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nhà cung cấp</label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className={inputCls}
                placeholder="Tên nhà cung cấp"
              />
            </div>
            <div>
              <label className={labelCls}>Ngày hết hạn</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className={labelCls}>Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Status */}
          <div>
            <label className={labelCls}>Trạng thái</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    status === s
                      ? s === "chua-coc"
                        ? "bg-zinc-800 text-white border-zinc-800"
                        : s === "da-coc-mot-phan"
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                  }`}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
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
              type="submit"
              className="flex-1 px-4 py-3 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {editItem ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
