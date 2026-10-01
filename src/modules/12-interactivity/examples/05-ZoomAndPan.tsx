/**
 * Example 12.05: zoom and pan with d3.zoom.
 *
 * D3 handles wheel, drag, pinch and double-click gestures, and reports a
 * ZoomTransform. We store the transform in React state and RESCALE the
 * axes with it (semantic zoom), so points keep their size and the axes
 * show the zoomed domain. Buttons control the zoom through a ref.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../shared/charts/Axis";
import { manyPoints } from "../../../shared/data";

const points = manyPoints(1500, 21);
const color = d3.scaleOrdinal<number, string>().range(["#2f6fdf", "#e0803a", "#2c9a6a", "#c2477f"]);

export default function ZoomAndPan() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.6 });
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [transform, setTransform] = useState<d3.ZoomTransform>(d3.zoomIdentity);
  const [mode, setMode] = useState<"semantic" | "geometric">("semantic");

  const x = useMemo(() => d3.scaleLinear().domain([0, 100]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => d3.scaleLinear().domain([0, 100]).range([dms.innerHeight, 0]), [dms.innerHeight]);

  // Attach the zoom behavior to the <svg>. React owns the element; D3 only adds listeners.
  useEffect(() => {
    if (!svgRef.current || dms.innerWidth === 0) return;
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 40])
      .extent([
        [0, 0],
        [dms.innerWidth, dms.innerHeight],
      ])
      .translateExtent([
        [0, 0],
        [dms.innerWidth, dms.innerHeight],
      ])
      .on("zoom", (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => setTransform(event.transform));
    zoomRef.current = zoom;
    const svg = d3.select(svgRef.current).call(zoom);
    return () => {
      svg.on(".zoom", null); // remove all zoom listeners
    };
  }, [dms.innerWidth, dms.innerHeight]);

  // Rescaled copies: the domain shrinks as you zoom in.
  const zx = useMemo(() => transform.rescaleX(x), [transform, x]);
  const zy = useMemo(() => transform.rescaleY(y), [transform, y]);

  const zoomBy = (k: number) => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(400).call(zoomRef.current.scaleBy, k);
  };
  const reset = () => {
    if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(600).call(zoomRef.current.transform, d3.zoomIdentity);
  };

  const semantic = mode === "semantic";
  const visibleCount = points.filter((p) => {
    const [x0, x1] = zx.domain();
    const [y0, y1] = zy.domain();
    return p.x >= x0 && p.x <= x1 && p.y >= y0 && p.y <= y1;
  }).length;

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => zoomBy(2)}>
          ＋
        </button>
        <button className="btn" onClick={() => zoomBy(0.5)}>
          －
        </button>
        <button className="btn" onClick={reset}>
          Reset
        </button>
        {(["semantic", "geometric"] as const).map((m) => (
          <button key={m} className={`btn ${mode === m ? "primary" : ""}`} onClick={() => setMode(m)}>
            {m} zoom
          </button>
        ))}
        <span className="muted">
          k = {transform.k.toFixed(2)} · {visibleCount} points in view · scroll / drag / double-click the chart
        </span>
      </div>
      <div ref={ref}>
        {dms.width > 0 && (
          <svg ref={svgRef} width={dms.width} height={dms.height} className="chart" style={{ cursor: "grab", touchAction: "none" }}>
            <defs>
              <clipPath id="zoom-clip">
                <rect width={dms.innerWidth} height={dms.innerHeight} />
              </clipPath>
            </defs>
            <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
              <Axis orientation="bottom" scale={semantic ? zx : x} transform={`translate(0,${dms.innerHeight})`} duration={0} />
              <Axis orientation="left" scale={semantic ? zy : y} duration={0} />
              <g clipPath="url(#zoom-clip)">
                {/* An invisible background so every part of the plot catches gestures */}
                <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" />
                {semantic ? (
                  // SEMANTIC: positions come from the rescaled scales; radius stays 2.5px
                  points.map((p, i) => <circle key={i} cx={zx(p.x)} cy={zy(p.y)} r={2.5} fill={color(p.group)} fillOpacity={0.7} />)
                ) : (
                  // GEOMETRIC: one transform on a group; circles (and strokes) grow as you zoom
                  <g transform={transform.toString()}>
                    {points.map((p, i) => (
                      <circle key={i} cx={x(p.x)} cy={y(p.y)} r={2.5} fill={color(p.group)} fillOpacity={0.7} />
                    ))}
                  </g>
                )}
              </g>
            </g>
          </svg>
        )}
      </div>
    </div>
  );
}
