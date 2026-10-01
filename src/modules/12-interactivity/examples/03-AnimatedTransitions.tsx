/**
 * Example 12.03: three ways to animate React-rendered charts.
 *
 *   A. CSS transitions on SVG attributes (simplest; best in Chromium)
 *   B. A D3 transition on a React-created element (D3 animates attributes React doesn't set)
 *   C. Interpolating the DATA with d3.timer + d3.interpolate; React renders every frame
 *      (works for anything, including path `d` strings)
 */
import { useEffect, useRef, useState, type SVGProps } from "react";
import * as d3 from "d3";

const N = 10;
const W = 300;
const H = 160;
const newValues = () => Array.from({ length: N }, () => Math.round(10 + Math.random() * 90));

const x = d3.scaleBand<number>().domain(d3.range(N)).range([0, W]).padding(0.15);
const y = d3.scaleLinear().domain([0, 100]).range([H, 0]);

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------------------------------------------------------------------------
// A. CSS
// ---------------------------------------------------------------------------
function CssBars({ values }: { values: number[] }) {
  return (
    <svg width={W} height={H}>
      {values.map((v, i) => (
        <rect key={i} x={x(i)} width={x.bandwidth()} y={y(v)} height={H - y(v)} fill="#2f6fdf" style={{ transition: "y 600ms ease, height 600ms ease" }} />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// B. D3 transition on a React element
// ---------------------------------------------------------------------------
function D3AnimatedRect({ targetY, targetHeight, ...rest }: { targetY: number; targetHeight: number } & SVGProps<SVGRectElement>) {
  const ref = useRef<SVGRectElement>(null);
  useEffect(() => {
    d3.select(ref.current!)
      .transition()
      .duration(prefersReducedMotion() ? 0 : 600)
      .ease(d3.easeBackOut.overshoot(1.2))
      .attr("y", targetY)
      .attr("height", targetHeight);
  }, [targetY, targetHeight]);
  // y and height are NOT passed to React, so React never overwrites D3's animation.
  return <rect ref={ref} y={H} height={0} {...rest} />;
}

function D3Bars({ values }: { values: number[] }) {
  return (
    <svg width={W} height={H}>
      {values.map((v, i) => (
        <D3AnimatedRect key={i} x={x(i)} width={x.bandwidth()} targetY={y(v)} targetHeight={H - y(v)} fill="#e0803a" />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// C. Interpolate the data
// ---------------------------------------------------------------------------
function useAnimatedValue<T>(target: T, duration = 600): T {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  useEffect(() => {
    // d3.interpolate handles numbers, colors, arrays and objects. The cast
    // tells TS the result has the same type as the input.
    const interpolate = d3.interpolate(current.current as object, target as object) as unknown as (t: number) => T;
    if (prefersReducedMotion()) {
      current.current = target;
      setValue(target);
      return;
    }
    const timer = d3.timer((elapsed) => {
      const t = Math.min(1, elapsed / duration);
      const v = interpolate(d3.easeCubicInOut(t));
      current.current = v; // remember where we are, in case we get interrupted
      setValue(v);
      if (t === 1) timer.stop();
    });
    return () => timer.stop();
  }, [target, duration]);
  return value;
}

function InterpolatedChart({ values }: { values: number[] }) {
  const animated = useAnimatedValue(values);
  const line = d3
    .line<number>()
    .x((_, i) => x(i)! + x.bandwidth() / 2)
    .y((v) => y(v))
    .curve(d3.curveMonotoneX);
  return (
    <svg width={W} height={H}>
      {animated.map((v, i) => (
        <rect key={i} x={x(i)} width={x.bandwidth()} y={y(v)} height={H - y(v)} fill="#2c9a6a" fillOpacity={0.35} />
      ))}
      {/* A path `d` can't be CSS-transitioned portably, but interpolated data just works */}
      <path d={line(animated)!} fill="none" stroke="#2c9a6a" strokeWidth={2.5} />
    </svg>
  );
}

export default function AnimatedTransitions() {
  const [values, setValues] = useState(newValues);
  return (
    <div className="stack">
      <div className="row">
        <button className="btn primary" onClick={() => setValues(newValues())}>
          New data
        </button>
        <span className="muted">Click several times quickly. Every approach handles interruptions differently.</span>
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <figure style={{ margin: 0 }}>
          <CssBars values={values} />
          <figcaption className="muted">A · CSS transition</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <D3Bars values={values} />
          <figcaption className="muted">B · d3.transition on a ref</figcaption>
        </figure>
        <figure style={{ margin: 0 }}>
          <InterpolatedChart values={values} />
          <figcaption className="muted">C · interpolated data (d3.timer)</figcaption>
        </figure>
      </div>
      <p className="muted">All three honor <code>prefers-reduced-motion</code> except A. Add a media query in CSS for that.</p>
    </div>
  );
}
