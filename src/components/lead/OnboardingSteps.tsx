"use client";

import type { OnboardingKey, OnboardingStepMeta } from "./OnboardingStepModal";

export const ONBOARDING_STEPS: { key: OnboardingKey; label: string; short: string }[] = [
  { key: "contactDetails", label: "Contact details found", short: "Contact" },
  { key: "commissionSettled", label: "Commission settled", short: "Commission" },
  { key: "partnerCreated", label: "Partner created", short: "Partner" },
];

type Props = {
  onboarding: Partial<Record<OnboardingKey, OnboardingStepMeta>>;
  onOpen: (key: OnboardingKey) => void;
};

export default function OnboardingSteps({ onboarding, onOpen }: Props) {
  const doneCount = ONBOARDING_STEPS.filter((s) => onboarding[s.key]?.checked).length;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium text-white/40">ONBOARDING CHECKLIST</div>
        <div className="text-xs text-white/60">
          {doneCount}/3 <span className="text-white/30">done</span>
        </div>
      </div>

      {/* Mobile: stacked. Desktop: 3 wide big buttons */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ONBOARDING_STEPS.map((s) => {
          const meta = onboarding[s.key] || { checked: false };

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onOpen(s.key)}
              title={s.label}
              className={[
                "group w-full rounded-2xl border",
                "bg-black/35 hover:bg-black/45",
                "px-4 py-3.5",
                "flex items-center gap-3",
                "min-h-[64px]",
                meta.checked ? "border-emerald-400/30" : "border-white/10",
              ].join(" ")}
            >
              <TickDot checked={!!meta.checked} />

              <div className="min-w-0 text-left">
                {/* On desktop show full label; on smaller widths show short */}
                <div className="text-[13px] font-medium text-white/85">
                  <span className="sm:hidden">{s.short}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </div>

                <div className="mt-0.5 text-[11px] text-white/40">
                  {meta.updatedAt ? formatTime(meta.updatedAt) : "Not done yet"}
                </div>
              </div>

              {/* subtle affordance */}
              <div className="ml-auto hidden sm:block text-white/20 group-hover:text-white/35">
                →
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- UI helpers ---------------- */

function TickDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={[
        "grid h-6 w-6 place-items-center rounded-full border text-[12px] shrink-0",
        checked
          ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
          : "border-white/20 text-white/30",
      ].join(" ")}
      aria-hidden="true"
    >
      {checked ? "✓" : ""}
    </span>
  );
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString();
}
