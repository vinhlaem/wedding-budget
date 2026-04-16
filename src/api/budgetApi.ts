import axios from "axios";
import type {
  ApiResponse,
  BudgetItem,
  BudgetItemInput,
  BudgetCategory,
  AppNotification,
  VendorInput,
  BudgetDefaultPayload,
} from "../types/budget";

// External backend for budget CRUD
const backendApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:9000/api",
  headers: { "Content-Type": "application/json" },
});

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("wb:auth");
    if (!raw) return null;
    // wb:auth is stored as JSON { token, user }
    const parsed = JSON.parse(raw);
    const t = parsed?.token;
    return typeof t === "string" ? t : null;
  } catch (e) {
    // invalid JSON or other error — clear invalid item
    try {
      localStorage.removeItem("wb:auth");
    } catch (err) {}
    return null;
  }
};

// Same-origin API routes — required for iOS PWA push compatibility
const localApi = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

backendApi.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export const budgetApi = {
  getAll: async (category?: BudgetCategory): Promise<BudgetItem[]> => {
    const params = category ? { category } : {};
    const { data } = await backendApi.get<ApiResponse<BudgetItem[]>>(
      "/budgets",
      { params },
    );
    return data.data;
  },

  create: async (item: BudgetItemInput): Promise<BudgetItem> => {
    const { data } = await backendApi.post<ApiResponse<BudgetItem>>(
      "/budgets",
      item,
    );
    return data.data;
  },

  createBulk: async (items: BudgetDefaultPayload[]): Promise<BudgetItem[]> => {
    const { data } = await backendApi.post<ApiResponse<BudgetItem[]>>(
      "/budgets/bulk",
      { budgets: items },
    );
    return data.data;
  },

  update: async (
    id: string,
    item: Partial<BudgetItemInput>,
  ): Promise<BudgetItem> => {
    const { data } = await backendApi.put<ApiResponse<BudgetItem>>(
      `/budgets/${id}`,
      item,
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await backendApi.delete(`/budgets/${id}`);
  },

  // ── Vendor sub-resource ──────────────────────────────────────────────────
  addVendor: async (
    budgetId: string,
    vendor: VendorInput,
  ): Promise<BudgetItem> => {
    const { data } = await backendApi.post<ApiResponse<BudgetItem>>(
      `/budgets/${budgetId}/vendors`,
      vendor,
    );
    return data.data;
  },

  updateVendor: async (
    budgetId: string,
    vendorId: string,
    vendor: Partial<VendorInput>,
  ): Promise<BudgetItem> => {
    const { data } = await backendApi.put<ApiResponse<BudgetItem>>(
      `/budgets/${budgetId}/vendors/${vendorId}`,
      vendor,
    );
    return data.data;
  },

  deleteVendor: async (
    budgetId: string,
    vendorId: string,
  ): Promise<BudgetItem> => {
    const { data } = await backendApi.delete<ApiResponse<BudgetItem>>(
      `/budgets/${budgetId}/vendors/${vendorId}`,
    );
    return data.data;
  },

  setDefaultVendor: async (
    budgetId: string,
    vendorId: string,
  ): Promise<BudgetItem> => {
    const { data } = await backendApi.patch<ApiResponse<BudgetItem>>(
      `/budgets/${budgetId}/vendors/${vendorId}/default`,
    );
    return data.data;
  },

  // Workspace share — shares ALL of the current user's budget items
  createShareLink: async (): Promise<{
    link: string;
    token?: string;
  } | null> => {
    const data = await backendApi.post<{ link: string; token?: string }>(
      "/budgets/share",
    );
    return data.data;
  },
};

// Auth helpers for frontend to set auth header after login
export function setAuthToken(token?: string | null) {
  if (token) {
    backendApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete backendApi.defaults.headers.common["Authorization"];
  }
}

// Initialize auth header from localStorage (client only).
// AuthProvider stores `{ token, user }` under 'wb:auth'. If a token exists,
// set it on the axios instance so page reloads keep the session.
try {
  if (typeof window !== "undefined") {
    const raw = localStorage.getItem("wb:auth");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const t = parsed?.token;
        if (t && typeof t === "string") {
          setAuthToken(t);
        }
      } catch (e) {
        // ignore parse errors
        // clear invalid item to avoid future parse issues
        try {
          localStorage.removeItem("wb:auth");
        } catch (e) {}
      }
    }
  }
} catch (e) {
  // defensive: any error reading localStorage should not break module init
}

export const pushApi = {
  getVapidKey: async (): Promise<string> => {
    const { data } = await localApi.get<ApiResponse<{ publicKey: string }>>(
      "/push/vapid-public-key",
    );
    return data.data.publicKey;
  },
  subscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    await localApi.post("/push/subscribe", subscription);
  },
  unsubscribe: async (endpoint: string): Promise<void> => {
    await localApi.delete("/push/unsubscribe", { data: { endpoint } });
  },
};

export const notificationApi = {
  getAll: async (): Promise<{
    notifications: AppNotification[];
    unreadCount: number;
  }> => {
    const { data } =
      await localApi.get<
        ApiResponse<{ notifications: AppNotification[]; unreadCount: number }>
      >("/notifications");
    return data.data;
  },
  markRead: async (id: string): Promise<void> => {
    await localApi.patch(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await localApi.patch("/notifications/read-all");
  },
};
