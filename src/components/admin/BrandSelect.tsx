"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check, Plus, Loader2 } from "lucide-react";

export type BrandOptionLite = { id: string; name: string };

type Props = {
  brands: BrandOptionLite[];
  value: string | null | undefined;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  /** Creates a brand row and resolves to its new id. Omit => search-only picker. */
  onCreateBrand?: (name: string) => Promise<string>;
  // Accepted for call-site compatibility with the old BrandPicker; unused here.
  categories?: string[];
  preferred?: string;
  className?: string;
};

export function BrandSelect({
  brands,
  value,
  onChange,
  label,
  placeholder = "Select brand",
  onCreateBrand,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [created, setCreated] = useState<BrandOptionLite[]>([]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Merge server brands + locally-created ones so a just-added brand is selectable/visible.
    // Merge server brands + locally-created ones, de-duplicated by id so a refreshed
  // `brands` prop (router.refresh on save / hot reload) can never double-count an
  // optimistically-added brand. Authoritative = `brands`; `created` only fills gaps.
  const all = useMemo(() => {
   const seen = new Set(brands.map((b) => b.id));
    const extra = created.filter((b) => !seen.has(b.id));
    return [...brands, ...extra];
  }, [brands, created]);
  const selected = useMemo(() => all.find((b) => b.id === value) ?? null, [all, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((b) => b.name.toLowerCase().includes(q));
  }, [all, query]);

  const showCreate = !!onCreateBrand && query.trim().length > 0 && filtered.length === 0;

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHint(null);
    const idx = filtered.findIndex((b) => b.id === value);
    setActive(idx === -1 ? 0 : idx);
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    (listRef.current.children[active] as HTMLElement | undefined)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const commit = (id: string) => { onChange(id); setOpen(false); };

  const handleCreate = async () => {
    if (!onCreateBrand || !query.trim() || creating) return;
    const name = query.trim();
    setCreating(true);
    setHint(null);
    try {
      const id = await onCreateBrand(name);
      setCreated((c) => (c.some((x) => x.id === id) ? c : [...c, { id, name }]));
      onChange(id);
      setOpen(false);
    } catch (e) {
      setHint(e instanceof Error ? e.message : "Could not create this brand.");
    } finally {
      setCreating(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (showCreate) { void handleCreate(); return; }
      const b = filtered[active];
      if (b) commit(b.id);
    } else if (e.key === "Escape") { e.preventDefault(); setOpen(false); }
    else if (e.key === "Tab") { setOpen(false); }
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {label && <span className="mb-1 block text-[12.5px] font-semibold text-ink-900">{label}</span>}

      <button
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 text-left text-sm text-gray-900 transition-colors hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]"
      >
        <span className={selected ? "truncate" : "truncate text-gray-400"}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown className={`size-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black/5">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3">
            <Search className="size-4 shrink-0 text-gray-400" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setActive(0); setHint(null); }}
              onKeyDown={onKeyDown}
              placeholder="Type to search or add a brand…"
              className="h-10 w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
          </div>

          {hint && (
            <p className="border-b border-gray-100 bg-flame-500/5 px-3 py-2 text-[11.5px] font-medium text-flame-600">{hint}</p>
          )}

          <ul ref={listRef} role="listbox" className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 && !showCreate && (
              <li className="px-3 py-6 text-center text-[12.5px] text-gray-400">No brands match</li>
            )}
            {filtered.map((b, i) => {
              const isSel = b.id === value;
              const isActive = i === active;
              return (
                <li key={b.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => commit(b.id)}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors ${isActive ? "bg-gray-100" : "bg-white"}`}
                  >
                    <span className="truncate font-medium text-gray-900">{b.name}</span>
                    {isSel && <Check className="size-4 shrink-0 text-[#8b6914]" />}
                  </button>
                </li>
              );
            })}
          </ul>

          {showCreate && (
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={creating}
              className="flex w-full items-center gap-2 border-t border-gray-100 px-3 py-2.5 text-left text-[13px] font-semibold text-[#1a1a2e] hover:bg-gray-50 disabled:opacity-60"
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Create “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BrandSelect;