import { parseProductOptions } from "@/lib/product-options";
import { sanitizePdpBlocks } from "@/lib/pdp-blocks";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireStaff, audit, can } from "@/lib/auth/guards";
import { productInputSchema } from "@/lib/validators";
import { discountPercent, jsonError, slugify } from "@/lib/utils";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { validationError, ok } from "@/lib/api-response";
import { seedRating, buildReviewPicks, REVIEW_TARGET } from "@/lib/rating-seed";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uniqueSlug(tx: any, base: string, excludeId?: string) {
  let slug = slugify(base) || "product";
  let i = 2;
  while (true) {
    const exists = await tx.product.findUnique({ where: { slug }, select: { id: true } });
    if (!exists || exists.id === excludeId) return slug;
    slug = `${slugify(base)}-${i++}`;
  }
}

// Coerce an unknown array into clean {group,label,value} rows (max lengths mirror
// productInputSchema so a malformed admin payload can't blow past the column limits).
function specRows(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: any) => ({
      group: typeof r?.group === "string" ? r.group.trim().slice(0, 60) : "",
      label: typeof r?.label === "string" ? r.label.trim().slice(0, 80) : "",
      value: typeof r?.value === "string" ? r.value.trim().slice(0, 240) : "",
    }))
    .filter((r) => r.group && r.label && r.value);
}
function imageRows(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r: any) => ({
      url: typeof r?.url === "string" ? r.url.trim().slice(0, 1000) : "",
      alt: typeof r?.alt === "string" ? r.alt.trim().slice(0, 500) : "",
    }))
    .filter((r) => r.url);
}

export async function POST(req: Request) {
  const rl = await rateLimit("adminMutation", clientIp(req));
  if (!rl.success) return tooMany(rl);
  try {
    const actor = await requireStaff();
    if (!can.manageCatalog(actor.role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    const body: Record<string, unknown> = await req.json().catch(() => ({}));

    // Strip the keys that are NOT part of productInputSchema so the strict-ish
    // parse only sees the core contract. The extras are read from `body` below.
    const bodyForSchema: Record<string, unknown> = { ...body };
    delete bodyForSchema.colors;
    delete bodyForSchema.colorOptions;
    delete bodyForSchema.variants;
    delete bodyForSchema.optionGroups;
    delete bodyForSchema.groupId;
    delete bodyForSchema.description;
    delete bodyForSchema.warrantySpecifications;
    delete bodyForSchema.mfgSpecifications;
    delete bodyForSchema.showcaseImages;
    delete bodyForSchema.pdpBlocks;

    const parsed = productInputSchema.safeParse(bodyForSchema);
    if (!parsed.success) return validationError(parsed.error);
    const data = parsed.data;

    const rawGroupId = (body as { groupId?: unknown }).groupId;
    const groupId = typeof rawGroupId === "string" && rawGroupId.trim() ? rawGroupId.trim() : null;

    if (data.salePrice > data.mrp) {
      return NextResponse.json({ ok: false, error: "Sale price cannot exceed MRP" }, { status: 422 });
    }

    // ---- extra sections (the image-2 parity fields) ----
    const description =
      typeof body.description === "string" ? body.description.trim().slice(0, 20000) || null : null;
    const warranty = specRows(body.warrantySpecifications);
    const mfg = specRows(body.mfgSpecifications);
    const showcase = imageRows(body.showcaseImages);
    const pdpBlocks = sanitizePdpBlocks(body.pdpBlocks);

    const [category, brand] = await Promise.all([
      prisma.category.findUnique({ where: { id: data.categoryId }, select: { id: true } }),
      prisma.brand.findUnique({ where: { id: data.brandId }, select: { id: true } }),
    ]);
    if (!category || !brand) {
      return NextResponse.json({ ok: false, error: "Invalid category or brand" }, { status: 422 });
    }

    const galleryCount = data.images.length;

    const product = await prisma.$transaction(async (tx) => {
      const slug = await uniqueSlug(tx, data.slug || data.name);
      return tx.product.create({
        data: {
          name: data.name,
          slug,
          shortDescription: data.shortDescription || null,
          description,                                   // <-- long-form copy
          pdpBlocks: pdpBlocks as any,                   // <-- PDP info blocks (Json)
          category: { connect: { id: data.categoryId } },
          brand: { connect: { id: data.brandId } },
          mrp: data.mrp,
          salePrice: data.salePrice,
          discountPercent: discountPercent(data.mrp, data.salePrice),
          stock: data.stock,
          lowStockAt: data.lowStockAt,
          subtype: data.subtype || null,
          ram: data.ram || null,
          storage: data.storage || null,
          screenSize: data.screenSize || null,
          processor: data.processor || null,
          color: data.color || null,
          warrantyMonths: data.warrantyMonths,
          codEligible: data.codEligible,
          emiEligible: data.emiEligible,
          exchangeEligible: data.exchangeEligible,
          featured: data.featured,
          active: data.active,
          hsnCode: data.hsnCode || null,
          tags: data.tags,
          ...seedRating(data.name),
          ...parseProductOptions(body),
          groupId,
          images: {
            create: [
              // GALLERY (primary first) — unchanged behaviour
              ...data.images.map((img, idx) => ({
                url: img.url,
                alt: img.alt || data.name,
                position: idx,
                isPrimary: idx === 0,
                kind: "GALLERY" as const,
              })),
              // SHOWCASE banners — stacked after the gallery, never primary
              ...showcase.map((img, i) => ({
                url: img.url,
                alt: img.alt || data.name,
                position: galleryCount + i,
                isPrimary: false,
                kind: "SHOWCASE" as const,
              })),
            ],
          },
          specifications: {
            create: [
              ...data.specifications.map((s) => ({
                group: s.group,
                label: s.label,
                value: s.value,
                kind: "SPEC" as const,
              })),
              ...warranty.map((s) => ({ ...s, kind: "WARRANTY" as const })),
              ...mfg.map((s) => ({ ...s, kind: "MFG" as const })),
            ],
          },
        },
      });
    });

    // best-effort visible review strip, POST-commit so it can never block creation.
    try {
      const authors = await prisma.user.findMany({
        where: { role: { not: "ADMIN" } },
        take: REVIEW_TARGET,
        select: { id: true },
      });
      if (authors.length) {
        await prisma.review.createMany({
          data: buildReviewPicks(product.id, authors.map((a) => a.id)),
        });
      }
    } catch (e) {
      console.error("review seed skipped for", product.id, e instanceof Error ? e.message : e);
    }

    await audit({
      actorId: actor.id,
      action: "PRODUCT_CREATE",
      entity: "Product",
      entityId: product.id,
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
      after: { name: product.name, salePrice: product.salePrice, stock: product.stock },
    });
    return ok({ product });
  } catch (e) {
    return jsonError(e, "Product creation failed");
  }
}