import { Trash2, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirm({ isOpen, itemName, onConfirm, onCancel }: Props) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="animate-slide-up relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <button onClick={onCancel} className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:bg-zinc-100 transition-colors cursor-pointer">
          <X size={16} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-4 flex items-center justify-center">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h3 className="text-base font-bold text-zinc-900 mb-1">Xác nhận xóa</h3>
        <p className="text-sm text-zinc-500 mb-6 leading-relaxed">
          Bạn chắc chắn muốn xóa{" "}
          <span className="font-semibold text-zinc-700">"{itemName}"</span>?
          <br />
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer">
            Hủy
          </button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors cursor-pointer">
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}