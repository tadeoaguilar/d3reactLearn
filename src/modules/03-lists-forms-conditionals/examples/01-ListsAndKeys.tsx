/**
 * Example 03.01: why keys matter.
 *
 * Type something in each row's input, then click "Remove first" or
 * "Shuffle". With index keys, the typed text stays in place while the
 * labels move, so the text ends up next to the wrong item.
 */
import { useState } from "react";

interface Item {
  id: string;
  label: string;
}

const initial: Item[] = [
  { id: "a", label: "🍎 Apple" },
  { id: "b", label: "🍌 Banana" },
  { id: "c", label: "🍒 Cherry" },
  { id: "d", label: "🥝 Kiwi" },
];

/** A row with its OWN state (the note input). */
function Row({ label }: { label: string }) {
  const [note, setNote] = useState("");
  return (
    <li className="row" style={{ marginBottom: 4 }}>
      <span style={{ width: 90 }}>{label}</span>
      <input type="text" value={note} placeholder="type a note" onChange={(e) => setNote(e.target.value)} />
    </li>
  );
}

function ListDemo({ useIndexKeys }: { useIndexKeys: boolean }) {
  const [items, setItems] = useState(initial);
  return (
    <div className="card" style={{ flex: 1, minWidth: 280 }}>
      <strong>{useIndexKeys ? "❌ key={index}" : "✅ key={item.id}"}</strong>
      <div className="row" style={{ margin: "8px 0" }}>
        <button className="btn" onClick={() => setItems((xs) => xs.slice(1))}>
          Remove first
        </button>
        <button className="btn" onClick={() => setItems((xs) => [...xs].sort(() => Math.random() - 0.5))}>
          Shuffle
        </button>
        <button className="btn" onClick={() => setItems(initial)}>
          Reset
        </button>
      </div>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((item, index) => (
          <Row key={useIndexKeys ? index : item.id} label={item.label} />
        ))}
      </ul>
    </div>
  );
}

export default function ListsAndKeys() {
  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <ListDemo useIndexKeys />
      <ListDemo useIndexKeys={false} />
    </div>
  );
}
