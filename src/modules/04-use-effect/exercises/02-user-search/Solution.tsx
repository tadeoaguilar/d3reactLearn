/**
 * Exercise 04.2: reference solution.
 */
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  role: string;
  country: string;
}

type FetchState = { status: "loading" } | { status: "error"; error: string } | { status: "success"; users: User[] };

const URL = "/data/users.json";
const DEBOUNCE_MS = 300;
const BAR_MAX = 200;

export default function UserSearch() {
  const [state, setState] = useState<FetchState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // 1. Load once, abortable
  useEffect(() => {
    const controller = new AbortController();
    fetch(URL, { signal: controller.signal })
      .then((res) => {
        // fetch only rejects on NETWORK errors. HTTP errors need a check.
        if (!res.ok) throw new Error(`HTTP ${res.status} loading ${URL}`);
        return res.json() as Promise<User[]>;
      })
      .then((users) => setState({ status: "success", users }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
      });
    return () => controller.abort();
  }, []);

  // 3. Debounce: each keystroke restarts the timer
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  if (state.status === "loading") return <p>Loading…</p>;
  if (state.status === "error") return <p style={{ color: "var(--danger)" }}>Error: {state.error}</p>;

  // 2. Derived: filtered users
  const q = debouncedQuery.trim().toLowerCase();
  const users = state.users.filter((u) => u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));

  // 5. Derived: counts per role, sorted descending
  const counts = Object.entries(
    users.reduce<Record<string, number>>((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const maxCount = Math.max(1, ...counts.map(([, n]) => n));

  return (
    <div className="stack">
      <input
        type="search"
        placeholder="Search by name or role…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="muted" style={{ minHeight: 20 }}>
        {query !== debouncedQuery ? "Searching…" : `${users.length} of ${state.users.length} users`}
      </div>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — <span className="muted">{u.role}</span>
          </li>
        ))}
      </ul>
      <svg width={360} height={counts.length * 22} role="img" aria-label="Users per role">
        {counts.map(([role, n], i) => (
          <g key={role} transform={`translate(0, ${i * 22})`}>
            <text x={130} y={14} textAnchor="end">
              {role}
            </text>
            <rect x={140} y={3} width={(n / maxCount) * BAR_MAX} height={15} fill="#2c9a6a" rx={2} />
            <text x={140 + (n / maxCount) * BAR_MAX + 4} y={14}>
              {n}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
