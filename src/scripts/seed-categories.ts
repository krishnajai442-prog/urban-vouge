// src/scripts/seed-categories.ts
// Run: npx tsx src/scripts/seed-categories.ts
// Idempotent category seeder. Inserts/updates rows only; no schema change.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATS: { name: string; slug: string }[] = [
  { name: "Footwear", slug: "footwear" },
  { name: "Watches", slug: "watches" },
  { name: "Smart Wearables", slug: "smart-wearables" },
  { name: "Grooming & Personal Care", slug: "grooming" },
  { name: "Ethnic Wear", slug: "ethnic-wear" },
  { name: "Innerwear & Loungewear", slug: "innerwear" },
  { name: "Winter Wear", slug: "winter-wear" },
  { name: "Bags & Travel", slug: "bags" },
];

async function main() {
  for (const c of CATS) {
    const existing = await prisma.category.findFirst({
      where: { slug: c.slug },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: c.name,
        },
      });
      console.log(`updated: ${c.slug}`);
    } else {
      await prisma.category.create({
        data: {
          name: c.name,
          slug: c.slug,
          // If your Category model has other REQUIRED fields, add them here.
        },
      });
      console.log(`created: ${c.slug}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });