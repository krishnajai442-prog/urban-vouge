import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MEN_GROUPS } from "@/lib/men-taxonomy";

// Force a fresh execution per request so the random pick below is re-rolled on
// every fetch (a cached/static GET would freeze one image forever).
export const dynamic = "force-dynamic";

/** Decode the `q` term from a `...?q=<term>` href ("" if not a q-link). */
const termOf = (href: string): string => {
  const i = href.indexOf("q=");
  return i === -1 ? "" : decodeURIComponent(href.slice(i + 2));
};

/** Random element of a non-empty array, else null. Re-rolled each request. */
const pick = <T,>(arr: T[]): T | null =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] ?? null : null;

/**
 * Serves the static MEN taxonomy with live, ROTATING catalog thumbnails.
 *  - group.image = a RANDOM matching active product that has ANY image (primary-
 *    first), ignoring `kind`, so a product whose photo was uploaded as a Showcase
 *    banner (kind != GALLERY) still lights the tile — this is what fixes Men's
 *    Grooming, whose images aren't tagged GALLERY.
 *  - item.image  = a RANDOM product matching the item's search term (preferring a
 *    GALLERY image, then any image), falling back to the group image so no tile is
 *    ever blank.
 * Because the pick is random per request, the rail + dropdown thumbnails change on
 * every page refresh / route navigation / login-redirect (the client re-fetches).
 */
export async function GET() {
  const rows = await prisma.product.findMany({
    where: { active: true },
    select: {
      name: true,
      subtype: true,
      // No hard kind gate; primary first so images[0] is the best available shot.
      images: {
        orderBy: [{ isPrimary: "desc" }, { position: "asc" }],
        take: 5,
        select: { url: true, kind: true, isPrimary: true },
      },
    },
  });

  const hay = (r: { name: string; subtype: string | null }) =>
    `${r.name} ${r.subtype ?? ""}`.toLowerCase();
  const anyImage = (r: { images: { url: string; kind?: string | null }[] }) =>
    r.images[0]?.url ?? null;
  const galleryImage = (r: { images: { url: string; kind?: string | null }[] }) =>
    r.images.find((i) => (i.kind ?? "GALLERY") === "GALLERY")?.url ?? null;

  const groups = MEN_GROUPS.map((g) => {
    const re = g.matcher ? new RegExp(g.matcher, "i") : null;
    const matched = re
      ? rows.filter((r) => re.test(hay(r)))
      : rows.filter((r) =>
          g.items.some((it) => {
            const t = termOf(it.href).toLowerCase();
            return t && hay(r).includes(t);
          }),
        );

    // Rail tile: random imaged product in the group (any kind).
    const imaged = matched.filter((r) => anyImage(r));
    const chosen = pick(imaged);
    const image = chosen ? anyImage(chosen) : null;

    const items = g.items.map((it) => {
      const term = termOf(it.href).toLowerCase() || null;
      const cand = term
        ? (matched.filter((r) => hay(r).includes(term)))
        : [];
      const cand2 = cand.length
        ? cand
        : term
          ? rows.filter((r) => hay(r).includes(term))
          : [];
      const imagedCand = cand2.filter((r) => anyImage(r));
      const hit = pick(imagedCand);
      // Prefer a clean GALLERY shot for the term, else any image, else the group image.
      const itemImage = (hit ? (galleryImage(hit) ?? anyImage(hit)) : null) ?? image;
      return { label: it.label, href: it.href, image: itemImage };
    });

    return {
      slug: g.slug,
      label: g.label,
      subtitle: g.subtitle,
      icon: g.icon,
      viewAll: g.viewAll,
      image,
      items,
    };
  });

  return NextResponse.json({ groups });
}