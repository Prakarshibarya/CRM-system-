import { ActivityItem } from "@/types/crm";

type ActivityTimelineProps = {
  title?: string;
  items: ActivityItem[];
  limit?: number;
};

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export function ActivityTimeline({
  title = "Activity Timeline",
  items,
  limit = 10,
}: ActivityTimelineProps) {
  const shown = (items || []).slice(0, limit);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold">{title}</div>

      {shown.length === 0 ? (
        <div className="mt-3 text-sm text-white/50">No activity yet.</div>
      ) : (
        <div className="mt-3 space-y-2">
          {shown.map((a, idx) => (
            <div
              key={`${a.at}-${idx}`}
              className="rounded-xl border border-white/10 bg-black/30 p-3"
            >
              <div className="text-xs text-white/40">{formatTime(a.at)}</div>
              <div className="mt-1 text-sm text-white/80">{a.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
