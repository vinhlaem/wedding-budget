"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { BudgetItem } from "../types/budget";
import { formatCurrency } from "../utils/format";

interface Props {
  items: BudgetItem[];
  title?: string;
}

const COLORS = [
  "#3b82f6",
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#60a5fa",
];

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl shadow-lg p-3 text-sm">
        <p className="font-semibold text-zinc-800">{payload[0].name}</p>
        <p className="text-zinc-500 mt-0.5">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function BudgetChart({ items, title }: Props) {
  const data = items
    .filter((i) => i.estimatedCost > 0)
    .map((i) => ({ name: i.itemName, value: i.estimatedCost }));

  if (data.length === 0) return null;

  // Each legend row is ~20px; chart donut needs ~200px; add padding
  const legendRows = Math.ceil(data.length / 2);
  const totalHeight = 220 + legendRows * 22;

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
      <h3 className="text-sm font-bold text-zinc-800 mb-1">
        {title ?? "Phân bổ ngân sách"}
      </h3>
      <p className="text-xs text-zinc-400 mb-4">
        Tỷ lệ dự toán chi phí theo hạng mục
      </p>
      <ResponsiveContainer width="100%" height={totalHeight}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy={100}
            innerRadius={60}
            outerRadius={95}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ paddingTop: 16 }}
            formatter={(value) => (
              <span className="text-xs text-zinc-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
