"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Image as ImageIcon,
  List,
  Palette,
  Plus,
  Save,
  Trash2,
  ZoomIn,
} from "lucide-react";

import { type BrandOption } from "@/components/admin/BrandPicker";
import { BrandSelect } from "@/components/admin/BrandSelect";
import { CategorySelect } from "@/components/admin/CategorySelect";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { ImagePreviewModal } from "@/components/admin/ImagePreviewModal";
import { ImageUploadButton } from "@/components/admin/ImageUploadButton";
import {
  ProductOptionsEditor,
  type OptionsPayload,
} from "@/components/admin/ProductOptionsEditor";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toaster";
import { parseProductOptions } from "@/lib/product-options";

type Option = { id: string; name: string };
type FormImage = { url: string; alt: string };
type FormSpec = { group: string; label: string; value: string };

type Initial = {
  name: string; slug: string; shortDescription: string; categoryId: string; brandId: string;
  mrp: number; salePrice: number; stock: number; lowStockAt: number; subtype: string; groupId: string;
  ram: string; storage: string; screenSize: string; processor: string; color: string; warrantyMonths: number;
  codEligible: boolean; emiEligible: boolean; exchangeEligible: boolean; featured: boolean; active: boolean;
  hsnCode: string; tags: string; images: FormImage[]; specifications: FormSpec[];
  colors: any[]; variants: any[]; optionGroups: any[];
};

const blank: Initial = {
  name: "", slug: "", shortDescription: "", categoryId: "", brandId: "", mrp: 0, salePrice: 0, stock: 0,
  lowStockAt: 5, subtype: "", groupId: "", ram: "", storage: "", screenSize: "", processor: "", color: "",
  warrantyMonths: 12, codEligible: true, emiEligible: true, exchangeEligible: true, featured: false, active: true,
  hsnCode: "", tags: "", images: [{ url: "", alt: "" }], specifications: [], colors: [], variants: [], optionGroups: [],
};

type NumericKey = "mrp" | "salePrice" | "stock" | "lowStockAt";
type RawState = Record<NumericKey, string> & { hsnCode: string };
type SaveResponse = {
  ok: boolean; id?: string; product?: { id?: string }; error?: string; fields?: Record<string, string[]>;
};

function createRawState(form: Initial): RawState {
  return {
    mrp: String(form.mrp), salePrice: String(form.salePrice), stock: String(form.stock),
    lowStockAt: String(form.lowStockAt), hsnCode: form.hsnCode,
  };
}
function splitTags(tags: string): string[] {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}
function normalizeImages(images: FormImage[], fallbackAlt: string) {
  return images.filter((i) => i.url.trim() !== "").map((i) => ({ url: i.url.trim(), alt: i.alt.trim() || fallbackAlt }));
}
function normalizeSpecifications(specs: FormSpec[]) {
  return specs.filter((s) => s.label.trim() !== "" && s.value.trim() !== "").map((s) => ({
    group: s.group.trim() || "General", label: s.label.trim(), value: s.value.trim(),
  }));
}

// Friendly labels for keys a control can't red-line itself (custom selects, opaque
// option editor, array rows). Anything not in KNOWN surfaces here, so no error is lost.
const LABEL: Record<string, string> = {
  brandId: "Brand", categoryId: "Category", images: "Images", specifications: "Specifications",
  colors: "Colours & variants", variants: "Colours & variants", optionGroups: "Colours & variants",
  shortDescription: "Short description", _: "Product",
};
// Scalar controls that DO accept `error` and render red + message themselves.
const KNOWN = new Set([
  "name", "slug", "subtype", "groupId", "hsnCode", "ram", "storage", "screenSize", "processor", "color", "tags",
  "mrp", "salePrice", "stock", "lowStockAt", "active", "featured", "codEligible", "emiEligible", "exchangeEligible",
]);

