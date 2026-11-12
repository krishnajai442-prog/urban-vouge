export type GradientThemeId =
  | "MIDNIGHT"
  | "VIOLET_STORM"
  | "ELECTRIC_AZURE"
  | "EMERALD_TECH"
  | "SUNSET_DEAL"
  | "STEEL_GRAPHITE";

export type SlideGradient = {
  id: GradientThemeId;
  label: string;
  stage: string;
  glow: string;
  badge: string;
  headline: string;
  ring: string;
  swatch: string;
};

export const SLIDE_GRADIENTS: Record<GradientThemeId, SlideGradient> = {
  MIDNIGHT: {
    id: "MIDNIGHT",
    label: "Midnight Charcoal",
    stage: "bg-[radial-gradient(120%_120%_at_85%_10%,#2c3e50_0%,#1a1a2e_55%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.45),transparent_62%)]",
    badge: "from-[#c9a96e]/90 to-[#8b6914]/90",
    headline: "from-[#c9a96e] via-[#e0cfa8] to-[#d4b87a]",
    ring: "ring-[#c9a96e]/25",
    swatch: "linear-gradient(135deg,#1a1a2e,#c9a96e,#8b6914)",
  },
  VIOLET_STORM: {
    id: "VIOLET_STORM",
    label: "Deep Navy",
    stage: "bg-[radial-gradient(120%_120%_at_80%_15%,#1a1a3e_0%,#1a1a2e_55%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(44,62,80,0.55),transparent_62%)]",
    badge: "from-[#2c3e50]/90 to-[#1a1a2e]/90",
    headline: "from-[#a0b4c8] via-[#c9d6e3] to-[#8fa8c0]",
    ring: "ring-[#2c3e50]/25",
    swatch: "linear-gradient(135deg,#1a1a2e,#2c3e50,#4a6fa5)",
  },
  ELECTRIC_AZURE: {
    id: "ELECTRIC_AZURE",
    label: "Champagne Gold",
    stage: "bg-[radial-gradient(120%_120%_at_85%_10%,#3d2b00_0%,#2a1f00_55%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.55),transparent_62%)]",
    badge: "from-[#c9a96e]/90 to-[#d4a017]/90",
    headline: "from-[#c9a96e] via-[#e0cfa8] to-[#f0e6d0]",
    ring: "ring-[#c9a96e]/25",
    swatch: "linear-gradient(135deg,#2a1f00,#c9a96e,#e0cfa8)",
  },
  EMERALD_TECH: {
    id: "EMERALD_TECH",
    label: "Forest Green",
    stage: "bg-[radial-gradient(120%_120%_at_85%_10%,#1b4332_0%,#0d2818_55%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(45,106,79,0.50),transparent_62%)]",
    badge: "from-[#2d6a4f]/90 to-[#1b4332]/90",
    headline: "from-[#74c69d] via-[#95d5b2] to-[#52b788]",
    ring: "ring-[#2d6a4f]/25",
    swatch: "linear-gradient(135deg,#0d2818,#2d6a4f,#52b788)",
  },
  SUNSET_DEAL: {
    id: "SUNSET_DEAL",
    label: "Warm Bronze",
    stage: "bg-[radial-gradient(120%_120%_at_85%_10%,#5c3a1e_0%,#3d2510_50%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(192,121,42,0.55),transparent_62%)]",
    badge: "from-[#c0792a]/90 to-[#a0522d]/90",
    headline: "from-[#deb887] via-[#d2a679] to-[#c0792a]",
    ring: "ring-[#c0792a]/25",
    swatch: "linear-gradient(135deg,#3d2510,#c0792a,#deb887)",
  },
  STEEL_GRAPHITE: {
    id: "STEEL_GRAPHITE",
    label: "Steel Graphite",
    stage: "bg-[radial-gradient(120%_120%_at_85%_10%,#2a2c38_0%,#181a24_55%,#0d0d0d_100%)]",
    glow: "bg-[radial-gradient(circle_at_center,rgba(150,150,165,0.35),transparent_62%)]",
    badge: "from-[#3a3d52]/90 to-[#6b7080]/90",
    headline: "from-[#cdd2e0] via-[#e3e6ef] to-[#aab0c2]",
    ring: "ring-[#6b7080]/25",
    swatch: "linear-gradient(135deg,#181a24,#3a3d52,#9aa0b0)",
  },
};

export function gradientFor(id: string | null | undefined): SlideGradient {
  const key = (id ?? "MIDNIGHT") as GradientThemeId;
  return SLIDE_GRADIENTS[key] ?? SLIDE_GRADIENTS.MIDNIGHT;
}