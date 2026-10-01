/**
 * Example 00.01: TypeScript ideas in a tiny React component.
 *
 * Hover over the variables in your editor to see what TypeScript infers.
 */
import { useState } from "react";

// 1. An interface describes the shape of one data row.
interface Planet {
  name: string;
  diameterKm: number;
  moons: number;
  hasRings?: boolean; // optional
}

// 2. A union of string literals: only these three values are allowed.
type SortKey = "name" | "diameterKm" | "moons";

// 3. A discriminated union: each variant has its own fields.
type Selection = { kind: "none" } | { kind: "planet"; planet: Planet };

const planets: Planet[] = [
  { name: "Mercury", diameterKm: 4879, moons: 0 },
  { name: "Earth", diameterKm: 12742, moons: 1 },
  { name: "Jupiter", diameterKm: 139820, moons: 95, hasRings: true },
  { name: "Saturn", diameterKm: 116460, moons: 146, hasRings: true },
];

// 4. A generic function: works for any array of objects and any key of T.
function sortBy<T>(items: T[], key: keyof T): T[] {
  return [...items].sort((a, b) => (a[key] > b[key] ? 1 : a[key] < b[key] ? -1 : 0));
}

export default function TypesInAction() {
  // 5. Generic hooks: useState<SortKey> means the setter only accepts a SortKey.
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [selection, setSelection] = useState<Selection>({ kind: "none" });

  const sorted = sortBy(planets, sortKey);

  return (
    <div className="stack">
      <div className="row">
        <span>Sort by:</span>
        {(["name", "diameterKm", "moons"] as const).map((key) => (
          <button key={key} className={`btn ${key === sortKey ? "primary" : ""}`} onClick={() => setSortKey(key)}>
            {key}
          </button>
        ))}
      </div>

      <ul>
        {sorted.map((p) => (
          <li key={p.name}>
            <button className="link-button" onClick={() => setSelection({ kind: "planet", planet: p })}>
              {p.name}
            </button>{" "}
            — {p.diameterKm.toLocaleString()} km, {p.moons} moons
            {/* 6. Optional property: `hasRings` might be undefined */}
            {p.hasRings && " 💍"}
          </li>
        ))}
      </ul>

      <div className="card">
        {/* 7. Narrowing: inside the ternary TS knows which variant we have */}
        {selection.kind === "none" ? (
          <span className="muted">Click a planet name.</span>
        ) : (
          <span>
            Selected <strong>{selection.planet.name}</strong>: {selection.planet.moons} moons
          </span>
        )}
      </div>
    </div>
  );
}
