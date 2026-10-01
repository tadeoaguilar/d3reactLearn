/**
 * Exercise 03.1: Filterable product table. See README.md.
 */
import { useState } from "react";
import { products, type Product } from "../../../../shared/data";

type Category = Product["category"] | "All";
type SortKey = "name" | "category" | "price" | "stock";

// TODO 1: SearchBar component. Define its props interface first.
function SearchBar() {
  return <div className="todo-hint">SearchBar goes here</div>;
}

// TODO 2: ProductTable component (with sortable headers and an empty state)
function ProductTable({ rows }: { rows: Product[] }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}>
            <td>{p.name}</td>
            <td>{p.category}</td>
            <td>${p.price.toFixed(2)}</td>
            {/* TODO 3: inline SVG stock bar */}
            <td>{p.stock}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function FilterableProductTable() {
  // TODO: state for query, inStockOnly, category, sortKey, sortDir

  // TODO: derive the visible rows (filter, then sort)
  const visible = products;

  return (
    <div className="stack">
      <SearchBar />
      <ProductTable rows={visible} />
      {/* TODO 4: summary line */}
    </div>
  );
}
