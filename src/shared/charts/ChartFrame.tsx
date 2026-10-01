/**
 * ChartFrame: a responsive <svg> that follows the margin convention and
 * shares its dimensions with children through context.
 *
 *   <ChartFrame height={300} margin={{ left: 60 }}>
 *     {({ innerWidth, innerHeight }) => <MyMarks … />}
 *   </ChartFrame>
 *
 * Children can also call useChartContext() instead of taking props.
 * Built in Module 10, example 04.
 */
import { createContext, useContext, type ReactNode, type SVGProps } from "react";
import { useChartDimensions, type ChartDimensions } from "../hooks/useChartDimensions";
import type { Margin } from "../theme";

const ChartContext = createContext<ChartDimensions | null>(null);

export function useChartContext(): ChartDimensions {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error("useChartContext must be used inside <ChartFrame>");
  return ctx;
}

interface ChartFrameProps {
  height?: number;
  aspectRatio?: number;
  margin?: Partial<Margin>;
  /** Rendered in the wrapper <div> (outside the SVG): tooltips, legends… */
  overlay?: (dims: ChartDimensions) => ReactNode;
  children: (dims: ChartDimensions) => ReactNode;
  svgProps?: SVGProps<SVGSVGElement>;
}

export function ChartFrame({ height, aspectRatio, margin, overlay, children, svgProps }: ChartFrameProps) {
  const [ref, dims] = useChartDimensions({ height, aspectRatio, margin });
  return (
    <div ref={ref} className="chart-wrapper">
      {dims.width > 0 && (
        <ChartContext value={dims}>
          <svg width={dims.width} height={dims.height} className="chart" {...svgProps}>
            <g transform={`translate(${dims.margin.left},${dims.margin.top})`}>{children(dims)}</g>
          </svg>
          {overlay?.(dims)}
        </ChartContext>
      )}
    </div>
  );
}
