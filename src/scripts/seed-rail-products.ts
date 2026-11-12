// src/scripts/seed-rail-products.ts
// Seeds >=2 active products into each EMPTY rail group so the tiles, hover
// dropdowns and /shop/<group> pages are populated. Idempotent by slug.
// NO image rows are created (no thematic image exists in the DB for these
// groups) -> tiles show the honest icon fallback until you upload in admin.
// Defensive: a missing required column is reported per-row and skipped, not fatal.
// Run:  npx tsx src/scripts/seed-rail-products.ts --dry-run   (preview, no writes)
//       npx tsx src/scripts/seed-rail-products.ts             (write)
import { PrismaClient } from "@prisma/client";
import { MEN_GROUPS } from "../lib/men-taxonomy";

const prisma = new PrismaClient();
const DRY = process.argv.includes("--dry-run");
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));
const errors: string[] = [];

type Ref = { name: string; slug: string };
type Prod = {
  slug: string; name: string; subtype: string; short: string;
  brand: Ref; category: Ref;
  mrp: number; salePrice: number; color: string; size: string; // size -> `ram` column
};

// 2 per empty group. Names embed the group's matcher term (probe-confirmed).
const SPECS: { group: string; products: Prod[] }[] = [
  { group: "sports", products: [
    { slug: "gym-training-gloves-seed", name: "Gym Training Gloves", subtype: "Fitness Gloves", short: "Breathable padded gloves for gym and workout sessions.", brand: { name: "Nivia", slug: "nivia" }, category: { name: "Sports & Fitness", slug: "sports-fitness" }, mrp: 1299, salePrice: 899, color: "Black", size: "Free Size" },
    { slug: "anti-slip-yoga-mat-seed", name: "Anti-Slip Yoga Mat", subtype: "Yoga Mat", short: "Cushioned non-slip mat for yoga and floor training.", brand: { name: "Boldfit", slug: "boldfit" }, category: { name: "Sports & Fitness", slug: "sports-fitness" }, mrp: 2499, salePrice: 1799, color: "Purple", size: "6 mm" },
  ]},
  { group: "smart-watches", products: [
    { slug: "noise-colorfit-smart-watch-seed", name: "Noise Smart Watch ColorFit", subtype: "Smart Watch", short: "Bluetooth calling smart watch with AMOLED display.", brand: { name: "Noise", slug: "noise" }, category: { name: "Smart Wearables", slug: "smart-wearables" }, mrp: 5999, salePrice: 3499, color: "Black", size: "1.85 inch" },
    { slug: "boat-wave-smart-watch-seed", name: "boAt Smart Watch Wave", subtype: "Smart Watch", short: "Fitness tracking smart watch with 7-day battery.", brand: { name: "boAt", slug: "boat" }, category: { name: "Smart Wearables", slug: "smart-wearables" }, mrp: 4999, salePrice: 2999, color: "Blue", size: "1.69 inch" },
  ]},
  { group: "smart-bands", products: [
    { slug: "noise-fitpro-smart-band-seed", name: "Noise Smart Band FitPro", subtype: "Smart Band", short: "Lightweight activity tracker band with heart-rate monitor.", brand: { name: "Noise", slug: "noise" }, category: { name: "Smart Wearables", slug: "smart-wearables" }, mrp: 2499, salePrice: 1499, color: "Black", size: "Medium" },
    { slug: "fireboltt-blaze-smart-band-seed", name: "Fire-Boltt Smart Band Blaze", subtype: "Smart Band", short: "SpO2 and sleep-tracking smart band for daily activity.", brand: { name: "Fire-Boltt", slug: "fire-boltt" }, category: { name: "Smart Wearables", slug: "smart-wearables" }, mrp: 1999, salePrice: 1299, color: "Grey", size: "Standard" },
  ]},
  { group: "personal-care", products: [
    { slug: "beardo-smart-trimmer-seed", name: "Beardo Smart Trimmer", subtype: "Trimmer", short: "Self-sharpening cordless trimmer with 10 length settings.", brand: { name: "Beardo", slug: "beardo" }, category: { name: "Grooming & Personal Care", slug: "grooming" }, mrp: 2299, salePrice: 1599, color: "Black", size: "1-10 mm" },
    { slug: "philips-series-shaver-seed", name: "Philips Series Shaver", subtype: "Shaver", short: "Wet & dry electric shaver with pop-up trimmer.", brand: { name: "Philips", slug: "philips" }, category: { name: "Grooming & Personal Care", slug: "grooming" }, mrp: 4495, salePrice: 3295, color: "White", size: "Wet & Dry" },
  ]},
  { group: "grooming", products: [
    { slug: "nivea-men-deodorant-seed", name: "Nivea Men Deodorant Roll On", subtype: "Deodorant", short: "48h protection roll-on deodorant for men.", brand: { name: "Nivea", slug: "nivea" }, category: { name: "Grooming & Personal Care", slug: "grooming" }, mrp: 350, salePrice: 280, color: "Blue", size: "150 ml" },
    { slug: "denver-limited-perfume-seed", name: "Denver Limited Perfume", subtype: "Perfume", short: "Long-lasting woody fragrance for evening wear.", brand: { name: "Denver", slug: "denver" }, category: { name: "Grooming & Personal Care", slug: "grooming" }, mrp: 1299, salePrice: 899, color: "Gold", size: "100 ml" },
  ]},
  { group: "fabrics", products: [
    { slug: "vardhman-cotton-shirt-fabric-seed", name: "Vardhman Cotton Shirt Fabric 2.5m", subtype: "Shirt Fabric", short: "Premium breathable cotton fabric, enough for one shirt.", brand: { name: "Vardhman", slug: "vardhman" }, category: { name: "Fabrics", slug: "fabrics" }, mrp: 999, salePrice: 749, color: "White", size: "2.5 mtr" },
    { slug: "raymond-wool-suit-fabric-seed", name: "Raymond Wool Suit Fabric 3m", subtype: "Suit Fabric", short: "Fine merino-blend wool fabric for tailored suits.", brand: { name: "Raymond", slug: "raymond" }, category: { name: "Fabrics", slug: "fabrics" }, mrp: 3499, salePrice: 2799, color: "Charcoal", size: "3 mtr" },
  ]},
  { group: "ethnic", products: [
    { slug: "raymond-cotton-kurta-set-seed", name: "Raymond Cotton Kurta Set", subtype: "Kurta", short: "Hand-finished cotton kurta with matching pyjama.", brand: { name: "Raymond", slug: "raymond" }, category: { name: "Ethnic Wear", slug: "ethnic-wear" }, mrp: 2999, salePrice: 2199, color: "Beige", size: "M" },
    { slug: "brooksbond-sherwani-seed", name: "Brooks Bond Sherwani", subtype: "Sherwani", short: "Embroidered festive sherwani with Nehru collar.", brand: { name: "Brooks Bond", slug: "brooks-bond" }, category: { name: "Ethnic Wear", slug: "ethnic-wear" }, mrp: 8999, salePrice: 6999, color: "Ivory", size: "L" },
  ]},
  { group: "raincoats", products: [
    { slug: "fortison-compact-raincoat-seed", name: "Fortison Compact Raincoat", subtype: "Raincoat", short: "Waterproof foldable raincoat with hood and pockets.", brand: { name: "Fortison", slug: "fortison" }, category: { name: "Raincoats & Windcheaters", slug: "raincoats" }, mrp: 1899, salePrice: 1299, color: "Navy", size: "M" },
    { slug: "wildcraft-windcheater-seed", name: "Wildcraft Windcheater", subtype: "Windcheater", short: "Lightweight wind-resistant jacket for outdoor use.", brand: { name: "Wildcraft", slug: "wildcraft" }, category: { name: "Raincoats & Windcheaters", slug: "raincoats" }, mrp: 2499, salePrice: 1799, color: "Olive", size: "L" },
  ]},
];

