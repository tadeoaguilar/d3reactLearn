/**
 * Sample datasets used across the modules.
 *
 * Randomness comes from a seeded generator (d3.randomLcg), so every reload
 * produces the same "random" data. That keeps screenshots, exercises and
 * solutions consistent.
 */
import * as d3 from "d3";

const seeded = (seed: number) => d3.randomLcg(seed);

// ---------------------------------------------------------------------------
// Simple categorical data
// ---------------------------------------------------------------------------

export interface CategoryValue {
  label: string;
  value: number;
}

export const fruitSales: CategoryValue[] = [
  { label: "Apples", value: 120 },
  { label: "Bananas", value: 95 },
  { label: "Cherries", value: 42 },
  { label: "Dates", value: 18 },
  { label: "Elderberries", value: 7 },
  { label: "Figs", value: 33 },
  { label: "Grapes", value: 76 },
];

export interface MonthlyRecord {
  month: string; // "Jan"
  date: Date;
  revenue: number;
  expenses: number;
  profit: number;
}

export const monthlyFinance: MonthlyRecord[] = (() => {
  const rnd = seeded(7);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return months.map((month, i) => {
    const revenue = Math.round(40_000 + i * 2_500 + rnd() * 12_000);
    const expenses = Math.round(30_000 + i * 1_200 + rnd() * 9_000);
    return { month, date: new Date(2025, i, 1), revenue, expenses, profit: revenue - expenses };
  });
})();

// ---------------------------------------------------------------------------
// Time series
// ---------------------------------------------------------------------------

export interface TimePoint {
  date: Date;
  value: number;
}

/** A random walk: each value is the previous one plus some noise. */
export function randomWalk(count: number, seed = 1, start = 100, startDate = new Date(2025, 0, 1)): TimePoint[] {
  const rnd = seeded(seed);
  const points: TimePoint[] = [];
  let value = start;
  for (let i = 0; i < count; i++) {
    value = Math.max(1, value + (rnd() - 0.48) * 6);
    points.push({ date: d3.timeDay.offset(startDate, i), value: +value.toFixed(2) });
  }
  return points;
}

export interface Series {
  name: string;
  values: TimePoint[];
}

export const stockSeries: Series[] = [
  { name: "ACME", values: randomWalk(180, 11, 120) },
  { name: "GLOBEX", values: randomWalk(180, 23, 90) },
  { name: "INITECH", values: randomWalk(180, 42, 60) },
];

/** Wide format rows, useful for d3.stack(): one row per date, one column per key. */
export interface EnergyRow {
  date: Date;
  solar: number;
  wind: number;
  hydro: number;
  gas: number;
}

export const energyMix: EnergyRow[] = (() => {
  const rnd = seeded(99);
  return d3.range(24).map((i) => {
    const date = new Date(2024, i, 1);
    const season = Math.sin((i / 12) * Math.PI * 2);
    return {
      date,
      solar: Math.round(20 + i * 1.5 + season * 10 + rnd() * 5),
      wind: Math.round(30 + rnd() * 15 - season * 5),
      hydro: Math.round(25 + season * 4 + rnd() * 4),
      gas: Math.round(60 - i * 1.2 + rnd() * 8),
    };
  });
})();

// ---------------------------------------------------------------------------
// Scatter / multivariate
// ---------------------------------------------------------------------------

export type Species = "Adelie" | "Chinstrap" | "Gentoo";

export interface Penguin {
  id: number;
  species: Species;
  billLength: number; // mm
  billDepth: number; // mm
  flipperLength: number; // mm
  bodyMass: number; // g
}

/** Synthetic data shaped like the classic Palmer Penguins dataset. */
export const penguins: Penguin[] = (() => {
  const normal = (seed: number) => d3.randomNormal.source(seeded(seed));
  const specs: Record<Species, [number, number, number, number]> = {
    Adelie: [38.8, 18.3, 190, 3700],
    Chinstrap: [48.8, 18.4, 196, 3730],
    Gentoo: [47.5, 15.0, 217, 5080],
  };
  const out: Penguin[] = [];
  let id = 0;
  (Object.keys(specs) as Species[]).forEach((species, s) => {
    const [bl, bd, fl, bm] = specs[species];
    const n = normal(100 + s);
    for (let i = 0; i < 60; i++) {
      out.push({
        id: id++,
        species,
        billLength: +n(bl, 2.8)().toFixed(1),
        billDepth: +n(bd, 1.1)().toFixed(1),
        flipperLength: Math.round(n(fl, 6.5)()),
        bodyMass: Math.round(n(bm, 420)()),
      });
    }
  });
  return out;
})();

/** Many random points, used to show why <canvas> beats SVG for big data. */
export function manyPoints(count: number, seed = 5): { x: number; y: number; group: number }[] {
  const rnd = seeded(seed);
  const n = d3.randomNormal.source(rnd);
  const centers = [
    [30, 40],
    [70, 65],
    [50, 20],
    [20, 80],
  ];
  return d3.range(count).map((i) => {
    const group = i % centers.length;
    const [cx, cy] = centers[group];
    return { x: n(cx, 9)(), y: n(cy, 9)(), group };
  });
}

// ---------------------------------------------------------------------------
// Hierarchies
// ---------------------------------------------------------------------------

export interface TreeNode {
  name: string;
  value?: number;
  children?: TreeNode[];
}

/** A pretend project folder. Leaf values are file sizes in KB. */
export const fileTree: TreeNode = {
  name: "project",
  children: [
    {
      name: "src",
      children: [
        {
          name: "components",
          children: [
            { name: "Button.tsx", value: 4 },
            { name: "Chart.tsx", value: 18 },
            { name: "Modal.tsx", value: 9 },
            { name: "Table.tsx", value: 14 },
          ],
        },
        {
          name: "hooks",
          children: [
            { name: "useFetch.ts", value: 3 },
            { name: "useResize.ts", value: 2 },
            { name: "useTheme.ts", value: 2 },
          ],
        },
        { name: "App.tsx", value: 6 },
        { name: "main.tsx", value: 1 },
      ],
    },
    {
      name: "public",
      children: [
        { name: "logo.svg", value: 12 },
        { name: "hero.png", value: 180 },
        { name: "data.json", value: 64 },
      ],
    },
    {
      name: "docs",
      children: [
        { name: "README.md", value: 8 },
        { name: "CHANGELOG.md", value: 22 },
        {
          name: "guides",
          children: [
            { name: "setup.md", value: 5 },
            { name: "deploy.md", value: 7 },
          ],
        },
      ],
    },
    { name: "package.json", value: 2 },
  ],
};

// ---------------------------------------------------------------------------
// Networks
// ---------------------------------------------------------------------------

export interface GraphNode {
  id: string;
  group: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

/** A small social network: 4 friend groups plus a few bridges between them. */
export const socialGraph: { nodes: GraphNode[]; links: GraphLink[] } = (() => {
  const rnd = seeded(2024);
  const names = [
    "Ana", "Ben", "Cai", "Dev", "Eli", "Fay", "Gus", "Hana", "Ivo", "Jin",
    "Kai", "Lea", "Max", "Noa", "Oli", "Pia", "Quin", "Rui", "Sol", "Tia",
    "Uma", "Vik", "Wes", "Xia",
  ];
  const nodes = names.map((id, i) => ({ id, group: i % 4 }));
  const links: GraphLink[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const same = nodes[i].group === nodes[j].group;
      if (rnd() < (same ? 0.45 : 0.03)) {
        links.push({ source: nodes[i].id, target: nodes[j].id, weight: 1 + Math.floor(rnd() * 4) });
      }
    }
  }
  return { nodes, links };
})();

// ---------------------------------------------------------------------------
// Tabular data for React list / table exercises
// ---------------------------------------------------------------------------

export interface Product {
  id: number;
  name: string;
  category: "Fruit" | "Vegetable" | "Dairy" | "Bakery";
  price: number;
  stock: number;
}

export const products: Product[] = [
  { id: 1, name: "Apple", category: "Fruit", price: 0.5, stock: 120 },
  { id: 2, name: "Banana", category: "Fruit", price: 0.25, stock: 0 },
  { id: 3, name: "Carrot", category: "Vegetable", price: 0.3, stock: 80 },
  { id: 4, name: "Cheddar", category: "Dairy", price: 4.5, stock: 12 },
  { id: 5, name: "Croissant", category: "Bakery", price: 2.1, stock: 30 },
  { id: 6, name: "Milk", category: "Dairy", price: 1.2, stock: 45 },
  { id: 7, name: "Potato", category: "Vegetable", price: 0.2, stock: 200 },
  { id: 8, name: "Sourdough", category: "Bakery", price: 5.0, stock: 0 },
  { id: 9, name: "Spinach", category: "Vegetable", price: 1.8, stock: 25 },
  { id: 10, name: "Strawberry", category: "Fruit", price: 3.5, stock: 60 },
  { id: 11, name: "Yogurt", category: "Dairy", price: 0.9, stock: 70 },
  { id: 12, name: "Bagel", category: "Bakery", price: 1.1, stock: 18 },
];
