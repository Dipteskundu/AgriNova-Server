/**
 * Farm input fixtures — `npm run seed:inputs`.
 *
 * These are what the public `/inputs` page lists, so they cover every entry
 * in `Product.category` and mix stock levels (including one deliberately
 * low-stock row and one delisted row) so the supplier's Inventory screen has
 * something to alert on.
 *
 * `name` is the natural key the seeder upserts on. `image` points at
 * `public/inputs/*.svg`, one per category, generated alongside the produce
 * illustrations in `public/produce/`.
 *
 * `supplier` is intentionally absent — it is resolved from
 * `supplier@demo.com` at seed time, because a hard-coded ObjectId would not
 * survive a `npm run seed`.
 */
const inputs = [
  {
    name: "Urea 50kg Bag",
    category: "fertilizer",
    description: "Granular urea, 46% nitrogen. The workhorse basal dose for paddy and maize.",
    price: 2750,
    unit: "bag",
    stock: 240,
    minimumOrderQuantity: 2,
    image: "/inputs/fertilizer.svg",
    isActive: true,
  },
  {
    name: "TSP 50kg Bag",
    category: "fertilizer",
    description: "Triple superphosphate, 46% P₂O₅. Applied at transplanting for root vigour.",
    price: 3100,
    unit: "bag",
    stock: 160,
    minimumOrderQuantity: 1,
    image: "/inputs/fertilizer.svg",
    isActive: true,
  },
  {
    name: "Magnesium Sulphate 5kg",
    category: "fertilizer",
    description: "Corrects interveinal chlorosis in vegetable and fruit crops.",
    price: 640,
    unit: "bag",
    stock: 75,
    minimumOrderQuantity: 1,
    image: "/inputs/fertilizer.svg",
    isActive: true,
  },
  {
    name: "BRRI dhan-28 Seed 20kg",
    category: "seeds",
    description: "Certified aman paddy seed, 105–110 days, drought tolerant.",
    price: 1850,
    unit: "bag",
    stock: 90,
    minimumOrderQuantity: 1,
    image: "/inputs/seeds.svg",
    isActive: true,
  },
  {
    name: "Hybrid Onion Seed 100g",
    category: "seeds",
    description: "Atlas hybrid onion seed, 100g sachet, ~8,000 plants.",
    price: 420,
    unit: "piece",
    stock: 320,
    minimumOrderQuantity: 1,
    image: "/inputs/seeds.svg",
    isActive: true,
  },
  {
    name: "Hybrid Tomato Seed 50g",
    category: "seeds",
    description: "Mintoo Super determinate tomato, disease resistant.",
    price: 380,
    unit: "piece",
    stock: 6,
    minimumOrderQuantity: 1,
    image: "/inputs/seeds.svg",
    isActive: true,
  },
  {
    name: "Neem Oil 1L",
    category: "pesticide",
    description: "Cold-pressed botanical pesticide. Effective against aphids and mites.",
    price: 480,
    unit: "liter",
    stock: 60,
    minimumOrderQuantity: 2,
    image: "/inputs/pesticide.svg",
    isActive: true,
  },
  {
    name: "Mancozeb 1kg",
    category: "pesticide",
    description: "Protectant fungicide, 80% WP. Blight and leaf-spot programmes.",
    price: 760,
    unit: "kg",
    stock: 45,
    minimumOrderQuantity: 1,
    image: "/inputs/pesticide.svg",
    isActive: true,
  },
  {
    name: "Pruning Shear",
    category: "tools",
    description: "Drop-forged bypass shear with sap groove. Suits up to 20mm green wood.",
    price: 1250,
    unit: "piece",
    stock: 34,
    minimumOrderQuantity: 1,
    image: "/inputs/tools.svg",
    isActive: true,
  },
  {
    name: "Knapsack Sprayer 16L",
    category: "equipment",
    description: "Pressure-indicator knapsack sprayer, 16L, brass nozzle set included.",
    price: 4600,
    unit: "piece",
    stock: 18,
    minimumOrderQuantity: 1,
    image: "/inputs/equipment.svg",
    isActive: true,
  },
  {
    name: "Drip Irrigation Kit 100m",
    category: "irrigation",
    description: "100m mainline with 20 emitters and filter — covers roughly 0.1 acre of vegetables.",
    price: 7900,
    unit: "set",
    stock: 12,
    minimumOrderQuantity: 1,
    image: "/inputs/irrigation.svg",
    isActive: true,
  },
  {
    name: "Vented Produce Crate",
    category: "packaging",
    description: "Stackable 25kg vented crate for tomato and onion handling.",
    price: 940,
    unit: "piece",
    stock: 210,
    minimumOrderQuantity: 5,
    image: "/inputs/packaging.svg",
    isActive: true,
  },
  {
    // Delisted on purpose: the supplier's inventory list should show it, the
    // public `/inputs` catalogue should not, and it must refuse to be ordered.
    name: "Atrazine 500g (Recalled)",
    category: "pesticide",
    description: "Withdrawn from sale pending a re-registration check.",
    price: 520,
    unit: "kg",
    stock: 0,
    minimumOrderQuantity: 1,
    image: "/inputs/pesticide.svg",
    isActive: false,
  },
];

module.exports = { inputs };
