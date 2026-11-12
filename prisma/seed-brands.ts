import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SHIRTS = [
  "Louis Philippe", "Van Heusen", "Allen Solly", "Peter England", "Raymond",
  "Park Avenue", "John Players", "Mufti", "Indian Terrain", "Arrow",
  "Zara", "H&M", "Uniqlo", "Mango Man", "U.S. Polo Assn",
];

const TROUSERS = [
  "Raymond", "Van Heusen", "Louis Philippe", "Peter England", "Park Avenue",
  "Levi's", "Wrangler", "Pepe Jeans", "Mufti", "John Players",
];

const JACKETS = [
  "Raymond", "Van Heusen", "Allen Solly", "John Players", "H&M",
  "Zara", "Mufti", "Indian Terrain", "Pepe Jeans", "Arrow",
];

const ACCESSORIES = [
  "Nike", "Adidas", "Puma", "Clarks", "Casio",
  "Fossil", "Tommy Hilfiger", "Ray-Ban", "Titan", "Woodland",
  "Wildcraft", "American Tourister", "Skybags", "Targus", "Hidesign",
];

const ALSO_ACCESSORIES = [
  "Louis Philippe", "Van Heusen", "Allen Solly", "Peter England",
  "Raymond", "Park Avenue", "Levi's", "Zara", "H&M", "Uniqlo",
];
const EXTRA: Record<string, string[]> = {
  "Louis Philippe": ["Shirts & T-Shirts", "Pants & Trousers", "Jackets & Blazers"],
  "Van Heusen": ["Shirts & T-Shirts", "Jackets & Blazers"],
  "Allen Solly": ["Shirts & T-Shirts", "Jackets & Blazers"],
  "Raymond": ["Pants & Trousers", "Jackets & Blazers"],
  "Levi's": ["Pants & Trousers"],
  "Zara": ["Shirts & T-Shirts", "Jackets & Blazers"],
  "H&M": ["Shirts & T-Shirts", "Jackets & Blazers"],
  "Nike": ["Shoes & Accessories"],
  "Adidas": ["Shoes & Accessories"],
  "Puma": ["Shoes & Accessories"],
  "Casio": ["Shoes & Accessories"],
  "Fossil": ["Shoes & Accessories"],
};

function slugify(name: string): string {
  return (
    name.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
      .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
  ) || "brand";
}

async function main() {
  const cats = new Map<string, Set<string>>();
  const add = (n: string, c: string) => {
    if (!cats.has(n)) cats.set(n, new Set());
    cats.get(n)!.add(c);
  };
    SHIRTS.forEach((n) => add(n, "Shirts & T-Shirts"));
  TROUSERS.forEach((n) => add(n, "Pants & Trousers"));
  JACKETS.forEach((n) => add(n, "Jackets & Blazers"));
  ACCESSORIES.forEach((n) => add(n, "Accessories"));
  ALSO_ACCESSORIES.forEach((n) => add(n, "Accessories"));

  let added = 0, tagged = 0, skipped = 0;

  for (const [name, set] of cats) {
    const existing = await prisma.brand.findFirst({ where: { name } });
    if (existing) {
      const before = existing.categories ?? [];
      const merged = [...new Set([...before, ...set])];
      if (merged.length !== before.length) {
        await prisma.brand.update({ where: { id: existing.id }, data: { categories: merged } });
        tagged++;
      } else skipped++;
      continue;
    }
    const base = slugify(name);
    let slug = base, n = 2;
    while (await prisma.brand.findUnique({ where: { slug }, select: { id: true } })) slug = `${base}-${n++}`;
    await prisma.brand.create({ data: { name, slug, categories: [...set] } });
    added++;
  }

  console.log(`Brands: ${added} added, ${tagged} re-tagged, ${skipped} unchanged.`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());