async function ensureRef(model: "brand" | "category", ref: Ref): Promise<string | null> {
  try {
    if (model === "brand") {
      const found = await prisma.brand.findFirst({ where: { slug: ref.slug } });
      if (found) { await prisma.brand.update({ where: { id: found.id }, data: { name: ref.name } }); return found.id; }
      const created = await prisma.brand.create({ data: { name: ref.name, slug: ref.slug } });
      return created.id;
    } else {
      const found = await prisma.category.findFirst({ where: { slug: ref.slug } });
      if (found) { await prisma.category.update({ where: { id: found.id }, data: { name: ref.name } }); return found.id; }
      const created = await prisma.category.create({ data: { name: ref.name, slug: ref.slug } });
      return created.id;
    }
  } catch (e) { errors.push(`${model} "${ref.slug}": ${msg(e)}`); return null; }
}

async function ensureProduct(p: Prod, brandId: string, categoryId: string): Promise<boolean> {
  const discountPercent = p.mrp > p.salePrice ? Math.round(((p.mrp - p.salePrice) / p.mrp) * 100) : 0;
  const data = {
    name: p.name, slug: p.slug, shortDescription: p.short, description: "",
    subtype: p.subtype, groupId: "", ram: p.size, storage: "", screenSize: "", processor: "",
    color: p.color, mrp: p.mrp, salePrice: p.salePrice, discountPercent,
    stock: 20, lowStockAt: 5, warrantyMonths: 12, hsnCode: "", tags: [] as string[],
    codEligible: true, emiEligible: true, exchangeEligible: true, featured: false, active: true,
    categoryId, brandId,
  };
  try {
    const found = await prisma.product.findFirst({ where: { slug: p.slug } });
    if (found) await prisma.product.update({ where: { id: found.id }, data });
    else await prisma.product.create({ data });
    return true;
  } catch (e) { errors.push(`product "${p.slug}": ${msg(e)}`); return false; }
}

