"use client";

import type { CRMItem } from "@/types/crm";

type Props = {
  item: CRMItem;
  statusText?: string;

  // open right drawer
  onOpen: (id: string) => void;

  // middle block (steps / milestones)
  children: React.ReactNode;

  // optional: override right-side actions
  rightActions?: React.ReactNode;
};

export default function LeadCard({
  item,
  statusText,
  onOpen,
  children,
  rightActions,
}: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
        {/* LEFT: Organizer/Event info */}
        <div className="lg:col-span-5 min-w-0">
          <button
            type="button"
            onClick={() => onOpen(item.id)}
            className="block w-full text-left"
            title="Open details"
          >
            <div className="truncate text-base font-semibold">{item.title}</div>
          </button>

          <div className="mt-1 text-sm text-white/50">
            Found on {item.platform} • {item.eventType}
          </div>

          {statusText ? (
            <div className="mt-2 text-sm text-fuchsia-400">{statusText}</div>
          ) : null}

          <div className="mt-1 text-xs text-white/40">AM: {item.manager}</div>
        </div>

        {/* MIDDLE: Steps / Milestones */}
        <div className="lg:col-span-5 min-w-0">{children}</div>
      </div>
    </div>
  );
}
