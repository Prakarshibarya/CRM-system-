type ChecklistItemProps = {
  label: string;
  short?: string;
  checked: boolean;
  updatedAt?: string;
  onClick: () => void;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export function ChecklistItem({
  label,
  short,
  checked,
  updatedAt,
  onClick,
}: ChecklistItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={[
        "w-full rounded-xl border px-3 py-3",
        "flex items-center gap-2 text-left",
        "bg-black/35 hover:bg-black/45",
        checked ? "border-emerald-400/30" : "border-white/10",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-5 w-5 place-items-center rounded-full border text-[11px] shrink-0",
          checked
            ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
            : "border-white/20 text-white/30",
        ].join(" ")}
      >
        {checked ? "✓" : ""}
      </span>

      <div className="min-w-0">
        <div className="truncate text-[12px] text-white/80">
          {short || label}
        </div>
        <div className="truncate text-[10px] text-white/35">
          {updatedAt ? formatTime(updatedAt) : "Not done"}
        </div>
      </div>
    </button>
  );
}
