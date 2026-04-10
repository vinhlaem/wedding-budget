import { useEffect, useState } from "react";
import { useBudgetStore } from "../store/budgetStore";
import type { BudgetItem, BudgetStatus, BudgetCategory } from "../types/budget";
import SummaryCards from "./SummaryCards";
import TabSelector from "./TabSelector";
import BudgetTable from "./BudgetTable";
import BudgetChart from "./BudgetChart";
import BudgetModal from "./BudgetModal";
import DeleteConfirm from "./DeleteConfirm";
import NotificationCenter from "./NotificationCenter";
import {
  Plus,
  Loader2,
  AlertCircle,
  PieChart,
  X,
  RefreshCw,
} from "lucide-react";
import { registerServiceWorker } from "../services/serviceWorker";
import { requestAndSubscribePush } from "../services/push.service";
import { Bell, BellOff } from "lucide-react";

export default function BudgetDashboard() {
  const {
    items,
    loading,
    error,
    activeTab,
    setActiveTab,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  } = useBudgetStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editItem, setEditItem] = useState<BudgetItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BudgetItem | null>(null);
  const [chartOpen, setChartOpen] = useState(false);
  const [showNotifBanner, setShowNotifBanner] = useState(false);

  useEffect(() => {
    fetchItems();
    // Register service worker
    registerServiceWorker().then((reg) => {
      if (!reg) {
        console.warn("[SW] Service worker registration failed");
        return;
      }
      const supportsNotif = "Notification" in window && "PushManager" in window;
      if (!supportsNotif) {
        console.warn("[push] Notifications not supported");

        return;
      }
      if (Notification.permission === "granted") {
        // Already granted — silently re-subscribe
        requestAndSubscribePush();
      } else if (Notification.permission === "default") {
        // Not yet asked — show banner so user can trigger via gesture (required on mobile)
        setShowNotifBanner(true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEnableNotifications = async () => {
    setShowNotifBanner(false);
    await requestAndSubscribePush();
  };

  const filteredItems = items.filter((i) => i.category === activeTab);
  const damHoiCount = items.filter((i) => i.category === "dam-hoi").length;
  const damCuoiCount = items.filter((i) => i.category === "dam-cuoi").length;

  const handleEdit = (item: BudgetItem) => {
    setEditItem(item);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };
  const handleAdd = () => {
    setEditItem(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleModalSubmit = async (data: {
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
  }) => {
    if (editItem) await updateItem(editItem._id, data);
    else await addItem(data);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteItem(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-dvh bg-[#f5f5f7]">
      {/* Top nav bar */}
      <header
        className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/60 sticky top-0 z-30"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center">
              <span className="text-white text-base leading-none">💒</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-900 leading-tight">
                Wedding Budget
              </h1>
              <p className="text-[10px] text-zinc-400 leading-none">
                Quản lý chi phí đám cưới
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationCenter />
            {/* Refresh — mobile only */}
            <button
              onClick={() => window.location.reload()}
              className="md:hidden p-2 rounded-xl hover:bg-zinc-100 transition-colors text-zinc-500"
              aria-label="Làm mới trang"
            >
              <RefreshCw size={16} />
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
            >
              <Plus size={14} />
              Thêm mới
            </button>
          </div>
        </div>
      </header>

      {/* Notification permission banner */}
      {showNotifBanner && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <Bell size={15} className="shrink-0 text-blue-500" />
            <span>Bật thông báo để nhắc nhở deadline thanh toán</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleEnableNotifications}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Bật
            </button>
            <button
              onClick={() => setShowNotifBanner(false)}
              className="p-1 text-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <BellOff size={15} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Summary cards */}
        <SummaryCards />

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-600">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Full-width table */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <TabSelector
              activeTab={activeTab}
              onChange={setActiveTab}
              counts={{ "dam-hoi": damHoiCount, "dam-cuoi": damCuoiCount }}
            />
            <p className="text-xs text-zinc-400">
              {filteredItems.length} hạng mục
            </p>
          </div>

          {loading && items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm flex items-center justify-center py-24">
              <Loader2 className="animate-spin text-zinc-400" size={28} />
            </div>
          ) : (
            <BudgetTable
              items={filteredItems}
              onEdit={handleEdit}
              onDelete={setDeleteTarget}
            />
          )}
        </div>
      </div>

      {/* ── Chart Drawer ─────────────────────────────────────────────────── */}
      {/* Mobile backdrop */}
      {chartOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 xl:hidden"
          onClick={() => setChartOpen(false)}
        />
      )}

      {/* Slide-in right panel */}
      <aside
        className={`fixed right-0 top-14 bottom-0 w-80 bg-white border-l border-zinc-200 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          chartOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
          <div>
            <p className="text-sm font-bold text-zinc-900">Phân bổ ngân sách</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {activeTab === "dam-hoi" ? "Đám hỏi" : "Đám cưới"}
            </p>
          </div>
          <button
            onClick={() => setChartOpen(false)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <BudgetChart items={items.filter((i) => i.category === activeTab)} />
        </div>
      </aside>

      {/* ── Fixed FABs ───────────────────────────────────────────────────── */}
      {/* Mobile: add button */}
      <button
        onClick={handleAdd}
        className="fixed bottom-6 right-6 xl:hidden w-14 h-14 bg-zinc-900 text-white rounded-2xl shadow-2xl flex items-center justify-center hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95 cursor-pointer z-20"
      >
        <Plus size={22} />
      </button>

      {/* Chart toggle FAB — above add on mobile, standalone on desktop */}
      <button
        onClick={() => setChartOpen((v) => !v)}
        title="Phân bổ ngân sách"
        className={`fixed bottom-24 xl:bottom-6 right-6 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer z-20 ${
          chartOpen
            ? "bg-zinc-800 text-white"
            : "bg-white text-zinc-700 border border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <PieChart size={22} />
      </button>

      {/* Modals */}
      <BudgetModal
        key={modalKey}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditItem(null);
        }}
        onSubmit={handleModalSubmit}
        editItem={editItem}
        activeTab={activeTab}
      />
      <DeleteConfirm
        isOpen={!!deleteTarget}
        itemName={deleteTarget?.itemName ?? ""}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
