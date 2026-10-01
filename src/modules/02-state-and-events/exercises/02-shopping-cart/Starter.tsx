/**
 * Exercise 02.2: Shopping cart. See README.md.
 */
import { useState } from "react";
import { products } from "../../../../shared/data";

interface CartLine {
  productId: number;
  qty: number;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function ShoppingCart() {
  const [cart, setCart] = useState<CartLine[]>([]);

  // TODO 1: add to cart (or increase qty if already there)
  function addToCart(productId: number) {}

  // TODO 2: change qty by +1 / -1; remove when it drops below 1; respect stock
  function changeQty(productId: number, delta: number) {}

  // TODO 3: remove a line
  function remove(productId: number) {}

  // TODO 5: derived values
  const itemCount = 0;
  const subtotal = 0;
  const discount = 0;
  const total = subtotal - discount;

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card" style={{ flex: 1, minWidth: 260 }}>
        <strong>Products</strong>
        <ul style={{ paddingLeft: 18 }}>
          {products.map((p) => (
            <li key={p.id}>
              {p.name} — {money(p.price)} <span className="muted">({p.stock} in stock)</span>{" "}
              {/* TODO 6: disable when out of stock */}
              <button className="btn" onClick={() => addToCart(p.id)}>
                Add
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card" style={{ flex: 1, minWidth: 260 }}>
        <strong>Cart ({itemCount} items)</strong>
        {cart.length === 0 ? (
          <p className="muted">Your cart is empty.</p>
        ) : (
          <ul style={{ paddingLeft: 18 }}>
            {cart.map((line) => {
              const product = products.find((p) => p.id === line.productId)!;
              return (
                <li key={line.productId}>
                  {product.name} × {line.qty}
                  {/* TODO 2 + 3: − / + / ✕ buttons */}
                </li>
              );
            })}
          </ul>
        )}
        <div>Subtotal: {money(subtotal)}</div>
        {discount > 0 && <div style={{ color: "#2c8a4b" }}>Discount: −{money(discount)}</div>}
        <div>
          <strong>Total: {money(total)}</strong>
        </div>
        {/* TODO 4: Clear cart */}
      </div>
    </div>
  );
}
