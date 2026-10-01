/**
 * Exercise 11.1: Horizontal bar chart (top-N cities). See README.md.
 */
import { useEffect, useMemo, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../../shared/charts/ChartFrame";
import { Axis } from "../../../../shared/charts/Axis";

interface City {
  city: string;
  country: string;
  population: number; // millions
}

// TODO 1: a useFetch-style hook (or fetch in an effect here)

const ROW_HEIGHT = 28;

export default function HorizontalBarChart() {
  // TODO 1: load /data/cities.json
  const cities: City[] = [];

  // TODO 5: state for topN, sort, highlightCountry

  // TODO: derive the visible rows

  return (
    <div className="stack">
      {/* TODO 5: controls */}
      <ChartFrame height={200} margin={{ left: 110, top: 30, right: 50 }}>
        {({ innerWidth, innerHeight }) => (
          // TODO 3, 4, 6: scales, bars, labels, top axis
          <text x={innerWidth / 2} y={innerHeight / 2} textAnchor="middle">
            {cities.length} cities loaded. Draw the bars here.
          </text>
        )}
      </ChartFrame>
    </div>
  );
}
