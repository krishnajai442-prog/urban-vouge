/**
 * FULL "MEN" MEGA-MENU TAXONOMY — mirrors the reference panel group-for-group and
 * item-for-item. Each entry becomes one rail tile (with image-or-icon) whose hover
 * dropdown lists `items`. `matcher` picks the tile's thumbnail from the live catalog
 * (first active product whose name/subtype matches); null => lucide icon fallback.
 * `href`s use the existing /products/all?q= search so an item shows results as soon
 * as the catalog stocks it. Reorder entries here to reorder the rail.
 */
export type MenNavItem = { label: string; href: string };
export type MenNavGroup = {
  slug: string;
  label: string;
  subtitle: string;
  icon: string;
  viewAll: string;
  matcher: string | null;
  items: MenNavItem[];
};

const q = (term: string) => `/products/all?q=${encodeURIComponent(term)}`;

export const MEN_GROUPS: MenNavGroup[] = [
  {
    slug: "footwear", label: "Footwear", subtitle: "Sports, Casual & Formal", icon: "footprints",
    viewAll: q("Shoes"), matcher: "shoe|sneaker|loafer|boot|sandal",
    items: [
      { label: "Sports Shoes", href: q("Running Shoes") },
      { label: "Casual Shoes", href: q("Sneaker") },
      { label: "Formal Shoes", href: q("Oxford") },
      { label: "Sandals & Floaters", href: q("Sandal") },
      { label: "Flip- Flops", href: q("Flip Flop") },
      { label: "Loafers", href: q("Loafer") },
      { label: "Boots", href: q("Boot") },
      { label: "Running Shoes", href: q("Running") },
      { label: "Sneakers", href: q("Sneaker") },
    ],
  },
  {
    slug: "grooming", label: "Men's Grooming", subtitle: "Deo, Perfume & More", icon: "spray",
    viewAll: q("Grooming"), matcher: "deodorant|perfume|beard|trimmer",
    items: [
      { label: "Deodorants", href: q("Deodorant") },
      { label: "Perfumes", href: q("Perfume") },
      { label: "Beard Care & Grooming", href: q("Beard") },
      { label: "Shaving & Aftershave", href: q("Shave") },
      { label: "Sexual Wellness", href: q("Wellness") },
    ],
  },
  {
    slug: "topwear", label: "Top wear", subtitle: "T-Shirts & Shirts", icon: "shirt",
    viewAll: q("Shirt"), matcher: "t-?shirt|polo|shirt",
    items: [
      { label: "T-Shirts", href: q("T-Shirt") },
      { label: "Formal Shirts", href: q("Formal Shirt") },
      { label: "Casual Shirts", href: q("Casual Shirt") },
    ],
  },
  {
    slug: "bottomwear", label: "Bottom wear", subtitle: "Jeans & Trousers", icon: "ruler",
    viewAll: q("Trouser"), matcher: "trouser|jean|chino|short|cargo",
    items: [
      { label: "Jeans", href: q("Jeans") },
      { label: "Casual Trousers", href: q("Casual Trouser") },
      { label: "Formal Trousers", href: q("Formal Trouser") },
      { label: "Track pants", href: q("Track") },
      { label: "Shorts", href: q("Short") },
      { label: "Cargos", href: q("Cargo") },
      { label: "Three Fourths", href: q("Three Fourth") },
    ],
  },
  {
    slug: "suits", label: "Suits, Blazers & Waistcoats", subtitle: "Formal suiting", icon: "briefcase",
    viewAll: q("Blazer"), matcher: "blazer|suit|waistcoat",
    items: [
      { label: "Blazers", href: q("Blazer") },
      { label: "Waistcoats", href: q("Waistcoat") },
      { label: "Two-Piece Suits", href: q("Suit") },
    ],
  },
  {
    slug: "ties-socks-caps", label: "Ties, Socks, Caps & More", subtitle: "Small essentials", icon: "hat",
    viewAll: q("Cap"), matcher: "tie|sock|cap",
    items: [
      { label: "Ties", href: q("Tie") },
      { label: "Socks", href: q("Socks") },
      { label: "Caps", href: q("Cap") },
      { label: "Pocket Squares", href: q("Pocket Square") },
    ],
  },
  {
    slug: "fabrics", label: "Fabrics", subtitle: "Unstitched material", icon: "layers",
    viewAll: q("Fabric"), matcher: "fabric",
    items: [
      { label: "Shirt Fabric", href: q("Shirt Fabric") },
      { label: "Suit Fabric", href: q("Suit Fabric") },
      { label: "Unstitched", href: q("Unstitched") },
    ],
  },
  {
    slug: "winter", label: "Winter Wear", subtitle: "Sweaters & Jackets", icon: "snowflake",
    viewAll: q("Jacket"), matcher: "jacket|sweater|hoodie|bomber|windcheater",
    items: [
      { label: "Sweatshirts", href: q("Sweatshirt") },
      { label: "Jackets", href: q("Jacket") },
      { label: "Sweater", href: q("Sweater") },
      { label: "Tracksuits", href: q("Tracksuit") },
    ],
  },
  {
    slug: "ethnic", label: "Ethnic wear", subtitle: "Kurta & Sets", icon: "sparkles",
    viewAll: q("Kurta"), matcher: "kurta|sherwani|ethnic",
    items: [
      { label: "Kurta", href: q("Kurta") },
      { label: "Ethnic Sets", href: q("Ethnic") },
      { label: "Sherwanis", href: q("Sherwani") },
      { label: "Ethnic Pyjama", href: q("Pyjama") },
      { label: "Dhoti", href: q("Dhoti") },
      { label: "Lungi", href: q("Lungi") },
    ],
  },
  {
    slug: "innerwear", label: "Innerwear & Loungewear", subtitle: "Briefs, Vests & More", icon: "layers",
    viewAll: q("Innerwear"), matcher: "brief|vest|boxer|thermal|lounge",
    items: [
      { label: "Briefs & Trunks", href: q("Brief") },
      { label: "Vests", href: q("Vest") },
      { label: "Boxers", href: q("Boxer") },
      { label: "Pyjamas and Lounge Pants", href: q("Lounge") },
      { label: "Thermals", href: q("Thermal") },
      { label: "Night Suits", href: q("Night") },
    ],
  },
  {
    slug: "raincoats", label: "Raincoats & Windcheaters", subtitle: "Weather proof", icon: "umbrella",
    viewAll: q("Raincoat"), matcher: "raincoat|windcheater",
    items: [
      { label: "Raincoats", href: q("Raincoat") },
      { label: "Windcheaters", href: q("Windcheater") },
    ],
  },
  {
    slug: "watches", label: "Watches", subtitle: "Fastrack, Casio & More", icon: "watch",
    viewAll: q("Watch"), matcher: "watch",
    items: [
      { label: "Fastrack", href: q("Fastrack") },
      { label: "Casio", href: q("Casio") },
      { label: "Titan", href: q("Titan") },
      { label: "Fossil", href: q("Fossil") },
      { label: "Sonata", href: q("Sonata") },
    ],
  },
  {
    slug: "accessories", label: "Accessories", subtitle: "Bags, Belts & Shades", icon: "gem",
    viewAll: q("Accessory"), matcher: "belt|wallet|sunglass|backpack|bag",
    items: [
      { label: "Backpacks", href: q("Backpack") },
      { label: "Wallets", href: q("Wallet") },
      { label: "Belts", href: q("Belt") },
      { label: "Sunglasses", href: q("Sunglass") },
      { label: "Luggage & Travel", href: q("Luggage") },
      { label: "Frames", href: q("Frame") },
      { label: "Jewellery", href: q("Jewellery") },
    ],
  },
  {
    slug: "sports", label: "Sports & Fitness Store", subtitle: "Gym & training", icon: "dumbbell",
    viewAll: q("Fitness"), matcher: "gym|fitness|yoga",
    items: [
      { label: "Gym Gloves", href: q("Gym Gloves") },
      { label: "Shakers", href: q("Shaker") },
      { label: "Resistance Bands", href: q("Resistance Band") },
      { label: "Yoga Mats", href: q("Yoga Mat") },
    ],
  },
  {
    slug: "smart-watches", label: "Smart Watches", subtitle: "Wearables", icon: "watch",
    viewAll: q("Smart Watch"), matcher: "smart watch",
    items: [
      { label: "boAt", href: q("boAt") },
      { label: "Noise", href: q("Noise") },
      { label: "Fire-Boltt", href: q("Fire-Boltt") },
    ],
  },
  {
    slug: "smart-bands", label: "Smart Bands", subtitle: "Activity trackers", icon: "smartphone",
    viewAll: q("Smart Band"), matcher: "smart band",
    items: [
      { label: "Fitness Bands", href: q("Fitness Band") },
      { label: "Activity Trackers", href: q("Activity Tracker") },
    ],
  },
  {
    slug: "personal-care", label: "Personal Care Appliances", subtitle: "Trimmers & Shavers", icon: "spray",
    viewAll: q("Trimmer"), matcher: "trimmer|shaver",
    items: [
      { label: "Trimmers", href: q("Trimmer") },
      { label: "Shavers", href: q("Shaver") },
      { label: "Grooming Kits", href: q("Grooming Kit") },
    ],
  },
  {
    slug: "featured", label: "Featured", subtitle: "Brand stores", icon: "star",
    viewAll: q("Nike"), matcher: null,
    items: [
      { label: "Watches Store", href: q("Watch") },
      { label: "Footwear Club", href: q("Shoe") },
      { label: "Bags & Wallet", href: q("Wallet") },
      { label: "T-Shirt Store", href: q("T-Shirt") },
      { label: "Adidas", href: q("Adidas") },
      { label: "Beardo", href: q("Beardo") },
      { label: "Reebok", href: q("Reebok") },
      { label: "Skechers", href: q("Skechers") },
      { label: "Nike", href: q("Nike") },
    ],
  },
];