export function ProductForm({
  categories, brands, initial, productId, canDelete, footer,
}: {
  categories: Option[]; brands: BrandOption[]; initial?: Initial; productId?: string; canDelete?: boolean; footer?: ReactNode;
}) {
  const router = useRouter();
  const toast = useToast();
  const isEdit = Boolean(productId);

  const [form, setForm] = useState<Initial>(initial ?? blank);
  const [raw, setRaw] = useState<RawState>(() => createRawState(form));
  const [busy, setBusy] = useState(false);
  const [copyBusy, setCopyBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});
  const [preview, setPreview] = useState<string | null>(null);

  const fe = (k: string) => fieldErrs[k]?.[0];
  const unmapped = Object.entries(fieldErrs).filter(([k]) => !KNOWN.has(k));

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }) as Initial);
  }
  function setNumeric(key: NumericKey, value: string) {
    setRaw((r) => ({ ...r, [key]: value }));
    const n = Number(value);
    set(key, value === "" || !Number.isFinite(n) ? 0 : n);
  }
  function setHsnCode(value: string) {
    setRaw((r) => ({ ...r, hsnCode: value }));
    set("hsnCode", value);
  }
  function patchImage(i: number, p: Partial<FormImage>) {
    setForm((f) => ({ ...f, images: f.images.map((im, idx) => (idx === i ? { ...im, ...p } : im)) }));
  }
  function removeImage(i: number) { setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) })); }
  function addImage() { setForm((f) => ({ ...f, images: [...f.images, { url: "", alt: "" }] })); }
  function patchSpec(i: number, p: Partial<FormSpec>) {
    setForm((f) => ({ ...f, specifications: f.specifications.map((s, idx) => (idx === i ? { ...s, ...p } : s)) }));
  }
  function removeSpec(i: number) { setForm((f) => ({ ...f, specifications: f.specifications.filter((_, idx) => idx !== i) })); }
  function addSpec() { setForm((f) => ({ ...f, specifications: [...f.specifications, { group: "General", label: "", value: "" }] })); }

  async function duplicate() {
    if (!productId) return;
    setCopyBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, { method: "POST" });
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
      if (!res.ok || !json.ok || !json.id) throw new Error(json.error ?? "Could not copy the product");
      toast.push({ title: "Product copied", body: "Opened the copy for editing." });
      router.push(`/admin/products/${json.id}/edit`); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Copy failed"); } finally { setCopyBusy(false); }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError(null); setFieldErrs({});
    try {
      const options = parseProductOptions({ colors: form.colors, variants: form.variants, optionGroups: form.optionGroups });
      const payload = {
        ...form,
        tags: splitTags(form.tags),
        images: normalizeImages(form.images, form.name),
        specifications: normalizeSpecifications(form.specifications),
        ...options,
      };
      const res = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", {
        method: productId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as SaveResponse;
      if (!res.ok || !json.ok) {
        // Keep the per-field map; only fall back to the flat string when there is none.
        setFieldErrs(json.fields ?? {});
        if (!json.fields || Object.keys(json.fields).length === 0) {
          throw new Error(json.error ?? "Save failed");
        }
        return; // field errors are now shown on the controls; don't also throw a banner
      }
      const createdId = json.product?.id ?? json.id;
      toast.push({
        title: isEdit ? "Product updated" : "Product created",
        body: isEdit ? undefined : "Next: add description, specs & PDP details.",
      });
      router.push(!isEdit && createdId ? `/admin/products/${createdId}/edit` : "/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <section className="card grid gap-3 p-5 sm:grid-cols-2">
        <Input containerClassName="sm:col-span-2" label="Product name" value={form.name} onChange={(e) => set("name", e.target.value)} error={fe("name")} required />
        <Input label="Slug (optional)" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto-generated" error={fe("slug")} />
        <BrandSelect
          label="Brand" brands={brands} categories={categories.map((c) => c.name)}
          preferred={categories.find((c) => c.id === form.categoryId)?.name}
          value={form.brandId} onChange={(id) => set("brandId", id)} 
          onCreateBrand={async (name) => {
            const res = await fetch("/api/admin/brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
            const j = (await res.json().catch(() => ({}))) as { ok?: boolean; id?: string; error?: string };
            if (!res.ok || !j?.ok || !j?.id) throw new Error(j?.error ?? "Could not create this brand.");
            return j.id;
          }}
        />
        <CategorySelect label="Category" options={categories.map((c) => ({ value: c.id, label: c.name }))} value={form.categoryId} onChange={(id) => set("categoryId", id)}/>
        <Input label="Style Type" value={form.subtype} onChange={(e) => set("subtype", e.target.value)} placeholder="Shirt / Trouser / Blazer / Shoes" error={fe("subtype")} />
        <Input label="Family group (same value links colour/variant siblings)" value={form.groupId} onChange={(e) => set("groupId", e.target.value)} error={fe("groupId")} />
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-3">
        <Input label="MRP (₹)" type="number" value={raw.mrp} onChange={(e) => setNumeric("mrp", e.target.value)} error={fe("mrp")} required min={1} />
        <Input label="Sale price (₹)" type="number" value={raw.salePrice} onChange={(e) => setNumeric("salePrice", e.target.value)} error={fe("salePrice")} required min={1} />
        <Input label="Stock" type="number" value={raw.stock} onChange={(e) => setNumeric("stock", e.target.value)} error={fe("stock")} required min={0} />
        <Input label="Low stock alert at" type="number" value={raw.lowStockAt} onChange={(e) => setNumeric("lowStockAt", e.target.value)} error={fe("lowStockAt")} min={0} />
        <Input label="HSN code" value={raw.hsnCode} onChange={(e) => setHsnCode(e.target.value)} error={fe("hsnCode")} />
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-3">
        <Input label="Size" value={form.ram} onChange={(e) => set("ram", e.target.value)} placeholder="S / M / L / XL" error={fe("ram")} />
        <Input label="Fabric" value={form.storage} onChange={(e) => set("storage", e.target.value)} placeholder="Cotton / Linen / Polyester" error={fe("storage")} />
        <Input label="Fit" value={form.screenSize} onChange={(e) => set("screenSize", e.target.value)} placeholder="Slim / Regular / Loose" error={fe("screenSize")} />
        <Input label="Occasion" value={form.processor} onChange={(e) => set("processor", e.target.value)} placeholder="Formal / Casual / Sports" error={fe("processor")} />
        <Input label="Color" value={form.color} onChange={(e) => set("color", e.target.value)} error={fe("color")} />
        <Input containerClassName="sm:col-span-3" label="Tags (comma separated)" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="formal, cotton, office, shirt" error={fe("tags")} />
      </section>

      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink-900"><ImageIcon className="size-4 text-electric-600" />Images</h2>
        {fieldErrs.images && <p className="mb-2 text-[12px] font-semibold text-flame-600">Images — {fieldErrs.images.join("; ")}</p>}
        <div className="mb-2">
          <button type="button" onClick={addImage} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#1a1a2e] hover:underline"><Plus className="size-3.5" />Add image</button>
        </div>
        <div className="space-y-2">
          {form.images.map((img, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[auto_auto_1fr_1fr_auto]">
              {img.url ? (
                <button type="button" onClick={() => setPreview(img.url)} title="Click to preview full image" className="group/thumb relative block size-12 shrink-0 cursor-zoom-in overflow-hidden rounded border border-gray-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="" className="size-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center text-white opacity-0 transition-opacity group-hover/thumb:bg-black/30 group-hover/thumb:opacity-100"><ZoomIn className="size-4" /></span>
                </button>
              ) : (<div className="size-12 shrink-0 rounded border border-dashed border-gray-300" />)}
              <ImageUploadButton onUploaded={(url) => patchImage(idx, { url })} />
              <Input placeholder="…or paste a URL" value={img.url} onChange={(e) => patchImage(idx, { url: e.target.value })} required={idx === 0} />
              <Input placeholder="Alt text" value={img.alt} onChange={(e) => patchImage(idx, { alt: e.target.value })} />
              <button type="button" onClick={() => removeImage(idx)} className="grid size-12 place-items-center rounded-xl border border-hairline text-flame-600 hover:bg-flame-500/10" aria-label="Remove image"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink-900"><List className="size-4 text-electric-600" />Specifications</h2>
        {fieldErrs.specifications && <p className="mb-2 text-[12px] font-semibold text-flame-600">Specifications — {fieldErrs.specifications.join("; ")}</p>}
        <div className="space-y-2">
          {form.specifications.map((spec, idx) => (
            <div key={idx} className="grid gap-2 sm:grid-cols-[10rem_1fr_1fr_auto]">
              <Input placeholder="Group" value={spec.group} onChange={(e) => patchSpec(idx, { group: e.target.value })} />
              <Input placeholder="Label" value={spec.label} onChange={(e) => patchSpec(idx, { label: e.target.value })} />
              <Input placeholder="Value" value={spec.value} onChange={(e) => patchSpec(idx, { value: e.target.value })} />
              <button type="button" onClick={() => removeSpec(idx)} className="grid size-12 place-items-center rounded-xl border border-hairline text-flame-600 hover:bg-flame-500/10" aria-label="Remove spec"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
        <Button type="button" size="sm" variant="outline" className="mt-3" onClick={addSpec}><Plus className="size-3.5" />Add specification</Button>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink-900"><Palette className="size-4 text-electric-600" />Colours, groups &amp; variants</h2>
        {(fieldErrs.colors || fieldErrs.variants || fieldErrs.optionGroups) && (
          <p className="mb-2 text-[12px] font-semibold text-flame-600">Colours & variants — {[...(fieldErrs.colors ?? []), ...(fieldErrs.variants ?? []), ...(fieldErrs.optionGroups ?? [])].join("; ")}</p>
        )}
        <p className="mb-4 text-[12.5px] text-gray-500">Swatches with optional image URL, option groups such as Size, and price variants. Final size price = sale price + group add + size add.</p>
        <ProductOptionsEditor
          value={{ colors: form.colors, variants: form.variants, optionGroups: form.optionGroups }}
          onChange={(v: OptionsPayload) => setForm((f) => ({ ...f, colors: v.colors ?? f.colors, variants: v.variants ?? f.variants, optionGroups: v.optionGroups ?? f.optionGroups }))}
        />
      </section>

      <section className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Checkbox checked={form.active} onChange={(e) => set("active", e.target.checked)} label="Active" error={fe("active")} />
        <Checkbox checked={form.featured} onChange={(e) => set("featured", e.target.checked)} label="Featured" error={fe("featured")} />
        <Checkbox checked={form.codEligible} onChange={(e) => set("codEligible", e.target.checked)} label="COD eligible" error={fe("codEligible")} />
        <Checkbox checked={form.emiEligible} onChange={(e) => set("emiEligible", e.target.checked)} label="EMI eligible" error={fe("emiEligible")} />
        <Checkbox checked={form.exchangeEligible} onChange={(e) => set("exchangeEligible", e.target.checked)} label="Exchange eligible" error={fe("exchangeEligible")} />
      </section>

      {footer}

      {(error || unmapped.length > 0) && (
        <div role="alert" className="space-y-1 rounded-xl bg-flame-500/10 px-4 py-3 text-[13px] font-semibold text-flame-600">
          {error && <p>{error}</p>}
          {unmapped.map(([k, v]) => (<p key={k}>{LABEL[k] ?? k} — {v.join("; ")}</p>))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={busy}>{!busy && <Save className="size-4" />}{isEdit ? "Update product" : "Create product"}</Button>
        {productId && (<Button type="button" variant="outline" loading={copyBusy} onClick={() => void duplicate()}>{!copyBusy && <Copy className="size-4" />}Copy product</Button>)}
        <Button type="button" variant="outline" onClick={() => router.push("/admin/products")}>Cancel</Button>
        {productId && canDelete && (
          <ConfirmButton url={`/api/admin/products/${productId}`} confirmText="Delete this product? Only allowed if no order history exists." successText="Product deleted" variant="danger">Delete product</ConfirmButton>
        )}
      </div>
      {preview && <ImagePreviewModal url={preview} onClose={() => setPreview(null)} />}
    </form>
  );
}