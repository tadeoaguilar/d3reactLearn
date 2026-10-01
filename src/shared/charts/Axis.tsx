/**
 * A reusable axis component: the "hybrid" strategy from Module 10.
 *
 * React creates the <g> and positions it. D3's axis generator draws the
 * ticks inside it from an effect. When the scale changes, the effect runs
 * again and D3 updates the ticks in place (optionally animated).
 *
 *   <Axis orientation="bottom" scale={x} transform={`translate(0,${innerHeight})`} />
 *   <Axis orientation="left" scale={y} ticks={5} gridSize={innerWidth} />          // grid lines only
 *   <Axis orientation="left" scale={y} ticks={5} tickFormat={d3.format("~s")} />   // labels
 */
import { useEffect, useRef } from "react";
import * as d3 from "d3";

type Orientation = "top" | "right" | "bottom" | "left";

export interface AxisProps<Domain extends d3.AxisDomain> {
  orientation: Orientation;
  scale: d3.AxisScale<Domain>;
  transform?: string;
  ticks?: number | d3.TimeInterval | null;
  tickFormat?: (value: Domain, index: number) => string;
  /**
   * Grid mode: ticks extend across the chart as lines of this length, with
   * no labels and no domain line. Render a second, normal <Axis> for labels.
   */
  gridSize?: number;
  /** Animate changes (ms). 0 disables transitions. */
  duration?: number;
  label?: string;
}

const generators = {
  top: d3.axisTop,
  right: d3.axisRight,
  bottom: d3.axisBottom,
  left: d3.axisLeft,
} as const;

export function Axis<Domain extends d3.AxisDomain>({
  orientation,
  scale,
  transform,
  ticks,
  tickFormat,
  gridSize,
  duration = 300,
  label,
}: AxisProps<Domain>) {
  const ref = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const axis = generators[orientation](scale);
    if (ticks !== undefined) axis.ticks(ticks as number);
    if (tickFormat) axis.tickFormat(tickFormat);
    if (gridSize) axis.tickSizeInner(-gridSize).tickSizeOuter(0).tickFormat(() => "");

    const g = d3.select(ref.current);
    // `.call()` on a transition animates ticks between the old and new scale.
    if (duration > 0) g.transition().duration(duration).call(axis);
    else g.call(axis);

    if (gridSize) {
      // Faint grid lines, and the domain line removed.
      g.selectAll(".tick line").attr("stroke-opacity", 0.15);
      g.select(".domain").remove();
    }
  }, [orientation, scale, ticks, tickFormat, gridSize, duration]);

  const isVertical = orientation === "left" || orientation === "right";
  return (
    <g ref={ref} className="axis" transform={transform}>
      {label && (
        // A child React renders inside the D3-managed <g>. D3 only touches
        // .tick and .domain elements, so this label is left alone.
        <text
          className="axis-label"
          textAnchor={isVertical ? "start" : "end"}
          x={isVertical ? (orientation === "left" ? -8 : 8) : undefined}
          y={isVertical ? -10 : undefined}
          dy={isVertical ? undefined : -6}
          style={{ fill: "var(--muted)", fontSize: 11 }}
        >
          {label}
        </text>
      )}
    </g>
  );
}
