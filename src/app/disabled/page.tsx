"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { useCRMStore } from "@/hooks/useCRMStore";

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}

/* ------------------ Loading Skeleton ------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-20 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}

/* ------------------ Error Banner ------------------ */

function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      <span>⚠ {message}</span>
      <button
        type="button"
        onClick={onRetry}
        className="ml-4 rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30"
      >
        Retry
      </button>
    </div>
  );
}

/* ------------------ Page ------------------ */

export default function DisabledPage() {
  // ✅ Pull loading, error, refreshItems from store
  const { items, updateItem, loading, error, refreshItems } = useCRMStore();

  // ✅ Fetch on mount
  useEffect(() => {
    refreshItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disabledItems = useMemo(() => items.filter((i) => i.disabled), [items]);

  return (
    <main className="min-h-screen bg-black text-white overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <div className="text-lg font-semibold">Organizer Onboarding</div>

          <nav className="flex rounded-full bg-white/5 p-1">
            <Link
              href="/onboarding"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Onboarding
            </Link>
            <Link
              href="/active-events"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Active Events
            </Link>
            <Link
              href="/disabled"
              className="rounded-full bg-white/10 px-3 py-1 text-sm"
            >
              Disabled
            </Link>
            <Link
              href="/expired-events"
              className="rounded-full px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Expired Events
            </Link>
          </nav>

          {/* ✅ Refresh button */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshItems()}
              disabled={loading}
              className="rounded-full bg-white/5 px-3 py-2 text-xs text-white/50 hover:bg-white/10 disabled:opacity-40"
              title="Refresh"
            >
              {loading ? "↻ Loading..." : "↻ Refresh"}
            </button>

            <div className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-xs">
              JD
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-sm font-medium text-white/70">DISABLED LEADS</div>
          {/* ✅ Show dash while loading */}
          <div className="text-sm font-medium text-white/40">
            {loading ? "—" : disabledItems.length}
          </div>
        </div>

        {/* ✅ Error banner with retry */}
        {error && !loading && (
          <div className="mb-4">
            <ErrorBanner message={error} onRetry={refreshItems} />
          </div>
        )}

        {/* ✅ Skeleton vs content */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-3">
            {disabledItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-base font-semibold">{item.title}</div>

                    <div className="mt-1 text-sm text-white/50">
                      {item.platform} • {item.eventType} • AM: {item.manager}
                    </div>

                    <div className="mt-2 text-xs text-white/40">
                      Disabled: {formatTime(item.disabledAt)}
                      {item.disabledReason ? ` • ${item.disabledReason}` : ""}
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

            {disabledItems.length === 0 && !error && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/60">
                No disabled leads.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}