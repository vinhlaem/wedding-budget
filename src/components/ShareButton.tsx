"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { budgetApi } from "../api/budgetApi";

export default function ShareButton() {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await budgetApi.createShareLink();

      const link = res?.link ?? null;
      if (link) {
        console.log(link);

        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ??
        (err as Error)?.message ??
        "Không thể tạo link chia sẻ";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        disabled={loading}
        title="Chia sẻ toàn bộ danh sách"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer disabled:opacity-50"
      >
        {copied ? (
          <>
            <Check size={13} className="text-emerald-500" />
            Đã copy link
          </>
        ) : loading ? (
          <>
            <Share2 size={13} className="animate-pulse" />
            Đang tạo...
          </>
        ) : (
          <>
            <Share2 size={13} />
            Chia sẻ
          </>
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-1 right-0 z-50 text-xs text-red-500 bg-white border border-red-200 rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
}
