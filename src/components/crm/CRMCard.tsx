import { ReactNode } from "react";
import { CRMItem } from "@/types/crm";

type CRMCardProps = {
  item: CRMItem;
  statusText?: string;
  checklist: ReactNode;
  onOpen: () => void;
};

export function CRMCard({
  item,
  statusText,
  checklist,
  onOpen,
}: CRMCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_1fr_120px] lg:items-center">

        {/* Left info */}
        <div className="min-w-0">
          <button
            type="button"
            onClick={onOpen}
            className="block w-full text-left"
            title="Open details"
          >
            <div className="truncate text-base font-semibold">
              {item.title}
            </div>
          </button>

          <div className="mt-1 text-sm text-white/50">
            {item.platform} • {item.eventType}
          </div>

          {statusText && (
            <div className="mt-2 text-sm text-fuchsia-400">
              {statusText}
            </div>
          )}

          <div className="mt-1 text-xs text-white/40">
            AM: {item.manager}
          </div>
        </div>

        {/* Checklist */}
        <div>{checklist}</div>

        {/* Quick actions */}
        <div className="flex items-center justify-end gap-2">
          <button className="grid h-9 w-9 place-items-center rounded-full bg-white/5 hover:bg-white/10">
            @
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-white/5 hover:bg-white/10">
            ☎
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-full bg-white/5 hover:bg-white/10">
            ↗
          </button>
        </div>

      </div>
    </div>
  );
}
