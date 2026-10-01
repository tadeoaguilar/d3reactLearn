/**
 * Exercise 02.2: reference solution.
 */
import { useState } from "react";
import { products, type Product } from "../../../../shared/data";

interface CartLine {
  productId: number;
  qty: number;
}

const money = (n: number) => `$${n.toFixed(2)}`;
const productById = (id: number): Product => products.find((p) => p.id === id)!;

export default function ShoppingCart() {
  const [cart, setCart] = useState<CartLine[]>([]);

  function addToCart(productId: number) {
    setCart((current) => {
      const existing = current.find((l) => l.productId === productId);
      if (!existing) return [...current, { productId, qty: 1 }];
      const stock = productById(productId).stock;
      return current.map((l) => (l.productId === productId ? { ...l, qty: Math.min(stock, l.qty + 1) } : l));
    });
  }

  function changeQty(productId: number, delta: number) {
    const stock = productById(productId).stock;
    setCart((current) =>
      current
        .map((l) => (l.productId === productId ? { ...l, qty: Math.min(stock, l.qty + delta) } : l))
        .filter((l) => l.qty >= 1),
    );
  }

  function remove(productId: number) {
    setCart((current) => current.filter((l) => l.productId !== productId));
  }

  // Derived values
  const itemCount = cart.reduce((n, l) => n + l.qty, 0);
  const subtotal = cart.reduce((sum, l) => sum + productById(l.productId).price * l.qty, 0);
  const discount = subtotal > 20 ? subtotal * 0.1 : 0;
  const total = subtotal - discount;

  const qtyInCart = (id: number) => cart.find((l) => l.productId === id)?.qty ?? 0;

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card" style={{ flex: 1, minWidth: 260 }}>
        <strong>Products</strong>
        <ul style={{ paddingLeft: 18 }}>
          {products.map((p) => (
            <li key={p.id}>
              {p.name} — {money(p.price)} <span className="muted">({p.stock} in stock)</span>{" "}
              <button className="btn" onClick={() => addToCart(p.id)} disabled={qtyInCart(p.id) >= p.stock}>
                {p.stock === 0 ? "Sold out" : "Add"}
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
              const product = productById(line.productId);
              return (
                <li key={line.productId} style={{ marginBottom: 4 }}>
                  {product.name} × {line.qty} = {money(product.price * line.qty)}{" "}
                  <button className="btn" onClick={() => changeQty(line.productId, -1)}>
                    −
                  </button>{" "}
                  <button
                    className="btn"
                    onClick={() => changeQty(line.productId, +1)}
                    disabled={line.qty >= product.stock}
                  >
                    +
                  </button>{" "}
                  <button className="link-button" onClick={() => remove(line.productId)}>
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <div>Subtotal: {money(subtotal)}</div>
        {discount > 0 && <div style={{ color: "#2c8a4b" }}>Discount (10%): −{money(discount)}</div>}
        <div>
          <strong>Total: {money(total)}</strong>
        </div>
        <button className="btn" style={{ marginTop: 8 }} onClick={() => setCart([])} disabled={cart.length === 0}>
          Clear cart
        </button>
      </div>
    </div>
  );
}
