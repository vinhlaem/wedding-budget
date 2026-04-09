import axios from "axios";
import type {
  ApiResponse,
  BudgetItem,
  BudgetItemInput,
  BudgetCategory,
  AppNotification,
} from "../types/budget";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:9000/api",
  headers: { "Content-Type": "application/json" },
});

export const budgetApi = {
  getAll: async (category?: BudgetCategory): Promise<BudgetItem[]> => {
    const params = category ? { category } : {};
    const { data } = await api.get<ApiResponse<BudgetItem[]>>("/budgets", {
      params,
    });
    return data.data;
  },

  create: async (item: BudgetItemInput): Promise<BudgetItem> => {
    const { data } = await api.post<ApiResponse<BudgetItem>>("/budgets", item);
    return data.data;
  },

  update: async (
    id: string,
    item: Partial<BudgetItemInput>,
  ): Promise<BudgetItem> => {
    const { data } = await api.put<ApiResponse<BudgetItem>>(
      `/budgets/${id}`,
      item,
    );
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/budgets/${id}`);
  },
};

export const pushApi = {
  getVapidKey: async (): Promise<string> => {
    const { data } = await api.get<ApiResponse<{ publicKey: string }>>(
      "/push/vapid-public-key",
    );
    return data.data.publicKey;
  },
  subscribe: async (subscription: PushSubscriptionJSON): Promise<void> => {
    await api.post("/push/subscribe", subscription);
  },
  unsubscribe: async (endpoint: string): Promise<void> => {
    await api.delete("/push/unsubscribe", { data: { endpoint } });
  },
};

export const notificationApi = {
  getAll: async (): Promise<{
    notifications: AppNotification[];
    unreadCount: number;
  }> => {
    const { data } =
      await api.get<
        ApiResponse<{ notifications: AppNotification[]; unreadCount: number }>
      >("/notifications");
    return data.data;
  },
  markRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.patch("/notifications/read-all");
  },
};
