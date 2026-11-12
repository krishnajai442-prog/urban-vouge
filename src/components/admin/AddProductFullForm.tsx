"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ProductOptionsEditor, type OptionsPayload } from "@/components/admin/ProductOptionsEditor";
import { ImageUploadButton } from "@/components/admin/ImageUploadButton";
import { Input, Select, Textarea, Checkbox } from "@/components/ui/Input";
import {
  DEFAULT_DELIVERY_DETAILS, DEFAULT_PEACE_OF_MIND, defaultDeliveryBy, defaultSoldBy, defaultHighlightsFromProduct,
} from "@/lib/pdp-blocks";

type Cat = { id: string; name: string };
type Brand = { id: string; name: string; categories?: string[] };
type ImgRow = { url: string; alt: string };
type SpecRow = { group: string; label: string; value: string };
type ColorRich = { name: string; image: string };

const emptyImg = (): ImgRow => ({ url: "", alt: "" });
const emptySpec = (): SpecRow => ({ group: "General", label: "", value: "" });
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

const LABEL: Record<string, string> = {
  images: "Images", specifications: "Specifications", warrantySpecifications: "Return & Exchange",
  mfgSpecifications: "Manufacturer Info", showcaseImages: "Showcase banners",
  colors: "Colours & variants", variants: "Colours & variants", optionGroups: "Colours & variants",
  shortDescription: "Short description", pdpBlocks: "PDP info blocks", _: "Product",
};
const KNOWN = new Set([
  "name", "slug", "shortDescription", "categoryId", "brandId", "subtype", "groupId",
  "mrp", "salePrice", "stock", "lowStockAt", "hsnCode", "ram", "storage", "screenSize", "processor", "color", "tags",
  "description", "deliveryDetails", "deliveryBy", "soldBy", "peaceOfMind", "highlights",
  "active", "featured", "codEligible", "emiEligible", "exchangeEligible",
]);

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-3 p-4 md:p-5">
      <div>
        <h2 className="font-display text-[15px] font-bold text-ink-900">{title}</h2>
        {hint && <p className="mt-0.5 text-[12px] text-ink-400">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

export function AddProductFullForm({ categories, brands }: { categories: Cat[]; brands: Brand[] }) {
  const router = useRouter();

  const [name, setName] = useState(""); const [slug, setSlug] = useState(""); const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState(""); const [brandId, setBrandId] = useState(""); const [subtype, setSubtype] = useState(""); const [groupId, setGroupId] = useState("");
  const [mrp, setMrp] = useState("0"); const [salePrice, setSalePrice] = useState("0"); const [stock, setStock] = useState("0"); const [lowStockAt, setLowStockAt] = useState("5"); const [hsnCode, setHsnCode] = useState("");
  const [ram, setRam] = useState(""); const [storage, setStorage] = useState(""); const [screenSize, setScreenSize] = useState(""); const [processor, setProcessor] = useState(""); const [color, setColor] = useState(""); const [tags, setTags] = useState("");
  const [images, setImages] = useState<ImgRow[]>([emptyImg()]); const [specs, setSpecs] = useState<SpecRow[]>([]);
  const [warranty, setWarranty] = useState<SpecRow[]>([]); const [mfg, setMfg] = useState<SpecRow[]>([]); const [showcase, setShowcase] = useState<ImgRow[]>([]); const [description, setDescription] = useState("");
  const [options, setOptions] = useState<OptionsPayload>({ colors: [], variants: [], optionGroups: [] });
  const [active, setActive] = useState(true); const [featured, setFeatured] = useState(false); const [codEligible, setCodEligible] = useState(true); const [emiEligible, setEmiEligible] = useState(true); const [exchangeEligible, setExchangeEligible] = useState(true);
  const [deliveryDetails, setDeliveryDetails] = useState(""); const [deliveryBy, setDeliveryBy] = useState(""); const [soldBy, setSoldBy] = useState(""); const [peaceOfMind, setPeaceOfMind] = useState(""); const [highlights, setHighlights] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});
  const fe = (k: string) => fieldErrs[k]?.[0];
  const unmapped = Object.entries(fieldErrs).filter(([k]) => !KNOWN.has(k));

  const highlightHint = useMemo(() => {
    const pseudo = { ram, storage, screenSize, processor, color, returnDays: null, returnWindowDays: null, returnPolicyDays: null, easyReturnDays: null, exchangeEligible };
    return defaultHighlightsFromProduct(pseudo).join(" · ") || "—";
  }, [ram, storage, screenSize, processor, color, exchangeEligible]);

  const setRow = <T,>(list: T[], i: number, patch: Partial<T>, setter: (v: T[]) => void) => setter(list.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const dropRow = <T,>(list: T[], i: number, setter: (v: T[]) => void) => setter(list.filter((_, idx) => idx !== i));
  const galleryUrls = images.filter((r) => r.url.trim());

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(null); setFieldErrs({});
    if (name.trim().length < 3) return setError("Product name must be at least 3 characters.");
    if (!categoryId) return setError("Select a category.");
    if (!brandId) return setError("Select a brand.");
    const mrpN = Number(mrp), saleN = Number(salePrice), stockN = Number(stock), lowN = Number(lowStockAt);
    if (!Number.isFinite(mrpN) || mrpN <= 0) return setError("MRP must be a positive number.");
    if (!Number.isFinite(saleN) || saleN <= 0) return setError("Sale price must be a positive number.");
    if (saleN > mrpN) return setError("Sale price cannot exceed MRP.");
    if (!Number.isFinite(stockN) || stockN < 0) return setError("Stock cannot be negative.");
    if (!galleryUrls.length) return setError("Add at least one product image (upload or paste a URL).");
    setBusy(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(), slug: slug.trim() || undefined, shortDescription: shortDescription.trim() || undefined,
          categoryId, brandId, subtype: subtype.trim() || undefined, mrp: mrpN, salePrice: saleN, stock: stockN,
          lowStockAt: Number.isFinite(lowN) ? lowN : 5, ram: ram.trim() || undefined, storage: storage.trim() || undefined,
          screenSize: screenSize.trim() || undefined, processor: processor.trim() || undefined, color: color.trim() || undefined,
          warrantyMonths: 12, codEligible, emiEligible, exchangeEligible, featured, active, hsnCode: hsnCode.trim() || undefined,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean), groupId: groupId.trim() || undefined,
          images: galleryUrls.map((r) => ({ url: r.url.trim(), alt: r.alt.trim() })),
          specifications: specs.filter((s) => s.group.trim() && s.label.trim() && s.value.trim()).map((s) => ({ group: s.group.trim(), label: s.label.trim(), value: s.value.trim() })),
          description: description.trim(),
          warrantySpecifications: warranty.filter((s) => s.group.trim() && s.label.trim() && s.value.trim()).map((s) => ({ group: s.group.trim(), label: s.label.trim(), value: s.value.trim() })),
          mfgSpecifications: mfg.filter((s) => s.group.trim() && s.label.trim() && s.value.trim()).map((s) => ({ group: s.group.trim(), label: s.label.trim(), value: s.value.trim() })),
          showcaseImages: showcase.filter((r) => r.url.trim()).map((r) => ({ url: r.url.trim(), alt: r.alt.trim() })),
          pdpBlocks: { deliveryDetails: lines(deliveryDetails), deliveryBy: deliveryBy.trim(), soldBy: soldBy.trim(), peaceOfMind: lines(peaceOfMind), highlights: lines(highlights) },
          colors: (options.colors as ColorRich[]).map((c) => ({ name: c.name, image: c.image ?? "" })), variants: options.variants, optionGroups: options.optionGroups,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setFieldErrs(json.fields ?? {});
        if (!json.fields || Object.keys(json.fields).length === 0) throw new Error(json.error ?? "Creation failed.");
        setBusy(false); return;
      }
      router.push(`/admin/products/${json.product.id}/edit`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create product."); setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <AdminPageHeader title="Add product" subtitle="Create a new SKU with pricing, inventory, specs, media and full PDP content." />

      <Section title="Basics">
        <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} error={fe("name")} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Slug (optional)" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated" error={fe("slug")} />
          <Select label="Brand" value={brandId} onChange={(e) => setBrandId(e.target.value)} error={fe("brandId")} required>
            <option value="">Select brand</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} error={fe("categoryId")} required>
            <option value="">Select category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Style Type" value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="Shirt / Trouser / Blazer / Shoes" error={fe("subtype")} />
        </div>
        <Input label="Family group (same value links colour/variant siblings)" value={groupId} onChange={(e) => setGroupId(e.target.value)} error={fe("groupId")} />
      </Section>

      <Section title="Pricing & inventory">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="MRP (₹)" type="number" value={mrp} onChange={(e) => setMrp(e.target.value)} error={fe("mrp")} />
          <Input label="Sale price (₹)" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} error={fe("salePrice")} />
          <Input label="Stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} error={fe("stock")} />
          <Input label="Low stock alert at" type="number" value={lowStockAt} onChange={(e) => setLowStockAt(e.target.value)} error={fe("lowStockAt")} />
          <Input label="HSN code" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} error={fe("hsnCode")} />
        </div>
      </Section>

      <Section title="Attributes">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Size" value={ram} onChange={(e) => setRam(e.target.value)} placeholder="S / M / L / XL" error={fe("ram")} />
          <Input label="Fabric" value={storage} onChange={(e) => setStorage(e.target.value)} placeholder="Cotton / Linen / Polyester" error={fe("storage")} />
          <Input label="Fit" value={screenSize} onChange={(e) => setScreenSize(e.target.value)} placeholder="Slim / Regular / Loose" error={fe("screenSize")} />
          <Input label="Occasion" value={processor} onChange={(e) => setProcessor(e.target.value)} placeholder="Formal / Casual / Sports" error={fe("processor")} />
          <Input label="Color" value={color} onChange={(e) => setColor(e.target.value)} error={fe("color")} />
        </div>
        <Input label="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="formal, cotton, office" error={fe("tags")} />
      </Section>

      <Section title="Images" hint="Gallery shots. The first URL becomes the primary image.">
        {fieldErrs.images && <p className="text-[12px] font-semibold text-flame-600">Images — {fieldErrs.images.join("; ")}</p>}
        <button type="button" onClick={() => setImages((a) => [...a, emptyImg()])} className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-700 hover:text-electric-600"><Plus className="size-4" />Add image</button>
        <div className="space-y-2">
          {images.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-canvas">{r.url ? <img src={r.url} alt="" className="size-full object-contain" /> : null}</span>
              <ImageUploadButton onUploaded={(url) => setRow(images, i, { url }, setImages)} />
              <Input containerClassName="flex-1" value={r.url} onChange={(e) => setRow(images, i, { url: e.target.value }, setImages)} placeholder="…or paste a URL" />
              <Input containerClassName="flex-1" value={r.alt} onChange={(e) => setRow(images, i, { alt: e.target.value }, setImages)} placeholder="Alt text" />
              <button type="button" onClick={() => dropRow(images, i, setImages)} aria-label="Remove image" className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline text-flame-600 hover:bg-flame-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Specifications">
        {fieldErrs.specifications && <p className="text-[12px] font-semibold text-flame-600">Specifications — {fieldErrs.specifications.join("; ")}</p>}
        <button type="button" onClick={() => setSpecs((a) => [...a, emptySpec()])} className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-700 hover:text-electric-600"><Plus className="size-4" />Add specification</button>
        <div className="space-y-2">
          {specs.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <Input value={s.group} onChange={(e) => setRow(specs, i, { group: e.target.value }, setSpecs)} placeholder="Group" />
              <Input value={s.label} onChange={(e) => setRow(specs, i, { label: e.target.value }, setSpecs)} placeholder="Label" />
              <Input value={s.value} onChange={(e) => setRow(specs, i, { value: e.target.value }, setSpecs)} placeholder="Value" />
              <button type="button" onClick={() => dropRow(specs, i, setSpecs)} aria-label="Remove spec" className="grid size-12 place-items-center rounded-lg border border-hairline text-flame-600 hover:bg-flame-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Colours, groups & variants" hint="Swatches (with optional image URL), pill option groups (e.g. Size) and price sizes. Size price = sale price + group add + size add.">
        {(fieldErrs.colors || fieldErrs.variants || fieldErrs.optionGroups) && (
          <p className="text-[12px] font-semibold text-flame-600">Colours & variants — {[...(fieldErrs.colors ?? []), ...(fieldErrs.variants ?? []), ...(fieldErrs.optionGroups ?? [])].join("; ")}</p>
        )}
        <ProductOptionsEditor value={options} onChange={setOptions} />
      </Section>

      <Section title="Visibility & eligibility">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Checkbox label="Active" checked={active} onChange={(e) => setActive(e.target.checked)} error={fe("active")} />
          <Checkbox label="Featured" checked={featured} onChange={(e) => setFeatured(e.target.checked)} error={fe("featured")} />
          <Checkbox label="COD eligible" checked={codEligible} onChange={(e) => setCodEligible(e.target.checked)} error={fe("codEligible")} />
          <Checkbox label="EMI eligible" checked={emiEligible} onChange={(e) => setEmiEligible(e.target.checked)} error={fe("emiEligible")} />
          <Checkbox label="Exchange eligible" checked={exchangeEligible} onChange={(e) => setExchangeEligible(e.target.checked)} error={fe("exchangeEligible")} />
        </div>
      </Section>

      <Section title="Description" hint="Long-form product description shown on the product page's Description tab. Markdown/plain text; line breaks preserved.">
        <Textarea rows={6} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write the full product story, materials, care and what's in the box…" error={fe("description")} />
      </Section>

      <Section title="Return & Exchange" hint="Rows rendered under the product page's Return & Exchange tab.">
        {fieldErrs.warrantySpecifications && <p className="text-[12px] font-semibold text-flame-600">Return & Exchange — {fieldErrs.warrantySpecifications.join("; ")}</p>}
        <button type="button" onClick={() => setWarranty((a) => [...a, emptySpec()])} className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-700 hover:text-electric-600"><Plus className="size-4" />Add row</button>
        {warranty.length === 0 && <p className="text-[12px] text-ink-400">No rows yet — add one above.</p>}
        <div className="space-y-2">
          {warranty.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <Input value={s.group} onChange={(e) => setRow(warranty, i, { group: e.target.value }, setWarranty)} placeholder="Group" />
              <Input value={s.label} onChange={(e) => setRow(warranty, i, { label: e.target.value }, setWarranty)} placeholder="Label" />
              <Input value={s.value} onChange={(e) => setRow(warranty, i, { value: e.target.value }, setWarranty)} placeholder="Value" />
              <button type="button" onClick={() => dropRow(warranty, i, setWarranty)} aria-label="Remove row" className="grid size-12 place-items-center rounded-lg border border-hairline text-flame-600 hover:bg-flame-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Manufacturer Info" hint="Rows rendered under the product page's Manufacturer Info tab.">
        {fieldErrs.mfgSpecifications && <p className="text-[12px] font-semibold text-flame-600">Manufacturer Info — {fieldErrs.mfgSpecifications.join("; ")}</p>}
        <button type="button" onClick={() => setMfg((a) => [...a, emptySpec()])} className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-700 hover:text-electric-600"><Plus className="size-4" />Add row</button>
        {mfg.length === 0 && <p className="text-[12px] text-ink-400">No rows yet — add one above.</p>}
        <div className="space-y-2">
          {mfg.map((s, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]">
              <Input value={s.group} onChange={(e) => setRow(mfg, i, { group: e.target.value }, setMfg)} placeholder="Group" />
              <Input value={s.label} onChange={(e) => setRow(mfg, i, { label: e.target.value }, setMfg)} placeholder="Label" />
              <Input value={s.value} onChange={(e) => setRow(mfg, i, { value: e.target.value }, setMfg)} placeholder="Value" />
              <button type="button" onClick={() => dropRow(mfg, i, setMfg)} aria-label="Remove row" className="grid size-12 place-items-center rounded-lg border border-hairline text-flame-600 hover:bg-flame-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Showcase banners" hint="Tall full-width images (e.g. 1080×1350). They stack vertically in the Showcase tab. Click a thumbnail to preview it full size.">
        {fieldErrs.showcaseImages && <p className="text-[12px] font-semibold text-flame-600">Showcase banners — {fieldErrs.showcaseImages.join("; ")}</p>}
        <button type="button" onClick={() => setShowcase((a) => [...a, emptyImg()])} className="inline-flex items-center gap-1 text-[13px] font-bold text-ink-700 hover:text-electric-600"><Plus className="size-4" />Add banner</button>
        {showcase.length === 0 && <p className="text-[12px] text-ink-400">No banners yet — add one above.</p>}
        <div className="space-y-2">
          {showcase.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-hairline bg-canvas">{r.url ? <img src={r.url} alt="" className="size-full object-cover" /> : null}</span>
              <ImageUploadButton onUploaded={(url) => setRow(showcase, i, { url }, setShowcase)} />
              <Input containerClassName="flex-1" value={r.url} onChange={(e) => setRow(showcase, i, { url: e.target.value }, setShowcase)} placeholder="Banner URL" />
              <button type="button" onClick={() => dropRow(showcase, i, setShowcase)} aria-label="Remove banner" className="grid size-9 shrink-0 place-items-center rounded-lg border border-hairline text-flame-600 hover:bg-flame-500/10"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </Section>

      <Section title="PDP info blocks" hint="Leave a field empty to use the live default (shown as its placeholder). Typing a value overrides just that section for this product; clearing it restores the default.">
        {(() => {
          const hlDefault = defaultHighlightsFromProduct({ ram, storage, screenSize, processor, color, returnDays: null, returnWindowDays: null, returnPolicyDays: null, easyReturnDays: null, exchangeEligible });
          return (
            <div className="space-y-4">
              <div>
                <p className="mb-1 block text-[12.5px] font-bold text-ink-900">Delivery details (one per line)</p>
                <Textarea rows={3} value={deliveryDetails} onChange={(e) => setDeliveryDetails(e.target.value)} placeholder={DEFAULT_DELIVERY_DETAILS.join("\n")} error={fe("deliveryDetails")} />
                <p className="mt-1.5 text-[11.5px] text-ink-400">Default: {DEFAULT_DELIVERY_DETAILS.join(" · ")}</p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 block text-[12.5px] font-bold text-ink-900">Delivery by</p>
                  <Input value={deliveryBy} onChange={(e) => setDeliveryBy(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} placeholder={defaultDeliveryBy()} error={fe("deliveryBy")} />
                  <p className="mt-1.5 text-[11.5px] text-ink-400">Default updates daily: {defaultDeliveryBy()}</p>
                </div>
                <div>
                  <p className="mb-1 block text-[12.5px] font-bold text-ink-900">Sold by</p>
                  <Input value={soldBy} onChange={(e) => setSoldBy(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }} placeholder={defaultSoldBy()} error={fe("soldBy")} />
                  <p className="mt-1.5 text-[11.5px] text-ink-400">Default: {defaultSoldBy()}</p>
                </div>
              </div>
              <div>
                <p className="mb-1 block text-[12.5px] font-bold text-ink-900">Shop with peace of mind (one per line)</p>
                <Textarea rows={3} value={peaceOfMind} onChange={(e) => setPeaceOfMind(e.target.value)} placeholder={DEFAULT_PEACE_OF_MIND.join("\n")} error={fe("peaceOfMind")} />
                <p className="mt-1.5 text-[11.5px] text-ink-400">Default: {DEFAULT_PEACE_OF_MIND.join(" · ")}</p>
              </div>
              <div>
                <p className="mb-1 block text-[12.5px] font-bold text-ink-900">Product highlights (one per line)</p>
                <Textarea rows={4} value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder={hlDefault.join("\n")} error={fe("highlights")} />
                <p className="mt-1.5 text-[11.5px] text-ink-400">Default derived from this product: {highlightHint}</p>
              </div>
            </div>
          );
        })()}
      </Section>

      {(error || unmapped.length > 0) && (
        <div role="alert" className="space-y-1 rounded-xl bg-flame-500/10 px-4 py-3 text-[13px] font-semibold text-flame-600">
          {error && <p>{error}</p>}
          {unmapped.map(([k, v]) => (<p key={k}>{LABEL[k] ?? k} — {v.join("; ")}</p>))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-5 py-2.5 text-[13.5px] font-bold text-white transition-colors hover:bg-electric-600 disabled:opacity-50"><Save className="size-4" />{busy ? "Creating…" : "Create product"}</button>
        <button type="button" onClick={() => router.push("/admin/products")} className="rounded-xl border border-hairline bg-white px-5 py-2.5 text-[13.5px] font-bold text-ink-700 hover:border-electric-300">Cancel</button>
      </div>
    </form>
  );
}

export default AddProductFullForm;