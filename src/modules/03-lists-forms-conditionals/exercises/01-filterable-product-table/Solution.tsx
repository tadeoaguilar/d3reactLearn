/**
 * Exercise 03.1: reference solution.
 */
import { useState } from "react";
import { products, type Product } from "../../../../shared/data";

type Category = Product["category"] | "All";
type SortKey = "name" | "category" | "price" | "stock";
type SortDir = "asc" | "desc";

const CATEGORIES: Category[] = ["All", "Fruit", "Vegetable", "Dairy", "Bakery"];
const MAX_STOCK = Math.max(...products.map((p) => p.stock));
const BAR_MAX = 80;

interface SearchBarProps {
  query: string;
  onQueryChange: (q: string) => void;
  inStockOnly: boolean;
  onInStockOnlyChange: (v: boolean) => void;
  category: Category;
  onCategoryChange: (c: Category) => void;
}

function SearchBar(props: SearchBarProps) {
  return (
    <div className="row">
      <input
        type="search"
        placeholder="Search…"
        value={props.query}
        onChange={(e) => props.onQueryChange(e.target.value)}
      />
      <select value={props.category} onChange={(e) => props.onCategoryChange(e.target.value as Category)}>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <label>
        <input
          type="checkbox"
          checked={props.inStockOnly}
          onChange={(e) => props.onInStockOnlyChange(e.target.checked)}
        />{" "}
        Only show products in stock
      </label>
    </div>
  );
}

interface ProductTableProps {
  rows: Product[];
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}

function ProductTable({ rows, sortKey, sortDir, onSort }: ProductTableProps) {
  const columns: { key: SortKey; label: string }[] = [
    { key: "name", label: "Name" },
    { key: "category", label: "Category" },
    { key: "price", label: "Price" },
    { key: "stock", label: "Stock" },
  ];
  return (
    <table style={{ borderCollapse: "collapse", minWidth: 480 }}>
      <thead>
        <tr>
          {columns.map((col) => (
            <th
              key={col.key}
              onClick={() => onSort(col.key)}
              style={{ cursor: "pointer", textAlign: "left", padding: "4px 12px 4px 0", userSelect: "none" }}
            >
              {col.label} {sortKey === col.key ? (sortDir === "asc" ? "▲" : "▼") : ""}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan={4} className="muted">
              No products match your filters
            </td>
          </tr>
        ) : (
          rows.map((p) => <ProductRow key={p.id} product={p} />)
        )}
      </tbody>
    </table>
  );
}

function ProductRow({ product: p }: { product: Product }) {
  const outOfStock = p.stock === 0;
  return (
    <tr style={{ color: outOfStock ? "var(--danger)" : undefined }}>
      <td style={{ padding: "3px 12px 3px 0" }}>{p.name}</td>
      <td>{p.category}</td>
      <td>${p.price.toFixed(2)}</td>
      <td>
        <svg width={BAR_MAX} height={10} style={{ marginRight: 6 }}>
          <rect width={BAR_MAX} height={10} fill="var(--surface-2)" rx={2} />
          <rect width={(p.stock / MAX_STOCK) * BAR_MAX} height={10} fill="#2f6fdf" rx={2} />
        </svg>
        {p.stock}
      </td>
    </tr>
  );
}

export default function FilterableProductTable() {
  const [query, setQuery] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [category, setCategory] = useState<Category>("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // Derived: filter, then sort
  const q = query.trim().toLowerCase();
  const visible = products
    .filter((p) => p.name.toLowerCase().includes(q))
    .filter((p) => !inStockOnly || p.stock > 0)
    .filter((p) => category === "All" || p.category === category)
    .toSorted((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });

  const totalValue = visible.reduce((sum, p) => sum + p.price * p.stock, 0);

  return (
    <div className="stack">
      <SearchBar
        query={query}
        onQueryChange={setQuery}
        inStockOnly={inStockOnly}
        onInStockOnlyChange={setInStockOnly}
        category={category}
        onCategoryChange={setCategory}
      />
      <ProductTable rows={visible} sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
      <p className="muted">
        Showing {visible.length} of {products.length} products · total value ${totalValue.toFixed(2)}
      </p>
    </div>
  );
}
