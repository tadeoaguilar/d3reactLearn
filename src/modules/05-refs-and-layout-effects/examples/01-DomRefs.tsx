/**
 * Example 05.01: refs to DOM and SVG elements.
 */
import { useRef, useState } from "react";

export default function DomRefs() {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const textRef = useRef<SVGTextElement>(null);
  const [bbox, setBbox] = useState<DOMRect | null>(null);
  const [label, setLabel] = useState("Measure me!");

  const scrollToItem = (i: number) => {
    const li = listRef.current?.children[i] as HTMLElement | undefined;
    li?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const measureText = () => {
    // getBBox is an SVG-only API: the rendered size of the text.
    if (textRef.current) setBbox(textRef.current.getBBox() as DOMRect);
  };

  return (
    <div className="stack">
      <section className="row">
        <input ref={inputRef} type="text" placeholder="I can be focused from a button" />
        <button className="btn" onClick={() => inputRef.current?.focus()}>
          Focus input
        </button>
        <button className="btn" onClick={() => inputRef.current?.select()}>
          Select text
        </button>
      </section>

      <section className="row" style={{ alignItems: "flex-start" }}>
        <ul ref={listRef} style={{ height: 100, overflowY: "auto", width: 160, border: "1px solid var(--border)", margin: 0 }}>
          {Array.from({ length: 30 }, (_, i) => (
            <li key={i}>Item {i}</li>
          ))}
        </ul>
        <div className="row">
          {[0, 10, 20, 29].map((i) => (
            <button key={i} className="btn" onClick={() => scrollToItem(i)}>
              Scroll to {i}
            </button>
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="row">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} />
          <button className="btn" onClick={measureText}>
            Measure SVG text
          </button>
        </div>
        <svg width={400} height={70} style={{ border: "1px dashed var(--border)" }}>
          {/* Use the measurement to draw a box behind the text */}
          {bbox && (
            <rect x={bbox.x - 4} y={bbox.y - 2} width={bbox.width + 8} height={bbox.height + 4} fill="#e3ecfc" rx={4} />
          )}
          <text ref={textRef} x={20} y={42} style={{ fontSize: 22 }}>
            {label}
          </text>
        </svg>
        <span className="muted">
          {bbox ? `width ${bbox.width.toFixed(1)}px, height ${bbox.height.toFixed(1)}px` : "not measured yet"}
          {" · "}Change the text, then measure again. (Example 03 shows how to re-measure automatically.)
        </span>
      </section>
    </div>
  );
}
