"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sparkles, LayoutGrid, Shirt, Footprints, Watch, Gem, Layers, Wind, Ruler,
  Snowflake, Umbrella, Dumbbell, Smartphone, SprayCan, Star, Briefcase, Tag,
} from "lucide-react";

type NavItem = { label: string; href: string; image?: string | null };
type NavGroup = {
  slug: string; label: string; subtitle: string; icon: string;
  viewAll: string; image: string | null; items: NavItem[];
};

const ICONS: Record<string, any> = {
  shirt: Shirt, footprints: Footprints, watch: Watch, gem: Gem, layers: Layers,
  wind: Wind, ruler: Ruler, snowflake: Snowflake, umbrella: Umbrella,
  dumbbell: Dumbbell, smartphone: Smartphone, spray: SprayCan, star: Star,
  briefcase: Briefcase, hat: Tag,
};

/** Pull the decoded search term out of a `...?q=<term>` href ("" if not a q-link). */
const termOf = (href: string): string => {
  const i = href.indexOf("q=");
  return i === -1 ? "" : decodeURIComponent(href.slice(i + 2));
};

/**
 * Resolves which rail tile owns the dark "selected" shade from the URL.
 * Calls useSearchParams(), so it MUST be rendered inside a <Suspense> boundary
 * (Next 15 build rule: a bare useSearchParams() opts the page into a CSR bailout
 * and fails prerendering — notably the /_not-found page, which renders this rail
 * through the root layout).
 */
function useActiveSlug(groups: NavGroup[]): string | null {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") ?? "").trim();
  let activeSlug: string | null = null;
  if (pathname === "/") activeSlug = "for-you";
  else {
    const shop = groups.find((g) => pathname === `/shop/${g.slug}`);
    if (shop) activeSlug = shop.slug;
    else if (q) {
      for (const g of groups) {
        if (termOf(g.viewAll) === q || g.items.some((it) => termOf(it.href) === q)) {
          activeSlug = g.slug;
          break;
        }
      }
    }
  }
  return activeSlug;
}

/** The horizontal tile row. Shade is passed in (null during prerender / on the 404). */
function RailRow({ groups, activeSlug, setOpen }: {
  groups: NavGroup[]; activeSlug: string | null; setOpen: (v: string | null) => void;
}) {
  const forYouActive = activeSlug === "for-you";
  return (
    <div className="flex items-stretch gap-2 overflow-x-auto rounded-xl border border-[#c9a96e]/50 bg-white p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* For You — shaded only while it is the active selection */}
      <Link
        href="/"
        onMouseEnter={() => setOpen(null)}
        className={`flex min-w-[132px] shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 transition-colors ${
          forYouActive ? "bg-[#1a1a2e] text-white" : "text-ink-900 hover:bg-canvas"
        }`}
      >
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${forYouActive ? "bg-white/10" : "bg-canvas text-ink-700"}`}>
          <Sparkles className="size-4" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[12.5px] font-bold">For You</span>
          <span className={`text-[10px] ${forYouActive ? "opacity-70" : "text-ink-400"}`}></span>
        </span>
      </Link>

      {groups.map((g) => {
        const Icon = ICONS[g.icon] ?? Shirt;
        const active = activeSlug === g.slug;
        return (
          <div key={g.slug} className="shrink-0" onMouseEnter={() => setOpen(g.slug)}>
            <Link
              href={`/shop/${g.slug}`}
              className={`flex min-w-[150px] items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${
                active ? "bg-[#1a1a2e] text-white" : "hover:bg-canvas"
              }`}
            >
              {g.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={g.image}
                  alt={g.label}
                  className={`size-9 shrink-0 rounded-lg object-cover ${active ? "border border-white/25" : "border border-hairline bg-canvas"}`}
                />
              ) : (
                <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${active ? "bg-white/10 text-white" : "bg-canvas text-ink-700"}`}>
                  <Icon className="size-4" />
                </span>
              )}
              <span className="flex min-w-0 flex-col leading-tight">
                <span className={`truncate text-[12.5px] font-bold ${active ? "text-white" : "text-ink-900"}`}>{g.label}</span>
                <span className={`truncate text-[10px] ${active ? "text-white/60" : "text-ink-400"}`}>{g.subtitle}</span>
              </span>
            </Link>
          </div>
        );
      })}

      <Link
        href="/products/all"
        onMouseEnter={() => setOpen(null)}
        className="flex min-w-[64px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 hover:bg-canvas"
      >
        <LayoutGrid className="size-4 text-ink-700" />
        <span className="text-[10px] font-bold text-ink-700">More</span>
      </Link>
    </div>
  );
}

