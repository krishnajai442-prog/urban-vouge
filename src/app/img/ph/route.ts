import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

function wrap(text: string, max = 18, maxLines = 4): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  let overflow = false;
  for (const w of words) {
    const next = cur ? cur + " " + w : w;
    if (next.length <= max) { cur = next; continue; }
    if (cur) lines.push(cur);
    cur = w;
    if (lines.length === maxLines) { overflow = true; break; }
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  else if (cur) overflow = true;
  if (overflow && lines.length) {
    lines[lines.length - 1] = lines[lines.length - 1]!.slice(0, max - 1) + "…";
  }
  return lines.length ? lines : ["Urban Vogue"];
}

function svgFor(text: string): string {
  const ls = wrap(text);
  const tspans = ls
    .map((l, i) => `<tspan x="300" dy="${i === 0 ? 0 : 34}">${esc(l)}</tspan>`)
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" role="img" aria-label="${esc(text)}">
<rect width="600" height="600" fill="#f6f4ef"/>
<rect x="14" y="14" width="572" height="572" rx="18" fill="none" stroke="#c9a96e" stroke-width="2"/>
<circle cx="300" cy="180" r="46" fill="#1a1a2e"/>
<text x="300" y="196" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-weight="700" fill="#c9a96e">V</text>
<text x="300" y="300" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="28" font-weight="600" fill="#1a1a2e">${tspans}</text>
<text x="300" y="540" text-anchor="middle" font-family="'Segoe UI', Arial, sans-serif" font-size="16" letter-spacing="4" fill="#8b6914">URBAN VOGUE</text>
</svg>`;
}

export async function GET(req: Request) {
  const text = (new URL(req.url).searchParams.get("text") ?? "").trim() || "Urban Vogue";
  return new NextResponse(svgFor(text.slice(0, 80)), {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
    },
  });
}