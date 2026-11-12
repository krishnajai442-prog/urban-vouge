import Link from "next/link";
import prisma from "@/lib/prisma";
import { productSelect, toCards } from "@/lib/catalog";
import { ProductListClient } from "@/components/product/ProductListClient";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CollectionGrid } from "@/components/home/CollectionGrid";
import { buildHeroSlides } from "@/lib/home-slides";
import { getCategoryExplorer } from "@/lib/category-explorer";
import type { ExplorerItem, ExplorerBrand } from "@/lib/category-explorer";
import type { Tile } from "@/lib/home-discovery";

// Reading `searchParams` makes this route dynamic in Next 15, so `revalidate`
// is ignored for filtered URLs (filters stay live). It still applies to the
// bare /products/<slug> view if Next ever statically caches it.
export const revalidate = 5;

const RUPEE = "\u20B9";
const inr = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? `${RUPEE}${n.toLocaleString("en-IN")}` : "";

// --- URL-param helpers -------------------------------------------------------
type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const csv = (v: string | string[] | undefined): string[] =>
  (first(v) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const posNum = (v: string | string[] | undefined): number | undefined => {
  const n = Number(first(v));
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

// Any of these present & non-empty => the visitor drilled into a filter
// (brand tile, sidebar facet, or header search). In that case we render a
// server-filtered grid ourselves and SKIP the category-level hero/deals/
// ProductListClient, which would otherwise show other brands' content.
const FACET_KEYS = [
  "brands", "subtypes", "ram", "storage", "screenSize", "processor",
  "color", "minRating", "minDiscount", "warranty", "inStock", "q",
] as const;
const hasFacets = (sp: SP) =>
  FACET_KEYS.some((k) => {
    const v = sp[k];
    if (v == null) return false;
    const s = Array.isArray(v) ? v.join(",") : v;
    return s.trim().length > 0;
  });

/** Build the Prisma `where` from active query params. The `brands` param holds
 *  brand SLUGS — identical to the contract in src/app/products/all/page.tsx
 *  (`brand: { slug: { in: brands } }`). No params => base category filter only,
 *  so the plain /products/<slug> view is byte-for-byte unchanged. */
function buildWhere(category: string, sp: SP) {
  const where: Record<string, unknown> = { active: true, category: { slug: category } };

  const brands = csv(sp.brands);
  if (brands.length) where.brand = { slug: { in: brands } };   // ← SLUG

  const subtypes = csv(sp.subtypes);
  if (subtypes.length) where.subtype = { in: subtypes };

  const ram = csv(sp.ram);
  if (ram.length) where.ram = { in: ram };

  const storage = csv(sp.storage);
  if (storage.length) where.storage = { in: storage };

  const screenSize = csv(sp.screenSize);
  if (screenSize.length) where.screenSize = { in: screenSize };

  const processor = csv(sp.processor);
  if (processor.length) where.processor = { in: processor };

  const color = csv(sp.color);
  if (color.length) where.color = { in: color };

  const minRating = posNum(sp.minRating);
  if (minRating) where.ratingAvg = { gte: minRating };

  const minDiscount = posNum(sp.minDiscount);
  if (minDiscount) where.discountPercent = { gte: minDiscount };

  const warranty = posNum(sp.warranty);
  if (warranty) where.warrantyMonths = { gte: warranty };

  if (first(sp.inStock)) where.stock = { gt: 0 };

  const q = first(sp.q)?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortDescription: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  return where;
}

function Pill({ item }: { item: ExplorerItem }) {
  if (item.off > 0)
    return <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">{item.off}% OFF</span>;
  if (item.isNew)
    return <span className="rounded bg-[#1a1a2e]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#1a1a2e]">New</span>;
  return null;
}

function DealCard({ p }: { p: ExplorerItem }) {
  return (
    <Link href={`/product/${p.slug}`} className="flex w-[120px] shrink-0 flex-col sm:w-auto">
      <div className="relative mb-1.5 aspect-square overflow-hidden rounded-lg border border-gray-100 bg-gray-50">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt={p.name} loading="lazy" className="size-full object-contain" />
        ) : null}
        <span className="absolute left-1 top-1"><Pill item={p} /></span>
      </div>
      <p className="line-clamp-2 min-h-[2rem] text-[11.5px] leading-snug text-gray-800">{p.name}</p>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="text-[12.5px] font-bold text-gray-900">{inr(p.price)}</span>
        {p.off > 0 && p.mrp ? <span className="text-[10.5px] text-gray-400 line-through">{inr(p.mrp)}</span> : null}
      </div>
    </Link>
  );
}

