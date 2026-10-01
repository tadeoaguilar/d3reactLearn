/**
 * Example 03.02: conditional rendering patterns.
 */
import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

/** Early return: a component can render nothing (null) or bail out early. */
function StatusBanner({ status }: { status: Status }) {
  if (status === "idle") return null;

  // A lookup object is cleaner than nested ternaries for many cases.
  const styles: Record<Exclude<Status, "idle">, { bg: string; text: string }> = {
    loading: { bg: "#e3ecfc", text: "⏳ Loading data…" },
    success: { bg: "#e3f4e8", text: "✅ Loaded 1,204 rows" },
    error: { bg: "#fbe4e4", text: "❌ Failed to load" },
  };
  const s = styles[status];
  return <div style={{ background: s.bg, color: "#1d1d1b", padding: 10, borderRadius: 6 }}>{s.text}</div>;
}

export default function ConditionalRendering() {
  const [status, setStatus] = useState<Status>("idle");
  const [items, setItems] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="stack">
      <div className="row">
        {(["idle", "loading", "success", "error"] as const).map((s) => (
          <button key={s} className={`btn ${status === s ? "primary" : ""}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>
      <StatusBanner status={status} />

      <hr />

      <div className="row">
        <button className="btn" onClick={() => setItems((xs) => [...xs, `Item ${xs.length + 1}`])}>
          Add item
        </button>
        <button className="btn" onClick={() => setItems([])}>
          Clear
        </button>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="card" style={{ flex: 1 }}>
          <code>{"{items.length && <List/>}"}</code>
          <div>
            {/* ⚠️ When empty this renders a literal "0" */}
            {items.length && <ul>{items.map((i) => <li key={i}>{i}</li>)}</ul>}
          </div>
        </div>
        <div className="card" style={{ flex: 1 }}>
          <code>{"{items.length > 0 ? <List/> : <Empty/>}"}</code>
          <div>
            {items.length > 0 ? (
              <ul>
                {items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">No items yet.</p>
            )}
          </div>
        </div>
      </div>

      <hr />
      <label>
        <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} /> Show details
      </label>
      {showDetails && <p>Here are the details. When the box is unchecked, this element is removed from the DOM.</p>}
    </div>
  );
}
