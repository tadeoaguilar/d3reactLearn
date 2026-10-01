/**
 * Example 09.05: d3-array and d3-format, the "data wrangling" half of D3.
 * Everything here is plain computation you can do in render.
 */
import * as d3 from "d3";
import { penguins } from "../../../shared/data";

function Row({ code, result }: { code: string; result: string }) {
  return (
    <tr>
      <td>
        <code>{code}</code>
      </td>
      <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{result}</td>
    </tr>
  );
}

const show = (v: unknown) =>
  JSON.stringify(v, (_, val) => (val instanceof Map ? Object.fromEntries(val) : typeof val === "number" ? +val.toFixed(2) : val));

export default function DataUtilities() {
  const masses = penguins.map((p) => p.bodyMass);
  const bySpecies = d3.group(penguins, (p) => p.species);
  const countBySpecies = d3.rollup(penguins, (v) => v.length, (p) => p.species);
  const meanMassBySpecies = d3.rollup(penguins, (v) => d3.mean(v, (p) => p.bodyMass), (p) => p.species);
  const bins = d3.bin().thresholds(8)(masses);
  const sorted = [...penguins].sort((a, b) => d3.ascending(a.bodyMass, b.bodyMass));
  const bisect = d3.bisector<(typeof penguins)[number], number>((p) => p.bodyMass);
  const idx = bisect.center(sorted, 4200);

  return (
    <div className="stack">
      <p className="muted">Dataset: {penguins.length} synthetic penguins (see src/shared/data.ts)</p>
      <table className="markdown">
        <tbody>
          <Row code="d3.extent(masses)" result={show(d3.extent(masses))} />
          <Row code="d3.mean(masses)" result={show(d3.mean(masses))} />
          <Row code="d3.median(masses)" result={show(d3.median(masses))} />
          <Row code="d3.deviation(masses)" result={show(d3.deviation(masses))} />
          <Row code="d3.quantile(masses.sort(d3.ascending), 0.9)" result={show(d3.quantile([...masses].sort(d3.ascending), 0.9))} />
          <Row code="d3.group(data, d => d.species)" result={`Map { ${[...bySpecies].map(([k, v]) => `${k} → [${v.length} rows]`).join(", ")} }`} />
          <Row code="d3.rollup(data, v => v.length, d => d.species)" result={show(countBySpecies)} />
          <Row code="d3.rollup(data, v => d3.mean(v, d => d.bodyMass), d => d.species)" result={show(meanMassBySpecies)} />
          <Row code="d3.bin().thresholds(8)(masses)" result={bins.map((b) => `[${b.x0}–${b.x1}): ${b.length}`).join("  ")} />
          <Row code="d3.bisector(d => d.bodyMass).center(sorted, 4200)" result={`index ${idx} → ${sorted[idx].bodyMass}g (nearest to 4200)`} />
          <Row code='d3.format(",.2f")(1234567.891)' result={d3.format(",.2f")(1234567.891)} />
          <Row code='d3.format("~s")(1_500_000)' result={d3.format("~s")(1_500_000)} />
          <Row code='d3.format(".1%")(0.2567)' result={d3.format(".1%")(0.2567)} />
          <Row code='d3.format("+$,.0f")(-42)' result={d3.format("+$,.0f")(-42)} />
          <Row code='d3.timeFormat("%A, %B %d")(new Date(2025, 6, 4))' result={d3.timeFormat("%A, %B %d")(new Date(2025, 6, 4))} />
          <Row code='d3.timeParse("%Y-%m-%d")("2025-03-15")' result={String(d3.timeParse("%Y-%m-%d")("2025-03-15"))} />
          <Row code="d3.timeDay.count(jan1, dec31)" result={show(d3.timeDay.count(new Date(2025, 0, 1), new Date(2025, 11, 31)))} />
          <Row code="d3.range(0, 1, 0.25)" result={show(d3.range(0, 1, 0.25))} />
        </tbody>
      </table>
    </div>
  );
}
