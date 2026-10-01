/**
 * Example 01.03: children and composition.
 *
 * `Panel` knows nothing about what it shows. It just frames `children`.
 * This is how dashboards are built: general containers with specific
 * content inside.
 */
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  /** JSX passed as a normal prop (a "slot") */
  actions?: ReactNode;
  /** whatever goes between <Panel> and </Panel> */
  children: ReactNode;
}

function Panel({ title, actions, children }: PanelProps) {
  return (
    <section className="card" style={{ flex: 1, minWidth: 220 }}>
      <header className="row" style={{ justifyContent: "space-between", marginBottom: 8 }}>
        <strong>{title}</strong>
        {actions}
      </header>
      {children}
    </section>
  );
}

/** A tiny "chart" built from plain SVG, so you can see charts are components too. */
function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const barWidth = 18;
  const height = 60;
  return (
    <svg width={values.length * (barWidth + 4)} height={height}>
      {values.map((v, i) => {
        const h = (v / max) * height;
        return <rect key={i} x={i * (barWidth + 4)} y={height - h} width={barWidth} height={h} fill="#2f6fdf" rx={2} />;
      })}
    </svg>
  );
}

export default function ChildrenAndComposition() {
  return (
    <div className="row" style={{ alignItems: "stretch" }}>
      <Panel title="Weekly signups" actions={<button className="btn">⋯</button>}>
        <MiniBars values={[4, 8, 6, 12, 9, 14, 11]} />
      </Panel>

      <Panel title="Notes">
        <p>Panels can hold anything:</p>
        <ul>
          <li>text</li>
          <li>lists</li>
          <li>other components</li>
        </ul>
      </Panel>

      {/* Nesting: a Panel inside a Panel */}
      <Panel title="Nested">
        <Panel title="Inner">
          <MiniBars values={[3, 1, 4, 1, 5]} />
        </Panel>
      </Panel>
    </div>
  );
}
