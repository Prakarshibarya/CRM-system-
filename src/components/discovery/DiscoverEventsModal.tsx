"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";

/* ─── Types ─────────────────────────────────────────────── */

export type DiscoveredEvent = {
  title: string;
  eventLink: string;
  city: string;
  platform: string;
  eventName?: string;
  eventType?: string;
  venue?: string;
  startDate?: string;
  endDate?: string;
};

type Manager = { id: string; label: string };

type ParsedRow = DiscoveredEvent & {
  _rowIndex: number;
  _error?: string;
};

const GEMINI_CITIES    = ["Bangalore", "Mumbai", "Pune", "Delhi NCR", "Goa", "Hyderabad"];
const GEMINI_PLATFORMS = ["All", "BookMyShow", "District", "SortMyScene"];

function extractPlatform(link: string): string {
  try {
    const host = new URL(link).hostname.toLowerCase();
    if (host.includes("bookmyshow")) return "BookMyShow";
    if (host.includes("district"))   return "District";
    if (host.includes("sortmyscene"))return "SortMyScene";
    return "Other";
  } catch { return "Other"; }
}

function parseExcel(file: File): Promise<ParsedRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet    = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        const parsed: ParsedRow[] = rows.map((row, i) => {
          const get = (keys: string[]) => {
            for (const key of Object.keys(row)) {
              if (keys.some((k) => key.trim().toLowerCase() === k.toLowerCase()))
                return String(row[key]).trim();
            }
            return "";
          };

          const title     = get(["title", "name", "event name", "event title"]);
          const eventLink = get(["link", "url", "event link", "event url"]);
          const city      = get(["city", "location"]);
          const errors: string[] = [];
          if (!title)     errors.push("missing title");
          if (!eventLink) errors.push("missing link");
          else { try { new URL(eventLink); } catch { errors.push("invalid URL"); } }

          return {
            _rowIndex: i + 2,
            _error: errors.length ? errors.join(", ") : undefined,
            title, eventLink, city,
            platform: eventLink ? extractPlatform(eventLink) : "Other",
          };
        });
        resolve(parsed);
      } catch (err) { reject(err); }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

