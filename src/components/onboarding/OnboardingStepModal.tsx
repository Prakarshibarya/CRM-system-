"use client";

import { useEffect, useMemo, useState } from "react";

export type OnboardingKey =
  | "contactDetails"
  | "commissionSettled"
  | "partnerCreated";

export type OnboardingMeta = {
  checked: boolean;
  updatedAt?: string;
  comment?: string;

  commissionValue?: string;
  partnerEmail?: string;
};

function ModalShell({
  open,
  title,
  subtitle,
  onClose,
  footer,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0B0B10] shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-sm text-white/50">{subtitle}</div>
            ) : null}
          </div>

          <button
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">{children}</div>
        <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-white/70">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
      />
    </div>
  );
}

export default function OnboardingStepModal({
  open,
  stepKey,
  current,
  onClose,
  onSave,
}: {
  open: boolean;
  stepKey: OnboardingKey;
  current?: OnboardingMeta;
  onClose: () => void;
  onSave: (meta: OnboardingMeta) => void;
}) {
  const [comment, setComment] = useState("");
  const [commissionValue, setCommissionValue] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    setComment(current?.comment || "");
    setCommissionValue(current?.commissionValue || "");
    setPartnerEmail(current?.partnerEmail || "");
  }, [open, current]);

  const title =
    stepKey === "contactDetails"
      ? "Contact details found"
      : stepKey === "commissionSettled"
      ? "Commission settled"
      : "Partner created";

  const canSave = useMemo(() => {
    if (!comment.trim()) return false;
    if (stepKey === "commissionSettled") return !!commissionValue.trim();
    if (stepKey === "partnerCreated") return !!partnerEmail.trim();
    return true;
  }, [comment, commissionValue, partnerEmail, stepKey]);

  return (
    <ModalShell
      open={open}
      title={title}
      subtitle="Save captures timestamp + comments"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-40"
            onClick={() => {
              const now = new Date().toISOString();
              const meta: OnboardingMeta = {
                ...(current || { checked: false }),
                checked: true,
                updatedAt: now,
                comment: comment.trim(),
              };

              if (stepKey === "commissionSettled") {
                meta.commissionValue = commissionValue.trim();
              }
              if (stepKey === "partnerCreated") {
                meta.partnerEmail = partnerEmail.trim();
              }

              onSave(meta);
            }}
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {stepKey === "commissionSettled" ? (
          <LabeledInput
            label="Commission (amount or %)"
            value={commissionValue}
            onChange={setCommissionValue}
            placeholder="e.g., 5% or ₹5000"
          />
        ) : null}

        {stepKey === "partnerCreated" ? (
          <LabeledInput
            label="Partner email ID"
            value={partnerEmail}
            onChange={setPartnerEmail}
            placeholder="e.g., organizer@gmail.com"
          />
        ) : null}

        <div>
          <div className="text-sm font-medium text-white/70">Comments</div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What happened / what did the organizer say?"
            className="mt-2 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm"
          />
        </div>
      </div>
    </ModalShell>
  );
}
