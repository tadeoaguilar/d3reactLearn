/**
 * Example 05.03: useLayoutEffect vs useEffect for measure-then-position.
 *
 * Each tooltip is first rendered in a default spot, measured, and then
 * moved so it stays inside the box. With useEffect you can see a jump
 * (to make it obvious, the useEffect version waits 60ms before correcting).
 * With useLayoutEffect the correction happens before paint.
 */
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const BOX_W = 320;
const BOX_H = 160;

function blockFor(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* busy-wait to make the flicker visible */
  }
}

function Tooltip({ x, y, layout }: { x: number; y: number; layout: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 12, top: y + 12 });

  const useSomeEffect = layout ? useLayoutEffect : useEffect;

  // Measure, then flip the tooltip if it would overflow the box.
  useSomeEffect(() => {
    const el = ref.current;
    if (!el) return;
    // useEffect runs AFTER paint, so the unflipped tooltip is already on
    // screen. Waiting here keeps that wrong frame visible long enough to see.
    if (!layout) blockFor(60);
    const { width, height } = el.getBoundingClientRect();
    let left = x + 12;
    let top = y + 12;
    if (left + width > BOX_W) left = x - width - 12;
    if (top + height > BOX_H) top = y - height - 12;
    setPos({ left, top });
  }, [x, y]);

  return (
    <div ref={ref} className="tooltip" style={{ left: pos.left, top: pos.top }}>
      x={x}, y={y}
      <br />a longer tooltip line
    </div>
  );
}

function Box({ layout }: { layout: boolean }) {
  const [p, setP] = useState<{ x: number; y: number } | null>(null);
  return (
    <div className="stack">
      <strong>{layout ? "✅ useLayoutEffect" : "❌ useEffect"}</strong>
      <div
        style={{ position: "relative", width: BOX_W, height: BOX_H, border: "1px solid var(--border)", borderRadius: 8 }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setP({ x: Math.round(e.clientX - r.left), y: Math.round(e.clientY - r.top) });
        }}
        onMouseLeave={() => setP(null)}
      >
        {/* key={…} remounts the tooltip at each new position, so the flip is redone every time */}
        {p && <Tooltip key={`${p.x},${p.y}`} x={p.x} y={p.y} layout={layout} />}
      </div>
    </div>
  );
}

export default function LayoutEffectVsEffect() {
  return (
    <div className="stack">
      <p className="muted">
        Move the mouse near the right and bottom edges of each box. The left tooltip visibly jumps. The right one
        doesn't.
      </p>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <Box layout={false} />
        <Box layout />
      </div>
      <p className="muted">
        Note: the component picks <code>useLayoutEffect</code> or <code>useEffect</code> from a prop. That's allowed
        here only because <code>layout</code> never changes for a mounted component. The hook order stays the same.
      </p>
    </div>
  );
}
