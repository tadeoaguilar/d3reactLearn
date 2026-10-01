/**
 * Example 01.01: JSX basics.
 * Everything inside { } is a JavaScript expression.
 */
export default function JsxBasics() {
  const name = "Ada Lovelace";
  const born = 1815;
  const languages = ["English", "French", "Mathematics"];
  const isPioneer = true;

  // JSX is a value, so it can live in a variable.
  const badge = <span style={{ background: "#2f6fdf", color: "white", padding: "2px 8px", borderRadius: 12 }}>pioneer</span>;

  return (
    // A Fragment (<>…</>) groups siblings without adding a DOM element.
    <>
      <h3>
        {name} {isPioneer && badge}
      </h3>

      {/* Expressions: math, method calls, template strings */}
      <p>
        Born {born}, which was {new Date().getFullYear() - born} years ago.
      </p>
      <p>Initials: {name.split(" ").map((part) => part[0]).join("")}</p>

      {/* Attributes: className, style objects, camelCase events */}
      <p className="muted" style={{ fontStyle: "italic" }}>
        Speaks: {languages.join(", ")}
      </p>

      {/* SVG works in JSX too. Note the camelCase strokeWidth. D3 charts use this. */}
      <svg width={220} height={60} style={{ border: "1px dashed #ccc" }}>
        <circle cx={30} cy={30} r={20} fill="#e0803a" />
        <rect x={60} y={10} width={60} height={40} rx={6} fill="#2c9a6a" />
        <line x1={140} y1={10} x2={200} y2={50} stroke="#c2477f" strokeWidth={4} strokeLinecap="round" />
      </svg>
    </>
  );
}
