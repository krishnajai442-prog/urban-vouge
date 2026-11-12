/**
 * SIZE CHART REGISTRY — the ONLY place garment measurements live.
 *
 * ── DATA HONESTY ────────────────────────────────────────────────────────────
 * The `tshirt` rows below are a STANDARD INDIAN‑MENSWEAR BASELINE (monotonic
 * XS→3XL ladder in centimetres). They are NOT any brand's published spec.
 * Swap each `cm` array for the brand‑official chart when you have it — the
 * INCHES column is derived from cm at render time, so fixing cm fixes both.
 *
 * Garments other than `tshirt` are intentionally EMPTY (rows: []). The modal and
 * the trigger hide themselves for an empty chart, so no broken/blank chart ever
 * reaches a shopper. To enable one later: fill `rows` (and set `diagram`), done.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type ChartColumn = string;            // header text, e.g. "CHEST"
export type ChartRow = { size: string; cm: number[] }; // cm aligned to columns

export type DiagramKey = "tee" | "shirt" | "blazer" | "sweater" | "trouser" | "shoe" | "generic";

export type SizeChart = {
  label: string;            // shown in the modal header line, e.g. "T‑Shirt"
  columns: ChartColumn[];   // measurement columns AFTER the SIZE column
  rows: ChartRow[];         // empty => chart disabled
  diagram: DiagramKey;
  /** Header for the first (size) column; defaults to "SIZE". */
  sizeHeader?: string;
  /** Indices of columns that are physical lengths converted by the CM|INCHES
      toggle. Defaults to EVERY column. Size-code columns (IND/UK/US/EURO) opt
      out so the toggle never divides a UK 6 by 2.54. */
  unitCols?: number[];
  /** Optional numbered measuring steps rendered under the diagram. */
  howTo?: string[];
  /** Optional italic tip rendered after the steps. */
  tip?: string;
};

/** cm → inches, one decimal. Derived so the file stores cm only. */
export const toInches = (cm: number) => Number((cm / 2.54).toFixed(1));

