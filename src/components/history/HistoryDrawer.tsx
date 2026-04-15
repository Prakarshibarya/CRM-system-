"use client";

import { useEffect, useRef, useState } from "react";

type HistoryEntry = {
  at: string;
  text: string;
  by: string;
  eventTitle: string;
  eventId: string;
  stage: string;
  manager: string;
};

type GroupedEntries = {
  label: string;
  dateKey: string;
  entries: HistoryEntry[];
};

function toDateKey(iso: string): string {
  return iso.split("T")[0];
}

function formatDateLabel(dateKey: string): string {
  const today     = toDateKey(new Date().toISOString());
  const yesterday = toDateKey(new Date(Date.now() - 86400000).toISOString());
  if (dateKey === today)     return "Today";
  if (dateKey === yesterday) return "Yesterday";
  return new Date(dateKey).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function groupByDate(entries: HistoryEntry[]): GroupedEntries[] {
  const map = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    const key = toDateKey(e.at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, entries]) => ({ dateKey, label: formatDateLabel(dateKey), entries }));
}

function stageBadge(stage: string) {
  return stage === "ACTIVE"
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
    : "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/20";
}

function activityIcon(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("created"))    return "✦";
  if (t.includes("disabled"))   return "✕";
  if (t.includes("active"))     return "↑";
  if (t.includes("onboarding")) return "◎";
  if (t.includes("milestone"))  return "◆";
  if (t.includes("edited"))     return "✎";
  if (t.includes("discovered")) return "⊕";
  return "·";
}

type Preset = "today" | "7d" | "30d" | "custom";

function presetToRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const to = toDateKey(new Date().toISOString());
  if (preset === "today") return { from: to, to };
  if (preset === "7d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 6);
    return { from: toDateKey(from.toISOString()), to };
  }
  if (preset === "30d") {
    const from = new Date(today);
    from.setDate(from.getDate() - 29);
    return { from: toDateKey(from.toISOString()), to };
  }
  return { from: "", to: "" };
}

export function HistoryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries]             = useState<HistoryEntry[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [preset, setPreset]               = useState<Preset>("7d");
  const [fromDate, setFromDate]           = useState("");
  const [toDate, setToDate]               = useState("");
  const [managerFilter, setManagerFilter] = useState("All");
  const [stageFilter, setStageFilter]     = useState("All");
  const [search, setSearch]               = useState("");
  const abortRef                          = useRef<AbortController | null>(null);

  const activeRange = preset !== "custom" ? presetToRange(preset) : { from: fromDate, to: toDate };

  async function fetchHistory() {
    setLoading(true);
    setError("");
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const params = new URLSearchParams();
      if (activeRange.from) params.set("from", activeRange.from);
      if (activeRange.to)   params.set("to", activeRange.to);
      const res  = await fetch(`/api/history?${params}`, { signal: controller.signal });
      const data = await res.json();
      if (!res.ok) { setError(data?.error ?? "Failed to load history."); return; }
      setEntries(data.entries ?? []);
    } catch (err: any) {
      if (err?.name !== "AbortError") setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, preset, fromDate, toDate]);

  useEffect(() => {
    if (!open) { setSearch(""); setManagerFilter("All"); setStageFilter("All"); }
  }, [open]);

  if (!open) return null;

  const managers = Array.from(new Set(entries.map((e) => e.by))).sort();

  const filtered = entries.filter((e) => {
    if (managerFilter !== "All" && e.by !== managerFilter) return false;
    if (stageFilter   !== "All" && e.stage !== stageFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!e.eventTitle.toLowerCase().includes(q) &&
          !e.text.toLowerCase().includes(q) &&
          !e.by.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const grouped = groupByDate(filtered);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <aside className="absolute right-0 top-0 h-full w-[420px] border-l border-white/10 bg-[#07070A] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 shrink-0">
          <div>
            <div className="text-base font-semibold">Activity History</div>
            <div className="text-xs text-white/40 mt-0.5">
              {loading ? "Loading…" : `${filtered.length} entries`}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/50 hover:bg-white/10">✕</button>
        </div>

        {/* Filters */}
        <div className="border-b border-white/10 px-5 py-3 space-y-3 shrink-0">
          {/* Preset tabs */}
          <div className="flex gap-1">
            {(["today", "7d", "30d", "custom"] as Preset[]).map((p) => (
              <button key={p} type="button" onClick={() => setPreset(p)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  preset === p ? "bg-white/15 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
                }`}>
                {p === "today" ? "Today" : p === "7d" ? "7 days" : p === "30d" ? "30 days" : "Custom"}
              </button>
            ))}
          </div>

          {/* Custom date pickers */}
          {preset === "custom" && (
            <div className="flex gap-2 items-center">
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white" />
              <span className="text-white/30 text-xs">to</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white" />
            </div>
          )}

          {/* Search */}
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events or changes…"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white placeholder:text-white/30" />

          {/* Manager + stage filters */}
          <div className="flex gap-2">
            <select value={managerFilter} onChange={(e) => setManagerFilter(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white">
              <option value="All">All managers</option>
              {managers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white">
              <option value="All">All stages</option>
              <option value="ONBOARDING">Onboarding</option>
              <option value="ACTIVE">Active</option>
            </select>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-4">
              {error}
              <button type="button" onClick={fetchHistory} className="ml-3 underline text-red-300">Retry</button>
            </div>
          )}

          {loading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
              ))}
            </div>
          )}

          {!loading && !error && grouped.length === 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/40">
              No activity found for this period.
            </div>
          )}

          {!loading && grouped.map((group) => (
            <div key={group.dateKey} className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xs font-semibold text-white/50 uppercase tracking-wider">{group.label}</div>
                <div className="flex-1 h-px bg-white/5" />
                <div className="text-xs text-white/30">{group.entries.length}</div>
              </div>

              <div className="space-y-2">
                {group.entries.map((entry, idx) => (
                  <div key={idx}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-sm text-white/30 shrink-0 w-4 text-center">
                        {activityIcon(entry.text)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-white/90 truncate">{entry.eventTitle}</span>
                          <span className={`rounded-full border px-2 py-0.5 text-xs shrink-0 ${stageBadge(entry.stage)}`}>
                            {entry.stage === "ACTIVE" ? "Active" : "Onboarding"}
                          </span>
                        </div>
                        <div className="mt-0.5 text-xs text-white/60">{entry.text}</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-white/50">
                            👤 {entry.by}
                          </span>
                          <span className="text-xs text-white/30">{formatTime(entry.at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}