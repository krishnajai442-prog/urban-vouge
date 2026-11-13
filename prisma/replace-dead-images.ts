// Repairs rows that still point at the Cloudflare-403 picsum host.
//   product has >=1 real image  -> dead rows deleted
//   product has ONLY dead rows  -> primary re-pointed at /img/ph placeholder
//   slide/banner/review/showcase picsum URLs -> nulled / pruned
// Usage:
//   npx tsx prisma/replace-dead-images.ts --dry          preview local DB
//   npx tsx prisma/replace-dead-images.ts                apply local DB
//   npx tsx prisma/replace-dead-images.ts --dry --neon   preview production
//   npx tsx prisma/replace-dead-images.ts --neon         apply production
import { existsSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

function loadDotEnv(): void {
  if (!existsSync(".env")) { console.warn("[env] no .env - relying on exported env"); return; }
  let text: string;
  try { text = readFileSync(".env", "utf8"); } catch { return; }
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/i, "");
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv();

const DRY = process.argv.includes("--dry");
const NEON = process.argv.includes("--neon");
const DEAD = "picsum.photos";
const url = NEON ? process.env.NEON_DATABASE_URL : process.env.DATABASE_URL;
if (!url) { console.error(`ABORT - missing ${NEON ? "NEON_DATABASE_URL" : "DATABASE_URL"}`); process.exit(1); }
const prisma = new PrismaClient({ datasources: { db: { url } } });

const isDead = (u: string | null | undefined) => Boolean(u && u.includes(DEAD));
const ph = (name: string) => `/img/ph?text=${encodeURIComponent(name.slice(0, 60))}`;

async function main() {
  console.log(`${DRY ? "DRY-RUN" : "APPLY"} -> ${NEON ? "NEON" : "LOCAL"} DB`);
  let repointed = 0, dropped = 0, slidesFixed = 0, reviewsFixed = 0;

  const products = await prisma.product.findMany({
    select: {
      id: true, slug: true, name: true, showcaseImages: true,
      images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], select: { id: true, url: true } },
    },
  });
  for (const p of products) {
    const dead = p.images.filter((i) => isDead(i.url));
    const alive = p.images.length - dead.length;
    const deadShowcase = (p.showcaseImages ?? []).filter(isDead);
    if (!dead.length && !deadShowcase.length) continue;
    console.log(`  [${alive ? "drop" : "repoint"}] ${p.slug}: dead=${dead.length} real=${alive}`);
    if (DRY) continue;
    if (deadShowcase.length) {
      await prisma.product.update({ where: { id: p.id }, data: { showcaseImages: (p.showcaseImages ?? []).filter((u) => !isDead(u)) } });
    }
    if (!dead.length) continue;
    if (alive > 0) {
      await prisma.productImage.deleteMany({ where: { id: { in: dead.map((d) => d.id) } } });
      dropped += dead.length;
    } else {
      const [keep, ...rest] = dead;
      await prisma.productImage.update({ where: { id: keep!.id }, data: { url: ph(p.name), isPrimary: true, alt: p.name } });
      if (rest.length) await prisma.productImage.deleteMany({ where: { id: { in: rest.map((r) => r.id) } } });
      repointed++; dropped += rest.length;
    }
  }

  const slides = await prisma.heroSlide.findMany({ select: { id: true, image: true, products: { select: { slideId: true, productId: true, image: true } } } });
  for (const s of slides) {
    const deadJoins = s.products.filter((jp) => isDead(jp.image));
    if (!isDead(s.image) && !deadJoins.length) continue;
    slidesFixed++;
    if (DRY) continue;
    if (isDead(s.image)) await prisma.heroSlide.update({ where: { id: s.id }, data: { image: null } });
    for (const jp of deadJoins) {
      await prisma.heroSlideProduct.update({ where: { slideId_productId: { slideId: jp.slideId, productId: jp.productId } }, data: { image: null } });
    }
  }
  const banners = DRY ? { count: 0 } : await prisma.banner.updateMany({ where: { imageUrl: { contains: DEAD } }, data: { imageUrl: null } });

  const reviews = await prisma.review.findMany({ where: { images: { isEmpty: false } }, select: { id: true, images: true } });
  for (const r of reviews) {
    const cleaned = r.images.filter((u) => !isDead(u));
    if (cleaned.length === r.images.length) continue;
    reviewsFixed++;
    if (!DRY) await prisma.review.update({ where: { id: r.id }, data: { images: cleaned } });
  }

  console.log(`\n${DRY ? "Would repoint" : "Repointed"} ${repointed} product(s); dropped ${dropped} dead row(s); slides=${slidesFixed}, banners=${banners.count}, reviews=${reviewsFixed}.`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());