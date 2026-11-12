"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, Search } from "lucide-react";

export type BrandOption = {
  id: string;
  name: string;
  slug?: string;
  categories?: string[];
};

const UNC = "Uncategorized";

export function BrandPicker({
  brands,
  categories,
  preferred,
  value,
  onChange,
}: {
  brands: BrandOption[];
  categories: string[];
  preferred?: string;
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string | null>(null); // null = category list view
  const [q, setQ] = useState("");

  // Brands created inline during this session, merged so the trigger label and
  // search both see them without a refetch.
  const [created, setCreated] = useState<BrandOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

    // Dedupe by id: a brand can arrive in BOTH `brands` (parent refetches after a
  // save) and `created` (added inline this session). Without this, the same id
  // yields two list rows sharing one React key. First occurrence wins, and it
  // also keeps `countFor` / `uncItems` from double-counting the duplicate.
  const allBrands = useMemo(() => {
    const seen = new Set<string>();
    const out: BrandOption[] = [];
    for (const b of [...brands, ...created]) {
      if (b.id && !seen.has(b.id)) {
        seen.add(b.id);
        out.push(b);
      }
    }
    return out;
  }, [brands, created]);

  const selected = allBrands.find((b) => b.id === value);

  const cats = useMemo(
    () =>
      [...categories].sort((a, b) =>
        a === preferred ? -1 : b === preferred ? 1 : a.localeCompare(b),
      ),
    [categories, preferred],
  );

  const countFor = (c: string) =>
    allBrands.filter((b) => (b.categories ?? []).includes(c)).length;

  const uncItems = useMemo(
    () => allBrands.filter((b) => (b.categories ?? []).length === 0),
    [allBrands],
  );

  const needle = q.trim().toLowerCase();
  const trimmed = q.trim();

  // KEY FIX: when a search query is present, match across ALL brands (any
  // category) — the brand is no longer gated by the category you drilled into.
  // With no query, keep the curated per-category browse.
  const items = useMemo(() => {
    if (!cat) return [];
    if (needle) return allBrands.filter((b) => b.name.toLowerCase().includes(needle));
    const base =
      cat === UNC ? uncItems : allBrands.filter((b) => (b.categories ?? []).includes(cat));
    return base;
  }, [cat, needle, allBrands, uncItems]);

  // Offer inline creation only when the typed name isn't already an exact brand.
  const exactExists =
    trimmed.length > 0 && allBrands.some((b) => b.name.toLowerCase() === trimmed.toLowerCase());
  const showCreate = Boolean(cat) && trimmed.length >= 2 && !exactExists && !creating;

  function close() {
    setOpen(false);
    setCat(null);
    setQ("");
    setCreateErr(null);
  }

  async function createBrand() {
    const name = trimmed;
    if (name.length < 2 || creating) return;
    setCreating(true);
    setCreateErr(null);
    try {
      const res = await fetch("/api/admin/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok || !json?.brand?.id) {
        throw new Error(json?.error || "Could not create brand");
      }
      const nb: BrandOption = {
        id: json.brand.id,
        name: json.brand.name,
        slug: json.brand.slug,
        categories: json.brand.categories ?? [],
      };
      setCreated((p) => (p.some((x) => x.id === nb.id) ? p : [...p, nb]));
      onChange(nb.id);
      close();
    } catch (e: any) {
      setCreateErr(e?.message || "Could not create brand");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="relative">
      <span className="mb-1 block text-[12px] font-bold text-gray-700">Brand</span>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 text-[13px] focus:border-[#1a1a2e]"
      >
        <span className={selected ? "text-gray-900" : "text-gray-400"}>
          {selected?.name ?? "Select brand"}
        </span>
        <ChevronDown className="size-4 text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={close} />
          <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
            {cat === null ? (
              /* LEVEL 1 — categories only */
              <div className="p-1">
                <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                  Choose a category
                </p>
                {cats.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setCat(c);
                      setQ("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-gray-50"
                  >
                    <span className="text-gray-800">{c}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                      {countFor(c)}
                    </span>
                  </button>
                ))}
                {uncItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCat(UNC);
                      setQ("");
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-[13px] font-semibold text-gray-500 hover:bg-gray-50"
                  >
                    {UNC}
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                      {uncItems.length}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* LEVEL 2 — brands, search is GLOBAL across all categories */
              <div>
                <div className="flex items-center gap-1 border-b border-gray-100 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCat(null);
                      setQ("");
                    }}
                    aria-label="Back to categories"
                    className="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-gray-50"
                  >
                    <ChevronLeft className="size-4 text-gray-500" />
                  </button>
                  <p className="text-[12.5px] font-bold text-gray-900">{cat}</p>
                </div>

                <div className="flex items-center gap-2 border-b border-gray-100 px-2 py-1.5">
                  <Search className="size-4 shrink-0 text-gray-400" />
                  <input
                    autoFocus
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={`Search all brands (any category)…`}
                    className="h-9 w-full rounded-lg border border-gray-300 pl-1 pr-2 text-[13px] outline-none focus:border-[#1a1a2e]"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto p-1">
                  {showCreate && (
                    <button
                      type="button"
                      onClick={createBrand}
                      disabled={creating}
                      className="mb-1 flex w-full items-center gap-2 rounded-lg border border-dashed border-[#c9a96e]/60 bg-[#faf5eb] px-2 py-2 text-left text-[13px] font-semibold text-[#8b6914] hover:bg-[#f0e6d0] disabled:opacity-60"
                    >
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#c9a96e] text-white">
                        +
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        Create brand “{trimmed}” and use it here
                      </span>
                    </button>
                  )}
                  {createErr && (
                    <p className="px-2 py-1 text-[11.5px] font-semibold text-[#a93226]">
                      {createErr}
                    </p>
                  )}

                  {items.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onChange(b.id);
                        close();
                      }}
                      className={`flex w-full flex-col rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-gray-50 ${
                        b.id === value ? "font-bold text-[#1a1a2e]" : "text-gray-800"
                      }`}
                    >
                      <span className="text-gray-900">{b.name}</span>
                      {(b.categories ?? []).length > 0 && (
                        <span className="mt-0.5 block truncate text-[10.5px] text-gray-400">
                          {(b.categories ?? []).join(" · ")}
                        </span>
                      )}
                    </button>
                  ))}

                  {items.length === 0 && !showCreate && !createErr && (
                    <p className="p-3 text-[12.5px] text-gray-400">
                      {needle
                        ? `No brand matches “${trimmed}”. Use the “Create brand” button above to add it.`
                        : `No brands tagged under ${cat} yet — tag them at /admin/brands.`}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default BrandPicker;