/**
 * Per-product PDP info blocks: live defaults + optional admin overrides.
 * Rule: an ABSENT/EMPTY override means "use the default", so dynamic defaults
 * (the delivery date) keep updating; a non-empty override freezes that section.
 * Pure functions, no imports — safe on server and client.
 */
export type PdpBlocksOverride = {
  deliveryDetails?: string[] | null;
  deliveryBy?: string | null;
  soldBy?: string | null;
  peaceOfMind?: string[] | null;
  highlights?: string[] | null;
};

export const DEFAULT_DELIVERY_DETAILS = [
  "Free delivery",
  "Delivery in 3-5 business days",
  "7-day replacement window",
];

export const DEFAULT_PEACE_OF_MIND = [
  "7-day brand support",
  "Cash on Delivery",
  "Urban Vogue Assured",
];

/** "Delivery by Saturday, 14 Nov" — today + 4 days, en-IN formatting. */
export function defaultDeliveryBy(): string {
  const d = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  const s = d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  return `Delivery by ${s}`;
}

export function defaultSoldBy(): string {
  return "Sold by Urban Vogue";
}

/**
 * Highlight lines derived from product columns. Field names are probed
 * defensively (return-window column name varies) so this module never hard-depends
 * on a column I can't see; missing fields simply omit their line.
 */
export function defaultHighlightsFromProduct(p: any): string[] {
  const out: string[] = [];
  if (p?.ram) out.push(`Size: ${p.ram}`);
  if (p?.storage) out.push(`Fabric: ${p.storage}`);
  if (p?.screenSize) out.push(`Fit: ${p.screenSize}`);
  if (p?.processor) out.push(`Occasion: ${p.processor}`);
  if (p?.color) out.push(`Colour: ${p.color}`);
  const days = p?.returnDays ?? p?.returnWindowDays ?? p?.returnPolicyDays ?? p?.easyReturnDays ?? null;
  if (days) out.push(`${days} day(s) easy return`);
  if (p?.exchangeEligible) out.push("7-day exchange");
  return out;
}

const clean = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const cleanList = (v: unknown): string[] | null => {
  if (!Array.isArray(v)) return null;
  const out = v.map(clean).filter(Boolean);
  return out.length ? out : null;
};

/** Strip anything unexpected from admin/API input; empty sections are dropped. */
export function sanitizePdpBlocks(raw: unknown): PdpBlocksOverride {
  if (!raw || typeof raw !== "object") return {};
  const r = raw as Record<string, unknown>;
  const out: PdpBlocksOverride = {};
  const dd = cleanList(r.deliveryDetails); if (dd) out.deliveryDetails = dd;
  const db = clean(r.deliveryBy); if (db) out.deliveryBy = db;
  const sb = clean(r.soldBy); if (sb) out.soldBy = sb;
  const pm = cleanList(r.peaceOfMind); if (pm) out.peaceOfMind = pm;
  const hl = cleanList(r.highlights); if (hl) out.highlights = hl;
  return out;
}

export type ResolvedPdpBlocks = {
  deliveryDetails: string[];
  deliveryBy: string;
  soldBy: string;
  peaceOfMind: string[];
  highlights: string[];
};

/**
 * What the PDP renders. `opts.highlights` = the line list the page derives from
 * product fields today, so resolution never needs to know those columns.
 */
export function resolvePdpBlocks(
  override: PdpBlocksOverride | null | undefined,
  opts: { highlights?: string[] | null } = {},
): ResolvedPdpBlocks {
  const o = override ?? {};
  return {
    deliveryDetails: cleanList(o.deliveryDetails) ?? DEFAULT_DELIVERY_DETAILS,
    deliveryBy: clean(o.deliveryBy) || defaultDeliveryBy(),
    soldBy: clean(o.soldBy) || defaultSoldBy(),
    peaceOfMind: cleanList(o.peaceOfMind) ?? DEFAULT_PEACE_OF_MIND,
    highlights: cleanList(o.highlights) ?? (opts.highlights?.length ? opts.highlights : []),
  };
}