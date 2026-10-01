/**
 * Example 02.04: updating objects and arrays immutably.
 */
import { useState } from "react";

interface Task {
  id: number;
  title: string;
  done: boolean;
}

interface ChartConfig {
  title: string;
  axis: { label: string; ticks: number };
}

let nextId = 4;

export default function ObjectsAndArrays() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: "Learn useState", done: true },
    { id: 2, title: "Learn useEffect", done: false },
    { id: 3, title: "Draw a D3 chart", done: false },
  ]);
  const [draft, setDraft] = useState("");
  const [config, setConfig] = useState<ChartConfig>({ title: "Revenue", axis: { label: "USD", ticks: 5 } });

  // ADD: a new array with the old items plus one
  const add = () => {
    if (!draft.trim()) return;
    setTasks((ts) => [...ts, { id: nextId++, title: draft.trim(), done: false }]);
    setDraft("");
  };
  // UPDATE: map, and replace the matching item with a copy
  const toggle = (id: number) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  // REMOVE: filter it out
  const remove = (id: number) => setTasks((ts) => ts.filter((t) => t.id !== id));
  // SORT: copy first (sort() mutates!)
  const sortByTitle = () => setTasks((ts) => [...ts].sort((a, b) => a.title.localeCompare(b.title)));

  // Derived values: computed each render, never stored in state
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <div className="card stack" style={{ flex: 1, minWidth: 280 }}>
        <strong>
          Tasks ({doneCount}/{tasks.length} done)
        </strong>
        <div className="row">
          <input
            type="text"
            value={draft}
            placeholder="New task"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button className="btn" onClick={add}>
            Add
          </button>
          <button className="btn" onClick={sortByTitle}>
            Sort A–Z
          </button>
        </div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {tasks.map((t) => (
            <li key={t.id}>
              <label>
                <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />{" "}
                <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
              </label>{" "}
              <button className="link-button" onClick={() => remove(t.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="card stack" style={{ flex: 1, minWidth: 280 }}>
        <strong>Nested object state</strong>
        <label>
          Title{" "}
          <input type="text" value={config.title} onChange={(e) => setConfig({ ...config, title: e.target.value })} />
        </label>
        <label>
          Axis label{" "}
          <input
            type="text"
            value={config.axis.label}
            // Spread at EVERY level you change
            onChange={(e) => setConfig({ ...config, axis: { ...config.axis, label: e.target.value } })}
          />
        </label>
        <label>
          Ticks{" "}
          <input
            type="number"
            min={2}
            max={10}
            value={config.axis.ticks}
            onChange={(e) => setConfig({ ...config, axis: { ...config.axis, ticks: Number(e.target.value) } })}
          />
        </label>
        <pre className="log">{JSON.stringify(config, null, 2)}</pre>
      </div>
    </div>
  );
}
