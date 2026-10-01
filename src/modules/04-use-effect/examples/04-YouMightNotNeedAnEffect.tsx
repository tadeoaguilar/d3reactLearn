/**
 * Example 04.04: effects you should NOT write.
 *
 * Each pair shows the effect-based version and the simpler correct one.
 * Watch the render counters: the effect versions render twice per change.
 */
import { useEffect, useRef, useState } from "react";
import { products } from "../../../shared/data";

/**
 * Counts renders. Writing to a ref during render is normally something to
 * avoid; it's fine for a debug counter. In dev, StrictMode renders twice,
 * so the numbers go up by 2. Compare the two panels, not the exact values.
 */
function useRenderCount() {
  const count = useRef(0);
  count.current++;
  return count.current;
}

// ---------------------------------------------------------------------------
// 1. Derived data
// ---------------------------------------------------------------------------
function DerivedWithEffect({ query }: { query: string }) {
  const renders = useRenderCount();
  const [visible, setVisible] = useState(products);
  useEffect(() => {
    setVisible(products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())));
  }, [query]);
  return (
    <div className="card" style={{ flex: 1 }}>
      <strong>❌ useEffect + setState</strong>
      <div className="muted">renders: {renders}</div>
      <div>{visible.map((p) => p.name).join(", ") || "—"}</div>
    </div>
  );
}

function DerivedInRender({ query }: { query: string }) {
  const renders = useRenderCount();
  const visible = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="card" style={{ flex: 1 }}>
      <strong>✅ computed during render</strong>
      <div className="muted">renders: {renders}</div>
      <div>{visible.map((p) => p.name).join(", ") || "—"}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Resetting state when a prop changes
// ---------------------------------------------------------------------------
function NoteEditor({ productName }: { productName: string }) {
  const [note, setNote] = useState("");
  return (
    <label>
      Note about <strong>{productName}</strong>:{" "}
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
    </label>
  );
}

function NoteEditorWithEffect({ productName }: { productName: string }) {
  const [note, setNote] = useState("");
  // ❌ Runs AFTER render, so there's one frame showing the old note with the new name.
  useEffect(() => {
    setNote("");
  }, [productName]);
  return (
    <label>
      Note about <strong>{productName}</strong>:{" "}
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} />
    </label>
  );
}

export default function YouMightNotNeedAnEffect() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(products[0].name);

  return (
    <div className="stack">
      <h4>1. Derived data</h4>
      <input type="search" placeholder="Filter products…" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="row" style={{ alignItems: "stretch" }}>
        <DerivedWithEffect query={query} />
        <DerivedInRender query={query} />
      </div>

      <h4>2. Resetting state when a prop changes</h4>
      <div className="row">
        {products.slice(0, 4).map((p) => (
          <button key={p.id} className={`btn ${selected === p.name ? "primary" : ""}`} onClick={() => setSelected(p.name)}>
            {p.name}
          </button>
        ))}
      </div>
      <div className="card stack">
        <div>
          ❌ <NoteEditorWithEffect productName={selected} /> <span className="muted">(effect clears it)</span>
        </div>
        <div>
          {/* ✅ A different key means a different component instance, so its state starts fresh. */}
          ✅ <NoteEditor key={selected} productName={selected} /> <span className="muted">(key={"{selected}"})</span>
        </div>
      </div>

      <h4>3. Responding to an event</h4>
      <p>
        If code should run <em>because the user clicked something</em>, put it in the <code>onClick</code> handler.
        Don't set a flag in state and react to it in an effect. Effects are for keeping things in sync, not for
        handling events.
      </p>
    </div>
  );
}
