import { GradientTheme, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slides = [
  {
    id: "seed-slide-new-season",
    badge: "NEW SEASON",
    headline: "India's freshest,",
    highlight: "style drops",
    description: "New season shirts, trousers and jackets are live with launch pricing and exchange support.",
    ctaLabel: "Shop new arrivals",
    ctaHref: "/products/all?sort=newest",
    secondaryLabel: "See offers",
    secondaryHref: "/offers",
    gradient: GradientTheme.EMERALD_TECH,
    sortOrder: 1,
    productSlugs: [
      "louis-philippe-oxford-formal-shirt-white-slim",
      "van-heusen-single-breasted-blazer-navy",
      "raymond-slim-fit-formal-trousers-charcoal",
    ],
  },
  {
    id: "seed-slide-sale",
    badge: "MEGA SALE",
    headline: "Big savings on,",
    highlight: "wardrobe essentials",
    description: "Shirts, trousers, jackets and accessories at festival-style prices.",
    ctaLabel: "Browse collection",
    ctaHref: "/products/shirts",
    secondaryLabel: "Coupons",
    secondaryHref: "/offers",
    gradient: GradientTheme.SUNSET_DEAL,
    sortOrder: 2,
    productSlugs: [
      "levis-511-slim-fit-jeans-dark-indigo",
      "allen-solly-bomber-jacket-olive",
      "peter-england-solid-crew-neck-tshirt-black",
    ],
  },
  {
    id: "seed-slide-premium",
    badge: "PREMIUM EDIT",
    headline: "Own the look,",
    highlight: "pay in EMIs",
    description: "Selected blazers, overcoats and premium shoes available on 3, 6, 9 and 12-month no-cost EMI plans.",
    ctaLabel: "Explore jackets",
    ctaHref: "/products/jackets",
    secondaryLabel: "EMI offers",
    secondaryHref: "/offers",
    gradient: GradientTheme.STEEL_GRAPHITE,
    sortOrder: 3,
    productSlugs: [
      "raymond-wool-blend-overcoat-camel",
      "van-heusen-single-breasted-blazer-navy",
      "clarks-leather-oxford-shoes-tan",
    ],
  },
];

async function main() {
  console.log("Refreshing Urban Vogue hero slides...");
  for (const slide of slides) {
    const products = await prisma.product.findMany({
      where: { slug: { in: slide.productSlugs }, active: true },
      select: { id: true, slug: true },
    });
    if (!products.length) { console.warn(`Skipping ${slide.id}: no matching active products found.`); continue; }
    const order = new Map(slide.productSlugs.map((slug, index) => [slug, index]));
    const sorted = products.sort((a, b) => (order.get(a.slug) ?? 999) - (order.get(b.slug) ?? 999)).slice(0, 3);
    await prisma.heroSlide.upsert({
      where: { id: slide.id },
      update: { kind: "CUSTOM", active: true, badge: slide.badge, headline: slide.headline, highlight: slide.highlight, description: slide.description, ctaLabel: slide.ctaLabel, ctaHref: slide.ctaHref, secondaryLabel: slide.secondaryLabel, secondaryHref: slide.secondaryHref, gradient: slide.gradient, sortOrder: slide.sortOrder, startsAt: new Date(), endsAt: new Date(Date.now() + 90 * 86400000) },
      create: { id: slide.id, kind: "CUSTOM", active: true, badge: slide.badge, headline: slide.headline, highlight: slide.highlight, description: slide.description, ctaLabel: slide.ctaLabel, ctaHref: slide.ctaHref, secondaryLabel: slide.secondaryLabel, secondaryHref: slide.secondaryHref, gradient: slide.gradient, sortOrder: slide.sortOrder, startsAt: new Date(), endsAt: new Date(Date.now() + 90 * 86400000) },
    });
    await prisma.heroSlideProduct.deleteMany({ where: { slideId: slide.id } });
    await prisma.heroSlideProduct.createMany({ data: sorted.map((product, position) => ({ slideId: slide.id, productId: product.id, position })) });
    console.log(`Updated slide: ${slide.id}`);
  }
  console.log("Hero slides refreshed.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => { await prisma.$disconnect(); });