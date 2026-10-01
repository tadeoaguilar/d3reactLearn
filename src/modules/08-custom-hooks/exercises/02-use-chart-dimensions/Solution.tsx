/**
 * Exercise 08.2: reference solution.
 */
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import type { Margin } from "../../../../shared/theme";

interface ChartDimensions {
  width: number;
  height: number;
  margin: Margin;
  innerWidth: number;
  innerHeight: number;
}

const DEFAULT_MARGIN: Margin = { top: 20, right: 20, bottom: 40, left: 50 };

function useChartDimensions(
  options: { height?: number; aspectRatio?: number; margin?: Partial<Margin> } = {},
): readonly [RefObject<HTMLDivElement | null>, ChartDimensions] {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width); // measure right away, before paint
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margin = { ...DEFAULT_MARGIN, ...options.margin };
  const height = options.aspectRatio ? Math.round(width / options.aspectRatio) : (options.height ?? 300);

  return [
    ref,
    {
      width,
      height,
      margin,
      innerWidth: Math.max(0, width - margin.left - margin.right),
      innerHeight: Math.max(0, height - margin.top - margin.bottom),
    },
  ] as const;
}

export default function UseChartDimensionsExercise() {
  const [mode, setMode] = useState<"fixed" | "aspect">("fixed");
  const [ref, dims] = useChartDimensions(mode === "fixed" ? { height: 260 } : { aspectRatio: 16 / 9 });
  const { width, height, margin, innerWidth, innerHeight } = dims;

  return (
    <div className="stack">
      <div className="row">
        <button className={`btn ${mode === "fixed" ? "primary" : ""}`} onClick={() => setMode("fixed")}>
          fixed height
        </button>
        <button className={`btn ${mode === "aspect" ? "primary" : ""}`} onClick={() => setMode("aspect")}>
          16:9
        </button>
      </div>
      <div ref={ref} style={{ width: "100%" }}>
        {width > 0 && (
          <svg width={width} height={height} className="chart">
            <rect width={width} height={height} fill="none" stroke="var(--border)" strokeDasharray="4 4" />
            <g transform={`translate(${margin.left},${margin.top})`}>
              <rect width={innerWidth} height={innerHeight} fill="#2f6fdf" fillOpacity={0.12} stroke="#2f6fdf" />
              <text x={innerWidth / 2} y={innerHeight / 2} textAnchor="middle">
                bounds: {Math.round(innerWidth)} × {innerHeight}
              </text>
              <text x={innerWidth / 2} y={innerHeight / 2 + 16} textAnchor="middle" className="muted">
                svg: {Math.round(width)} × {height}
              </text>
            </g>
            <text x={width / 2} y={margin.top / 2 + 4} textAnchor="middle">
              top {margin.top}
            </text>
            <text x={width / 2} y={height - margin.bottom / 2 + 4} textAnchor="middle">
              bottom {margin.bottom}
            </text>
            <text x={margin.left / 2} y={height / 2} textAnchor="middle">
              {margin.left}
            </text>
            <text x={width - margin.right / 2} y={height / 2} textAnchor="middle">
              {margin.right}
            </text>
          </svg>
        )}
      </div>
    </div>
  );
}
