import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getActor } from "@/lib/auth/guards";

const makeSlug = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** create with {name, slug} + a collision-safe unique slug (Brand.slug is required) */
async function createBrand(name: string) {
  const base = makeSlug(name) || "brand";
  let slug = base;
  for (let i = 2; i <= 60; i++) {
    const taken = await prisma.brand.findFirst({ where: { slug } });
    if (!taken) break;
    slug = `${base}-${i}`;
  }
  return prisma.brand.create({ data: { name, slug } });
}

export async function POST(req: Request) {
  // Signed-in check mirrors the leniency of getActor() (returns null when logged out).
  // If your OTHER /api/admin/* routes enforce a role, copy that exact line here.
  const actor = await getActor();
  if (!actor) {
    return NextResponse.json({ ok: false, error: "Sign in to add a brand." }, { status: 401 });
  }

  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ ok: false, error: "Brand name is required." }, { status: 400 });
  if (name.length > 80) return NextResponse.json({ ok: false, error: "Brand name too long (max 80)." }, { status: 400 });

  // Idempotent: re-typing an existing brand returns it instead of duplicating.
  const existing = await prisma.brand.findFirst({ where: { name } });
  if (existing) {
    return NextResponse.json({ ok: true, id: existing.id, name: existing.name, slug: (existing as any).slug ?? null });
  }

  try {
    const brand = await createBrand(name);
    return NextResponse.json({ ok: true, id: brand.id, name: brand.name, slug: (brand as any).slug ?? null });
  } catch (e) {
    // Surface Prisma's exact message (e.g. a still-missing required column like
    // `image`) into the inline hint so the failure stays self-diagnosing.
    const msg = e instanceof Error ? e.message : "Could not create brand.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}