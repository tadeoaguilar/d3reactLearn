/**
 * Exercise 09.1: your first D3 bar chart, the D3 way. See README.md.
 */
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fruitSales, type CategoryValue } from "../../../../shared/data";

const W = 600;
const H = 320;
const M = { top: 24, right: 16, bottom: 40, left: 50 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;

export default function FirstBarChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<CategoryValue[]>(fruitSales);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);

    // TODO 2: scales

    // TODO 3: bounds + axis groups (idempotent: use .data([null]).join("g"))

    // TODO 4: bars with enter / update / exit

    // TODO 5: axes

    // TODO 6: value labels

    // TODO 8: hover
  }, [data]);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setData((d) => d.map((x) => ({ ...x, value: Math.round(Math.random() * 150) })))}>
          Randomize values
        </button>
        <button className="btn" onClick={() => setData((d) => [...d].sort((a, b) => b.value - a.value))}>
          Sort
        </button>
        <button className="btn" onClick={() => setData((d) => d.slice(0, -1))}>
          Remove last
        </button>
        <button className="btn" onClick={() => setData(fruitSales)}>
          Reset
        </button>
      </div>
      <svg ref={svgRef} width={W} height={H} className="chart" />
    </div>
  );
}
