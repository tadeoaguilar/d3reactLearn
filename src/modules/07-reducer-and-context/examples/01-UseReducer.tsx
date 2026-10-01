/**
 * Example 07.01: useReducer with typed actions, driving a small chart.
 *
 * Every change to the dataset goes through one reducer. The buttons only
 * describe WHAT happened.
 */
import { useReducer } from "react";

interface Bar {
  id: number;
  label: string;
  value: number;
}

interface State {
  bars: Bar[];
  selectedId: number | null;
  sort: "none" | "asc" | "desc";
  nextId: number;
}

type Action =
  | { type: "added"; label: string }
  | { type: "removed"; id: number }
  | { type: "incremented"; id: number; by: number }
  | { type: "selected"; id: number | null }
  | { type: "sortCycled" }
  | { type: "reset" };

const initialState: State = {
  bars: [
    { id: 1, label: "A", value: 30 },
    { id: 2, label: "B", value: 80 },
    { id: 3, label: "C", value: 45 },
    { id: 4, label: "D", value: 60 },
  ],
  selectedId: null,
  sort: "none",
  nextId: 5,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "added":
      return {
        ...state,
        bars: [...state.bars, { id: state.nextId, label: action.label, value: 20 }],
        nextId: state.nextId + 1,
      };
    case "removed":
      return {
        ...state,
        bars: state.bars.filter((b) => b.id !== action.id),
        // Keep related state consistent in ONE place
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };
    case "incremented":
      return {
        ...state,
        bars: state.bars.map((b) => (b.id === action.id ? { ...b, value: Math.max(0, b.value + action.by) } : b)),
      };
    case "selected":
      return { ...state, selectedId: action.id };
    case "sortCycled":
      return { ...state, sort: state.sort === "none" ? "asc" : state.sort === "asc" ? "desc" : "none" };
    case "reset":
      return initialState;
    default: {
      // If you add an Action variant and forget a case, this line errors.
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export default function UseReducerExample() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Derived: sorted view
  const bars =
    state.sort === "none" ? state.bars : state.bars.toSorted((a, b) => (state.sort === "asc" ? a.value - b.value : b.value - a.value));
  const selected = state.bars.find((b) => b.id === state.selectedId);
  const max = Math.max(100, ...bars.map((b) => b.value));

  return (
    <div className="stack">
      <div className="row">
        <button className="btn" onClick={() => dispatch({ type: "added", label: String.fromCharCode(64 + state.nextId) })}>
          Add bar
        </button>
        <button className="btn" onClick={() => dispatch({ type: "sortCycled" })}>
          Sort: {state.sort}
        </button>
        <button className="btn" onClick={() => dispatch({ type: "reset" })}>
          Reset
        </button>
      </div>

      <svg width={Math.max(300, bars.length * 50)} height={170}>
        {bars.map((b, i) => {
          const h = (b.value / max) * 140;
          return (
            <g key={b.id} transform={`translate(${i * 50},0)`} onClick={() => dispatch({ type: "selected", id: b.id })} style={{ cursor: "pointer" }}>
              <rect x={5} y={140 - h} width={40} height={h} rx={3} fill={b.id === state.selectedId ? "#e0803a" : "#2f6fdf"} />
              <text x={25} y={156} textAnchor="middle">
                {b.label}
              </text>
              <text x={25} y={136 - h} textAnchor="middle">
                {b.value}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="card row">
        {selected ? (
          <>
            Selected <strong>{selected.label}</strong>
            <button className="btn" onClick={() => dispatch({ type: "incremented", id: selected.id, by: 10 })}>
              +10
            </button>
            <button className="btn" onClick={() => dispatch({ type: "incremented", id: selected.id, by: -10 })}>
              −10
            </button>
            <button className="btn" onClick={() => dispatch({ type: "removed", id: selected.id })}>
              Remove
            </button>
            <button className="btn" onClick={() => dispatch({ type: "selected", id: null })}>
              Deselect
            </button>
          </>
        ) : (
          <span className="muted">Click a bar to select it.</span>
        )}
      </div>
    </div>
  );
}
