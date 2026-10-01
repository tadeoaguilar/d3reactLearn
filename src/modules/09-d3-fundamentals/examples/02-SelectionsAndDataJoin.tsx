/**
 * Example 09.02: selections and the data join, "the D3 way".
 *
 * React renders an empty <svg> and gives it to D3 through a ref. After
 * that, D3 creates, updates and removes the <circle>s with .join().
 *
 * Colors show the join groups on each update:
 *   green = ENTER (new data) · blue = UPDATE (kept) · red = EXIT (fading out)
 *
 * Toggle "key function" off to see index-based matching: D3 then thinks
 * the items changed instead of moving, just like React with index keys.
 */
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface Item {
  id: number;
  value: number;
}

const W = 560;
const H = 140;
let nextId = 0;
const makeItem = (): Item => ({ id: nextId++, value: Math.round(10 + Math.random() * 90) });

export default function SelectionsAndDataJoin() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [items, setItems] = useState<Item[]>(() => Array.from({ length: 6 }, makeItem));
  const [useKey, setUseKey] = useState(true);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);
    const x = d3.scalePoint<number>().domain(d3.range(items.length)).range([40, W - 40]).padding(0.5);
    const r = d3.scaleSqrt().domain([0, 100]).range([0, 28]);
    // One shared transition so enter, update and exit animate in sync.
    const t = d3.transition().duration(700);

    svg
      .selectAll<SVGGElement, Item>("g.item")
      // The key function tells D3 how to match data to existing elements.
      .data(items, useKey ? (d) => d.id : undefined)
      .join(
        (enter) => {
          const g = enter
            .append("g")
            .attr("class", "item")
            .attr("transform", (_, i) => `translate(${x(i)},${H / 2})`);
          g.append("circle").attr("r", 0).attr("fill", "#2c9a6a");
          g.append("text").attr("text-anchor", "middle").attr("dy", "0.35em").attr("fill", "white").style("font-weight", 600);
          return g;
        },
        (update) => {
          update.select("circle").attr("fill", "#2f6fdf");
          return update;
        },
        (exit) => {
          exit.select("circle").attr("fill", "#c43d3d");
          exit.transition(t).style("opacity", 0).remove();
          return exit;
        },
      )
      // Everything below applies to ENTER + UPDATE (the merged selection).
      .call((g) =>
        g
          .transition(t)
          .attr("transform", (_, i) => `translate(${x(i)},${H / 2})`)
          .style("opacity", 1),
      )
      .call((g) => g.select("circle").transition(t).attr("r", (d) => r(d.value)))
      .call((g) => g.select("text").text((d) => d.value));

    // No cleanup needed: .join() is idempotent. Running this effect twice
    // (StrictMode!) with the same data changes nothing.
  }, [items, useKey]);

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => setItems((xs) => [...xs, makeItem()])}>
          Add
        </button>
        <button className="btn" onClick={() => setItems((xs) => xs.slice(1))}>
          Remove first
        </button>
        <button className="btn" onClick={() => setItems((xs) => d3.shuffle([...xs]))}>
          Shuffle
        </button>
        <button className="btn" onClick={() => setItems((xs) => xs.map((d) => ({ ...d, value: Math.round(10 + Math.random() * 90) })))}>
          New values
        </button>
        <label>
          <input type="checkbox" checked={useKey} onChange={(e) => setUseKey(e.target.checked)} /> key function{" "}
          <code>d =&gt; d.id</code>
        </label>
      </div>
      {/* React only renders the container. D3 owns everything inside it. */}
      <svg ref={svgRef} width={W} height={H} className="chart" style={{ border: "1px solid var(--border)", borderRadius: 8 }} />
      <div className="row muted" style={{ fontSize: 13 }}>
        <span style={{ color: "#2c9a6a" }}>● enter</span>
        <span style={{ color: "#2f6fdf" }}>● update</span>
        <span style={{ color: "#c43d3d" }}>● exit</span>
        <span>Order: {items.map((d) => d.id).join(", ")}</span>
      </div>
    </div>
  );
}
