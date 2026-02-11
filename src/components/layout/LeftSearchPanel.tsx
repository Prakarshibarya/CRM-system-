"use client";

type Platform = "All" | "BookMyShow" | "District" | "SortMyScene" | "Other";

type Props = {
  query: string;
  onQueryChange: (v: string) => void;

  platform: Platform;
  onPlatformChange: (v: Platform) => void;

  manager: string;
  onManagerChange: (v: string) => void;

  managers?: string[];
  className?: string; // ✅ allow page to control spacing/position
};

export default function LeftSearchPanel({
  query,
  onQueryChange,
  platform,
  onPlatformChange,
  manager,
  onManagerChange,
  managers = [],
  className = "",
}: Props) {
  return (
    // ✅ no extra width constraints; let parent grid decide
    <div className={["w-full", className].join(" ")}>
      {/* ✅ sticky so it stays visible while page scrolls */}
      <div className="sticky top-[88px]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
          {/* Search */}
          <div>
            <div className="text-xs font-medium text-white/50 mb-1">Search</div>
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Organizer / Event / City"
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
            />
          </div>

          {/* Platform */}
          <div>
            <div className="text-xs font-medium text-white/50 mb-1">Platform</div>
            <select
              value={platform}
              onChange={(e) => onPlatformChange(e.target.value as Platform)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option>All</option>
              <option>BookMyShow</option>
              <option>District</option>
              <option>SortMyScene</option>
              <option>Other</option>
            </select>
          </div>

          {/* Account Manager */}
          <div>
            <div className="text-xs font-medium text-white/50 mb-1">
              Account Manager
            </div>
            <select
              value={manager}
              onChange={(e) => onManagerChange(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
            >
              <option value="All">All</option>
              {managers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
