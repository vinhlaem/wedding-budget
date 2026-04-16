import { create } from "zustand";
import type {
  BudgetItem,
  BudgetCategory,
  BudgetStatus,
  BudgetItemInput,
  VendorInput,
  BudgetDefaultPayload,
} from "../types/budget";
import { budgetApi } from "../api/budgetApi";
import { STATUS_ORDER } from "../types/budget";

interface BudgetState {
  items: BudgetItem[];
  loading: boolean;
  error: string | null;
  activeTab: BudgetCategory;

  setActiveTab: (tab: BudgetCategory) => void;
  fetchItems: () => Promise<void>;
  addItem: (item: BudgetItemInput) => Promise<void>;
  addBulkItems: (items: BudgetDefaultPayload[]) => Promise<void>;
  updateItem: (id: string, item: Partial<BudgetItemInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  cycleStatus: (id: string) => Promise<void>;

  addVendor: (budgetId: string, vendor: VendorInput) => Promise<void>;
  updateVendor: (
    budgetId: string,
    vendorId: string,
    vendor: Partial<VendorInput>,
  ) => Promise<void>;
  deleteVendor: (budgetId: string, vendorId: string) => Promise<void>;
  setDefaultVendor: (budgetId: string, vendorId: string) => Promise<void>;
}

export const suggestStatus = (
  estimatedCost: number,
  depositPaid: number,
): BudgetStatus => {
  if (depositPaid <= 0) return "chua-coc";
  if (depositPaid >= estimatedCost) return "hoan-thanh";
  return "da-coc-mot-phan";
};

const patchItem = (items: BudgetItem[], updated: BudgetItem): BudgetItem[] =>
  items.map((i) => (i._id === updated._id ? updated : i));

export const useBudgetStore = create<BudgetState>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  activeTab: "dam-hoi",

  setActiveTab: (tab) => set({ activeTab: tab }),

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await budgetApi.getAll();
      set({ items, loading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi tải dữ liệu";
      set({ error: message, loading: false });
    }
  },

  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      const created = await budgetApi.create(item);
      set((state) => ({ items: [...state.items, created], loading: false }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi thêm mục";
      set({ error: message, loading: false });
    }
  },
  addBulkItems: async (items) => {
    set({ loading: true, error: null });
    try {
      const createdItems = await budgetApi.createBulk(items);
      set((state) => ({
        items: [...state.items, ...createdItems],
        loading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi thêm mục";
      set({ error: message, loading: false });
    }
  },
  updateItem: async (id, updates) => {
    set({ error: null });
    try {
      const updated = await budgetApi.update(id, updates);
      set((state) => ({ items: patchItem(state.items, updated) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi cập nhật";
      set({ error: message });
    }
  },

  deleteItem: async (id) => {
    set({ error: null });
    try {
      await budgetApi.delete(id);
      set((state) => ({ items: state.items.filter((i) => i._id !== id) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi xóa mục";
      set({ error: message });
    }
  },

  cycleStatus: async (id) => {
    const item = get().items.find((i) => i._id === id);
    if (!item) return;
    const currentIdx = STATUS_ORDER.indexOf(item.status);
    const nextStatus = STATUS_ORDER[(currentIdx + 1) % STATUS_ORDER.length];
    await get().updateItem(id, { status: nextStatus });
  },

  addVendor: async (budgetId, vendor) => {
    set({ error: null });
    try {
      const updated = await budgetApi.addVendor(budgetId, vendor);
      set((state) => ({ items: patchItem(state.items, updated) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi thêm vendor";
      set({ error: message });
    }
  },

  updateVendor: async (budgetId, vendorId, vendor) => {
    set({ error: null });
    try {
      const updated = await budgetApi.updateVendor(budgetId, vendorId, vendor);
      set((state) => ({ items: patchItem(state.items, updated) }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Lỗi cập nhật vendor";
      set({ error: message });
    }
  },

  deleteVendor: async (budgetId, vendorId) => {
    set({ error: null });
    try {
      const updated = await budgetApi.deleteVendor(budgetId, vendorId);
      set((state) => ({ items: patchItem(state.items, updated) }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Lỗi xóa vendor";
      set({ error: message });
    }
  },

  setDefaultVendor: async (budgetId, vendorId) => {
    set({ error: null });
    try {
      const updated = await budgetApi.setDefaultVendor(budgetId, vendorId);
      set((state) => ({ items: patchItem(state.items, updated) }));
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Lỗi đặt vendor mặc định";
      set({ error: message });
    }
  },
}));
