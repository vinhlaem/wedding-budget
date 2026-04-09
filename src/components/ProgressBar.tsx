interface Props {
  percentage: number;
  showLabel?: boolean;
}

export default function ProgressBar({ percentage, showLabel = true }: Props) {
  const clamped = Math.min(100, Math.max(0, percentage));

  let barColor = "bg-zinc-200";
  if (clamped > 0 && clamped < 100) barColor = "bg-amber-400";
  if (clamped >= 100) barColor = "bg-emerald-500";

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden min-w-[60px]">
        <div
          className={`h-full rounded-full progress-bar-fill ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-[11px] font-medium text-zinc-400 w-8 text-right tabular-nums">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