function DealsRail({ title, items }: { title: string; items: ExplorerItem[] }) {
  if (!items.length) return null;
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3">
      <h3 className="mb-2 font-display text-[13.5px] font-bold text-gray-900">{title}</h3>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible">
        {items.map((p) => <DealCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const filtered = hasFacets(sp);
  const where = buildWhere(category, sp);

  // brandRows = name<->slug dictionaries so the tile (which only carries a name
  // via the explorer) emits the SLUG the server filter expects, and the chip can
  // show the pretty NAME instead of the raw slug.
  const [products, cat, explorer, rawSlides, brandRows] = await Promise.all([
    prisma.product.findMany({ where: where as any, select: productSelect, take: 50 }),
    prisma.category.findUnique({ where: { slug: category }, select: { name: true } }),
    getCategoryExplorer(),
    buildHeroSlides(6, { categorySlug: category }),
    prisma.brand.findMany({ select: { slug: true, name: true } }),
  ]);

  const catName = cat?.name ?? category;
  const bucket = explorer.byCategory[category];
  const brandSlugByName = new Map(brandRows.map((b) => [b.name, b.slug] as const));
  const brandNameBySlug = new Map(brandRows.map((b) => [b.slug, b.name] as const));

  const cards = toCards(products);

  // ---- FILTERED VIEW: brand's own products only, nothing category-level ----
  if (filtered) {
    const activeBrands = csv(sp.brands);
    const brandLabels = activeBrands.map((s) => brandNameBySlug.get(s) ?? s);
    const q = first(sp.q)?.trim();

    // "Clear brand" link: same URL minus the brands param (keeps size/colour/etc).
    const cleared = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) {
      if (k === "brands" || v == null) continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => x && cleared.append(k, x));
    }
    const clearedHref = `/products/${category}${cleared.toString() ? `?${cleared}` : ""}`;

    const heading = brandLabels.length
      ? `${brandLabels.join(", ")} in ${catName}`
      : q
        ? `Results for “${q}” in ${catName}`
        : `Filtered styles in ${catName}`;

    return (
      <div className="container-x space-y-5 py-6">
        {/* Active-filter chip with a human-readable brand name + count. */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#c9a96e]/40 bg-[#faf5eb] px-3 py-2 text-[13px]">
          <span className="font-semibold text-ink-700">Showing</span>
          {brandLabels.map((b) => (
            <span key={b} className="rounded-full bg-[#1a1a2e] px-2.5 py-0.5 text-[12px] font-bold text-white">{b}</span>
          ))}
          {q && !brandLabels.length && (
            <span className="rounded-full bg-[#1a1a2e] px-2.5 py-0.5 text-[12px] font-bold text-white">“{q}”</span>
          )}
          <span className="text-ink-400">· {cards.length} {cards.length === 1 ? "style" : "styles"} in {catName}</span>
          {brandLabels.length > 0 && (
            <Link href={clearedHref} className="ml-auto inline-flex items-center gap-1 font-bold text-[#8b6914] hover:underline">
              Clear brand ✕
            </Link>
          )}
        </div>

        <h1 className="font-display text-xl font-bold text-ink-900">{heading}</h1>

        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-[14px] font-semibold text-ink-700">No styles match this filter yet.</p>
            <p className="mt-1 text-[12.5px] text-ink-400">Try clearing the brand or browsing the full {catName} range.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link href={clearedHref} className="inline-flex h-9 items-center rounded-lg bg-[#1a1a2e] px-4 text-[12.5px] font-bold text-white hover:bg-[#2c3e50]">
                Clear filters
              </Link>
              <Link href={`/products/${category}`} className="inline-flex h-9 items-center rounded-lg border border-hairline px-4 text-[12.5px] font-bold text-ink-700 hover:bg-canvas">
                Browse all {catName}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c) => (
              <ProductCard key={c.id} product={c} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- UNFILTERED VIEW: original category experience (hero + picker + deals) ----
  const brandTiles: Tile[] = (bucket?.brands ?? []).map((b: ExplorerBrand) => ({
    label: b.name,
    pill: b.pill,
    image: b.image,
    href: `/products/${category}?brands=${encodeURIComponent(brandSlugByName.get(b.name) ?? b.name)}`,
  }));
  const deals = bucket?.deals ?? [];

  const slides = rawSlides.map((s: any) => ({
    id: s.id,
    imageUrl: s.image || "/placeholder-banner-bg.jpg",
    art: Boolean(s.image),
    headline: s.headline,
    highlight: s.highlight ?? "",
    description: s.description ?? `Discover top picks in ${catName}.`,
    badge: s.badge,
    ctaLabel: s.ctaLabel,
    ctaHref: s.ctaHref || `/products/${category}`,
    products: s.products,
  }));

  return (
    <div className="container-x space-y-6 py-6">
        {brandTiles.length > 0 && (
        <CollectionGrid title={`Top Brands in ${catName}`} tiles={brandTiles} tone="plain" columns={4} />
      )}
      <DealsRail title={`Top Deals in ${catName}`} items={deals} />
      <ProductListClient
        initialProducts={cards}
        total={cards.length}
        categorySlug={category}
      />
    </div>
  );
}