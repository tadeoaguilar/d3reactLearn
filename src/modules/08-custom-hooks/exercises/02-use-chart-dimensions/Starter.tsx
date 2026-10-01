/**
 * Exercise 08.2: useChartDimensions. See README.md.
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

// TODO: implement the hook
function useChartDimensions(
  options: { height?: number; aspectRatio?: number; margin?: Partial<Margin> } = {},
): readonly [RefObject<HTMLDivElement | null>, ChartDimensions] {
  const ref = useRef<HTMLDivElement>(null);
  const dims: ChartDimensions = { width: 0, height: 0, margin: DEFAULT_MARGIN, innerWidth: 0, innerHeight: 0 };
  return [ref, dims] as const;
}

export default function UseChartDimensionsExercise() {
  const [mode, setMode] = useState<"fixed" | "aspect">("fixed");
  const [ref, dims] = useChartDimensions(mode === "fixed" ? { height: 260 } : { aspectRatio: 16 / 9 });

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
        {/* TODO: draw the frame: outer rect, bounds rect, margin labels, size text */}
        <div className="todo-hint">
          width {dims.width} × height {dims.height}
        </div>
      </div>
    </div>
  );
}
