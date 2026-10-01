/**
 * Exercise 04.2: Debounced user search. See README.md.
 */
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  role: string;
  country: string;
}

// TODO 1: define a discriminated union type for the fetch state

export default function UserSearch() {
  // TODO 1: fetch state + effect that loads /data/users.json (with AbortController)

  // TODO 2 + 3: query and debouncedQuery state, plus the debounce effect
  const [query, setQuery] = useState("");

  // TODO 2: derive the filtered users from debouncedQuery
  const users: User[] = [];

  // TODO 5: derive counts per role for the chart

  return (
    <div className="stack">
      <input
        type="search"
        placeholder="Search by name or role…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {/* TODO 4: "Searching…" indicator */}
      {/* TODO 1: loading and error states */}
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — <span className="muted">{u.role}</span>
          </li>
        ))}
      </ul>
      {/* TODO 5: SVG bar chart of roles */}
    </div>
  );
}
