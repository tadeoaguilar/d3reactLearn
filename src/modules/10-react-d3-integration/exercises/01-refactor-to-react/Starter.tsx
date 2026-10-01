/**
 * Exercise 10.1: refactor this D3-owned chart to React. See README.md.
 *
 * This version WORKS. It's a typical "D3 owns the DOM" component. Rewrite
 * it so React renders the marks, legend and tooltip, D3 draws only the
 * axes, and the chart is responsive.
 */
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { penguins, type Penguin, type Species } from "../../../../shared/data";
// Imports you'll want for the refactor:
// import { useMemo, useState } from "react";
// import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
// import { Axis } from "../../../../shared/charts/Axis";
// import { Tooltip } from "../../../../shared/charts/Tooltip";

const W = 640;
const H = 420;
const M = { top: 20, right: 20, bottom: 50, left: 56 };
const SPECIES: Species[] = ["Adelie", "Chinstrap", "Gentoo"];
const COLORS = ["#2f6fdf", "#e0803a", "#2c9a6a"];

export default function RefactorToReact() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = d3.select(ref.current!);
    root.selectAll("*").remove(); // brute-force reset (a common D3 shortcut)

    const hidden = new Set<Species>();
    const iw = W - M.left - M.right;
    const ih = H - M.top - M.bottom;

    const x = d3.scaleLinear().domain(d3.extent(penguins, (d) => d.billLength) as [number, number]).nice().range([0, iw]);
    const y = d3.scaleLinear().domain(d3.extent(penguins, (d) => d.billDepth) as [number, number]).nice().range([ih, 0]);
    const r = d3.scaleSqrt().domain(d3.extent(penguins, (d) => d.bodyMass) as [number, number]).range([2, 9]);
    const color = d3.scaleOrdinal<Species, string>().domain(SPECIES).range(COLORS);

    const legend = root.append("div").attr("class", "legend");
    const svg = root.append("svg").attr("width", W).attr("height", H).attr("class", "chart");
    const tooltip = root.append("div").attr("class", "tooltip").style("opacity", 0);
    root.style("position", "relative");

    const g = svg.append("g").attr("transform", `translate(${M.left},${M.top})`);
    g.append("g").attr("class", "axis").attr("transform", `translate(0,${ih})`).call(d3.axisBottom(x));
    g.append("g").attr("class", "axis").call(d3.axisLeft(y));
    g.append("text").attr("x", iw).attr("y", ih + 40).attr("text-anchor", "end").text("Bill length (mm)");
    g.append("text").attr("x", -M.left + 8).attr("y", -6).text("Bill depth (mm)");

    function render() {
      g.selectAll<SVGCircleElement, Penguin>("circle")
        .data(penguins.filter((p) => !hidden.has(p.species)), (d) => d.id)
        .join("circle")
        .attr("cx", (d) => x(d.billLength))
        .attr("cy", (d) => y(d.billDepth))
        .attr("r", (d) => r(d.bodyMass))
        .attr("fill", (d) => color(d.species))
        .attr("fill-opacity", 0.7)
        .on("mouseenter", function (_event, d) {
          d3.select(this).raise().attr("r", r(d.bodyMass) * 1.6).attr("stroke", "currentColor");
          tooltip
            .style("opacity", 1)
            .style("left", `${M.left + x(d.billLength) + 12}px`)
            .style("top", `${M.top + y(d.billDepth) + 12}px`)
            .html(`<strong>${d.species}</strong><br/>bill ${d.billLength} × ${d.billDepth} mm<br/>${d.bodyMass} g`);
        })
        .on("mouseleave", function (_event, d) {
          d3.select(this).attr("r", r(d.bodyMass)).attr("stroke", null);
          tooltip.style("opacity", 0);
        });

      legend
        .selectAll<HTMLButtonElement, Species>("button")
        .data(SPECIES)
        .join("button")
        .style("opacity", (s) => (hidden.has(s) ? 0.4 : 1))
        .html((s) => `<span class="swatch" style="background:${color(s)}"></span> ${s}`)
        .on("click", (_event, s) => {
          if (hidden.has(s)) hidden.delete(s);
          else hidden.add(s);
          render();
        });
    }
    render();
  }, []);

  return <div ref={ref} />;
}
