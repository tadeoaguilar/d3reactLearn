/**
 * Exercise 12.1: Multi-series crosshair tooltip. See README.md.
 */
import { memo, useMemo, useState, type KeyboardEvent, type PointerEvent } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { stockSeries, type TimePoint } from "../../../../shared/data";
import { palette } from "../../../../shared/theme";

const color = d3.scaleOrdinal<string, string>().domain(stockSeries.map((s) => s.name)).range(palette);
const dates = stockSeries[0].values.map((v) => v.date);

export default function CrosshairTooltip() {
  const [ref, dms] = useChartDimensions({ height: 360 });

  // TODO 2: hovered index state

  const x = useMemo(() => d3.scaleTime().domain(d3.extent(dates) as [Date, Date]).range([0, dms.innerWidth]), [dms.innerWidth]);
  const y = useMemo(() => {
    const all = stockSeries.flatMap((s) => s.values.map((v) => v.value));
    return d3.scaleLinear().domain(d3.extent(all) as [number, number]).nice().range([dms.innerHeight, 0]);
  }, [dms.innerHeight]);
  const line = d3.line<TimePoint>().x((d) => x(d.date)).y((d) => y(d.value));

  // TODO 2: onPointerMove. TODO 5: onKeyDown

  return (
    <div ref={ref} className="chart-wrapper">
      {dms.width > 0 && (
        <svg width={dms.width} height={dms.height} className="chart" tabIndex={0}>
          <g transform={`translate(${dms.margin.left},${dms.margin.top})`}>
            {/* TODO 6: move this into a memo'd <StaticLayer> */}
            <Axis orientation="left" scale={y} gridSize={dms.innerWidth} />
            <Axis orientation="left" scale={y} />
            <Axis orientation="bottom" scale={x} transform={`translate(0,${dms.innerHeight})`} />
            {stockSeries.map((s) => (
              <path key={s.name} d={line(s.values)!} fill="none" stroke={color(s.name)} strokeWidth={1.8} />
            ))}

            {/* TODO 3 + 4: crosshair, dots, date pill */}

            <rect width={dms.innerWidth} height={dms.innerHeight} fill="transparent" />
          </g>
        </svg>
      )}
      {/* TODO 3: <Tooltip> */}
    </div>
  );
}