/** Suspended child: resolves the shade via the hook, then renders the row. */
function RailWithShade({ groups, setOpen }: {
  groups: NavGroup[]; setOpen: (v: string | null) => void;
}) {
  const activeSlug = useActiveSlug(groups);
  return <RailRow groups={groups} activeSlug={activeSlug} setOpen={setOpen} />;
}

export function CategoryRail() {
  const [groups, setGroups] = useState<NavGroup[]>([]);
    const [open, setOpen] = useState<string | null>(null);
  const pathname = usePathname();

  // Re-fetch on every route change (a full refresh also remounts the root layout),
  // with cache:"no-store" so the browser never reuses a stale payload. The server
  // re-rolls a RANDOM imaged product per group per request, so the rail + dropdown
  // thumbnails rotate on each navigation / refresh / login-redirect. Old groups are
  // kept until the new payload lands, so tiles never flash to the icon fallback.
  useEffect(() => {
    let alive = true;
    fetch("/api/nav", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j?.groups) setGroups(j.groups); })
      .catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  const openGroup = groups.find((g) => g.slug === open) ?? null;
  const OpenIcon = openGroup ? (ICONS[openGroup.icon] ?? Shirt) : Shirt;

  return (
    <div className="relative border-b border-hairline bg-white" onMouseLeave={() => setOpen(null)}>
      <div className="container-x py-2.5">
        {/* The row prerenders unshaded (fallback); hydration swaps in the shade.
            This is the Suspense boundary that satisfies the useSearchParams rule. */}
        <Suspense fallback={<RailRow groups={groups} activeSlug={null} setOpen={setOpen} />}>
          <RailWithShade groups={groups} setOpen={setOpen} />
        </Suspense>
      </div>

      {/* ── DROPDOWN: square photo tiles w/ gold underline; desktop-only (md:block) ── */}
      {openGroup && openGroup.items.length > 0 && (
        <div className="absolute inset-x-0 top-full z-40 hidden border-b border-hairline bg-white shadow-lift md:block">
          <div className="container-x py-4">
            <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {openGroup.items.map((it) => {
                const term = termOf(it.href) || it.label;
                return (
                  <Link
                    key={it.label}
                    href={`/shop/${openGroup.slug}?q=${encodeURIComponent(term)}`}
                    className="flex w-[104px] shrink-0 flex-col items-center"
                  >
                    <span className="relative aspect-square w-full overflow-hidden rounded-lg border border-hairline bg-canvas">
                      {it.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.image} alt={it.label} className="size-full object-cover" />
                      ) : (
                        <OpenIcon className="absolute inset-0 m-auto size-6 text-ink-400" />
                      )}
                      <span className="absolute inset-x-0 bottom-0 h-1.5 bg-[linear-gradient(90deg,#b8963f,#e0cfa8,#b8963f)]" />
                    </span>
                    <span className="mt-1.5 w-full truncate text-center text-[11px] font-semibold text-ink-700">
                      {it.label}
                    </span>
                  </Link>
                );
              })}

              {/* "Shop now" promo tile -> the group's full page */}
              <Link href={`/shop/${openGroup.slug}`} className="flex w-[104px] shrink-0 flex-col items-center">
                <span className="grid aspect-square w-full place-items-center rounded-lg bg-[#1a1a2e] px-2 text-center text-white">
                  <span className="text-[11px] font-bold leading-tight">{openGroup.label}</span>
                </span>
                <span className="mt-1.5 text-[11px] font-semibold text-ink-700 underline underline-offset-2">
                  Shop now
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryRail;