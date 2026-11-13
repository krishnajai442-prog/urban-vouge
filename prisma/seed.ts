import {
  CouponScope,
  CouponType,
  FeatureSection,
  GradientTheme,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PrismaClient,
  ReturnReason,
  ReturnStatus,
  Role,
  TicketStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/* ───────────────────────── helpers ───────────────────────── */

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function img(seed: string, _size = 900): string {
  return `/img/ph?text=${encodeURIComponent(seed.replace(/[-_]+/g, " ").slice(0, 60))}`;
}

function discount(mrp: number, sale: number): number {
  if (mrp <= 0 || sale >= mrp) return 0;
  return Math.round(((mrp - sale) / mrp) * 100);
}

function gstComponent(gross: number, rate = 18): number {
  return Math.round(gross - gross / (1 + rate / 100));
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * 86400000);
}

type SeedProduct = {
  slug: string;
  name: string;
  shortDescription: string;
  category: string;
  brand: string;
  mrp: number;
  salePrice: number;
  stock: number;
  lowStockAt?: number;
  ratingAvg?: number;
  ratingCount?: number;
  sold?: number;
  featured?: boolean;
  subtype?: string;
  ram?: string;
  storage?: string;
  screenSize?: string;
  processor?: string;
  color?: string;
  warrantyMonths?: number;
  returnableDays?: number;
  hsnCode?: string;
  tags?: string[];
  specs: [string, string, string][];
};

function makeDescription(name: string, shortDescription: string, returnableDays = 7) {
  return `${name} is listed at Urban Vogue with 100% genuine stock, GST invoice and brand warranty support. ${shortDescription} Shop with secure UPI/card payments, no-cost EMI options where eligible, exchange assistance and a ${returnableDays}-day replacement window for damaged or wrong deliveries.`;
}

async function getOrCreateOrder(orderNumber: string, factory: () => Promise<any>) {
  const existing = await prisma.order.findUnique({ where: { orderNumber } });
  if (existing) return existing;
  return factory();
}

/* ───────────────────────── catalog ───────────────────────── */

const categories = [
  {
    slug: "shirts",
    name: "Shirts & T-Shirts",
    description: "Formal shirts, casual shirts, t-shirts and polos from authorised brands.",
    icon: "Shirt",
    sortOrder: 1,
  },
  {
    slug: "trousers",
    name: "Pants & Trousers",
    description: "Formal trousers, jeans, chinos and joggers for every occasion.",
    icon: "Ruler",
    sortOrder: 2,
  },
  {
    slug: "jackets",
    name: "Jackets & Blazers",
    description: "Blazers, bomber jackets, denim jackets, sweaters and overcoats.",
    icon: "Jacket",
    sortOrder: 3,
  },
  {
    slug: "accessories",
    name: "Shoes & Accessories",
    description: "Shoes, watches, belts, wallets, sunglasses and style add-ons.",
    icon: "Watch",
    sortOrder: 4,
  },
];

const brands = [
  { slug: "louis-philippe", name: "Louis Philippe", countryCode: "IN" },
  { slug: "van-heusen", name: "Van Heusen", countryCode: "IN" },
  { slug: "allen-solly", name: "Allen Solly", countryCode: "IN" },
  { slug: "peter-england", name: "Peter England", countryCode: "IN" },
  { slug: "raymond", name: "Raymond", countryCode: "IN" },
  { slug: "levis", name: "Levi's", countryCode: "US" },
  { slug: "zara", name: "Zara", countryCode: "ES" },
  { slug: "hm", name: "H&M", countryCode: "SE" },
  { slug: "uniqlo", name: "Uniqlo", countryCode: "JP" },
  { slug: "adidas", name: "Adidas", countryCode: "DE" },
  { slug: "nike", name: "Nike", countryCode: "US" },
  { slug: "puma", name: "Puma", countryCode: "DE" },
  { slug: "clarks", name: "Clarks", countryCode: "GB" },
  { slug: "casio", name: "Casio", countryCode: "JP" },
  { slug: "fossil", name: "Fossil", countryCode: "US" },
  { slug: "tommy-hilfiger", name: "Tommy Hilfiger", countryCode: "US" },
  { slug: "ray-ban", name: "Ray-Ban", countryCode: "US" },
  { slug: "park-avenue", name: "Park Avenue", countryCode: "IN" },
  { slug: "mufti", name: "Mufti", countryCode: "IN" },
  { slug: "john-players", name: "John Players", countryCode: "IN" },
];

const products: SeedProduct[] = [
  {
    slug: "louis-philippe-oxford-formal-shirt-white-slim",
    name: "Louis Philippe Premium Oxford Formal Shirt (White, Slim Fit)",
    shortDescription: "100% Oxford cotton, button-down collar, full sleeve. Perfect for boardrooms.",
    category: "shirts",
    brand: "louis-philippe",
    mrp: 3499,
    salePrice: 2799,
    stock: 45,
    ratingAvg: 4.7,
    ratingCount: 214,
    sold: 132,
    featured: true,
    subtype: "Formal Shirt",
    ram: "Slim Fit",
    storage: "100% Cotton",
    screenSize: "Slim",
    processor: "Formal",
    color: "White",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62052000",
    tags: ["formal", "oxford", "cotton", "office", "shirt"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Oxford Cotton"],
      ["Fabric & Material", "Weight", "180 GSM"],
      ["Design Details", "Collar", "Button Down"],
      ["Design Details", "Sleeve", "Full Sleeve"],
      ["Care Instructions", "Wash", "Machine wash cold, tumble dry low"],
      ["Construction", "Stitching", "Single needle, 18 SPI"],
    ],
  },
  {
    slug: "van-heusen-stretch-formal-shirt-light-blue-regular",
    name: "Van Heusen Stretch Cotton Formal Shirt (Light Blue, Regular Fit)",
    shortDescription: "Cotton-stretch blend, wrinkle-resistant, ideal for long workdays.",
    category: "shirts",
    brand: "van-heusen",
    mrp: 2999,
    salePrice: 2399,
    stock: 38,
    ratingAvg: 4.6,
    ratingCount: 188,
    sold: 96,
    featured: true,
    subtype: "Formal Shirt",
    ram: "Regular Fit",
    storage: "Cotton Stretch",
    screenSize: "Regular",
    processor: "Formal",
    color: "Light Blue",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62052000",
    tags: ["formal", "stretch", "wrinkle-free", "office", "shirt"],
    specs: [
      ["Fabric & Material", "Fabric", "97% Cotton, 3% Elastane"],
      ["Fabric & Material", "Feature", "Wrinkle Resistant"],
      ["Design Details", "Collar", "Semi-Cutaway"],
      ["Design Details", "Sleeve", "Full Sleeve"],
      ["Care Instructions", "Wash", "Machine wash warm"],
    ],
  },
  {
    slug: "allen-solly-casual-linen-shirt-beige-relaxed",
    name: "Allen Solly Casual Linen Shirt (Beige, Relaxed Fit)",
    shortDescription: "Breathable linen, relaxed silhouette. Weekend-ready.",
    category: "shirts",
    brand: "allen-solly",
    mrp: 2499,
    salePrice: 1999,
    stock: 52,
    ratingAvg: 4.5,
    ratingCount: 142,
    sold: 118,
    subtype: "Casual Shirt",
    ram: "Relaxed Fit",
    storage: "100% Linen",
    screenSize: "Relaxed",
    processor: "Casual",
    color: "Beige",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62059000",
    tags: ["casual", "linen", "breathable", "weekend", "shirt"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Linen"],
      ["Design Details", "Collar", "Mandarin"],
      ["Design Details", "Sleeve", "Half Sleeve"],
      ["Care Instructions", "Wash", "Hand wash or gentle cycle"],
    ],
  },
  {
    slug: "peter-england-solid-crew-neck-tshirt-black",
    name: "Peter England Solid Crew Neck T-Shirt (Black)",
    shortDescription: "Everyday essential in combed cotton. Soft, durable, versatile.",
    category: "shirts",
    brand: "peter-england",
    mrp: 999,
    salePrice: 749,
    stock: 120,
    ratingAvg: 4.3,
    ratingCount: 304,
    sold: 267,
    subtype: "T-Shirt",
    ram: "Regular Fit",
    storage: "Combed Cotton",
    screenSize: "Regular",
    processor: "Casual",
    color: "Black",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "61091000",
    tags: ["tshirt", "cotton", "casual", "everyday", "basic"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Combed Cotton"],
      ["Fabric & Material", "Weight", "160 GSM"],
      ["Design Details", "Neck", "Crew Neck"],
      ["Design Details", "Sleeve", "Half Sleeve"],
    ],
  },
  {
    slug: "zara-textured-polo-tshirt-navy-slim",
    name: "Zara Textured Polo T-Shirt (Navy, Slim Fit)",
    shortDescription: "Textured knit polo with structured collar. Smart-casual essential.",
    category: "shirts",
    brand: "zara",
    mrp: 2299,
    salePrice: 1839,
    stock: 35,
    ratingAvg: 4.5,
    ratingCount: 176,
    sold: 154,
    subtype: "Polo T-Shirt",
    ram: "Slim Fit",
    storage: "Cotton Blend",
    screenSize: "Slim",
    processor: "Smart Casual",
    color: "Navy",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "61051000",
    tags: ["polo", "textured", "smart-casual", "navy"],
    specs: [
      ["Fabric & Material", "Fabric", "95% Cotton, 5% Elastane"],
      ["Design Details", "Collar", "Structured Polo Collar"],
      ["Design Details", "Placket", "2-Button"],
    ],
  },
  {
    slug: "uniqlo-supima-cotton-tshirt-white",
    name: "Uniqlo Supima Cotton Round Neck T-Shirt (White)",
    shortDescription: "Ultra-fine Supima cotton with a smooth finish. Premium basic.",
    category: "shirts",
    brand: "uniqlo",
    mrp: 1499,
    salePrice: 1199,
    stock: 80,
    ratingAvg: 4.7,
    ratingCount: 88,
    sold: 54,
    subtype: "T-Shirt",
    ram: "Regular Fit",
    storage: "Supima Cotton",
    screenSize: "Regular",
    processor: "Casual",
    color: "White",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "61091000",
    tags: ["tshirt", "supima", "premium", "basic", "white"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Supima Cotton"],
      ["Fabric & Material", "Weight", "170 GSM"],
      ["Design Details", "Neck", "Round Neck"],
    ],
  },
  {
    slug: "raymond-slim-fit-formal-trousers-charcoal",
    name: "Raymond Slim Fit Formal Trousers (Charcoal Grey)",
    shortDescription: "Premium wool-blend trousers with crease retention. Boardroom-ready.",
    category: "trousers",
    brand: "raymond",
    mrp: 3999,
    salePrice: 3199,
    stock: 30,
    ratingAvg: 4.6,
    ratingCount: 96,
    sold: 64,
    featured: true,
    subtype: "Formal Trousers",
    ram: "Slim Fit",
    storage: "Wool Blend",
    screenSize: "Slim",
    processor: "Formal",
    color: "Charcoal Grey",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62031100",
    tags: ["formal", "trousers", "wool", "office", "pants"],
    specs: [
      ["Fabric & Material", "Fabric", "55% Wool, 45% Polyester"],
      ["Fabric & Material", "Feature", "Crease Retention"],
      ["Design Details", "Closure", "Hook & Bar, Zip Fly"],
      ["Design Details", "Pockets", "2 Side, 2 Back"],
      ["Care Instructions", "Wash", "Dry clean only"],
    ],
  },
  {
    slug: "levis-511-slim-fit-jeans-dark-indigo",
    name: "Levi's 511 Slim Fit Jeans (Dark Indigo)",
    shortDescription: "The iconic 511 slim. Stretch denim, dark indigo wash.",
    category: "trousers",
    brand: "levis",
    mrp: 3499,
    salePrice: 2799,
    stock: 42,
    ratingAvg: 4.5,
    ratingCount: 221,
    sold: 198,
    subtype: "Jeans",
    ram: "Slim Fit",
    storage: "Stretch Denim",
    screenSize: "Slim",
    processor: "Casual",
    color: "Dark Indigo",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62034200",
    tags: ["jeans", "slim", "denim", "levis", "casual"],
    specs: [
      ["Fabric & Material", "Fabric", "99% Cotton, 1% Elastane"],
      ["Fabric & Material", "Weight", "12.5 oz"],
      ["Design Details", "Fit", "Slim through seat and thigh"],
      ["Design Details", "Rise", "Mid Rise"],
      ["Care Instructions", "Wash", "Machine wash cold, inside out"],
    ],
  },
  {
    slug: "mufti-stretch-chinos-khaki-slim",
    name: "Mufti Stretch Chinos (Khaki, Slim Fit)",
    shortDescription: "Versatile stretch chinos. From office to weekend seamlessly.",
    category: "trousers",
    brand: "mufti",
    mrp: 2299,
    salePrice: 1839,
    stock: 55,
    ratingAvg: 4.2,
    ratingCount: 304,
    sold: 267,
    subtype: "Chinos",
    ram: "Slim Fit",
    storage: "Cotton Stretch",
    screenSize: "Slim",
    processor: "Smart Casual",
    color: "Khaki",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62034200",
    tags: ["chinos", "stretch", "khaki", "smart-casual"],
    specs: [
      ["Fabric & Material", "Fabric", "98% Cotton, 2% Elastane"],
      ["Design Details", "Closure", "Button & Zip Fly"],
      ["Design Details", "Pockets", "2 Side, 2 Welt Back"],
    ],
  },
  {
    slug: "van-heusen-single-breasted-blazer-navy",
    name: "Van Heusen Single Breasted Blazer (Navy, Slim Fit)",
    shortDescription: "Tailored navy blazer with half lining. Sharp for any occasion.",
    category: "jackets",
    brand: "van-heusen",
    mrp: 7999,
    salePrice: 6399,
    stock: 15,
    ratingAvg: 4.8,
    ratingCount: 132,
    sold: 91,
    featured: true,
    subtype: "Blazer",
    ram: "Slim Fit",
    storage: "Poly-Viscose",
    screenSize: "Slim",
    processor: "Formal",
    color: "Navy",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62031100",
    tags: ["blazer", "formal", "navy", "tailored", "suit"],
    specs: [
      ["Fabric & Material", "Fabric", "65% Polyester, 35% Viscose"],
      ["Fabric & Material", "Lining", "Half Lined"],
      ["Design Details", "Buttons", "2-Button Front"],
      ["Design Details", "Pockets", "2 Flap, 1 Chest, 2 Interior"],
      ["Care Instructions", "Wash", "Dry clean only"],
    ],
  },
  {
    slug: "allen-solly-bomber-jacket-olive",
    name: "Allen Solly Bomber Jacket (Olive Green)",
    shortDescription: "Classic bomber silhouette with ribbed cuffs. Street-smart layering.",
    category: "jackets",
    brand: "allen-solly",
    mrp: 4499,
    salePrice: 3599,
    stock: 22,
    ratingAvg: 4.5,
    ratingCount: 74,
    sold: 42,
    subtype: "Bomber Jacket",
    ram: "Regular Fit",
    storage: "Polyester",
    screenSize: "Regular",
    processor: "Casual",
    color: "Olive Green",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62019300",
    tags: ["bomber", "jacket", "casual", "olive", "streetwear"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Polyester"],
      ["Design Details", "Closure", "Full Zip"],
      ["Design Details", "Cuffs", "Ribbed Knit"],
      ["Design Details", "Pockets", "2 Side Zip"],
    ],
  },
  {
    slug: "hm-oversized-denim-jacket-light-blue",
    name: "H&M Oversized Denim Jacket (Light Blue)",
    shortDescription: "Relaxed oversized denim jacket. Washed finish, timeless style.",
    category: "jackets",
    brand: "hm",
    mrp: 3999,
    salePrice: 3199,
    stock: 28,
    ratingAvg: 4.3,
    ratingCount: 156,
    sold: 128,
    subtype: "Denim Jacket",
    ram: "Oversized",
    storage: "Cotton Denim",
    screenSize: "Oversized",
    processor: "Casual",
    color: "Light Blue",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62014200",
    tags: ["denim", "jacket", "oversized", "casual", "wash"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Cotton Denim"],
      ["Design Details", "Closure", "Button Front"],
      ["Design Details", "Pockets", "2 Chest Flap, 2 Side"],
      ["Care Instructions", "Wash", "Machine wash cold"],
    ],
  },
  {
    slug: "clarks-leather-oxford-shoes-tan",
    name: "Clarks Leather Oxford Shoes (Tan Brown)",
    shortDescription: "Genuine leather Oxfords with cushioned insole. Timeless formal footwear.",
    category: "accessories",
    brand: "clarks",
    mrp: 5999,
    salePrice: 4799,
    stock: 25,
    ratingAvg: 4.4,
    ratingCount: 103,
    sold: 87,
    subtype: "Oxford Shoes",
    ram: "UK 6-11",
    storage: "Genuine Leather",
    screenSize: "Regular",
    processor: "Formal",
    color: "Tan Brown",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "64039900",
    tags: ["shoes", "oxford", "leather", "formal", "clarks"],
    specs: [
      ["Fabric & Material", "Upper", "Genuine Leather"],
      ["Fabric & Material", "Sole", "TPR (Thermo Plastic Rubber)"],
      ["Design Details", "Closure", "Lace-Up"],
      ["Design Details", "Toe", "Round Toe"],
      ["Care Instructions", "Care", "Wipe with dry cloth, use leather polish"],
    ],
  },
  {
    slug: "nike-air-force-1-sneakers-white",
    name: "Nike Air Force 1 Sneakers (White)",
    shortDescription: "The iconic Air Force 1. Air cushioning, premium leather upper.",
    category: "accessories",
    brand: "nike",
    mrp: 8195,
    salePrice: 7375,
    stock: 18,
    ratingAvg: 4.6,
    ratingCount: 61,
    sold: 33,
    featured: true,
    subtype: "Sneakers",
    ram: "UK 6-12",
    storage: "Leather Upper",
    screenSize: "Regular",
    processor: "Casual",
    color: "White",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "64039900",
    tags: ["sneakers", "nike", "air-force", "white", "casual"],
    specs: [
      ["Fabric & Material", "Upper", "Premium Leather"],
      ["Fabric & Material", "Sole", "Rubber with Air Unit"],
      ["Design Details", "Closure", "Lace-Up"],
      ["Design Details", "Cushioning", "Nike Air"],
    ],
  },
  {
    slug: "adidas-ultraboost-running-shoes-black",
    name: "Adidas Ultraboost Running Shoes (Black)",
    shortDescription: "BOOST midsole, Primeknit upper. Cloud-like running comfort.",
    category: "accessories",
    brand: "adidas",
    mrp: 11999,
    salePrice: 9599,
    stock: 12,
    ratingAvg: 4.7,
    ratingCount: 214,
    sold: 132,
    subtype: "Running Shoes",
    ram: "UK 6-12",
    storage: "Primeknit",
    screenSize: "Regular",
    processor: "Sports",
    color: "Black",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "64039900",
    tags: ["running", "adidas", "ultraboost", "sports", "shoes"],
    specs: [
      ["Fabric & Material", "Upper", "Primeknit"],
      ["Fabric & Material", "Midsole", "BOOST"],
      ["Design Details", "Closure", "Lace-Up"],
      ["Design Details", "Outsole", "Continental Rubber"],
    ],
  },
  {
    slug: "puma-suede-classic-sneakers-navy",
    name: "Puma Suede Classic Sneakers (Navy)",
    shortDescription: "The legendary Suede. Soft upper, timeless silhouette.",
    category: "accessories",
    brand: "puma",
    mrp: 3999,
    salePrice: 2799,
    stock: 40,
    ratingAvg: 4.2,
    ratingCount: 304,
    sold: 267,
    subtype: "Sneakers",
    ram: "UK 6-11",
    storage: "Suede Upper",
    screenSize: "Regular",
    processor: "Casual",
    color: "Navy",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "64039900",
    tags: ["sneakers", "puma", "suede", "casual", "classic"],
    specs: [
      ["Fabric & Material", "Upper", "Suede"],
      ["Fabric & Material", "Sole", "Rubber"],
      ["Design Details", "Closure", "Lace-Up"],
    ],
  },
  {
    slug: "casio-edifice-chronograph-watch-silver",
    name: "Casio Edifice Chronograph Watch (Silver)",
    shortDescription: "Stainless steel chronograph with 100m water resistance.",
    category: "accessories",
    brand: "casio",
    mrp: 8995,
    salePrice: 7196,
    stock: 20,
    ratingAvg: 4.5,
    ratingCount: 142,
    sold: 118,
    subtype: "Watch",
    ram: "One Size",
    storage: "Stainless Steel",
    screenSize: "Regular",
    processor: "Formal",
    color: "Silver",
    warrantyMonths: 24,
    returnableDays: 7,
    hsnCode: "91021100",
    tags: ["watch", "chronograph", "casio", "edifice", "silver"],
    specs: [
      ["Fabric & Material", "Case", "Stainless Steel"],
      ["Fabric & Material", "Strap", "Stainless Steel"],
      ["Design Details", "Display", "Analog Chronograph"],
      ["Design Details", "Water Resistance", "100m"],
      ["Design Details", "Movement", "Quartz"],
    ],
  },
  {
    slug: "tommy-hilfiger-leather-belt-brown",
    name: "Tommy Hilfiger Leather Belt (Brown)",
    shortDescription: "Genuine leather belt with branded buckle. Everyday essential.",
    category: "accessories",
    brand: "tommy-hilfiger",
    mrp: 2499,
    salePrice: 1999,
    stock: 60,
    ratingAvg: 4.3,
    ratingCount: 267,
    sold: 211,
    subtype: "Belt",
    ram: "32-42",
    storage: "Genuine Leather",
    screenSize: "Regular",
    processor: "Casual",
    color: "Brown",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "42033000",
    tags: ["belt", "leather", "tommy-hilfiger", "brown", "accessory"],
    specs: [
      ["Fabric & Material", "Material", "Genuine Leather"],
      ["Design Details", "Buckle", "Brushed Metal, Branded"],
      ["Design Details", "Width", "35mm"],
    ],
  },
  {
    slug: "fossil-leather-bifold-wallet-dark-brown",
    name: "Fossil Leather Bifold Wallet (Dark Brown)",
    shortDescription: "Premium leather bifold with RFID protection. 8 card slots.",
    category: "accessories",
    brand: "fossil",
    mrp: 3495,
    salePrice: 2796,
    stock: 45,
    ratingAvg: 4.4,
    ratingCount: 188,
    sold: 112,
    subtype: "Wallet",
    ram: "One Size",
    storage: "Genuine Leather",
    screenSize: "Regular",
    processor: "Casual",
    color: "Dark Brown",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "42023100",
    tags: ["wallet", "leather", "fossil", "bifold", "rfid"],
    specs: [
      ["Fabric & Material", "Material", "Genuine Leather"],
      ["Design Details", "Card Slots", "8"],
      ["Design Details", "Feature", "RFID Protection"],
      ["Design Details", "Closure", "Bifold"],
    ],
  },
  {
    slug: "ray-ban-aviator-sunglasses-gold",
    name: "Ray-Ban Aviator Sunglasses (Gold/Green)",
    shortDescription: "The original aviator. Gold frame, G-15 green lenses.",
    category: "accessories",
    brand: "ray-ban",
    mrp: 6990,
    salePrice: 5592,
    stock: 15,
    ratingAvg: 4.6,
    ratingCount: 87,
    sold: 52,
    subtype: "Sunglasses",
    ram: "One Size",
    storage: "Metal Frame",
    screenSize: "Regular",
    processor: "Casual",
    color: "Gold",
    warrantyMonths: 24,
    returnableDays: 7,
    hsnCode: "90041000",
    tags: ["sunglasses", "aviator", "ray-ban", "gold", "classic"],
    specs: [
      ["Fabric & Material", "Frame", "Gold-tone Metal"],
      ["Fabric & Material", "Lens", "G-15 Green Glass"],
      ["Design Details", "UV Protection", "100% UV"],
      ["Design Details", "Lens Width", "58mm"],
    ],
  },
  {
    slug: "raymond-wool-blend-overcoat-camel",
    name: "Raymond Wool Blend Overcoat (Camel)",
    shortDescription: "Premium wool-blend overcoat. Structured shoulders, timeless camel.",
    category: "jackets",
    brand: "raymond",
    mrp: 12999,
    salePrice: 10399,
    stock: 8,
    lowStockAt: 5,
    ratingAvg: 4.8,
    ratingCount: 132,
    sold: 91,
    featured: true,
    subtype: "Overcoat",
    ram: "Regular Fit",
    storage: "Wool Blend",
    screenSize: "Regular",
    processor: "Formal",
    color: "Camel",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62011100",
    tags: ["overcoat", "wool", "formal", "camel", "winter"],
    specs: [
      ["Fabric & Material", "Fabric", "70% Wool, 30% Polyester"],
      ["Fabric & Material", "Lining", "Full Lined"],
      ["Design Details", "Closure", "3-Button Front"],
      ["Design Details", "Pockets", "2 Flap, 1 Chest, 2 Interior"],
      ["Care Instructions", "Wash", "Dry clean only"],
    ],
  },
  {
    slug: "park-avenue-cashmere-sweater-maroon",
    name: "Park Avenue Premium Cashmere Sweater (Maroon)",
    shortDescription: "Ultra-soft cashmere blend crew neck. Luxurious warmth.",
    category: "jackets",
    brand: "park-avenue",
    mrp: 5999,
    salePrice: 4799,
    stock: 18,
    ratingAvg: 4.5,
    ratingCount: 119,
    sold: 76,
    subtype: "Sweater",
    ram: "Regular Fit",
    storage: "Cashmere Blend",
    screenSize: "Regular",
    processor: "Smart Casual",
    color: "Maroon",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "61102000",
    tags: ["sweater", "cashmere", "winter", "maroon", "premium"],
    specs: [
      ["Fabric & Material", "Fabric", "50% Cashmere, 50% Wool"],
      ["Design Details", "Neck", "Crew Neck"],
      ["Design Details", "Sleeve", "Full Sleeve"],
      ["Care Instructions", "Wash", "Hand wash cold, dry flat"],
    ],
  },
  {
    slug: "john-players-leather-jacket-black",
    name: "John Players Leather Jacket (Black)",
    shortDescription: "Genuine leather biker jacket. Quilted shoulders, matte finish.",
    category: "jackets",
    brand: "john-players",
    mrp: 8999,
    salePrice: 7199,
    stock: 10,
    ratingAvg: 4.6,
    ratingCount: 87,
    sold: 52,
    subtype: "Leather Jacket",
    ram: "Regular Fit",
    storage: "Genuine Leather",
    screenSize: "Regular",
    processor: "Casual",
    color: "Black",
    warrantyMonths: 12,
    returnableDays: 7,
    hsnCode: "42031000",
    tags: ["leather", "jacket", "biker", "black", "premium"],
    specs: [
      ["Fabric & Material", "Material", "Genuine Sheep Leather"],
      ["Fabric & Material", "Lining", "Polyester"],
      ["Design Details", "Closure", "Asymmetric Zip"],
      ["Design Details", "Pockets", "2 Zip Side, 1 Interior"],
      ["Care Instructions", "Care", "Wipe with damp cloth, leather conditioner"],
    ],
  },
  {
    slug: "louis-philippe-premium-silk-tie-burgundy",
    name: "Louis Philippe Premium Silk Tie (Burgundy)",
    shortDescription: "Hand-finished silk tie. Subtle sheen, classic burgundy.",
    category: "accessories",
    brand: "louis-philippe",
    mrp: 1999,
    salePrice: 1599,
    stock: 70,
    ratingAvg: 4.3,
    ratingCount: 143,
    sold: 98,
    subtype: "Tie",
    ram: "One Size",
    storage: "100% Silk",
    screenSize: "Regular",
    processor: "Formal",
    color: "Burgundy",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "62151000",
    tags: ["tie", "silk", "formal", "burgundy", "accessory"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Silk"],
      ["Design Details", "Pattern", "Solid with subtle sheen"],
      ["Design Details", "Width", "8cm at widest point"],
      ["Care Instructions", "Care", "Dry clean only"],
    ],
  },
  {
    slug: "peter-england-cotton-boxer-pack-navy",
    name: "Peter England Cotton Boxer Pack of 3 (Navy)",
    shortDescription: "Soft combed cotton boxers. Comfortable waistband, pack of 3.",
    category: "accessories",
    brand: "peter-england",
    mrp: 1499,
    salePrice: 1199,
    stock: 90,
    ratingAvg: 4.1,
    ratingCount: 512,
    sold: 429,
    subtype: "Innerwear",
    ram: "S / M / L / XL",
    storage: "Combed Cotton",
    screenSize: "Regular",
    processor: "Casual",
    color: "Navy",
    warrantyMonths: 7,
    returnableDays: 7,
    hsnCode: "61071100",
    tags: ["boxer", "cotton", "innerwear", "pack", "comfort"],
    specs: [
      ["Fabric & Material", "Fabric", "100% Combed Cotton"],
      ["Design Details", "Waistband", "Soft Elastic, Branded"],
      ["Design Details", "Pack", "3 pieces"],
      ["Care Instructions", "Wash", "Machine wash warm"],
    ],
  },
];

async function seedCatalog() {
  const categoryMap = new Map<string, string>();
  const brandMap = new Map<string, string>();
  const productMap = new Map<string, string>();

  for (const c of categories) {
    const row = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description, icon: c.icon, sortOrder: c.sortOrder, active: true },
      create: { slug: c.slug, name: c.name, description: c.description, icon: c.icon, sortOrder: c.sortOrder, active: true },
    });
    categoryMap.set(c.slug, row.id);
  }

  for (const b of brands) {
    const row = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, countryCode: b.countryCode, logoUrl: `/img/ph?text=${encodeURIComponent(b.name)}`, active: true },
      create: { slug: b.slug, name: b.name, countryCode: b.countryCode, logoUrl: `/img/ph?text=${encodeURIComponent(b.name)}`, active: true },
    });
    brandMap.set(b.slug, row.id);
  }

  for (const p of products) {
    const categoryId = categoryMap.get(p.category);
    const brandId = brandMap.get(p.brand);
    if (!categoryId || !brandId) throw new Error(`Missing category/brand for product ${p.slug}`);

    const returnableDays = p.returnableDays ?? 7;
    const warrantyMonths = p.warrantyMonths ?? 7;
    const lowStockAt = p.lowStockAt ?? 5;
    const ratingAvg = p.ratingAvg ?? 0;
    const ratingCount = p.ratingCount ?? 0;
    const sold = p.sold ?? 0;
    const views = Math.max(25, sold * 11 + ratingCount * 3);
    const description = makeDescription(p.name, p.shortDescription, returnableDays);

    const row = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name, shortDescription: p.shortDescription, categoryId, brandId,
        mrp: p.mrp, salePrice: p.salePrice, discountPercent: discount(p.mrp, p.salePrice),
        stock: p.stock, lowStockAt, ratingAvg, ratingCount, sold, views,
        featured: p.featured ?? false, active: true,
        subtype: p.subtype ?? null, ram: p.ram ?? null, storage: p.storage ?? null,
        screenSize: p.screenSize ?? null, processor: p.processor ?? null, color: p.color ?? null,
        warrantyMonths, returnableDays, codEligible: true, emiEligible: true,
        exchangeEligible: p.category !== "accessories", hsnCode: p.hsnCode ?? null, tags: p.tags ?? [],
      },
      create: {
        slug: p.slug, name: p.name, shortDescription: p.shortDescription, categoryId, brandId,
        mrp: p.mrp, salePrice: p.salePrice, discountPercent: discount(p.mrp, p.salePrice),
        stock: p.stock, lowStockAt, ratingAvg, ratingCount, sold, views,
        featured: p.featured ?? false, active: true,
        subtype: p.subtype ?? null, ram: p.ram ?? null, storage: p.storage ?? null,
        screenSize: p.screenSize ?? null, processor: p.processor ?? null, color: p.color ?? null,
        warrantyMonths, returnableDays, codEligible: true, emiEligible: true,
        exchangeEligible: p.category !== "accessories", hsnCode: p.hsnCode ?? null, tags: p.tags ?? [],
      },
    });
    productMap.set(p.slug, row.id);

    await prisma.productImage.deleteMany({ where: { productId: row.id } });
    await prisma.productImage.createMany({
      data: [
        { productId: row.id, url: img(`${p.slug}-hero`), alt: `${p.name} primary view`, position: 0, isPrimary: true },
        { productId: row.id, url: img(`${p.slug}-angle`), alt: `${p.name} alternate view`, position: 1, isPrimary: false },
        { productId: row.id, url: img(`${p.slug}-detail`), alt: `${p.name} detail view`, position: 2, isPrimary: false },
      ],
    });

    await prisma.productSpecification.deleteMany({ where: { productId: row.id } });
    await prisma.productSpecification.createMany({
      data: [
        { productId: row.id, group: "General", label: "Brand", value: brands.find((b) => b.slug === p.brand)?.name ?? p.brand },
        { productId: row.id, group: "General", label: "Category", value: categories.find((c) => c.slug === p.category)?.name ?? p.category },
        ...p.specs.map(([group, label, value]) => ({ productId: row.id, group, label, value })),
      ],
    });
  }

  return { categoryMap, brandMap, productMap };
}

/* ───────────────────────── marketing ───────────────────────── */

async function seedMarketing(
  categoryMap: Map<string, string>,
  brandMap: Map<string, string>,
  productMap: Map<string, string>,
) {
  const offers: Array<{
    code: string; type: string; title: string; description: string;
    bankName?: string; categorySlug?: string; brandSlug?: string; productSlug?: string; priority: number;
  }> = [
    { code: "BANK_ICICI_10", type: "BANK", title: "10% instant discount with ICICI Bank credit cards", description: "Maximum discount ₹1,500 per transaction. Applicable on prepaid orders only.", bankName: "ICICI Bank", priority: 100 },
    { code: "BANK_HDFC_5", type: "BANK", title: "5% cashback with HDFC Bank cards", description: "Cashback credited within 7 working days after delivery.", bankName: "HDFC Bank", priority: 90 },
    { code: "EXCHANGE_WARDROBE_2000", type: "EXCHANGE", title: "Up to ₹2,000 exchange bonus on wardrobe refresh", description: "Old clothing pickup at delivery. Final value depends on condition.", categorySlug: "shirts", priority: 80 },
    { code: "EMI_NO_COST_12M", type: "EMI", title: "No-cost EMI up to 12 months", description: "Available on select cards and products above ₹2,500.", priority: 70 },
    { code: "COMBO_STYLE", type: "COMBO", title: "Bundle accessories and save extra", description: "Add eligible belts, wallets or watches at checkout for combo pricing.", categorySlug: "accessories", priority: 60 },
    { code: "FESTIVAL_FASHION", type: "FESTIVAL", title: "Festival savings on premium wear", description: "Additional discounts on blazers, overcoats and suits during campaign windows.", categorySlug: "jackets", priority: 50 },
  ];

  for (const o of offers) {
    await prisma.offer.upsert({
      where: { code: o.code },
      update: { type: o.type, title: o.title, description: o.description, bankName: o.bankName ?? null, categoryId: o.categorySlug ? categoryMap.get(o.categorySlug) ?? null : null, brandId: o.brandSlug ? brandMap.get(o.brandSlug) ?? null : null, productId: o.productSlug ? productMap.get(o.productSlug) ?? null : null, active: true, priority: o.priority, startsAt: new Date(), endsAt: daysFromNow(45) },
      create: { code: o.code, type: o.type, title: o.title, description: o.description, bankName: o.bankName ?? null, categoryId: o.categorySlug ? categoryMap.get(o.categorySlug) ?? null : null, brandId: o.brandSlug ? brandMap.get(o.brandSlug) ?? null : null, productId: o.productSlug ? productMap.get(o.productSlug) ?? null : null, active: true, priority: o.priority, startsAt: new Date(), endsAt: daysFromNow(45) },
    });
  }

  const coupons = [
    { code: "VOGUE10", description: "10% off on your order, up to ₹1,500", type: CouponType.PERCENT, value: 10, scope: CouponScope.ALL, minOrderValue: 999, maxDiscount: 1500, usageLimit: 1000, perUserLimit: 1 },
    { code: "BLAZER5", description: "5% off on jackets & blazers, up to ₹2,000", type: CouponType.PERCENT, value: 5, scope: CouponScope.CATEGORY, categorySlug: "jackets", minOrderValue: 5000, maxDiscount: 2000, usageLimit: 300, perUserLimit: 1 },
    { code: "STYLE200", description: "Flat ₹200 off on accessories above ₹1,499", type: CouponType.FIXED, value: 200, scope: CouponScope.CATEGORY, categorySlug: "accessories", minOrderValue: 1499, usageLimit: 800, perUserLimit: 2 },
    { code: "LP10", description: "Extra 10% off on Louis Philippe", type: CouponType.PERCENT, value: 10, scope: CouponScope.BRAND, brandSlug: "louis-philippe", minOrderValue: 2000, maxDiscount: 1000, usageLimit: 500, perUserLimit: 1 },
    { code: "WELCOME250", description: "Flat ₹250 off for first-time Urban Vogue buyers", type: CouponType.FIXED, value: 250, scope: CouponScope.ALL, minOrderValue: 2999, usageLimit: 2000, perUserLimit: 1 },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: { description: c.description, type: c.type, value: c.value, scope: c.scope, categoryId: (c as any).categorySlug ? categoryMap.get((c as any).categorySlug) ?? null : null, brandId: (c as any).brandSlug ? brandMap.get((c as any).brandSlug) ?? null : null, minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount ?? null, usageLimit: c.usageLimit ?? null, perUserLimit: c.perUserLimit, active: true, startsAt: new Date(), endsAt: daysFromNow(60) },
      create: { code: c.code, description: c.description, type: c.type, value: c.value, scope: c.scope, categoryId: (c as any).categorySlug ? categoryMap.get((c as any).categorySlug) ?? null : null, brandId: (c as any).brandSlug ? brandMap.get((c as any).brandSlug) ?? null : null, minOrderValue: c.minOrderValue, maxDiscount: c.maxDiscount ?? null, usageLimit: c.usageLimit ?? null, perUserLimit: c.perUserLimit, active: true, startsAt: new Date(), endsAt: daysFromNow(60) },
    });
  }

  await prisma.banner.deleteMany({ where: { slot: { in: ["PROMO_STRIP", "SALE", "CATEGORY", "FOOTER"] } } });
  await prisma.banner.createMany({
    data: [
      { slot: "PROMO_STRIP", title: "Free delivery above ₹999", subtitle: "Standard shipping across serviceable PIN codes", ctaLabel: "Shop now", ctaHref: "/products/all", active: true, sortOrder: 1 },
      { slot: "PROMO_STRIP", title: "Express delivery in metros", subtitle: "24–48 hour delivery on eligible PIN codes", ctaLabel: "Check PIN code", ctaHref: "/track", active: true, sortOrder: 2 },
      { slot: "SALE", title: "Season-end fashion sale", subtitle: "Top discounts on shirts, trousers and accessories", ctaLabel: "View deals", ctaHref: "/products/all?sort=discount", active: true, sortOrder: 3 },
      { slot: "CATEGORY", title: "Upgrade your wardrobe", subtitle: "Exchange bonus available on select styles", ctaLabel: "Browse shirts", ctaHref: "/products/shirts", active: true, sortOrder: 4 },
      { slot: "CATEGORY", title: "Jackets for every season", subtitle: "No-cost EMI from 3 months", ctaLabel: "Browse jackets", ctaHref: "/products/jackets", active: true, sortOrder: 5 },
      { slot: "FOOTER", title: "Need style help?", subtitle: "Talk to a fashion specialist before you buy", ctaLabel: "Contact support", ctaHref: "/contact", active: true, sortOrder: 6 },
    ],
  });

  async function upsertSlide(id: string, data: { badge: string; headline: string; highlight?: string; description?: string; ctaLabel: string; ctaHref?: string; secondaryLabel?: string; secondaryHref?: string; gradient: GradientTheme; sortOrder: number }, productSlugs: string[]) {
    await prisma.heroSlide.upsert({
      where: { id },
      update: { kind: "CUSTOM", active: true, startsAt: new Date(), endsAt: daysFromNow(90), ...data },
      create: { id, kind: "CUSTOM", active: true, startsAt: new Date(), endsAt: daysFromNow(90), ...data },
    });
    await prisma.heroSlideProduct.deleteMany({ where: { slideId: id } });
    const rows = await prisma.product.findMany({ where: { slug: { in: productSlugs }, active: true }, select: { id: true, slug: true } });
    const order = new Map(productSlugs.map((s, i) => [s, i]));
    const sorted = rows.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
    if (sorted.length) {
      await prisma.heroSlideProduct.createMany({ data: sorted.map((p, position) => ({ slideId: id, productId: p.id, position })) });
    }
  }

  await upsertSlide("seed-slide-new-season", {
    badge: "NEW SEASON", headline: "India's freshest,", highlight: "style drops",
    description: "New season shirts, trousers and jackets are live with launch pricing and exchange support.",
    ctaLabel: "Shop new arrivals", ctaHref: "/products/all?sort=newest", secondaryLabel: "See offers", secondaryHref: "/offers",
    gradient: GradientTheme.EMERALD_TECH, sortOrder: 1,
  }, ["louis-philippe-oxford-formal-shirt-white-slim", "van-heusen-single-breasted-blazer-navy", "raymond-slim-fit-formal-trousers-charcoal"]);

  await upsertSlide("seed-slide-sale", {
    badge: "MEGA SALE", headline: "Big savings on,", highlight: "wardrobe essentials",
    description: "Shirts, trousers, jackets and accessories at festival-style prices.",
    ctaLabel: "Browse collection", ctaHref: "/products/shirts", secondaryLabel: "Coupons", secondaryHref: "/offers",
    gradient: GradientTheme.SUNSET_DEAL, sortOrder: 2,
  }, ["levis-511-slim-fit-jeans-dark-indigo", "allen-solly-bomber-jacket-olive", "peter-england-solid-crew-neck-tshirt-black"]);

  await upsertSlide("seed-slide-premium", {
    badge: "PREMIUM EDIT", headline: "Own the look,", highlight: "pay in EMIs",
    description: "Selected blazers, overcoats and premium shoes available on 3, 6, 9 and 12-month no-cost EMI plans.",
    ctaLabel: "Explore jackets", ctaHref: "/products/jackets", secondaryLabel: "EMI offers", secondaryHref: "/offers",
    gradient: GradientTheme.STEEL_GRAPHITE, sortOrder: 3,
  }, ["raymond-wool-blend-overcoat-camel", "van-heusen-single-breasted-blazer-navy", "clarks-leather-oxford-shoes-tan"]);

  async function setFeature(section: FeatureSection, slugs: string[]) {
    await prisma.productFeature.deleteMany({ where: { section } });
    const unique = Array.from(new Set(slugs));
    const rows = await prisma.product.findMany({ where: { slug: { in: unique }, active: true }, select: { id: true, slug: true } });
    const order = new Map(unique.map((s, i) => [s, i]));
    const sorted = rows.sort((a, b) => (order.get(a.slug) ?? 99) - (order.get(b.slug) ?? 99));
    if (sorted.length) {
      await prisma.productFeature.createMany({ data: sorted.map((p, position) => ({ section, productId: p.id, position })) });
    }
  }

  await setFeature(FeatureSection.NEW_ARRIVALS, ["louis-philippe-oxford-formal-shirt-white-slim", "van-heusen-single-breasted-blazer-navy", "raymond-slim-fit-formal-trousers-charcoal", "zara-textured-polo-tshirt-navy-slim", "uniqlo-supima-cotton-tshirt-white", "raymond-wool-blend-overcoat-camel", "casio-edifice-chronograph-watch-silver", "tommy-hilfiger-leather-belt-brown"]);
  await setFeature(FeatureSection.HOT_DEALS, ["peter-england-solid-crew-neck-tshirt-black", "allen-solly-casual-linen-shirt-beige-relaxed", "levis-511-slim-fit-jeans-dark-indigo", "puma-suede-classic-sneakers-navy", "mufti-stretch-chinos-khaki-slim", "peter-england-cotton-boxer-pack-navy", "hm-oversized-denim-jacket-light-blue", "fossil-leather-bifold-wallet-dark-brown"]);
  await setFeature(FeatureSection.TRENDING, ["allen-solly-bomber-jacket-olive", "nike-air-force-1-sneakers-white", "van-heusen-stretch-formal-shirt-light-blue-regular", "park-avenue-cashmere-sweater-maroon", "ray-ban-aviator-sunglasses-gold", "john-players-leather-jacket-black"]);
  await setFeature(FeatureSection.BEST_SELLERS, ["peter-england-solid-crew-neck-tshirt-black", "louis-philippe-premium-silk-tie-burgundy", "levis-511-slim-fit-jeans-dark-indigo", "mufti-stretch-chinos-khaki-slim", "allen-solly-casual-linen-shirt-beige-relaxed", "adidas-ultraboost-running-shoes-black"]);

  await prisma.frequentlyBoughtPair.deleteMany({});
  const fbpPairs = [
    ["louis-philippe-oxford-formal-shirt-white-slim", ["louis-philippe-premium-silk-tie-burgundy", "raymond-slim-fit-formal-trousers-charcoal"]],
    ["van-heusen-single-breasted-blazer-navy", ["louis-philippe-oxford-formal-shirt-white-slim", "clarks-leather-oxford-shoes-tan"]],
    ["levis-511-slim-fit-jeans-dark-indigo", ["peter-england-solid-crew-neck-tshirt-black", "puma-suede-classic-sneakers-navy"]],
  ] as const;

  const fbpData: { primaryId: string; addOnId: string }[] = [];
  for (const [primarySlug, addOnSlugs] of fbpPairs) {
    const primaryId = productMap.get(primarySlug);
    if (!primaryId) continue;
    for (const addOnSlug of addOnSlugs) {
      const addOnId = productMap.get(addOnSlug);
      if (addOnId && addOnId !== primaryId) fbpData.push({ primaryId, addOnId });
    }
  }
  if (fbpData.length) await prisma.frequentlyBoughtPair.createMany({ data: fbpData, skipDuplicates: true });
}

/* ───────────────────────── users + orders ───────────────────────── */

async function seedUsersAndOrders(productMap: Map<string, string>) {
  const customerPassword = await bcrypt.hash("", 12);

  async function ensureCustomer(input: { email: string; name: string; phone: string; whatsappOptIn: boolean }) {
    return prisma.user.upsert({
      where: { email: input.email },
      update: { name: input.name, phone: input.phone, whatsappOptIn: input.whatsappOptIn, role: Role.CUSTOMER, active: true },
      create: { email: input.email, name: input.name, phone: input.phone, passwordHash: customerPassword, role: Role.CUSTOMER, whatsappOptIn: input.whatsappOptIn, active: true },
    });
  }

  const priya = await ensureCustomer({ email: "priya@example.com", name: "Priya Verma", phone: "9876543210", whatsappOptIn: true });
  const rahul = await ensureCustomer({ email: "rahul@example.com", name: "Rahul Nair", phone: "9812345678", whatsappOptIn: false });

  await prisma.address.deleteMany({ where: { userId: { in: [priya.id, rahul.id] } } });
  const priyaAddress = await prisma.address.create({ data: { userId: priya.id, label: "Home", fullName: "Priya Verma", phone: "9876543210", pincode: "560103", line1: "Flat 402, Prestige Meridian", line2: "Outer Ring Road", city: "Bengaluru", state: "Karnataka", isDefault: true } });
  const rahulAddress = await prisma.address.create({ data: { userId: rahul.id, label: "Work", fullName: "Rahul Nair", phone: "9812345678", pincode: "400705", line1: "Unit 703, Kalpataru Square", line2: "Andheri East", city: "Mumbai", state: "Maharashtra", isDefault: true } });

  type BuildLine = { slug: string; quantity: number };
  async function buildLines(lines: BuildLine[]) {
    const out: { productId: string; name: string; slug: string; brand: string; image: string; unitMrp: number; unitPrice: number; quantity: number; lineTotal: number; warrantyMonths: number }[] = [];
    for (const line of lines) {
      const p = await prisma.product.findUniqueOrThrow({ where: { slug: line.slug }, include: { brand: { select: { name: true } }, images: { select: { url: true, isPrimary: true, position: true }, orderBy: { position: "asc" } } } });
      const image = p.images.find((i) => i.isPrimary)?.url ?? p.images[0]?.url ?? img(p.slug);
      out.push({ productId: p.id, name: p.name, slug: p.slug, brand: p.brand.name, image, unitMrp: p.mrp, unitPrice: p.salePrice, quantity: line.quantity, lineTotal: p.salePrice * line.quantity, warrantyMonths: p.warrantyMonths });
    }
    return out;
  }

  function totalsFromLines(lines: Awaited<ReturnType<typeof buildLines>>, opts: { deliveryFee: number; codFee: number; couponDiscount?: number }) {
    const subtotalMrp = lines.reduce((s, l) => s + l.unitMrp * l.quantity, 0);
    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const itemDiscount = subtotalMrp - subtotal;
    const payable = Math.max(0, subtotal - (opts.couponDiscount ?? 0));
    const total = payable + opts.deliveryFee + opts.codFee;
    const itemCount = lines.reduce((s, l) => s + l.quantity, 0);
    return { subtotalMrp, subtotal, itemDiscount, total, itemCount, gstComponent: gstComponent(total) };
  }

  const deliveredLines = await buildLines([{ slug: "peter-england-solid-crew-neck-tshirt-black", quantity: 1 }, { slug: "louis-philippe-premium-silk-tie-burgundy", quantity: 1 }]);
  const deliveredTotals = totalsFromLines(deliveredLines, { deliveryFee: 0, codFee: 0 });
  const deliveredOrder = await getOrCreateOrder("UVSEEDDELIVERED", () =>
    prisma.order.create({
      data: {
        orderNumber: "UVSEEDDELIVERED", userId: priya.id, status: OrderStatus.DELIVERED,
        paymentMethod: PaymentMethod.UPI, paymentStatus: PaymentStatus.PAID,
        subtotalMrp: deliveredTotals.subtotalMrp, subtotal: deliveredTotals.subtotal, itemDiscount: deliveredTotals.itemDiscount,
        couponDiscount: 0, deliveryFee: 0, codFee: 0, total: deliveredTotals.total,
        gstRate: 18, gstComponent: deliveredTotals.gstComponent, deliveryMode: "STANDARD",
        etaFrom: daysFromNow(-7), etaTo: daysFromNow(-5), deliveredAt: daysFromNow(-4),
        carrier: "Urban Vogue Partner Network", trackingNumber: "UVTRKSEED000001",
        addressSnapshot: { label: priyaAddress.label, fullName: priyaAddress.fullName, phone: priyaAddress.phone, pincode: priyaAddress.pincode, line1: priyaAddress.line1, line2: priyaAddress.line2, city: priyaAddress.city, state: priyaAddress.state },
        items: { create: deliveredLines.map((l) => ({ productId: l.productId, name: l.name, slug: l.slug, brand: l.brand, image: l.image, unitMrp: l.unitMrp, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal, warrantyMonths: l.warrantyMonths })) },
        payments: { create: { method: PaymentMethod.UPI, status: PaymentStatus.PAID, amountPaise: deliveredTotals.total * 100, razorpayOrderId: "order_seed_delivered", razorpayPaymentId: "pay_seed_delivered", razorpaySignature: "seed_signature", capturedAt: daysFromNow(-8) } },
        trackingEvents: { create: [
          { status: OrderStatus.PENDING, title: "Order placed", description: "Payment received. Your order is confirmed.", location: "Urban Vogue", createdAt: daysFromNow(-8) },
          { status: OrderStatus.CONFIRMED, title: "Order confirmed", description: "Moved to packing queue.", location: "Bengaluru Hub", createdAt: daysFromNow(-7) },
          { status: OrderStatus.PROCESSING, title: "Processing at fulfilment centre", description: "Quality checked and packed.", location: "Bengaluru Hub", createdAt: daysFromNow(-6) },
          { status: OrderStatus.SHIPPED, title: "Shipped", description: "Handed over to carrier.", location: "Bengaluru", createdAt: daysFromNow(-5) },
          { status: OrderStatus.OUT_FOR_DELIVERY, title: "Out for delivery", description: "Expected today.", location: "Bengaluru", createdAt: daysFromNow(-4) },
          { status: OrderStatus.DELIVERED, title: "Delivered", description: "Delivered to customer.", location: "Bengaluru", createdAt: daysFromNow(-4) },
        ]},
      },
    }),
  );

  const shippedLines = await buildLines([{ slug: "van-heusen-single-breasted-blazer-navy", quantity: 1 }]);
  const shippedTotals = totalsFromLines(shippedLines, { deliveryFee: 0, codFee: 0 });
  await getOrCreateOrder("UVSEEDSHIPPED", () =>
    prisma.order.create({
      data: {
        orderNumber: "UVSEEDSHIPPED", userId: rahul.id, status: OrderStatus.SHIPPED,
        paymentMethod: PaymentMethod.CARD, paymentStatus: PaymentStatus.PAID,
        subtotalMrp: shippedTotals.subtotalMrp, subtotal: shippedTotals.subtotal, itemDiscount: shippedTotals.itemDiscount,
        couponDiscount: 0, deliveryFee: 0, codFee: 0, total: shippedTotals.total,
        gstRate: 18, gstComponent: shippedTotals.gstComponent, deliveryMode: "EXPRESS",
        etaFrom: daysFromNow(1), etaTo: daysFromNow(2), carrier: "Blue Dart Express", trackingNumber: "UVTRKSEED000002",
        addressSnapshot: { label: rahulAddress.label, fullName: rahulAddress.fullName, phone: rahulAddress.phone, pincode: rahulAddress.pincode, line1: rahulAddress.line1, line2: rahulAddress.line2, city: rahulAddress.city, state: rahulAddress.state },
        items: { create: shippedLines.map((l) => ({ productId: l.productId, name: l.name, slug: l.slug, brand: l.brand, image: l.image, unitMrp: l.unitMrp, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal, warrantyMonths: l.warrantyMonths })) },
        payments: { create: { method: PaymentMethod.CARD, status: PaymentStatus.PAID, amountPaise: shippedTotals.total * 100, razorpayOrderId: "order_seed_shipped", razorpayPaymentId: "pay_seed_shipped", razorpaySignature: "seed_signature", capturedAt: daysFromNow(-2) } },
        trackingEvents: { create: [
          { status: OrderStatus.PENDING, title: "Order placed", description: "Payment received.", location: "Urban Vogue", createdAt: daysFromNow(-2) },
          { status: OrderStatus.CONFIRMED, title: "Order confirmed", description: "Ready for dispatch.", location: "Mumbai Hub", createdAt: daysFromNow(-1) },
          { status: OrderStatus.SHIPPED, title: "Shipped", description: "In transit to Mumbai.", location: "Mumbai", createdAt: daysFromNow(0) },
        ]},
      },
    }),
  );

  const pendingLines = await buildLines([{ slug: "raymond-wool-blend-overcoat-camel", quantity: 1 }]);
  const pendingTotals = totalsFromLines(pendingLines, { deliveryFee: 0, codFee: 49 });
  await getOrCreateOrder("UVSEEDPENDING", () =>
    prisma.order.create({
      data: {
        orderNumber: "UVSEEDPENDING", userId: null, guestEmail: "guest@example.com", guestPhone: "9898989898",
        status: OrderStatus.PENDING, paymentMethod: PaymentMethod.COD, paymentStatus: PaymentStatus.PENDING,
        subtotalMrp: pendingTotals.subtotalMrp, subtotal: pendingTotals.subtotal, itemDiscount: pendingTotals.itemDiscount,
        couponDiscount: 0, deliveryFee: 0, codFee: 49, total: pendingTotals.total,
        gstRate: 18, gstComponent: pendingTotals.gstComponent, deliveryMode: "STANDARD",
        etaFrom: daysFromNow(3), etaTo: daysFromNow(6),
        addressSnapshot: { label: "Home", fullName: "Guest Customer", phone: "9898989898", pincode: "110016", line1: "B-12, Second Floor", line2: "Greater Kailash I", city: "New Delhi", state: "Delhi" },
        items: { create: pendingLines.map((l) => ({ productId: l.productId, name: l.name, slug: l.slug, brand: l.brand, image: l.image, unitMrp: l.unitMrp, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal, warrantyMonths: l.warrantyMonths })) },
        trackingEvents: { create: [{ status: OrderStatus.PENDING, title: "Order placed", description: "Cash on delivery order awaiting confirmation call.", location: "Urban Vogue", createdAt: daysFromNow(0) }] },
      },
    }),
  );

  const firstDeliveredItem = await prisma.orderItem.findFirst({ where: { orderId: deliveredOrder.id }, orderBy: { id: "asc" } });
  if (firstDeliveredItem) {
    await prisma.returnRequest.upsert({
      where: { orderItemId: firstDeliveredItem.id },
      update: {},
      create: { orderItemId: firstDeliveredItem.id, orderId: deliveredOrder.id, userId: priya.id, reason: ReturnReason.DAMAGED, details: "Outer packaging was crushed and the tie had a visible pull.", status: ReturnStatus.REQUESTED, resolution: "REFUND" },
    });
  }

  const demoSubscriberEmail = "demo-subscriber@example.com";
  await prisma.subscriber.upsert({ where: { email: demoSubscriberEmail }, update: { active: true, whatsappOptIn: true }, create: { email: demoSubscriberEmail, phone: "9876543210", whatsappOptIn: true, source: "SEED", active: true } });

  const demoContactEmail = "demo-contact@example.com";
  const existingContact = await prisma.contactMessage.findFirst({ where: { email: demoContactEmail, topic: "SALES" } });
  if (!existingContact) {
    await prisma.contactMessage.create({ data: { name: "Demo Customer", email: demoContactEmail, phone: "9812345678", topic: "SALES", message: "Do you offer styling consultations for wedding wardrobes? What is the expected turnaround?" } });
  }

  const existingNotification = await prisma.notification.findFirst({ where: { userId: priya.id, title: "Return requested" } });
  if (!existingNotification) {
    await prisma.notification.create({ data: { userId: priya.id, audience: "USER", title: "Return requested", body: "Your return request for the Peter England T-Shirt is under review. We will update you shortly.", href: "/account/orders", channel: "IN_APP" } });
  }
}

async function seedCommunity(productMap: Map<string, string>) {
  const priya = await prisma.user.findUnique({ where: { email: "priya@example.com" } });
  const rahul = await prisma.user.findUnique({ where: { email: "rahul@example.com" } });
  const admin = await prisma.user.findFirst({ where: { role: Role.ADMIN } });

  const tshirtId = productMap.get("peter-england-solid-crew-neck-tshirt-black");
  const blazerId = productMap.get("van-heusen-single-breasted-blazer-navy");

  if (priya && tshirtId) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: tshirtId, userId: priya.id } },
      update: {},
      create: { productId: tshirtId, userId: priya.id, rating: 5, title: "Excellent quality cotton", body: "Arrived in two days, packaging was solid. The cotton feels premium and the fit is true to size. No complaints so far.", verified: true, helpfulCount: 4, published: true },
    });
    const reviewAggregate = await prisma.review.aggregate({ where: { productId: tshirtId, published: true }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: tshirtId }, data: { ratingAvg: reviewAggregate._avg.rating ?? 0, ratingCount: reviewAggregate._count } });
  }

  if (rahul && blazerId) {
    const existingQuestion = await prisma.question.findFirst({ where: { productId: blazerId, userId: rahul.id } });
    if (!existingQuestion) {
      const question = await prisma.question.create({ data: { productId: blazerId, userId: rahul.id, body: "Does this blazer come with a spare button?" } });
      if (admin) {
        await prisma.answer.create({ data: { questionId: question.id, userId: admin.id, body: "Yes. Each blazer comes with one spare button sewn inside the interior pocket.", isOfficial: true } });
        await prisma.question.update({ where: { id: question.id }, data: { answered: true } });
      }
    }
    const existingTicket = await prisma.supportTicket.findFirst({ where: { userId: rahul.id, subject: "Blazer sizing question" } });
    if (!existingTicket) {
      await prisma.supportTicket.create({ data: { reference: "UVSUP-SEED001", userId: rahul.id, email: rahul.email, subject: "Blazer sizing question", category: "PRODUCT", status: TicketStatus.OPEN, messages: { create: { userId: rahul.id, body: "I want to confirm the chest measurement for size 40 before placing the order." } } } });
    }
  }

  if (priya) {
    const existingFeedback = await prisma.feedback.findFirst({ where: { userId: priya.id } });
    if (!existingFeedback) {
      await prisma.feedback.create({ data: { userId: priya.id, name: priya.name, email: priya.email, productQuality: 5, delivery: 4, customerService: 5, packaging: 4, website: 5, overall: 5, comment: "Smooth checkout and clear order tracking. Wish there were more styling guides for formal wear." } });
    }
  }
}

async function main() {
  console.log("Seeding Urban Vogue database...");
  const { categoryMap, brandMap, productMap } = await seedCatalog();
  await seedMarketing(categoryMap, brandMap, productMap);
  await seedUsersAndOrders(productMap);
  await seedCommunity(productMap);
  console.log("Seed complete.");
  console.log("Demo customer password: Customer@12345");
  console.log("Run: npm run seed:admin");
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });