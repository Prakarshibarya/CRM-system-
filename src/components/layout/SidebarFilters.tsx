"use client";

type Platform =
  | "All"
  | "BookMyShow"
  | "District"
  | "SortMyScene"
  | "Other";

type SidebarFiltersProps = {
  query: string;
  onQueryChange: (v: string) => void;

  platform: Platform;
  onPlatformChange: (v: Platform) => void;

  manager: string;
  onManagerChange: (v: string) => void;

  managers: string[];
};

export function SidebarFilters({
  query,
  onQueryChange,
  platform,
  onPlatformChange,
  manager,
  onManagerChange,
  managers,
}: SidebarFiltersProps) {
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/10 bg-[#07070A] p-4 space-y-5">
      {/* Search */}
      <div>
        <div className="text-xs font-medium text-white/50">Search</div>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Org / event / city…"
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      {/* Platform */}
      <div>
        <div className="text-xs font-medium text-white/50">Platform</div>
        <select
          value={platform}
          onChange={(e) => onPlatformChange(e.target.value as Platform)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
        >
          <option>All</option>
          <option>BookMyShow</option>
          <option>District</option>
          <option>SortMyScene</option>
          <option>Other</option>
        </select>
      </div>

      {/* Manager */}
      <div>
        <div className="text-xs font-medium text-white/50">Account Manager</div>
        <select
          value={manager}
          onChange={(e) => onManagerChange(e.target.value)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
        >
          <option>All</option>
          {managers.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
    </aside>
  );
}
