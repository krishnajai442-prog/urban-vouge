// prisma/sync-images.ts   →   npx tsx prisma/sync-images.ts --dry   then   npx tsx prisma/sync-images.ts [--replace-dead]
import { readFileSync, existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

// PASTE-PROOF .env loader: NO regex, NO backslashes. Split each line on the FIRST
// '=' only, so "KEY=value", "KEY = value", and values containing '=' (query params)
// all parse. Strips a leading "export ", surrounding quotes, skips blanks/comments.
// Crucially it does NOT swallow read errors — a missing/unreadable .env is reported.
function loadDotEnv(): void {
  const path = ".env";
  if (!existsSync(path)) { console.warn(`[env] no .env at ${process.cwd()} — relying on exported env vars`); return; }
  let text: string;
  try { text = readFileSync(path, "utf8"); }
  catch (e) { console.error(`[env] FAILED to read .env: ${e instanceof Error ? e.message : e}`); return; }
  for (const raw of text.split(/\r\n|\r|\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    let key = line.slice(0, eq).trim().replace(/^export\s+/i, "");
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!(key in process.env)) process.env[key] = val; // don't clobber an explicit export
  }
}
loadDotEnv();

function mask(u?: string): string {
  if (!u) return "(unset)";
  try { const x = new URL(u); return `${x.protocol}//${x.hostname}${x.port ? ":" + x.port : ""}/…(${u.length} chars)`; }
  catch { return `unparseable, len=${u.length}`; }
}

const DRY = process.argv.includes("--dry");
const REPLACE_DEAD = process.argv.includes("--replace-dead");
const DEAD = "picsum.photos"; // the one host the KB confirms is Cloudflare-403-blocking

// ASSERT before constructing anything — turns a cryptic Prisma stack into a clear message.
const LOCAL_URL = process.env.DATABASE_URL;
const NEON_URL  = process.env.NEON_DATABASE_URL;
console.log(`[env] DATABASE_URL      = ${mask(LOCAL_URL)}`);
console.log(`[env] NEON_DATABASE_URL = ${mask(NEON_URL)}`);
const missing: string[] = [];
if (!LOCAL_URL) missing.push("DATABASE_URL (local Docker) — add it to .env or export it");
if (!NEON_URL)  missing.push("NEON_DATABASE_URL (Neon POOLED url, ends in -pooler) — add it to .env or export it");
if (missing.length) { console.error("\nABORT — missing env:\n  - " + missing.join("\n  - ")); process.exit(1); }

async function main() {
  // Construct AFTER the asserts so a bad/missing URL can never reach a lazy connect.
  const local = new PrismaClient();                                       // uses process.env.DATABASE_URL
  const neon  = new PrismaClient({ datasources: { db: { url: NEON_URL! } } }); // classic override, Prisma 6.19.3

  try {
    // local products that actually HAVE a real (non-picsum) image — the only ones sync can copy from
    const locals = await local.product.findMany({
      where: { active: true },
      select: {
        slug: true,
        images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
          select: { url: true, alt: true, position: true, isPrimary: true, kind: true } },
      },
    });
    const withImgs = locals.filter((p) => p.images.some((im) => im.url && !im.url.includes(DEAD)));
    const slugs = withImgs.map((p) => p.slug);

    // map slug -> neon product id (cuids differ across the two DBs, so we match by slug)
    const neonRows = await neon.product.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } });
    const neonIdBySlug = new Map(neonRows.map((r) => [r.slug, r.id]));

    let added = 0, removedDead = 0, deadDetected = 0, skippedNoNeon = 0, errors = 0;
    const log: string[] = [];

    for (const p of withImgs) {
      const nid = neonIdBySlug.get(p.slug);
      if (!nid) { skippedNoNeon++; log.push(`  [no-neon-product] ${p.slug} -> create it on the live Vercel admin first`); continue; }

      const existing = await neon.productImage.findMany({ where: { productId: nid }, select: { id: true, url: true } });
      const deadIds  = existing.filter((e) => e.url?.includes(DEAD)).map((e) => e.id);
      const keptUrls = new Set(existing.filter((e) => !e.url?.includes(DEAD)).map((e) => e.url));
      deadDetected += deadIds.length; // counted in BOTH modes so one --dry tells you the flag

      // rows to add = local real urls not already kept on neon (avoids duplicates; idempotent)
      const toAdd = p.images
        .filter((im) => im.url && !im.url.includes(DEAD) && !keptUrls.has(im.url))
        .map((im) => ({ productId: nid, url: im.url, alt: im.alt, position: im.position, isPrimary: im.isPrimary, kind: im.kind ?? "GALLERY" }));

      if (!deadIds.length && !toAdd.length) continue; // neon already mirrors local -> nothing to do

      log.push(`  [add ${toAdd.length}] ${p.slug}  neon(kept=${keptUrls.size}, dead=${deadIds.length})`);
      if (DRY) { added += toAdd.length; continue; }

      try {
        if (REPLACE_DEAD && deadIds.length) { await neon.productImage.deleteMany({ where: { id: { in: deadIds } } }); removedDead += deadIds.length; }
        if (toAdd.length) { await neon.productImage.createMany({ data: toAdd }); added += toAdd.length; }
      } catch (e) { errors++; log.push(`  [ERROR] ${p.slug}: ${e instanceof Error ? e.message : e}`); }
    }

    console.log(`${DRY ? "DRY-RUN" : "APPLIED"} | replace-dead=${REPLACE_DEAD} | products w/ real local imgs: ${withImgs.length}`);
    console.log(`real rows ${DRY ? "would be" : "were"} added: ${added}`);
    console.log(`dead picsum rows DETECTED: ${deadDetected}  (removed ONLY with --replace-dead; ${DRY ? "dry-run, nothing written" : `actually removed: ${removedDead}`})`);
    console.log(`skipped (no neon product): ${skippedNoNeon} | errors: ${errors}`);
    if (log.length) { console.log("details:"); for (const l of log) console.log(l); }
    console.log("\nA broken slug ABSENT from this list = local has no real image either -> paste its URL on the live Vercel admin (sync can't manufacture pixels).");
  } finally {
    await local.$disconnect(); await neon.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });