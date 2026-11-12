// src/scripts/probe-rail-groups.ts
// READ-ONLY. Reports, per arrow-targeted rail group: matcher, item-label match
// pass/fail, current active matching-product count, and a reusable primary image.
// Changes nothing. Run: npx tsx src/scripts/probe-rail-groups.ts
import { PrismaClient } from "@prisma/client";
import { MEN_GROUPS } from "../lib/men-taxonomy";

const prisma = new PrismaClient();

const TARGET = [
  "Sports & Fitness Store", "Smart Watches", "Smart Bands", "Personal Care Appliances",
  "Featured", "Men's Grooming", "Fabrics", "Ethnic wear", "Raincoats & Windcheaters",
];

const termOf = (href: string) => {
  const i = href.indexOf("q=");
  return i === -1 ? "" : decodeURIComponent(href.slice(i + 2));
};

async function main() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: {
      name: true, subtype: true,
      brand: { select: { name: true } },
      images: { where: { kind: "GALLERY" }, orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1, select: { url: true } },
    },
  });
  const hay = (r: any) => `${r.name} ${r.subtype ?? ""}`.toLowerCase();
  const hayBrand = (r: any) => `${r.name} ${r.brand?.name ?? ""}`.toLowerCase();

  for (const label of TARGET) {
    const g = MEN_GROUPS.find((x) => x.label.toLowerCase() === label.toLowerCase());
    if (!g) { console.log(`\n### ${label}  -> NOT FOUND in MEN_GROUPS (check exact label)`); continue; }
    const re = g.matcher ? new RegExp(g.matcher, "i") : null;
    const matched = re
      ? rows.filter((r) => re.test(hay(r)))
      : rows.filter((r) => g.items.some((it) => { const t = termOf(it.href).toLowerCase(); return t && hayBrand(r).includes(t); }));
    const img = matched.find((r) => r.images[0]?.url)?.images[0]?.url ?? null;
    console.log(`\n### ${g.label}  (slug: ${g.slug})`);
    console.log(`    matcher: ${g.matcher ?? "(none — brand/item-term group)"}`);
    console.log(`    current matching active products: ${matched.length}`);
    console.log(`    reusable primary image: ${img ?? "(none -> tile stays icon until upload)"}`);
    console.log(`    item labels -> would a product NAMED like this match the group?`);
    for (const it of g.items) {
      const ok = re ? re.test(it.label) : g.items.some((x) => { const t = termOf(x.href).toLowerCase(); return t && it.label.toLowerCase().includes(t); });
      console.log(`      ${ok ? "PASS" : "fail"}  "${it.label}"`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });