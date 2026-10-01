# Exercise 02.2: Shopping cart

Practice **immutable array updates**. The starter renders a product list and an empty cart.

## Requirements

1. **Add to cart**: clicking "Add" on a product adds it with `qty: 1`. If it's already in the cart, **increase its `qty`** instead of adding a duplicate row.
2. **Change quantity**: − / + buttons on each cart row. Going below 1 **removes** the row.
3. **Remove**: a ✕ button removes the row.
4. **Clear cart** button.
5. **Derived values** (not state): item count (sum of qty), subtotal, and a 10% discount when the subtotal is over $20.
6. Disable "Add" for products with `stock === 0`, and don't allow a cart qty above the product's stock.

## Rules

- Never call `push`, `splice`, or assign to `cart[i]`. Use `map`, `filter` and spread instead.
- Store only `{ productId, qty }` in the cart, not a copy of the whole product. Look the product up when rendering. (This is called **normalized** state. It prevents stale copies.)

## Done when

- [ ] Adding the same product twice gives one row with qty 2
- [ ] Qty can't exceed stock; − at qty 1 removes the item
- [ ] The discount appears and disappears as the subtotal crosses $20
