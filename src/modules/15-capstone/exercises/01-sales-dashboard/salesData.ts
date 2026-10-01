/**
 * Capstone dataset: one year of synthetic e-commerce orders.
 * Seeded, so it's identical on every load.
 */
import * as d3 from "d3";

export const REGIONS = ["North", "South", "East", "West"] as const;
export const CATEGORIES = ["Electronics", "Home", "Clothing", "Sports", "Books"] as const;
export type Region = (typeof REGIONS)[number];
export type Category = (typeof CATEGORIES)[number];

export interface Order {
  id: number;
  date: Date;
  region: Region;
  category: Category;
  product: string;
  quantity: number;
  revenue: number; // USD
}

const PRODUCTS: Record<Category, string[]> = {
  Electronics: ["Headphones", "Keyboard", "Monitor", "Webcam", "Charger"],
  Home: ["Lamp", "Kettle", "Blender", "Rug", "Vase"],
  Clothing: ["Jacket", "Sneakers", "T-Shirt", "Jeans", "Scarf"],
  Sports: ["Yoga Mat", "Dumbbells", "Bike Helmet", "Tent", "Water Bottle"],
  Books: ["Cookbook", "Novel", "Atlas", "Comic", "Biography"],
};

const PRICE: Record<Category, [number, number]> = {
  Electronics: [30, 400],
  Home: [15, 150],
  Clothing: [10, 120],
  Sports: [8, 250],
  Books: [8, 45],
};

export const orders: Order[] = (() => {
  const rnd = d3.randomLcg(2025);
  const start = new Date(2025, 0, 1);
  const out: Order[] = [];
  let id = 0;
  for (let day = 0; day < 365; day++) {
    const date = d3.timeDay.offset(start, day);
    const weekday = date.getDay();
    // Seasonality: a holiday peak in Nov/Dec, a summer bump for Sports, busier weekends
    const month = date.getMonth();
    const base = 18 + (month >= 10 ? 14 : 0) + (weekday === 0 || weekday === 6 ? 6 : 0);
    const n = Math.round(base + rnd() * 10);
    for (let i = 0; i < n; i++) {
      let category = CATEGORIES[Math.floor(rnd() * CATEGORIES.length)];
      if (month >= 5 && month <= 7 && rnd() < 0.2) category = "Sports";
      const region = REGIONS[Math.floor(Math.pow(rnd(), 1.3) * REGIONS.length)];
      const product = PRODUCTS[category][Math.floor(rnd() * 5)];
      const [lo, hi] = PRICE[category];
      const quantity = 1 + Math.floor(Math.pow(rnd(), 3) * 4);
      const revenue = +(quantity * (lo + rnd() * (hi - lo))).toFixed(2);
      out.push({ id: id++, date, region, category, product, quantity, revenue });
    }
  }
  return out;
})();
