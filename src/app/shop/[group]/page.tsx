import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { productSelect, toCards } from "@/lib/catalog";
import { MEN_GROUPS } from "@/lib/men-taxonomy";
import { SponsoredAdCard } from "@/components/product/SponsoredAdCard";
import { ProductCard } from "@/components/product/ProductCard";
import { HeroCarousel } from "@/components/home/HeroCarousel";

export const dynamic = "force-dynamic";

type SP = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const termOf = (href: string) => {
  const i = href.indexOf("q=");
  return i === -1 ? "" : decodeURIComponent(href.slice(i + 2));
};

/**
 * Dedicated storefront page per header group (Footwear, Top wear, Winter Wear…).
 * Same anatomy as Home: hero banner -> dynamic ad slot -> sub-category tiles ->
 * deals rail -> product grid. Membership comes from the group's `matcher`
 * (name/subtype regex); groups without a matcher (Featured) fall back to their
 * item search terms. `?q=<term>` narrows within the group (dropdown sub-items).
 */
export default async function ShopGroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ group: string }>;
  searchParams: Promise<SP>;
}) {
  const [{ group: slug }, sp] = await Promise.all([params, searchParams]);
  const group = MEN_GROUPS.find((g) => g.slug === slug);
  if (!group) notFound();

  const rawQ = (first(sp.q) ?? "").trim();
  const q = rawQ.toLowerCase();

  const rows = await prisma.product.findMany({
    where: { active: true },
    select: productSelect,
    take: 300,
  });

  const re = group.matcher ? new RegExp(group.matcher, "i") : null;
  let matched = re
    ? rows.filter((r: any) => re.test(`${r.name} ${r.subtype ?? ""}`))
    : rows.filter((r: any) =>
        group.items.some((it) => {
          const t = termOf(it.href).toLowerCase();
          return t ? `${r.name} ${r.brand?.name ?? ""}`.toLowerCase().includes(t) : false;
        }),
      );
  if (q) {
    matched = matched.filter((r: any) =>
      `${r.name} ${r.shortDescription ?? ""} ${r.brand?.name ?? ""}`.toLowerCase().includes(q),
    );
  }

    const cards = toCards(matched);

   // Dynamic hero slides. Prefers the group's OWN best-sellers; when the group has
  // no stock yet (e.g. Men's Grooming today), falls back to site-wide best-sellers
  // so the carousel is never a dead static banner. The moment products are added
  // to the group, `matched` becomes non-empty and they take over the hero
  // automatically — no code change, fully data-driven.
  const heroSource = matched.length > 0 ? matched : rows;
  const heroSlides = heroSource
    .slice()
    .sort((a: any, b: any) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 6)
    .map((p: any) => ({
      id: `group-${group.slug}-${p.id}`,
      imageUrl:
        p.images?.find((i: any) => i.isPrimary)?.url ??
        p.images?.[0]?.url ??
        "/placeholder-banner-bg.jpg",
      art: false,
      headline: p.name,
      highlight: group.label,
      description:
        matched.length > 0
          ? `${group.subtitle} · ${p.brand?.name ?? "Urban Vogue"}`
          : `Coming soon to ${group.label} · Meanwhile: ${p.brand?.name ?? "Urban Vogue"}`,
      badge: (p.discountPercent ?? 0) > 0 ? `${p.discountPercent}% OFF` : null,
      ctaLabel: "Shop Now",
      ctaHref: `/product/${p.slug}`,
      products: toCards([p]),
    }));

  const adCandidates = matched
    .slice()
    .sort((a: any, b: any) => (b.sold ?? 0) - (a.sold ?? 0))
    .slice(0, 8)
    .map((p: any) => ({
      id: p.id, slug: p.slug, name: p.name, mrp: p.mrp, salePrice: p.salePrice,
      image: p.images?.find((i: any) => i.isPrimary)?.url ?? p.images?.[0]?.url ?? null,
    }));

  const deals = cards.filter((c: any) => (c.discountPercent ?? 0) > 0).slice(0, 4);

  const itemTiles = group.items.map((it) => {
    const term = termOf(it.href);
    const hit = rows.find((r: any) =>
      term ? `${r.name} ${r.subtype ?? ""}`.toLowerCase().includes(term.toLowerCase()) : false,
    );
    return {
      label: it.label,
      term,
      image: hit?.images?.find((i: any) => i.isPrimary)?.url ?? hit?.images?.[0]?.url ?? null,
    };
  });

  return (
    <div className="container-x space-y-6 py-6">
            {/* ── group identity row ── */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-xl font-black text-ink-900 sm:text-2xl">{group.label}</h1>
          <p className="text-[12px] text-ink-400">{group.subtitle} · {cards.length} styles</p>
        </div>
        {q && (
          <p className="text-[12px] text-ink-400">
            Narrowed to “{rawQ}” ·{" "}
            <Link href={`/shop/${group.slug}`} className="text-[#8b6914] underline underline-offset-2">
              clear
            </Link>
          </p>
        )}
      </div>

      {/* ── dynamic hero carousel (same component + slide shape as Home) ── */}
      {heroSlides.length > 0 ? (
        <section className="overflow-hidden rounded-2xl">
          <HeroCarousel slides={heroSlides} />
        </section>
      ) : (
        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,#1a1a2e_0%,#2c3e50_55%,#8b6914_130%)] px-6 py-8 text-white sm:px-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#e0cfa8]">Urban Vogue · Men's Store</p>
          <h2 className="mt-2 font-display text-2xl font-black sm:text-3xl">{group.label}</h2>
          <p className="mt-1 text-[13px] text-white/70">{group.subtitle} · stocking soon</p>
        </div>
      )}

      {/* ── dynamic ad slot (same component Home/product pages use) ── */}
      {adCandidates.length > 0 && (
                <SponsoredAdCard seed={group.slug} products={adCandidates} />
      )}

      {/* ── sub-category tiles (the dropdo
      wn items, as a page section) ── */}
      <section className="rounded-xl border border-hairline bg-white p-4">
        <h2 className="mb-3 font-display text-[14px] font-bold text-ink-900">Shop by style</h2>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {itemTiles.map((t) => (
            <Link
              key={t.label}
              href={`/shop/${group.slug}?q=${encodeURIComponent(t.term)}`}
              className="flex w-[104px] shrink-0 flex-col items-center"
            >
              <span className="relative aspect-square w-full overflow-hidden rounded-lg border border-hairline bg-canvas">
                {t.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.image} alt={t.label} className="size-full object-cover" />
                ) : null}
                <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(90deg,#b8963f,#e0cfa8,#b8963f)]" />
              </span>
              <span className="mt-1.5 w-full truncate text-center text-[11px] font-semibold text-ink-700">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── deals rail ── */}
      {deals.length > 0 && (
        <section className="rounded-xl border border-hairline bg-white p-4">
          <h2 className="mb-3 font-display text-[14px] font-bold text-ink-900">Top deals in {group.label}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {deals.map((c: any) => (
              <ProductCard key={c.id} product={c} />
            ))}
          </div>
        </section>
      )}

      {/* ── main grid ── */}
      <section>
        <h2 className="mb-3 font-display text-[15px] font-bold text-ink-900">
          {q ? `Results for “${rawQ}” in ${group.label}` : `All ${group.label}`}
        </h2>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white py-12 text-center">
            <p className="text-[14px] font-semibold text-ink-700">No styles in this section yet.</p>
            <p className="mt-1 text-[12.5px] text-ink-400">New {group.label.toLowerCase()} drops land here first.</p>
            <Link
              href="/products/all"
              className="mt-4 inline-flex h-9 items-center rounded-lg bg-[#1a1a2e] px-4 text-[12.5px] font-bold text-white hover:bg-[#2c3e50]"
            >
              Browse everything
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cards.map((c: any) => (
              <ProductCard key={c.id} product={c} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}