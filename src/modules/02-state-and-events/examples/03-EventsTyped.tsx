/**
 * Example 02.03: typed event handlers, including SVG mouse events.
 * Using the mouse position on an SVG is the basis for tooltips later.
 */
import { useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";

export default function EventsTyped() {
  const [text, setText] = useState("");
  const [lastKey, setLastKey] = useState("");
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [clicked, setClicked] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    setLastKey(e.key);
    if (e.key === "Escape") setText("");
  }

  function handleMove(e: MouseEvent<SVGSVGElement>) {
    // Convert the page coordinates to coordinates inside the SVG.
    const rect = e.currentTarget.getBoundingClientRect();
    setPointer({ x: Math.round(e.clientX - rect.left), y: Math.round(e.clientY - rect.top) });
  }

  return (
    <div className="stack">
      <label className="row">
        Type something (Esc clears):
        <input type="text" value={text} onChange={handleChange} onKeyDown={handleKeyDown} />
      </label>
      <p className="muted">
        {text.length} characters · last key: <code>{lastKey || "—"}</code>
      </p>

      <svg
        width={400}
        height={160}
        style={{ border: "1px solid var(--border)", borderRadius: 8, cursor: "crosshair" }}
        onMouseMove={handleMove}
        onMouseLeave={() => setPointer(null)}
      >
        {["#2f6fdf", "#e0803a", "#2c9a6a"].map((color, i) => (
          <rect
            key={color}
            x={40 + i * 120}
            y={40}
            width={80}
            height={80}
            rx={8}
            fill={color}
            opacity={clicked === color ? 1 : 0.6}
            // Arrow function so the handler knows WHICH square was clicked.
            onClick={() => setClicked(color)}
            style={{ cursor: "pointer" }}
          />
        ))}
        {pointer && (
          <>
            <line x1={pointer.x} x2={pointer.x} y1={0} y2={160} stroke="#999" strokeDasharray="3 3" />
            <line x1={0} x2={400} y1={pointer.y} y2={pointer.y} stroke="#999" strokeDasharray="3 3" />
            <text x={pointer.x + 6} y={pointer.y - 6}>
              {pointer.x}, {pointer.y}
            </text>
          </>
        )}
      </svg>
      <p>Clicked square: {clicked ?? "none"}</p>
    </div>
  );
}
