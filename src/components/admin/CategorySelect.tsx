"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export type CategoryOption = { value: string; label: string; hint?: string };

type Props = {
  options: CategoryOption[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  /** Bold heading rendered above the trigger, matching the admin Input/Select labels. */
  label?: string;
};

/**
 * Accessible searchable category picker for the admin product form.
 * Replaces a native <select> (which cannot be filtered by typing).
 * Controlled: parent owns `value`; we only emit onChange(value) + close.
 */
export function CategorySelect({
  options,
  value,
  onChange,
  placeholder = "Select category",
  emptyText = "No categories match",
  className = "",
  label,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q),
    );
  }, [options, query]);

  // open => focus search, reset filter, point active at the current selection
  useEffect(() => {
    if (!open) return;
    setQuery("");
    const idx = filtered.findIndex((o) => o.value === value);
    setActive(idx === -1 ? 0 : idx);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // keep active row scrolled into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[active] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  // click-away closes
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (o: CategoryOption) => {
    onChange(o.value);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const o = filtered[active];
      if (o) commit(o);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
        {label && (
        <span className="mb-1 block text-[12.5px] font-semibold text-ink-900">{label}</span>
      )}
      {/* trigger */}
      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]"
      >
        <span className={selected ? "truncate" : "truncate text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3">
            <Search className="size-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); }}
              onKeyDown={onKeyDown}
              placeholder="Type to search…"
              className="h-10 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-[12.5px] text-gray-400">{emptyText}</li>
            )}
            {filtered.map((o, i) => {
              const isSel = o.value === value;
              const isActive = i === active;
              return (
                <li key={o.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(o)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">{o.label}</span>
                      {o.hint && <span className="block truncate text-[11px] text-gray-400">{o.hint}</span>}
                    </span>
                    {isSel && <Check className="size-4 shrink-0 text-[#8b6914]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CategorySelect;