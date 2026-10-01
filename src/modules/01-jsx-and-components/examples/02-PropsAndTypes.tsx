/**
 * Example 01.02: components and typed props.
 */

interface StatProps {
  label: string;
  value: number;
  /** optional, with a default in the destructuring below */
  unit?: string;
  /** a union prop: only these values are allowed */
  trend?: "up" | "down" | "flat";
}

function Stat({ label, value, unit = "", trend = "flat" }: StatProps) {
  const arrow = { up: "▲", down: "▼", flat: "■" }[trend];
  const color = { up: "#2c8a4b", down: "#c43d3d", flat: "#8a8a84" }[trend];
  return (
    <div className="card" style={{ minWidth: 150 }}>
      <div className="muted" style={{ fontSize: 13 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600 }}>
        {value.toLocaleString()}
        {unit}
      </div>
      <div style={{ color }}>{arrow}</div>
    </div>
  );
}

// Props can be callbacks. This is how a child talks to its parent.
function Hello({ name, onGreet }: { name: string; onGreet: (name: string) => void }) {
  return (
    <button className="btn" onClick={() => onGreet(name)}>
      Greet {name}
    </button>
  );
}

export default function PropsAndTypes() {
  return (
    <div className="stack">
      <div className="row">
        {/* Same component, different data */}
        <Stat label="Visitors" value={12840} trend="up" />
        <Stat label="Bounce rate" value={38} unit="%" trend="down" />
        <Stat label="Avg. session" value={4} unit=" min" />
        {/* Uncomment to see a type error: "sideways" isn't allowed */}
        {/* <Stat label="Oops" value={1} trend="sideways" /> */}
      </div>
      <div className="row">
        <Hello name="Ada" onGreet={(n) => alert(`Hello, ${n}!`)} />
        <Hello name="Grace" onGreet={(n) => console.log(`Hi ${n}`)} />
      </div>
    </div>
  );
}
