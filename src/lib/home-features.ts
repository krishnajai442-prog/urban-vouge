export type FeatureKey =
  | "HOT_DEALS"
  | "BEST_SELLERS"
  | "WISHLIST"
  | "NEW_ARRIVALS"
  | "TRENDING";

export type FeatureDef = {
  key: FeatureKey;
  title: string;
  bg: string;
  text: string;
  help: string;
};

export const HOME_FEATURES: FeatureDef[] = [
  { key: "HOT_DEALS",    title: "Top Deals on Fashion",       bg: "bg-[#2c3e50]", text: "text-white", help: "Products with big discounts, shown in the navy rail." },
  { key: "BEST_SELLERS", title: "Bestsellers of the Season",  bg: "bg-[#c9a96e]", text: "text-[#1a1a2e]", help: "Proven picks based on orders, ratings and repeat demand." },
  { key: "WISHLIST",     title: "Add to Your Wishlist",       bg: "bg-[#8b6914]", text: "text-white", help: "High-consideration styles worth saving for later." },
  { key: "NEW_ARRIVALS", title: "New Arrivals",               bg: "bg-[#1a1a2e]", text: "text-white", help: "Fresh drops with first-day pricing." },
  { key: "TRENDING",     title: "Suggested For You",          bg: "bg-gray-800",  text: "text-white", help: "Mixed pool shown to every visitor." },
];

export const FEATURE_KEYS = HOME_FEATURES.map((f) => f.key) as [FeatureKey, ...FeatureKey[]];

export function featureByKey(key: string): FeatureDef | undefined {
  return HOME_FEATURES.find((f) => f.key === key);
}