export const SIZE_CHARTS: Record<string, SizeChart> = {
  tshirt: {
    label: "T‑Shirt / Polo",
    columns: ["CHEST", "FRONT LENGTH", "ACROSS SHOULDER"],
    // cm ladder [chest, frontLength, acrossShoulder] — BASELINE, replace per brand
    rows: [
      { size: "XS",  cm: [96,  68, 40] },
      { size: "S",   cm: [101, 69, 41] },
      { size: "M",   cm: [106, 70, 42] },
      { size: "L",   cm: [111, 71, 43] },
      { size: "XL",  cm: [116, 72, 44] },
      { size: "XXL", cm: [121, 73, 45] },
      { size: "3XL", cm: [126, 74, 46] },
    ],
    diagram: "tee",
  },

  // ── FILL THESE WHEN YOU HAVE THE OFFICIAL CHARTS ──────────────────────────
  // Leave rows: [] and the link stays hidden. Suggested columns in comments.
   shirt: {
    label: "Formal / Casual Shirt",
    columns: ["CHEST", "FRONT LENGTH", "ACROSS SHOULDER"],
    // Published collared-shirt measurements (cm). INCHES is derived at render
    // time via toInches(cm); every cell below /2.54 reproduces the brand's
    // inch figures to 1 dp, so this is the single source of truth.
    rows: [
      { size: "XS",  cm: [99.1, 72.9, 41.9] },
      { size: "S",   cm: [104,  74.9, 43.9] },
      { size: "M",   cm: [109,  77,   47]   },
      { size: "L",   cm: [115,  78,   48.5] },
      { size: "XL",  cm: [121,  79,   50.5] },
      { size: "XXL", cm: [130,  81.5, 52.6] },
      { size: "3XL", cm: [139,  85.6, 55.9] },
      { size: "4XL", cm: [148,  86.6, 59.4] },
      { size: "5XL", cm: [157,  87.4, 63]   },
    ],
    diagram: "shirt",
  },
    blazer: {
    label: "Jacket / Blazer",
    columns: ["ACROSS SHOULDER", "CHEST", "FRONT LENGTH", "TO FIT WAIST"],
    // Published jacket measurements in CM (same ladder as the reference chart).
    // The INCHES column is derived at render time via toInches(cm) and reconciles
    // with the brand's inch figures to rounding (e.g. 117cm -> 46.1 vs their 46).
    rows: [
      { size: "XS",  cm: [45.7, 107, 68.6, 94]   },
      { size: "S",   cm: [48.3, 112, 68.6, 99.1] },
      { size: "M",   cm: [48.3, 117, 71.1, 104]  },
      { size: "L",   cm: [50.8, 122, 73.7, 109]  },
      { size: "XL",  cm: [53.3, 127, 73.7, 117]  },
      { size: "XXL", cm: [55.9, 135, 76.2, 122]  },
      { size: "3XL", cm: [55.9, 140, 78.7, 127]  },
    ],
    diagram: "blazer",
  },
  sweater: {
    label: "Sweater / Hoodie",
    columns: ["CHEST", "FRONT LENGTH", "ACROSS SHOULDER", "SLEEVE LENGTH"],
    rows: [],
    diagram: "sweater",
  },
  trouser: {
    label: "Trousers / Chinos / Jeans",
    columns: ["WAIST", "HIP", "INSEAM", "OUTSEAM"],
    rows: [],
    diagram: "trouser",
  },
    shoe: {
    label: "Men's Shoe",
    sizeHeader: "SHOE",
    columns: ["IND", "UK", "US", "EURO", "FOOT LENGTH"],
    // Only FOOT LENGTH (index 4) is a physical length; the rest are size codes
    // that must NOT convert when the shopper flips CM -> INCHES.
    unitCols: [4],
    // cm ladder transcribed from the published chart; inches derive to 10.3/10.6/
    // 10.9/11.1/11.5/11.7 exactly (26.2/2.54 = 10.31 -> 10.3, etc.).
    rows: [
      { size: "6",  cm: [6, 6, 7, 40, 26.2] },
      { size: "7",  cm: [7, 7, 8, 41, 26.9] },
      { size: "8",  cm: [8, 8, 9, 42, 27.7] },
      { size: "9",  cm: [9, 9, 10, 43, 28.2] },
      { size: "10", cm: [10, 10, 11, 44, 29.2] },
      { size: "11", cm: [11, 11, 12, 45, 29.7] },
    ],
    diagram: "shoe",
    howTo: [
      "Place a sheet of paper on a hard floor.",
      "Stand straight with your heel against the wall.",
      "Mark the longest toe on the paper.",
      "Measure the distance from the wall to the toe mark in centimeters.",
      "Use the chart above to find your size.",
    ],
    tip: "Always measure both feet – choose the larger length if there's a difference. For sports shoes, you may want to add 0.5 cm for comfort.",
  },
};

/**
 * Map a product's `subtype` (the value you already store) to a chart key.
 * Returns null when there's no chart → the Size Chart link is not rendered.
 * Today only knit tees resolve; woven shirts/blazers/etc. return null until
 * their rows are filled above.
 */
export function garmentForSubtype(subtype?: string | null): string | null {
  if (!subtype) return null;
  const s = subtype.toLowerCase();
  if (s.includes("t-shirt") || s.includes("tshirt") || s.includes("polo")) return "tshirt";
  if (s.includes("shirt")) return "shirt";          // hidden until rows filled
  if (s.includes("blazer") || s.includes("jacket")) return "blazer";
  if (s.includes("sweater") || s.includes("hoodie")) return "sweater";
  if (s.includes("trouser") || s.includes("chino") || s.includes("jean") || s.includes("denim")) return "trouser";
  if (s.includes("sneaker") || s.includes("shoe") || s.includes("loafer") || s.includes("boot")) return "shoe";
  return null;
}