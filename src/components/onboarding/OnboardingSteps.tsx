"use client";

import type { OnboardingKey, OnboardingStepMeta } from "./types";

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
    <div className="min-w-0">
      <div className="mb-2 text-xs font-medium text-white/40">
        ONBOARDING CHECKLIST — <span className="text-white/60">{doneCount}/3</span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {ONBOARDING_STEPS.map((s) => {
          const meta = onboarding[s.key] || { checked: false };

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onOpen(s.key)}
              title={s.label}
              className={[
                "w-full rounded-xl border px-4 py-3",
                "flex items-center gap-3",
                "bg-black/35 hover:bg-black/45",
                "min-w-0",
                meta.checked ? "border-emerald-400/30" : "border-white/10",
              ].join(" ")}
            >
              <TickDot checked={!!meta.checked} />

              <div className="min-w-0">
                <div className="truncate text-[13px] text-white/85">{s.short}</div>
                <div className="truncate text-[11px] text-white/40">
                  {meta.updatedAt ? formatTime(meta.updatedAt) : "Not done"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
