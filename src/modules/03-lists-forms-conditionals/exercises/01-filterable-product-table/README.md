# Exercise 03.1: Filterable product table

A classic React exercise with a data-viz twist. Build a searchable, sortable product table with a tiny inline bar for each row.

## Component tree

```
FilterableProductTable        ← owns ALL the state
├── SearchBar                 ← query, inStockOnly, category (value + onChange props)
└── ProductTable              ← receives the already-filtered rows + sort props
    └── ProductRow × n
```

## Requirements

1. **SearchBar**
   - text input: filter by name (case-insensitive)
   - checkbox: "Only show products in stock"
   - select: category (`All`, `Fruit`, `Vegetable`, `Dairy`, `Bakery`)
2. **ProductTable**
   - columns: Name, Category, Price, Stock
   - clicking a column header sorts by that column; clicking it again reverses the direction. Show ▲/▼ on the active header.
   - out-of-stock rows appear with red text
   - if nothing matches, show a single row "No products match your filters"
3. **Inline stock bar**: in the Stock column, draw an SVG `<rect>` whose width is proportional to `stock / maxStock` (max 80px), next to the number.
4. **Summary line** under the table: "Showing 5 of 12 products · total value $123.45". Total value is the sum of `price × stock` for the visible rows.

## Rules

- State lives in `FilterableProductTable` only. The children receive values and callbacks.
- Filtered and sorted rows are computed during render, not stored.
- Use `product.id` as the key.

## Done when

- [ ] All three filters combine correctly
- [ ] Sorting works on every column in both directions
- [ ] The empty state and summary line are correct
