"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { SIZE_CHARTS, garmentForSubtype, toInches, type DiagramKey } from "@/lib/size-charts";
import { BrandLogo } from "@/components/layout/BrandLogo";

type Props = {
  subtype?: string | null;
  garment?: string;
  productName?: string;
  images?: string[];
};

function Diagram({ kind }: { kind: DiagramKey }) {
  const lbl = "fill-gray-500 text-[8px] font-bold uppercase tracking-wider";
  const line = "stroke-gray-400";
  const dash = "stroke-gray-300 [stroke-dasharray:3 3]";

  if (kind === "tee") {
    return (
      <svg viewBox="0 0 300 340" className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="T-shirt measurement guide">
        <path
          d="M108 64 L84 72 L48 112 L66 152 L92 134 L92 296 L208 296 L208 134 L234 152 L252 112 L216 72 L192 64 C180 80 120 80 108 64 Z"
          fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"
        />
        <path d="M108 64 C120 80 180 80 192 64" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
        <line x1="84" y1="72" x2="216" y2="72" className={dash} />
        <text x="222" y="75" className={lbl}>Shoulder</text>
        <line x1="92" y1="150" x2="208" y2="150" className={dash} />
        <text x="214" y="153" className={lbl}>Chest</text>
        <line x1="96" y1="250" x2="204" y2="250" className={dash} />
        <text x="210" y="253" className={lbl}>Waist</text>
        <line x1="48" y1="112" x2="48" y2="152" className={line} />
        <text x="6" y="135" className={lbl}>Sleeve</text>
        <text x="6" y="145" className={lbl}>Length</text>
        <line x1="150" y1="82" x2="150" y2="296" className={dash} />
        <text x="120" y="312" className={lbl}>Front Length</text>
      </svg>
    );
  }

  if (kind === "shirt") {
    const ink = "#1f2937";
    const measure = "#374151";
    const label = "#111827";
    const faint = "#9ca3af";
    return (
      <svg viewBox="0 0 460 350" className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Shirt measurement guide">
        <g fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
          <path d="M196 30 Q220 42 244 30" />
          <path d="M198 37 Q220 49 242 37" />
          <path d="M196 30 Q220 20 244 30" />
          <path d="M196 30 L168 50 L194 86 L220 64" />
          <path d="M244 30 L272 50 L246 86 L220 64" />
          <path d="M170 52 L136 66" />
          <path d="M270 52 L304 66" />
          <path d="M150 130 L156 290 Q160 312 220 314 Q280 312 284 290 L290 130" />
          <path d="M136 66 L86 270 L128 284 L150 130" />
          <path d="M90 254 L132 268" />
          <path d="M304 66 L354 270 L312 284 L290 130" />
          <path d="M350 254 L308 268" />
          <path d="M220 64 L220 314" strokeWidth="1.1" />
        </g>
        <g fill="none" stroke={ink} strokeWidth="1.3">
          {[98, 138, 178, 218, 258, 296].map((y) => (
            <g key={y}>
              <circle cx="220" cy={y} r="4" />
              <circle cx="220" cy={y} r="1.2" fill={ink} stroke="none" />
            </g>
          ))}
        </g>
        <g transform="translate(262 104) scale(0.6)" fill="none" stroke={faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-7 -7 L-7 0 Q-7 7 0 7 Q7 7 7 0 L7 -7" />
          <path d="M-3.5 -3.5 L0 3.5 L3.5 -3.5" />
        </g>
        <g stroke={measure} strokeWidth="1.2">
          <line x1="136" y1="66" x2="352" y2="66" />
          <line x1="150" y1="130" x2="352" y2="130" />
          <line x1="154" y1="250" x2="352" y2="250" />
          <line x1="64" y1="62" x2="64" y2="314" />
          <line x1="58" y1="62" x2="70" y2="62" />
          <line x1="58" y1="314" x2="70" y2="314" />
          <line x1="142" y1="74" x2="96" y2="262" strokeDasharray="5 3" />
        </g>
        <g fill={label} fontSize="12" fontWeight="500" letterSpacing="0.05em">
          <text x="360" y="70">SHOULDER</text>
          <text x="360" y="134">CHEST</text>
          <text x="360" y="254">WAIST</text>
          <text x="56" y="182" textAnchor="end">SHIRT</text>
          <text x="56" y="197" textAnchor="end">LENGTH</text>
          <text transform="translate(119 168) rotate(-76)" y="18" textAnchor="middle">
            SLEEVE LENGTH
          </text>
        </g>
      </svg>
    );
  }

  if (kind === "blazer") {
    const ink = "#1f2937";
    const measure = "#374151";
    const label = "#111827";
    const faint = "#9ca3af";
    return (
      <svg viewBox="0 0 460 350" className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Jacket measurement guide">
        <g fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
          <path d="M200 28 Q220 22 240 28" />
          <path d="M204 34 Q220 42 236 34" />
          <path d="M200 28 L176 44 L170 78 L196 94 L220 70" />
          <path d="M240 28 L264 44 L270 78 L244 94 L220 70" />
          <path d="M210 38 L210 44 L230 44 L230 38" strokeWidth="1" />
          <path d="M176 44 L124 70" />
          <path d="M264 44 L316 70" />
          <path d="M148 140 L152 296 Q220 308 288 296 L292 140" />
          <path d="M124 70 Q100 150 80 288 L124 300 L148 140" />
          <path d="M83 272 L126 284" />
          <path d="M316 70 Q340 150 360 288 L316 300 L292 140" />
          <path d="M357 272 L314 284" />
          <path d="M152 282 Q220 294 288 282" strokeWidth="1.2" />
          <path d="M124 70 Q142 100 148 140" strokeWidth="1.2" />
          <path d="M316 70 Q298 100 292 140" strokeWidth="1.2" />
          <path d="M184 214 L196 218 L178 266 L166 262 Z" strokeWidth="1.4" />
          <path d="M256 214 L244 218 L262 266 L274 262 Z" strokeWidth="1.4" />
        </g>
        <g stroke={ink} fill="none" strokeLinecap="round">
          <line x1="218" y1="72" x2="218" y2="302" strokeWidth="1" />
          <line x1="222" y1="72" x2="222" y2="302" strokeWidth="1" />
          <line x1="220" y1="72" x2="220" y2="302" strokeWidth="3" strokeDasharray="1.5 1.5" />
          <rect x="217" y="76" width="6" height="12" rx="2" strokeWidth="1.2" fill="#fff" />
        </g>
        <g fill="none" stroke={faint} strokeWidth="1" strokeDasharray="2 3" strokeLinecap="round">
          <path d="M200 34 L180 48 L175 76 L196 89" />
          <path d="M240 34 L260 48 L265 76 L244 89" />
          <path d="M156 292 Q220 303 284 292" />
          <path d="M186 220 L176 260" />
          <path d="M254 220 L264 260" />
        </g>
        <g transform="translate(262 112) scale(0.6)" fill="none" stroke={faint} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-7 -7 L-7 0 Q-7 7 0 7 Q7 7 7 0 L7 -7" />
          <path d="M-3.5 -3.5 L0 3.5 L3.5 -3.5" />
        </g>
        <g stroke={measure} strokeWidth="1.2">
          <line x1="124" y1="70" x2="352" y2="70" />
          <line x1="148" y1="140" x2="352" y2="140" />
          <line x1="152" y1="250" x2="352" y2="250" />
          <line x1="64" y1="28" x2="64" y2="306" />
          <line x1="58" y1="28" x2="70" y2="28" />
          <line x1="58" y1="306" x2="70" y2="306" />
          <line x1="130" y1="80" x2="100" y2="284" strokeDasharray="5 3" />
        </g>
        <g fill={label} fontSize="12" fontWeight="500" letterSpacing="0.05em">
          <text x="360" y="74">SHOULDER</text>
          <text x="360" y="144">CHEST</text>
          <text x="360" y="254">WAIST</text>
          <text x="56" y="160" textAnchor="end">FRONT</text>
          <text x="56" y="175" textAnchor="end">LENGTH</text>
          <text transform="translate(115 182) rotate(-82)" y="14" textAnchor="middle">
            SLEEVE LENGTH
          </text>
        </g>
      </svg>
    );
  }

if (kind === "shoe") {
  const ink = "#374151";
  const guide = "#9ca3af";
  const arrow = "#d08a4e";

  // A single pencil, drawn upright (tip pointing down), then rotated/placed below
  const Pencil = ({ x, y, rotate, length }: { x: number; y: number; rotate: number; length: number }) => (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path d={`M -5.5 4 L -5.5 ${length - 16} L 0 ${length} L 5.5 ${length - 16} L 5.5 4`} />
      <path d="M -5.5 4 Q 0 -2 5.5 4" />
      <line x1="-5.5" y1="16" x2="5.5" y2="16" />
      <line x1="-5.5" y1={length - 16} x2="5.5" y2={length - 16} />
      <line x1="-1.5" y1="22" x2="-1.5" y2={length - 22} />
    </g>
  );

  return (
    <svg
      viewBox="0 0 420 232"
      className="mx-auto h-auto w-full max-w-[420px]"
      role="img"
      aria-label="How to measure your foot: side view with pencils marking the heel and longest toe, and top view showing the length measurement"
    >
      {/* ── Side view ── */}
      <g fill="none" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {/* left pencil (at toe) */}
        <Pencil x={14} y={76} rotate={-14} length={140} />
        {/* right pencil (at heel) */}
        <Pencil x={278} y={72} rotate={13} length={142} />

        {/* foot: toe -> instep -> ankle */}
        <path d="M 70 211 C 54 211 52 196 60 190 C 66 186 74 186 84 184 C 110 180 140 178 158 160 C 170 148 176 130 178 112" />
        {/* heel back */}
        <path d="M 240 128 C 238 150 242 180 244 211" />
        {/* small ankle tick */}
        <path d="M 214 128 Q 217 133 214 138" strokeWidth="1.2" />
      </g>
      {/* ground line */}
      <line x1="28" y1="212" x2="262" y2="212" stroke={ink} strokeWidth="1.4" />

      {/* ── Top view (sole) ── */}
      <g fill="none" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
        {/* sole outline */}
        <path d="M 318 56 C 326 46 372 44 384 58 C 396 80 400 120 392 158 C 386 190 380 218 356 218 C 334 218 328 196 322 168 C 314 130 312 80 318 56 Z" />
        {/* toes: big toe first, then smaller */}
        <ellipse cx="331" cy="30" rx="11" ry="15" />
        <ellipse cx="352" cy="33" rx="6" ry="8" />
        <ellipse cx="365" cy="38" rx="5.5" ry="7" />
        <ellipse cx="375" cy="44" rx="5" ry="6.5" />
        <ellipse cx="383" cy="52" rx="4.5" ry="6" />
      </g>

      {/* guide lines at longest toe and heel */}
      <line x1="300" y1="14" x2="410" y2="14" stroke={guide} strokeWidth="1" />
      <line x1="300" y1="220" x2="410" y2="220" stroke={guide} strokeWidth="1" />

      {/* length arrow (toe -> heel), double-headed */}
      <line x1="331" y1="26" x2="358" y2="210" stroke={arrow} strokeWidth="1.6" strokeLinecap="round" />
      <polygon points="331,22 335.8,30.4 328.8,31.4" fill={arrow} />
      <polygon points="358,214 360.2,204.6 353.2,205.6" fill={arrow} />
    </svg>
  );
}

  return (
    <svg viewBox="0 0 300 340" className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Garment measurement guide">
      <path d="M110 60 L86 70 L60 120 L80 150 L96 138 L96 300 L204 300 L204 138 L220 150 L240 120 L214 70 L190 60 C178 76 122 76 110 60 Z"
        fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="96" y1="150" x2="204" y2="150" className={dash} />
      <text x="210" y="153" className={lbl}>Chest</text>
      <line x1="100" y1="250" x2="200" y2="250" className={dash} />
      <text x="206" y="253" className={lbl}>Waist</text>
      <line x1="150" y1="78" x2="150" y2="300" className={dash} />
      <text x="120" y="316" className={lbl}>Length</text>
    </svg>
  );
}

function ShirtBackDiagram() {
  const ink = "#1f2937";
  const measure = "#374151";
  const label = "#111827";
  return (
    <svg viewBox="0 0 460 350" className="mx-auto h-auto w-full max-w-[420px]" role="img" aria-label="Shirt back measurement guide">
      <defs>
        <marker id="sb-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill={measure} />
        </marker>
      </defs>
      <g fill="none" stroke={ink} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
        <path d="M172 52 L136 66 L86 270 L128 284 L150 130 L156 290 Q160 312 220 314 Q280 312 284 290 L290 130 L312 284 L354 270 L304 66 L268 52" />
        <path d="M196 30 Q220 20 244 30" />
        <path d="M196 30 Q220 42 244 30" />
        <path d="M196 30 L172 52 Q220 70 268 52 L244 30" />
        <path d="M136 66 Q148 100 150 130" strokeWidth="1.2" />
        <path d="M304 66 Q292 100 290 130" strokeWidth="1.2" />
        <path d="M144 92 Q220 110 296 92" strokeWidth="1.2" />
        <path d="M90 254 L132 268" />
        <path d="M350 254 L308 268" />
      </g>
      <g stroke={measure} strokeWidth="1.2" fill="none">
        <line x1="136" y1="66" x2="304" y2="66" markerStart="url(#sb-arrow)" markerEnd="url(#sb-arrow)" />
        <line x1="304" y1="66" x2="352" y2="66" strokeWidth="1" />
        <line x1="220" y1="62" x2="220" y2="314" strokeDasharray="5 4" markerStart="url(#sb-arrow)" markerEnd="url(#sb-arrow)" />
        <line x1="220" y1="190" x2="352" y2="190" strokeWidth="1" />
        <line x1="156" y1="290" x2="284" y2="290" markerStart="url(#sb-arrow)" markerEnd="url(#sb-arrow)" />
        <line x1="284" y1="290" x2="352" y2="290" strokeWidth="1" />
      </g>
      <g fill={label} fontSize="12" fontWeight="500" letterSpacing="0.05em">
        <text x="360" y="62">ACROSS</text>
        <text x="360" y="77">SHOULDER</text>
        <text x="360" y="186">CENTRE BACK</text>
        <text x="360" y="201">LENGTH</text>
        <text x="360" y="286">BOTTOM</text>
        <text x="360" y="301">OPENING</text>
      </g>
    </svg>
  );
}

export function SizeChart({ subtype, garment, productName, images = [] }: Props) {
  const key = garment ?? garmentForSubtype(subtype);
  const chart = key ? SIZE_CHARTS[key] : undefined;

  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const [idx, setIdx] = useState(0);

  const imgs = useMemo(() => images.filter(Boolean), [images]);
  const prev = useCallback(() => setIdx((i) => (imgs.length ? (i - 1 + imgs.length) % imgs.length : 0)), [imgs.length]);
  const next = useCallback(() => setIdx((i) => (imgs.length ? (i + 1) % imgs.length : 0)), [imgs.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!chart || chart.rows.length === 0) return null;

  const fmt = (cm: number) => (unit === "cm" ? cm : toInches(cm));
  const unitCols = new Set(chart.unitCols ?? chart.columns.map((_, i) => i));

  return (
    <>
      <button
        type="button"
        onClick={() => { setIdx(0); setOpen(true); }}
        className="text-[12px] font-bold uppercase tracking-wide text-gray-900 underline underline-offset-4 hover:text-gray-500"
      >
        Size Chart
      </button>

      {open && chart && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Size chart">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="border-b border-gray-200 px-5 py-3 text-center">
              <p className="line-clamp-1 text-[13px] font-semibold text-gray-900">
                {productName ? `${productName} — ` : ""}Size Charts
              </p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close"
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
                <X className="size-5" />
              </button>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
              <div className="relative flex items-center justify-center bg-gray-50 p-4">
                {imgs.length > 0 ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgs[idx]} alt="Garment" className="max-h-[70vh] w-auto object-contain" />
                    <button type="button" onClick={prev} aria-label="Previous"
                      className="absolute left-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded bg-black/40 text-white hover:bg-black/60">
                      <ChevronLeft className="size-5" />
                    </button>
                    <button type="button" onClick={next} aria-label="Next"
                      className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded bg-black/40 text-white hover:bg-black/60">
                      <ChevronRight className="size-5" />
                    </button>
                  </>
                ) : (
                  <div className="grid h-[40vh] w-full place-items-center text-[12px] text-gray-400">No preview image</div>
                )}
              </div>

              <div className="min-h-0 overflow-y-auto px-5 py-4">
                <div className="mb-3 flex items-center justify-center gap-2 text-[12px] font-bold uppercase tracking-wider">
                  <button type="button" onClick={() => setUnit("cm")}
                    className={unit === "cm" ? "text-emerald-600 underline underline-offset-4" : "text-gray-400 hover:text-gray-600"}>cm</button>
                  <span className="text-gray-300">|</span>
                  <button type="button" onClick={() => setUnit("in")}
                    className={unit === "in" ? "text-emerald-600 underline underline-offset-4" : "text-gray-400 hover:text-gray-600"}>inches</button>
                </div>

                <table className="w-full border-collapse text-[12.5px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-[10.5px] uppercase tracking-wider text-gray-500">
                      <th className="py-2 pl-1 text-left font-bold">{chart.sizeHeader ?? "Size"}</th>
                      {chart.columns.map((c) => (
                        <th key={c} className="py-2 text-center font-bold">{c}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {chart.rows.map((r) => (
                      <tr key={r.size} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pl-1 font-bold text-gray-900">{r.size}</td>
                        {r.cm.map((v, i) => (
                          <td key={i} className="py-2 text-center tabular-nums text-gray-700">
                            {unitCols.has(i) ? fmt(v) : v}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 flex justify-center text-gray-900">
                  <BrandLogo emblemClass="size-10" wordmarkClass="text-[13px]" taglineClass="text-[6.5px]" />
                </div>

                <div className="mt-3 space-y-8">
                  <div>
                    <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Front view</p>
                    <Diagram kind={chart.diagram} />
                  </div>
                  {chart.diagram === "shirt" && (
                    <div>
                      <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-gray-500">Back view</p>
                      <ShirtBackDiagram />
                    </div>
                  )}
                </div>

                {chart.howTo && chart.howTo.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[12px] font-bold text-gray-900">How to Measure:</p>
                    <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-[11.5px] leading-relaxed text-gray-700">
                      {chart.howTo.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ol>
                    {chart.tip && (
                      <p className="mt-2 text-[11px] italic leading-relaxed text-gray-500">
                        💡 Tip: {chart.tip}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SizeChart;