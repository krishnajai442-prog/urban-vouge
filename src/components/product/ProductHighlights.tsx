"use client";

import { useState } from "react";
import { ChevronDown, Ruler, Shirt, Palette, ShieldCheck, RefreshCcw, Sparkles } from "lucide-react";

type Props = {
  ram?: string | null;
  storage?: string | null;
  processor?: string | null;
  screenSize?: string | null;
  color?: string | null;
  warrantyMonths?: number | null;
  returnableDays?: number | null;
  /** Admin override lines (PDP info blocks). Null/empty = derived defaults. */
  items?: string[] | null;
};

/** Position-based icons so overridden lines keep the same visual grammar. */
const POSITION_ICONS = [
  <Ruler className="size-4" key="i0" />,
  <Shirt className="size-4" key="i1" />,
  <Sparkles className="size-4" key="i2" />,
  <Palette className="size-4" key="i3" />,
  <Palette className="size-4" key="i4" />,
  <ShieldCheck className="size-4" key="i5" />,
  <RefreshCcw className="size-4" key="i6" />,
];

export function ProductHighlights(p: Props) {
  const [open, setOpen] = useState(true);

  const derived = [
    p.ram && { icon: <Ruler className="size-4" />, text: "Size: " + p.ram },
    p.storage && { icon: <Shirt className="size-4" />, text: "Fabric: " + p.storage },
    p.screenSize && { icon: <Sparkles className="size-4" />, text: "Fit: " + p.screenSize },
    p.processor && { icon: <Palette className="size-4" />, text: "Occasion: " + p.processor },
    p.color && { icon: <Palette className="size-4" />, text: "Colour: " + p.color },
    { icon: <ShieldCheck className="size-4" />, text: `${p.warrantyMonths ?? "—"} day(s) easy return` },
    { icon: <RefreshCcw className="size-4" />, text: `${p.returnableDays ?? 7}-day exchange` },
  ].filter(Boolean) as { icon: React.ReactNode; text: string }[];

  const rows =
    p.items && p.items.length
      ? p.items.map((text, i) => ({ icon: POSITION_ICONS[i % POSITION_ICONS.length], text }))
      : derived;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left">
        <span>
          <span className="font-display text-[15px] font-bold text-gray-900">Product highlights</span>
          <span className="mt-0.5 block text-[12px] text-gray-500">Key style attributes and feature details</span>
        </span>
        <ChevronDown className={`size-5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="space-y-2.5 border-t border-gray-100 px-4 py-3.5">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center gap-3 text-[13.5px] text-gray-800">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#c9a96e]/12 text-[#8b6914]">{r.icon}</span>
              <span className="font-medium">{r.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ProductHighlights;