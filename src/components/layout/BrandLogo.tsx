import { useId } from "react";

type Props = {
  emblemClass?: string;
  wordmarkClass?: string;
  taglineClass?: string;
  /** Champagne-gold base hue (drives the metallic ramp midpoint + glow + "Vogue"). */
  accent?: string;
  showTagline?: boolean;
  className?: string;
};

/**
 * Urban Vogue brand lockup = glossy metallic emblem + two-tone wordmark + tagline.
 * GEOMETRY FROZEN (the two rings + the V-inside-U monogram keep their exact
 * cx/cy/r and path `d`). SURFACE = brushed-gold gradient + top-lit sheen + inner
 * dome glow + warm halo/contact shadow, so the mark reads premium on the dark bar.
 * IDs namespaced via useId() so multiple instances never collide.
 */
export function BrandLogo({
  emblemClass = "size-8 sm:size-9",
  wordmarkClass = "text-[15px] sm:text-[18px]",
  taglineClass = "text-[7.5px] sm:text-[8.5px]",
  accent = "#c9a96e",
  showTagline = true,
  className = "",
}: Props) {
  const uid = useId().replace(/:/g, "");
  const gold = `uv-gold-${uid}`;
  const sheen = `uv-sheen-${uid}`;
  const dome = `uv-dome-${uid}`;
  const glow = `uv-glow-${uid}`;
  const textGold = `uv-text-${uid}`;

  return (
    <span className={`flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 48 48"
        className={`${emblemClass} shrink-0`}
        aria-hidden="true"
        role="presentation"
        style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.45))" }}
      >
        <defs>
          <linearGradient id={gold} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fbe9b8" />
            <stop offset="18%" stopColor="#e7c878" />
            <stop offset="42%" stopColor={accent} />
            <stop offset="62%" stopColor="#9c7a2e" />
            <stop offset="82%" stopColor="#6e4f12" />
            <stop offset="100%" stopColor="#d8b25e" />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="38%" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id={dome} cx="0.5" cy="0.32" r="0.62">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <filter id={glow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.4" floodColor={accent} floodOpacity="0.55" />
          </filter>
          <linearGradient id={textGold} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbe9b8" />
            <stop offset="45%" stopColor={accent} />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>

        <ellipse cx="24" cy="18" rx="15" ry="12" fill={`url(#${dome})`} />

        <g filter={`url(#${glow})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="22" stroke={`url(#${gold})`} strokeWidth="1.5" opacity="0.95" />
          <circle cx="24" cy="24" r="18.5" stroke={`url(#${gold})`} strokeWidth="0.8" opacity="0.55" />
          <path d="M16 14 L16 26 Q16 34 24 34 Q32 34 32 14" stroke={`url(#${gold})`} strokeWidth="3" />
          <path d="M19.5 19 L24 29 L28.5 19" stroke={`url(#${gold})`} strokeWidth="2.4" opacity="0.95" />
        </g>

        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="22" stroke={`url(#${sheen})`} strokeWidth="0.7" />
          <path d="M16 14 L16 26 Q16 34 24 34 Q32 34 32 14" stroke={`url(#${sheen})`} strokeWidth="1.3" />
          <path d="M19.5 19 L24 29 L28.5 19" stroke={`url(#${sheen})`} strokeWidth="1.0" />
        </g>
      </svg>

      <span className="flex flex-col leading-none">
        <span className={`font-display font-black tracking-tight ${wordmarkClass}`}>
          <span className="text-current">Urban</span>{" "}
          <span
            style={{
              backgroundImage: `linear-gradient(180deg, #fbe9b8 0%, ${accent} 45%, #8b6914 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: accent,
              WebkitTextFillColor: "transparent",
            }}
          >
            Vogue
          </span>
        </span>
        {showTagline && (
          <span className={`mt-1 font-semibold uppercase tracking-[0.18em] opacity-70 ${taglineClass}`}>
            The Multi Branded Store
          </span>
        )}
      </span>
    </span>
  );
}

export default BrandLogo;