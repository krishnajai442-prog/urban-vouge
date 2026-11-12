"use client";
import { useState } from "react";
import { ChevronDown, RefreshCcw, Wallet, Lock, ShieldCheck } from "lucide-react";

export function PeaceOfMind({
  brandName, warrantyMonths, returnableDays, codEligible, items,
}: {
  brandName?: string | null; warrantyMonths?: number | null;
  returnableDays?: number | null; codEligible?: boolean | null;
  /** Admin override labels (PDP info blocks). Null/empty = built-in defaults. */
  items?: string[] | null;
}) {
  const [open, setOpen] = useState(true);
  const defaults = [
    `${returnableDays ?? 7}-day brand support`,
    codEligible ? "Cash on Delivery" : "Secure payments",
    "Urban Vogue Assured",
  ];
  const labels = items && items.length ? items : defaults;
  const iconAt = (i: number) =>
    i === 0 ? (
      <RefreshCcw className="size-5" />
    ) : i === 1 ? (
      codEligible ? <Wallet className="size-5" /> : <Lock className="size-5" />
    ) : (
      <ShieldCheck className="size-5" />
    );
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left">
        <span className="font-display text-[15px] font-bold text-gray-900">Shop with peace of mind</span>
        <ChevronDown className={`size-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            {labels.map((label, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <span className="grid size-11 place-items-center rounded-full bg-[#1a1a2e]/10 text-[#1a1a2e]">{iconAt(i)}</span>
                <span className="text-[11.5px] font-semibold leading-tight text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
export default PeaceOfMind;