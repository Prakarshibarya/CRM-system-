"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCRMStore } from "@/hooks/useCRMStore";

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

export default function DisabledPage() {
  const { items, updateItem, selectItem, selected } = useCRMStore();

  const disabledItems = useMemo(() => items.filter((i) => i.disabled), [items]);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Organizer Onboarding</div>

          <nav className="flex rounded-full bg-white/5 p-1">
            <Link href="/onboarding" className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white">
              Onboarding
            </Link>
            <Link href="/active-events" className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white">
              Active Events
            </Link>
            <Link href="/disabled" className="rounded-full bg-white/10 px-3 py-1 text-sm">
              Disabled
            </Link>
          </nav>

          <div className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">
            JD
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">DISABLED LEADS</div>
          <div className="text-sm font-medium text-white/40">{disabledItems.length}</div>
        </div>
        

        <div className="space-y-3">
          {disabledItems.map((item) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => selectItem(item.id)}
                    className="block w-full text-left"
                    title="Open"
                  >
                    <div className="truncate text-base font-semibold">{item.title}</div>
                  </button>

                  <div className="mt-1 text-sm text-white/50">
                    {item.platform} • {item.eventType} • AM: {item.manager}
                  </div>

                  <div className="mt-2 text-xs text-white/40">
                    Disabled: {formatTime(item.disabledAt)}{" "}
                    {item.disabledReason ? `• ${item.disabledReason}` : ""}
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90"
                  onClick={() =>
                    updateItem(
                      {
                        ...item,
                        disabled: false,
                        disabledAt: undefined,
                        disabledReason: undefined,
                      } as any,
                      "Lead restored"
                    )
                  }
                >
                  Restore
                </button>
              </div>
            </div>
          ))}

          {disabledItems.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
              No disabled leads.
            </div>
          ) : null}
        </div>

        {selected ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold">Selected</div>
            <div className="mt-1 text-white/70">{selected.title}</div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
