/**
 * Exercise 13.2: Classed choropleth with an interactive legend. See README.md.
 */
import { useMemo, useState } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { borders, countries, countryIndex, type Country } from "../../../../shared/geo";

type Method = "quantize" | "quantile" | "threshold";
const COLORS = d3.schemeBlues[5];
const allValues = [...countryIndex.values()];

export default function ChoroplethWithLegend() {
  const [ref, dms] = useChartDimensions({ aspectRatio: 1.9, margin: { top: 0, right: 0, bottom: 0, left: 0 } });

  // TODO 1: projection + path (useMemo on the size)
  // TODO 2: method state + color scale for the method
  // TODO 3: legend classes (range, color, count)
  // TODO 4: hovered country and hovered class state
  // TODO 5: hatch <pattern> for missing values

  return (
    <div className="stack">
      {/* TODO 2: method switcher */}
      <div ref={ref} className="chart-wrapper">
        {dms.width > 0 && (
          <svg width={dms.width} height={dms.height}>
            <text x={dms.width / 2} y={dms.height / 2} textAnchor="middle">
              {countries.features.length} countries, {allValues.length} with values
            </text>
          </svg>
        )}
      </div>
      {/* TODO 3: legend */}
    </div>
  );
}
