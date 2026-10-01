/**
 * Example 08.04: useResizeObserver, the foundation of responsive charts.
 *
 * Drag the bottom-right corner of the box to resize it. The chart reflows
 * to fit. Unlike window "resize", this reacts to ANY size change of the
 * element (sidebar collapsing, flex layouts, …).
 */
import { useLayoutEffect, useRef, useState, type RefObject } from "react";

export function useResizeObserver<T extends Element>(): [RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      // Only update when it really changed, to avoid useless renders.
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size];
}

export default function UseResizeObserverExample() {
  const [ref, { width, height }] = useResizeObserver<HTMLDivElement>();
  const values = [12, 28, 19, 40, 33, 22, 45, 38, 26, 31];
  const max = Math.max(...values);
  const barW = width / values.length;

  return (
    <div className="stack">
      <div
        ref={ref}
        style={{
          resize: "both",
          overflow: "hidden",
          width: 480,
          height: 200,
          minWidth: 160,
          minHeight: 100,
          border: "1px dashed var(--border)",
          borderRadius: 8,
        }}
      >
        {width > 0 && (
          <svg width={width} height={height}>
            {values.map((v, i) => {
              const h = (v / max) * (height - 20);
              return <rect key={i} x={i * barW + 2} y={height - h} width={Math.max(0, barW - 4)} height={h} fill="#2c9a6a" rx={2} />;
            })}
            <text x={8} y={16}>
              {Math.round(width)} × {Math.round(height)}
            </text>
          </svg>
        )}
      </div>
      <p className="muted">
        The shared <code>src/shared/hooks/useChartDimensions.ts</code> builds on this and adds the margin
        convention. You write it yourself in exercise 08.2.
      </p>
    </div>
  );
}
