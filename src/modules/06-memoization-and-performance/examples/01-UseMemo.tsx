/**
 * Example 06.01: useMemo for an expensive computation.
 *
 * We generate 400k random numbers and compute a histogram. Clicking
 * "unrelated counter" re-renders the component:
 *   - without useMemo, the histogram is recomputed every time (slow clicks)
 *   - with useMemo, it's recomputed only when `sampleSize` changes
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";

function computeHistogram(sampleSize: number, seed: number) {
  const start = performance.now();
  const random = d3.randomNormal.source(d3.randomLcg(seed))(0, 1);
  const values = Float64Array.from({ length: sampleSize }, random);
  const bins = d3.bin().domain([-4, 4]).thresholds(40)(values);
  return { bins, ms: performance.now() - start };
}

function Histogram({ bins }: { bins: d3.Bin<number, number>[] }) {
  const width = 480;
  const height = 120;
  const max = d3.max(bins, (b) => b.length) ?? 1;
  const barW = width / bins.length;
  return (
    <svg width={width} height={height}>
      {bins.map((b, i) => {
        const h = (b.length / max) * height;
        return <rect key={i} x={i * barW} y={height - h} width={barW - 1} height={h} fill="#2f6fdf" />;
      })}
    </svg>
  );
}

export default function UseMemoExample() {
  const [sampleSize, setSampleSize] = useState(400_000);
  const [seed, setSeed] = useState(1);
  const [counter, setCounter] = useState(0);
  const [useMemoOn, setUseMemoOn] = useState(true);

  // Both hooks are always called (Rules of Hooks). We only choose which result to show.
  const memoized = useMemo(() => computeHistogram(sampleSize, seed), [sampleSize, seed]);
  const result = useMemoOn ? memoized : computeHistogram(sampleSize, seed);

  return (
    <div className="stack">
      <label>
        <input type="checkbox" checked={useMemoOn} onChange={(e) => setUseMemoOn(e.target.checked)} /> use useMemo
      </label>
      <div className="row">
        <button className="btn" onClick={() => setCounter((c) => c + 1)}>
          Unrelated counter: {counter}
        </button>
        <button className="btn" onClick={() => setSeed((s) => s + 1)}>
          New sample (seed {seed})
        </button>
        <select value={sampleSize} onChange={(e) => setSampleSize(Number(e.target.value))}>
          {[50_000, 400_000, 1_000_000].map((n) => (
            <option key={n} value={n}>
              {n.toLocaleString()} points
            </option>
          ))}
        </select>
      </div>
      <Histogram bins={result.bins} />
      <p className="muted">
        Last computation took <strong>{result.ms.toFixed(1)} ms</strong>. With useMemo on, clicking the counter
        shows the <em>same</em> timing because nothing is recomputed.
      </p>
    </div>
  );
}
