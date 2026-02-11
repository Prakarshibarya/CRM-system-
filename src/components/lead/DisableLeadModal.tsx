"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

export default function DisableLeadModal({
  open,
  onClose,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState("");

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0B0B10] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Disable Lead</div>
            <div className="mt-1 text-sm text-white/50">
              Use this when contact details cannot be found.
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium text-white/70">
            Reason / Notes
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tried WhatsApp, Instagram, website — no contact found."
            className="mt-2 h-28 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!reason.trim()}
            onClick={() => {
              onConfirm(reason.trim());
              setReason("");
            }}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-black hover:bg-red-400 disabled:opacity-40"
          >
            Disable
          </button>
        </div>
      </div>
    </div>
  );
}
