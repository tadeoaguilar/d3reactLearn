/**
 * Exercise 09.1: reference solution (D3 owns the DOM inside the <svg>).
 */
import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { fruitSales, type CategoryValue } from "../../../../shared/data";

const W = 600;
const H = 320;
const M = { top: 24, right: 16, bottom: 40, left: 50 };
const innerW = W - M.left - M.right;
const innerH = H - M.top - M.bottom;
const BAR = "#2f6fdf";
const BAR_HOVER = "#e0803a";

export default function FirstBarChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<CategoryValue[]>(fruitSales);

  useEffect(() => {
    const svg = d3.select(svgRef.current!);

    // 2. Scales
    const x = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.label))
      .range([0, innerW])
      .padding(0.2);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) ?? 1])
      .nice()
      .range([innerH, 0]);

    const t = d3.transition().duration(600).ease(d3.easeCubicOut);

    // 3. Structure: join on [null] creates the group once, then reuses it.
    const bounds = svg
      .selectAll<SVGGElement, null>("g.bounds")
      .data([null])
      .join("g")
      .attr("class", "bounds")
      .attr("transform", `translate(${M.left},${M.top})`);

    const xAxisG = bounds
      .selectAll<SVGGElement, null>("g.x-axis")
      .data([null])
      .join("g")
      .attr("class", "x-axis axis")
      .attr("transform", `translate(0,${innerH})`);

    const yAxisG = bounds.selectAll<SVGGElement, null>("g.y-axis").data([null]).join("g").attr("class", "y-axis axis");

    // 4. Bars
    bounds
      .selectAll<SVGRectElement, CategoryValue>("rect.bar")
      .data(data, (d) => d.label)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("class", "bar")
            .attr("fill", BAR)
            .attr("rx", 3)
            .attr("x", (d) => x(d.label)!)
            .attr("width", x.bandwidth())
            .attr("y", innerH) // start at the baseline…
            .attr("height", 0), // …with no height
        (update) => update,
        (exit) => exit.transition(t).attr("y", innerH).attr("height", 0).remove(),
      )
      // enter + update: animate to the final geometry
      .transition(t)
      .attr("x", (d) => x(d.label)!)
      .attr("width", x.bandwidth())
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => innerH - y(d.value));

    // 5. Axes
    xAxisG.transition(t).call(d3.axisBottom(x));
    yAxisG.transition(t).call(d3.axisLeft(y).ticks(6).tickFormat(d3.format("~s")));

    // 6. Labels
    bounds
      .selectAll<SVGTextElement, CategoryValue>("text.label")
      .data(data, (d) => d.label)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("class", "label")
            .attr("text-anchor", "middle")
            .attr("x", (d) => x(d.label)! + x.bandwidth() / 2)
            .attr("y", innerH - 4),
        (update) => update,
        (exit) => exit.remove(),
      )
      .text((d) => d.value)
      .transition(t)
      .attr("x", (d) => x(d.label)! + x.bandwidth() / 2)
      .attr("y", (d) => y(d.value) - 6);

    // 8. Hover. Calling .on() again replaces the old handler, so reruns are safe.
    bounds
      .selectAll<SVGRectElement, CategoryValue>("rect.bar")
      .on("mouseenter", function () {
        d3.select(this).attr("fill", BAR_HOVER);
      })
      .on("mouseleave", function () {
        d3.select(this).attr("fill", BAR);
      });
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
