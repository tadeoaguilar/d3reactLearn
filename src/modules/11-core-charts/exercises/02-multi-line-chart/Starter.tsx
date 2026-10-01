/**
 * Exercise 11.2: Multi-line chart with normalization. See README.md.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { ChartFrame } from "../../../../shared/charts/ChartFrame";
import { Axis } from "../../../../shared/charts/Axis";
import { stockSeries, type Series, type TimePoint } from "../../../../shared/data";
import { palette } from "../../../../shared/theme";

type Mode = "absolute" | "indexed";

// TODO 3: AnimatedPath component: a <path ref> whose `d` is transitioned by D3

// TODO 3: indexSeries(series) → a series where each value is value / first * 100

export default function MultiLineChart() {
  // TODO 3 + 4: state for mode and hidden series

  return (
    <div className="stack">
      {/* TODO 3: mode toggle */}
      <ChartFrame height={360} margin={{ right: 130 }}>
        {({ innerWidth, innerHeight }) => (
          // TODO 1, 2, 5, 6
          <text x={innerWidth / 2} y={innerHeight / 2} textAnchor="middle">
            {stockSeries.map((s) => s.name).join(" · ")}
          </text>
        )}
      </ChartFrame>
    </div>
  );
}
