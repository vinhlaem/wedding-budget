"use client";

import { useState } from "react";
import { useBudgetStore } from "../store/budgetStore";
import type { BudgetItem, Vendor, VendorInput } from "../types/budget";
import { STATUS_LABELS, STATUS_COLORS } from "../types/budget";
import {
  formatCurrency,
  formatNumber,
  parseInputNumber,
} from "../utils/format";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  Store,
  Phone,
  MapPin,
  BadgeDollarSign,
  Loader2,
} from "lucide-react";

interface Props {
  item: BudgetItem;
  onClose: () => void;
}

const inputCls =
  "w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm text-zinc-800 placeholder-zinc-300 focus:outline-none focus:bg-white focus:border-zinc-400 transition-all";
const labelCls =
  "block text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-1";

type EditingVendor = { vendorId: string } & Partial<VendorInput>;
type AddingVendor = VendorInput & { priceDisplay: string };

const emptyAdd = (): AddingVendor => ({
  name: "",
  address: "",
  phone: "",
  price: 0,
  priceDisplay: "",
});

export default function BudgetDetail({ item, onClose }: Props) {
  const { addVendor, updateVendor, deleteVendor, setDefaultVendor } =
    useBudgetStore();

  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<AddingVendor>(emptyAdd());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<
    Partial<VendorInput> & { priceDisplay: string }
  >({
    name: "",
    address: "",
    phone: "",
    price: 0,
    priceDisplay: "",
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Live item from store (re-renders when vendors change)
  const rawItem =
    useBudgetStore((s) => s.items.find((i) => i._id === item._id)) ?? item;
  // Guard: old documents without migration may have vendors = undefined
  const liveItem = { ...rawItem, vendors: rawItem.vendors ?? [] };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;
    setSaving(true);
    await addVendor(liveItem._id, {
      name: addForm.name.trim(),
      address: addForm.address.trim(),
      phone: addForm.phone.trim(),
      price: parseInputNumber(addForm.priceDisplay),
    });
    setSaving(false);
    setAdding(false);
    setAddForm(emptyAdd());
  };

  const startEdit = (v: Vendor) => {
    setEditingId(v._id);
    setEditForm({
      name: v.name,
      address: v.address,
      phone: v.phone,
      price: v.price,
      priceDisplay: v.price > 0 ? formatNumber(v.price) : "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    await updateVendor(liveItem._id, editingId, {
      name: editForm.name?.trim(),
      address: editForm.address,
      phone: editForm.phone,
      price: parseInputNumber(editForm.priceDisplay ?? ""),
    });
    setSaving(false);
    setEditingId(null);
  };

  const handleDelete = async (vendorId: string) => {
    setDeletingId(vendorId);
    await deleteVendor(liveItem._id, vendorId);
    setDeletingId(null);
  };

  const handleSetDefault = async (vendorId: string) => {
    await setDefaultVendor(liveItem._id, vendorId);
  };

  const statusColor = STATUS_COLORS[liveItem.status];
  const cheapestPrice =
    liveItem.vendors.length > 0
      ? Math.min(...liveItem.vendors.map((v) => v.price))
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="animate-slide-up relative bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] flex flex-col">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 flex items-start justify-between px-6 py-4 rounded-t-3xl sm:rounded-t-2xl z-10 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-base font-bold text-zinc-900 truncate">
              {liveItem.itemName}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold ${statusColor.bg} ${statusColor.text}`}
              >
                {STATUS_LABELS[liveItem.status]}
              </span>
              <span className="text-xs text-zinc-400">
                Dự toán:{" "}
                <span className="font-semibold text-zinc-600">
                  {formatCurrency(liveItem.estimatedCost)}
                </span>
              </span>
              {liveItem.depositPaid > 0 && (
                <span className="text-xs text-zinc-400">
                  Đã cọc:{" "}
                  <span className="font-semibold text-rose-500">
                    {formatCurrency(liveItem.depositPaid)}
                  </span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {/* Section title */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-zinc-800">Nhà cung cấp</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {liveItem.vendors.length === 0
                  ? "Chưa có nhà cung cấp nào"
                  : `${liveItem.vendors.length} nhà cung cấp · Chọn mặc định bằng nút tròn`}
              </p>
            </div>
            {!adding && (
              <button
                onClick={() => {
                  setAdding(true);
                  setEditingId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Plus size={13} />
                Thêm vendor
              </button>
            )}
          </div>

          {/* ── Vendor list ──────────────────────────────────────────────── */}
          <div className="space-y-2">
            {liveItem.vendors.map((v) => {
              const isCheapest =
                cheapestPrice !== null && v.price === cheapestPrice;
              const isEditing = editingId === v._id;
              const isDeleting = deletingId === v._id;

              if (isEditing) {
                return (
                  <form
                    key={v._id}
                    onSubmit={handleEditSubmit}
                    className="p-4 bg-violet-50 border border-violet-200 rounded-2xl space-y-3"
                  >
                    <p className="text-xs font-bold text-violet-700 uppercase tracking-wide">
                      Chỉnh sửa nhà cung cấp
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className={labelCls}>Tên *</label>
                        <input
                          type="text"
                          value={editForm.name ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className={inputCls}
                          placeholder="Tên nhà cung cấp"
                          required
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Giá (VND)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={editForm.priceDisplay ?? ""}
                          onChange={(e) => {
                            const n = parseInputNumber(e.target.value);
                            setEditForm((f) => ({
                              ...f,
                              priceDisplay: n > 0 ? formatNumber(n) : "",
                              price: n,
                            }));
                          }}
                          className={inputCls}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Số điện thoại</label>
                        <input
                          type="text"
                          inputMode="tel"
                          value={editForm.phone ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              phone: e.target.value,
                            }))
                          }
                          className={inputCls}
                          placeholder="0900 000 000"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className={labelCls}>Địa chỉ</label>
                        <input
                          type="text"
                          value={editForm.address ?? ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              address: e.target.value,
                            }))
                          }
                          className={inputCls}
                          placeholder="Địa chỉ"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        {saving ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Lưu
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={v._id}
                  className={`p-4 rounded-2xl border transition-all ${
                    v.isDefault
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-white border-zinc-100 hover:border-zinc-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Default toggle */}
                    <button
                      onClick={() => !v.isDefault && handleSetDefault(v._id)}
                      title={
                        v.isDefault ? "Đang là mặc định" : "Đặt làm mặc định"
                      }
                      className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                        v.isDefault
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-zinc-300 hover:border-emerald-400"
                      }`}
                    >
                      {v.isDefault && <Check size={11} color="white" />}
                    </button>

                    {/* Vendor info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-zinc-800">
                          {v.name}
                        </span>
                        {v.isDefault && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
                            Mặc định
                          </span>
                        )}
                        {isCheapest && liveItem.vendors.length > 1 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md">
                            Rẻ nhất
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs">
                          <BadgeDollarSign
                            size={12}
                            className="text-amber-500 shrink-0"
                          />
                          <span className="font-bold text-amber-600 tabular-nums">
                            {formatCurrency(v.price)}
                          </span>
                        </div>
                        {v.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Phone size={11} className="shrink-0" />
                            <span>{v.phone}</span>
                          </div>
                        )}
                        {v.address && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <MapPin size={11} className="shrink-0" />
                            <span className="line-clamp-1">{v.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(v)}
                        title="Sửa"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(v._id)}
                        disabled={isDeleting}
                        title="Xóa"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-40"
                      >
                        {isDeleting ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {liveItem.vendors.length === 0 && !adding && (
              <div className="flex flex-col items-center py-8 text-zinc-400">
                <Store size={32} className="mb-2 opacity-30" />
                <p className="text-sm">Chưa có nhà cung cấp nào</p>
                <p className="text-xs mt-1">Nhấn "Thêm vendor" để bắt đầu</p>
              </div>
            )}
          </div>

          {/* ── Add form ─────────────────────────────────────────────────── */}
          {adding && (
            <form
              onSubmit={handleAddSubmit}
              className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3"
            >
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-wide">
                Thêm nhà cung cấp mới
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className={labelCls}>Tên *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="Tên nhà cung cấp"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className={labelCls}>Giá (VND)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={addForm.priceDisplay}
                    onChange={(e) => {
                      const n = parseInputNumber(e.target.value);
                      setAddForm((f) => ({
                        ...f,
                        priceDisplay: n > 0 ? formatNumber(n) : "",
                        price: n,
                      }));
                    }}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelCls}>Số điện thoại</label>
                  <input
                    type="text"
                    inputMode="tel"
                    value={addForm.phone}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="0900 000 000"
                  />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Địa chỉ</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className={inputCls}
                    placeholder="Địa chỉ"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setAddForm(emptyAdd());
                  }}
                  className="flex-1 py-2 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-500 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Plus size={12} />
                  )}
                  Thêm
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {liveItem.vendors.length > 0 && (
          <div className="shrink-0 px-6 py-4 border-t border-zinc-100 bg-zinc-50/80">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-500 font-medium">Giá thấp nhất</span>
              <span className="font-bold text-emerald-600 tabular-nums">
                {cheapestPrice !== null ? formatCurrency(cheapestPrice) : "—"}
              </span>
            </div>
            {liveItem.vendors.length > 1 && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-zinc-500 font-medium">Giá cao nhất</span>
                <span className="font-bold text-zinc-500 tabular-nums">
                  {formatCurrency(
                    Math.max(...liveItem.vendors.map((v) => v.price)),
                  )}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