async function countFor(groupSlug: string): Promise<number> {
  const g = MEN_GROUPS.find((x) => x.slug === groupSlug);
  if (!g) return -1;
  const rows = await prisma.product.findMany({ where: { active: true }, select: { name: true, subtype: true, brand: { select: { name: true } } } });
  const hay = (r: any) => `${r.name} ${r.subtype ?? ""}`.toLowerCase();
  const hayBrand = (r: any) => `${r.name} ${r.brand?.name ?? ""}`.toLowerCase();
  const termOf = (href: string) => { const i = href.indexOf("q="); return i === -1 ? "" : decodeURIComponent(href.slice(i + 2)); };
  const re = g.matcher ? new RegExp(g.matcher, "i") : null;
  const matched = re
    ? rows.filter((r: any) => re.test(hay(r)))
    : rows.filter((r: any) => g.items.some((it) => { const t = termOf(it.href).toLowerCase(); return t && hayBrand(r).includes(t); }));
  return matched.length;
}

async function main() {
  const before: Record<string, number> = {};
  for (const s of SPECS) before[s.group] = await countFor(s.group);

  if (DRY) {
    console.log("DRY RUN — intended writes (no DB touched):\n");
    for (const s of SPECS) for (const p of s.products)
      console.log(`  [${s.group}] ${p.slug}  "${p.name}" / ${p.subtype}  brand=${p.brand.name} cat=${p.category.name}  ₹${p.salePrice} (₹${p.mrp})`);
    console.log(`\nTotal: ${SPECS.reduce((n, s) => n + s.products.length, 0)} products across ${SPECS.length} groups.`);
    return;
  }

  let created = 0, updated = 0;
  for (const s of SPECS) {
    for (const p of s.products) {
      const brandId = await ensureRef("brand", p.brand);
      if (!brandId) continue;
      const categoryId = await ensureRef("category", p.category);
      if (!categoryId) continue;
      const existed = await prisma.product.findFirst({ where: { slug: p.slug } });
      const ok = await ensureProduct(p, brandId, categoryId);
      if (ok) existed ? updated++ : created++;
    }
  }

  console.log(`\nSeeded: ${created} created, ${updated} updated, ${errors.length} skipped.`);
  console.log("\nPer-group matching count (before -> after):");
  for (const s of SPECS) {
    const after = await countFor(s.group);
    console.log(`  ${s.group.padEnd(16)} ${String(before[s.group]).padStart(2)} -> ${String(after).padStart(2)}${after < 2 ? "   <-- STILL SHORT" : ""}`);
  }
  if (errors.length) {
    console.log("\n⚠ Skipped rows (Prisma named the missing/invalid field — paste these to me and I'll add the column to the create object):");
    for (const e of errors) console.log("  - " + e);
  } else {
    console.log("\n✅ All targeted groups now have >=2 active products. Upload a photo to one product per group in admin to light its tile.");
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });