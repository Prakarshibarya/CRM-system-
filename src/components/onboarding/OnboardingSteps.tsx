"use client";

import type { OnboardingKey, OnboardingStepMeta } from "./types";

export const ONBOARDING_STEPS: { key: OnboardingKey; label: string; short: string }[] = [
  { key: "contactDetails", label: "Contact details found", short: "Contact" },
  { key: "commissionSettled", label: "Commission settled", short: "Commission" },
  { key: "partnerCreated", label: "Partner page created", short: "Partner" },
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

      {/* HORIZONTAL */}
      <div className="flex gap-2">
        {ONBOARDING_STEPS.map((s) => {
          const meta = onboarding[s.key] || { checked: false };

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onOpen(s.key)}
              className={[
                "flex-1 rounded-lg border px-3 py-2",
                "flex items-center gap-2",
                "bg-black/35 hover:bg-black/45",
                meta.checked ? "border-emerald-400/30" : "border-white/10",
              ].join(" ")}
            >
              <TickDot checked={!!meta.checked} />

              <div className="flex flex-col text-left leading-tight">
                <span className="text-[12px] text-white/90">
                  {s.short}
                </span>

                <span className="text-[10px] text-white/40">
                  {meta.updatedAt ? formatTime(meta.updatedAt) : "Not done"}
                </span>
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
        "grid h-5 w-5 place-items-center rounded-full border text-[11px] shrink-0",
        checked
          ? "border-emerald-400/70 bg-emerald-400/15 text-emerald-300"
          : "border-white/20 text-white/30",
      ].join(" ")}
    >
      {checked ? "✓" : ""}
    </span>
  );
}

function formatTime(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString();
}