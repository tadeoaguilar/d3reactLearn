/**
 * Example 07.03: reducer + context as a small dashboard store.
 *
 * In a real app the store section would be its own file (dashboardStore.tsx)
 * exporting DashboardProvider, useDashboardState and useDashboardDispatch.
 *
 * Note which components re-render: <Controls> reads only dispatch, so it
 * does NOT re-render when state changes.
 */
import { createContext, memo, useContext, useReducer, useRef, type Dispatch, type ReactNode } from "react";
import { monthlyFinance } from "../../../shared/data";

// ============================================================================
// Store
// ============================================================================
type Metric = "revenue" | "expenses" | "profit";

interface DashboardState {
  metric: Metric;
  selectedMonth: string | null;
  highlightAbove: number | null;
}

type DashboardAction =
  | { type: "metricChanged"; metric: Metric }
  | { type: "monthToggled"; month: string }
  | { type: "thresholdChanged"; value: number | null }
  | { type: "cleared" };

const initialState: DashboardState = { metric: "revenue", selectedMonth: null, highlightAbove: null };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "metricChanged":
      return { ...state, metric: action.metric, highlightAbove: null };
    case "monthToggled":
      return { ...state, selectedMonth: state.selectedMonth === action.month ? null : action.month };
    case "thresholdChanged":
      return { ...state, highlightAbove: action.value };
    case "cleared":
      return initialState;
  }
}

// Two contexts: state (changes) and dispatch (never changes)
const StateContext = createContext<DashboardState | null>(null);
const DispatchContext = createContext<Dispatch<DashboardAction> | null>(null);

function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  return (
    <DispatchContext value={dispatch}>
      <StateContext value={state}>{children}</StateContext>
    </DispatchContext>
  );
}

function useDashboardState() {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error("useDashboardState must be used inside <DashboardProvider>");
  return ctx;
}

function useDashboardDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useDashboardDispatch must be used inside <DashboardProvider>");
  return ctx;
}

// ============================================================================
// Components (these could be in any file, at any depth)
// ============================================================================
function useRenders() {
  const r = useRef(0);
  r.current++;
  return r.current;
}

// memo: this component has no props, so the only thing that could
// re-render it is a context it reads, and it reads only dispatch.
const Controls = memo(function Controls() {
  const dispatch = useDashboardDispatch();
  const renders = useRenders();
  return (
    <div className="row">
      {(["revenue", "expenses", "profit"] as const).map((m) => (
        <button key={m} className="btn" onClick={() => dispatch({ type: "metricChanged", metric: m })}>
          {m}
        </button>
      ))}
      <button className="btn" onClick={() => dispatch({ type: "cleared" })}>
        clear
      </button>
      <span className="muted">Controls renders: {renders}</span>
    </div>
  );
});

function Threshold() {
  const { metric, highlightAbove } = useDashboardState();
  const dispatch = useDashboardDispatch();
  const max = Math.max(...monthlyFinance.map((m) => m[metric]));
  return (
    <label className="row">
      Highlight above:
      <input
        type="range"
        min={0}
        max={max}
        step={500}
        value={highlightAbove ?? 0}
        onChange={(e) => dispatch({ type: "thresholdChanged", value: e.target.valueAsNumber || null })}
      />
      {highlightAbove ? `$${highlightAbove.toLocaleString()}` : "off"}
    </label>
  );
}

function MonthlyBars() {
  const { metric, selectedMonth, highlightAbove } = useDashboardState();
  const dispatch = useDashboardDispatch();
  const renders = useRenders();
  const values = monthlyFinance.map((m) => m[metric]);
  const max = Math.max(...values);
  const H = 140;
  return (
    <div className="card">
      <strong>{metric} by month</strong> <span className="muted">(renders: {renders})</span>
      <svg width={12 * 36} height={H + 18} style={{ display: "block" }}>
        {monthlyFinance.map((m, i) => {
          const h = (m[metric] / max) * H;
          const hot = highlightAbove !== null && m[metric] > highlightAbove;
          const dim = selectedMonth !== null && selectedMonth !== m.month;
          return (
            <g key={m.month} transform={`translate(${i * 36},0)`} onClick={() => dispatch({ type: "monthToggled", month: m.month })} style={{ cursor: "pointer" }}>
              <rect x={3} y={H - h} width={30} height={h} rx={2} fill={hot ? "#e0803a" : "#2f6fdf"} opacity={dim ? 0.25 : 1} />
              <text x={18} y={H + 13} textAnchor="middle" fontSize={10}>
                {m.month}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Summary() {
  const { metric, selectedMonth } = useDashboardState();
  const rows = selectedMonth ? monthlyFinance.filter((m) => m.month === selectedMonth) : monthlyFinance;
  const total = rows.reduce((s, m) => s + m[metric], 0);
  return (
    <div className="card">
      Total {metric} {selectedMonth ? `in ${selectedMonth}` : "for the year"}: <strong>${total.toLocaleString()}</strong>
    </div>
  );
}

export default function ReducerPlusContext() {
  return (
    <DashboardProvider>
      <div className="stack">
        <Controls />
        <Threshold />
        <MonthlyBars />
        <Summary />
      </div>
    </DashboardProvider>
  );
}
