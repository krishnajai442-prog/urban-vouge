const GENERIC = {
  plural: "styles and essentials",
  meta: "Genuine products, easy returns, no-cost EMI and fast delivery across India.",
  intro:
    "Every piece is sourced through authorised distribution, quality-checked at intake and covered by brand warranty. Filter by size, fabric, fit and occasion, and check live stock before you commit.",
};

const LIBRARY: Record<string, { plural: string; meta: string; intro: string }> = {
  "Louis Philippe": {
    plural: "formal shirts, trousers and blazers",
    meta: "Buy Louis Philippe India — premium formal wear with no-cost EMI, exchange and 1-year brand warranty.",
    intro:
      "Louis Philippe at Urban Vogue carries India warranty, GST invoice and size-exchange support. Trade in your old wardrobe at delivery for instant exchange credit, and split the cost across 3–12 month no-cost EMI plans.",
  },
  "Van Heusen": {
    plural: "corporate wear and blazers",
    meta: "Van Heusen India store — corporate shirts, trousers and blazers with best prices and EMI.",
    intro:
      "From corporate essentials to statement blazers, our Van Heusen shelf is stocked with current-season stock only, verified quality and manufacturer warranty registration help at delivery.",
  },
  "Allen Solly": {
    plural: "casual and smart-casual wear",
    meta: "Allen Solly India — casual shirts, tees and jackets with launch pricing and exchange bonus.",
    intro:
      "We list Allen Solly launch variants the day they go on sale in India, with season-ready units, 12-month warranty and exchange uplift on eligible items.",
  },
  "Raymond": {
    plural: "formal trousers, suits and overcoats",
    meta: "Raymond India — premium formal trousers, suits and overcoats with corporate-friendly pricing.",
    intro:
      "Raymond formal lines ship with premium fabric guarantees, and suit units are quality-tested before dispatch. Configure by fabric, fit and occasion using the filters on this page.",
  },
  "Levi's": {
    plural: "jeans and denim jackets",
    meta: "Levi's India — 511, 512 and 501 jeans with genuine warranty, best price and no-cost EMI.",
    intro:
      "All Levi's stock is India-retail (not imported grey units), meaning full manufacturer warranty and easy size exchange. Filter by fit, wash and stretch.",
  },
  "Zara": {
    plural: "trend-forward casual and formal wear",
    meta: "Zara India — trend-forward shirts, trousers and jackets with authentic warranty.",
    intro:
      "Zara collections are validated for quality at our fulfilment centre, so you receive pieces that match the listed fabric and fit.",
  },
};

export function brandPageCopy(brand: string) {
  return LIBRARY[brand] ?? GENERIC;
}