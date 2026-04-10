export type BudgetCategory = "dam-hoi" | "dam-cuoi";

export type BudgetStatus = "chua-coc" | "da-coc-mot-phan" | "hoan-thanh";

export interface Vendor {
  _id: string;
  name: string;
  address: string;
  phone: string;
  price: number;
  isDefault: boolean;
}

export interface BudgetItem {
  _id: string;
  category: BudgetCategory;
  itemName: string;
  estimatedCost: number;
  depositPaid: number;
  remainingCost: number;
  note: string;
  status: BudgetStatus;
  vendors: Vendor[];
  deadline: string | null; // ISO date string
  notifyStage: number;
  lastNotificationSent: string | null;
  createdAt: string;
  updatedAt: string;
}

export type BudgetItemInput = Omit<
  BudgetItem,
  | "_id"
  | "remainingCost"
  | "createdAt"
  | "updatedAt"
  | "notifyStage"
  | "lastNotificationSent"
  | "vendors"
>;

export type VendorInput = Omit<Vendor, "_id" | "isDefault">;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const STATUS_ORDER: BudgetStatus[] = [
  "chua-coc",
  "da-coc-mot-phan",
  "hoan-thanh",
];

export const STATUS_LABELS: Record<BudgetStatus, string> = {
  "chua-coc": "Chưa cọc",
  "da-coc-mot-phan": "Đã cọc một phần",
  "hoan-thanh": "Hoàn thành",
};

export const STATUS_COLORS: Record<BudgetStatus, { bg: string; text: string }> =
  {
    "chua-coc": { bg: "bg-gray-100", text: "text-gray-600" },
    "da-coc-mot-phan": { bg: "bg-amber-50", text: "text-amber-700" },
    "hoan-thanh": { bg: "bg-emerald-50", text: "text-emerald-700" },
  };

export interface AppNotification {
  _id: string;
  expenseIds: string[];
  stage: 1 | 2 | 3 | 4;
  deadlineDate: string; // "YYYY-MM-DD"
  message: string;
  isRead: boolean;
  sent: boolean;
  createdAt: string;
}

export const NOTIFY_STAGE_LABELS: Record<number, string> = {
  1: "7 ngày",
  2: "3 ngày",
  3: "1 ngày",
  4: "Quá hạn",
};