function PlatformBadge({ platform }: { platform: string }) {
  const colors: Record<string, string> = {
    BookMyShow:  "bg-red-500/20 text-red-300",
    District:    "bg-blue-500/20 text-blue-300",
    SortMyScene: "bg-green-500/20 text-green-300",
    Other:       "bg-white/10 text-white/50",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[platform] ?? colors.Other}`}>
      {platform}
    </span>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

export function DiscoverEventsModal({
  open,
  onClose,
  onImport,
}: {
  open: boolean;
  onClose: () => void;
  onImport: (events: (DiscoveredEvent & { manager: string })[]) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep]               = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [rows, setRows]               = useState<ParsedRow[]>([]);
  const [selected, setSelected]       = useState<Set<number>>(new Set());
  const [manager, setManager]         = useState("");
  const [managers, setManagers]       = useState<Manager[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [dragOver, setDragOver]       = useState(false);
  const [parseError, setParseError]   = useState("");
  const [importError, setImportError] = useState("");
  const [importedCount, setImportedCount] = useState(0);

  const [discoverCity, setDiscoverCity]         = useState(GEMINI_CITIES[0]);
  const [discoverPlatform, setDiscoverPlatform] = useState("All");
  const [discoverLoading, setDiscoverLoading]   = useState(false);
  const [discoverError, setDiscoverError]       = useState("");

  useEffect(() => {
    if (!open) {
      setStep("upload"); setRows([]); setSelected(new Set());
      setManager(""); setParseError(""); setImportError("");
      setImportedCount(0); setDiscoverError(""); setDiscoverLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setLoadingManagers(true);
    fetch("/api/users/managers")
      .then((r) => r.json())
      .then((data) => {
        setManagers(data.managers ?? []);
        if (data.managers?.length > 0) setManager(data.managers[0].label);
      })
      .catch(() => setManagers([]))
      .finally(() => setLoadingManagers(false));
  }, [open]);

  async function handleFile(file: File) {
    setParseError("");
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setParseError("Please upload an Excel file (.xlsx, .xls) or CSV."); return;
    }
    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) { setParseError("The file has no data rows."); return; }
      setRows(parsed);
      setSelected(new Set(parsed.filter((r) => !r._error).map((r) => r._rowIndex)));
      setStep("preview");
    } catch {
      setParseError("Could not read the file. Make sure it is a valid Excel or CSV file.");
    }
  }

  async function handleDiscover() {
    setDiscoverError("");
    setDiscoverLoading(true);
    try {
      const res  = await fetch("/api/discover/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: discoverCity, platform: discoverPlatform }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscoverError(data?.error ?? "Failed to fetch events."); return; }

      const events: DiscoveredEvent[] = data.events ?? [];
      if (events.length === 0) {
        setDiscoverError("No events found. Try a different city or platform."); return;
      }

      const parsed: ParsedRow[] = events.map((e, i) => ({
        ...e, _rowIndex: i + 1, _error: undefined,
      }));
      setRows(parsed);
      setSelected(new Set(parsed.map((r) => r._rowIndex)));
      setStep("preview");
    } catch {
      setDiscoverError("Something went wrong. Please try again.");
    } finally {
      setDiscoverLoading(false);
    }
  }

  function toggleRow(rowIndex: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) next.delete(rowIndex); else next.add(rowIndex);
      return next;
    });
  }

  function removeRow(rowIndex: number) {
    setRows((prev) => prev.filter((r) => r._rowIndex !== rowIndex));
    setSelected((prev) => { const next = new Set(prev); next.delete(rowIndex); return next; });
  }

  function toggleAll() {
    const valid = rows.filter((r) => !r._error).map((r) => r._rowIndex);
    if (valid.every((i) => selected.has(i))) setSelected(new Set());
    else setSelected(new Set(valid));
  }

  async function handleImport() {
    if (!manager.trim()) return;
    const toImport = rows
      .filter((r) => !r._error && selected.has(r._rowIndex))
      .map((r) => ({ ...r, manager: manager.trim() }));
    if (toImport.length === 0) return;
    setStep("importing"); setImportError("");
    try {
      await onImport(toImport);
      setImportedCount(toImport.length);
      setStep("done");
    } catch {
      setImportError("Import failed. Please try again.");
      setStep("preview");
    }
  }

  if (!open) return null;

  const validRows     = rows.filter((r) => !r._error);
  const errorRows     = rows.filter((r) => r._error);
  const selectedCount = rows.filter((r) => !r._error && selected.has(r._rowIndex)).length;
  const allValid      = validRows.every((r) => selected.has(r._rowIndex));

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-base font-semibold">Discover Events</div>
            <div className="text-xs text-white/40 mt-0.5">
              {step === "upload"    && "Upload an Excel / CSV file or discover events via web search"}
              {step === "preview"   && `${rows.length} events found — ${validRows.length} valid`}
              {step === "importing" && "Importing leads…"}
              {step === "done"      && `${importedCount} lead${importedCount !== 1 ? "s" : ""} added to Onboarding`}
            </div>
          </div>
          <button type="button" onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/50 hover:bg-white/10">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {/* ── Upload ── */}
          {step === "upload" && (
            <div className="space-y-4">
              {/* Drop zone */}
              <div
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors cursor-pointer
                  ${dragOver ? "border-fuchsia-500/60 bg-fuchsia-500/5" : "border-white/10 hover:border-white/20"}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              >
                <div className="text-3xl opacity-40">📊</div>
                <div className="text-sm text-white/60 text-center">
                  <span className="text-white/80 font-medium">Click to upload</span> or drag and drop
                </div>
                <div className="text-xs text-white/30">Excel (.xlsx, .xls) or CSV</div>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>

              {parseError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {parseError}
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <div className="text-xs font-medium text-white/50 mb-2">Expected columns</div>
                <div className="flex gap-2 flex-wrap">
                  {["title", "link", "city"].map((col) => (
                    <span key={col} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60 font-mono">{col}</span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-white/30">
                  Column names are flexible — "name", "event name", "url", "location" also work.
                </div>
              </div>

              {/* ── Discover via web search ── */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">✦</span>
                  <div className="text-sm font-medium text-white/80">Discover via Web Search</div>
                  <span className="ml-auto rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-0.5 text-xs text-fuchsia-300">
                    Live
                  </span>
                </div>
                <div className="text-xs text-white/40">
                  Searches BookMyShow, District, and SortMyScene in real time. Verifies each event is live and extracts date + venue automatically.
                </div>

                <div className="flex gap-2">
                  <select value={discoverCity} onChange={(e) => setDiscoverCity(e.target.value)}
                    disabled={discoverLoading}
                    className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50">
                    {GEMINI_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>

                  <select value={discoverPlatform} onChange={(e) => setDiscoverPlatform(e.target.value)}
                    disabled={discoverLoading}
                    className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white disabled:opacity-50">
                    {GEMINI_PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>

                  <button type="button" onClick={handleDiscover} disabled={discoverLoading}
                    className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-4 py-2 text-sm font-medium disabled:opacity-50 whitespace-nowrap">
                    {discoverLoading
                      ? <span className="flex items-center gap-2"><span className="inline-block animate-spin">⟳</span> Searching…</span>
                      : "Fetch Events"}
                  </button>
                </div>

                {discoverError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    {discoverError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Preview ── */}
          {step === "preview" && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-white/60 mb-1.5">Assign account manager to all imported leads</div>
                <select value={manager} onChange={(e) => setManager(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
                  disabled={loadingManagers}>
                  {loadingManagers && <option>Loading…</option>}
                  {managers.map((m) => <option key={m.id} value={m.label}>{m.label}</option>)}
                  {managers.length === 0 && !loadingManagers && <option value="">No approved users found</option>}
                </select>
              </div>

              {errorRows.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                  {errorRows.length} row{errorRows.length !== 1 ? "s" : ""} have errors and will be skipped.
                </div>
              )}

              <div className="flex items-center justify-between">
                <button type="button" onClick={toggleAll} className="text-xs text-white/50 hover:text-white/80">
                  {allValid ? "Deselect all" : "Select all valid"}
                </button>
                <div className="text-xs text-white/40">{selectedCount} of {validRows.length} selected</div>
              </div>

              <div className="space-y-2">
                {rows.map((row) => {
                  const isError   = !!row._error;
                  const isChecked = selected.has(row._rowIndex);
                  return (
                    <div key={row._rowIndex}
                      className={`flex items-start gap-3 rounded-xl border px-3 py-3 transition-colors
                        ${isError ? "border-red-500/20 bg-red-500/5 opacity-50"
                          : isChecked ? "border-white/15 bg-white/5"
                          : "border-white/5 bg-black/20"}`}>
                      <input type="checkbox" checked={isChecked && !isError} disabled={isError}
                        onChange={() => !isError && toggleRow(row._rowIndex)}
                        className="mt-0.5 accent-fuchsia-500" />

                      <div className="flex-1 min-w-0">
                        {/* Title + platform + city */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">
                            {row.title || <span className="text-white/30 italic">no title</span>}
                          </span>
                          <PlatformBadge platform={row.platform} />
                          {row.city && <span className="text-xs text-white/40">{row.city}</span>}
                        </div>

                        {/* Date + venue chips */}
                        {(row.startDate || row.venue) && (
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {row.startDate && (
                              <span className="inline-flex items-center gap-1 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-2 py-0.5">
                                📅 {formatDate(row.startDate)}
                                {row.endDate && row.endDate !== row.startDate && (
                                  <> – {formatDate(row.endDate)}</>
                                )}
                              </span>
                            )}
                            {row.venue && (
                              <span className="inline-flex items-center gap-1 text-xs text-white/60 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 max-w-[200px] truncate">
                                📍 {row.venue}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Link */}
                        {row.eventLink && (
                          <a href={row.eventLink} target="_blank" rel="noreferrer"
                            className="text-xs text-fuchsia-400/70 hover:text-fuchsia-300 truncate mt-1 block">
                            {row.eventLink}
                          </a>
                        )}
                        {isError && <div className="text-xs text-red-400 mt-0.5">⚠ {row._error}</div>}
                      </div>

                      {!isError && (
                        <button type="button" onClick={() => removeRow(row._rowIndex)}
                          className="mt-0.5 shrink-0 rounded-full p-1 text-white/20 hover:bg-white/10 hover:text-white/60 transition-colors"
                          title="Remove">✕</button>
                      )}
                    </div>
                  );
                })}
              </div>

              {importError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {importError}
                </div>
              )}
            </div>
          )}

          {/* ── Importing ── */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="text-3xl animate-spin">⟳</div>
              <div className="text-sm text-white/50">Adding leads to Onboarding…</div>
            </div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="text-4xl">✓</div>
              <div className="text-base font-medium">
                {importedCount} lead{importedCount !== 1 ? "s" : ""} imported
              </div>
              <div className="text-sm text-white/40">
                Now in Onboarding, assigned to <span className="text-white/70">{manager}</span>.
                Date and venue auto-filled where available.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4 flex items-center justify-between gap-3">
          {step === "upload" && (
            <><div />
            <button type="button" onClick={onClose}
              className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10">Cancel</button></>
          )}
          {step === "preview" && (
            <>
              <button type="button"
                onClick={() => { setStep("upload"); setRows([]); setParseError(""); }}
                className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/60 hover:bg-white/10">← Back</button>
              <button type="button" onClick={handleImport}
                disabled={selectedCount === 0 || !manager}
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2 text-sm font-medium disabled:opacity-40">
                Import {selectedCount} lead{selectedCount !== 1 ? "s" : ""}
              </button>
            </>
          )}
          {step === "done" && (
            <><div />
            <button type="button" onClick={onClose}
              className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-500 px-5 py-2 text-sm font-medium">Done</button></>
          )}
        </div>
      </div>
    </div>
  );
}