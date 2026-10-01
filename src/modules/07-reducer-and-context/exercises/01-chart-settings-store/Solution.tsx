/**
 * Exercise 07.1: reference solution.
 */
import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from "react";
import { randomWalk } from "../../../../shared/data";

interface Settings {
  chartType: "bar" | "line";
  color: string;
  showGrid: boolean;
  smoothing: number;
}

const defaultSettings: Settings = { chartType: "bar", color: "#2f6fdf", showGrid: true, smoothing: 1 };
const series = randomWalk(40, 3).map((p) => p.value);

// ---------------------------------------------------------------------------
// Actions + reducers
// ---------------------------------------------------------------------------
type SettingsAction =
  | { type: "typeChanged"; chartType: Settings["chartType"] }
  | { type: "colorChanged"; color: string }
  | { type: "gridToggled" }
  | { type: "smoothingChanged"; smoothing: number }
  | { type: "reset" };

type Action = SettingsAction | { type: "undo" } | { type: "redo" };

interface History {
  past: Settings[];
  present: Settings;
  future: Settings[];
}

/** The plain settings reducer: knows nothing about history. */
function settingsReducer(s: Settings, a: SettingsAction): Settings {
  switch (a.type) {
    case "typeChanged":
      return { ...s, chartType: a.chartType };
    case "colorChanged":
      return { ...s, color: a.color };
    case "gridToggled":
      return { ...s, showGrid: !s.showGrid };
    case "smoothingChanged":
      return { ...s, smoothing: a.smoothing };
    case "reset":
      return defaultSettings;
  }
}

const sameSettings = (a: Settings, b: Settings) =>
  a.chartType === b.chartType && a.color === b.color && a.showGrid === b.showGrid && a.smoothing === b.smoothing;

/** Wraps settingsReducer with undo/redo. This "reducer enhancer" pattern works with any reducer. */
function historyReducer(h: History, a: Action): History {
  switch (a.type) {
    case "undo": {
      if (h.past.length === 0) return h;
      const previous = h.past[h.past.length - 1];
      return { past: h.past.slice(0, -1), present: previous, future: [h.present, ...h.future] };
    }
    case "redo": {
      if (h.future.length === 0) return h;
      const [next, ...rest] = h.future;
      return { past: [...h.past, h.present], present: next, future: rest };
    }
    default: {
      const next = settingsReducer(h.present, a);
      if (sameSettings(next, h.present)) return h; // no-op: no history entry
      return { past: [...h.past, h.present], present: next, future: [] };
    }
  }
}

// ---------------------------------------------------------------------------
// Contexts + hooks
// ---------------------------------------------------------------------------
interface SettingsValue extends Settings {
  canUndo: boolean;
  canRedo: boolean;
}

const SettingsContext = createContext<SettingsValue | null>(null);
const DispatchContext = createContext<Dispatch<Action> | null>(null);

function SettingsProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(historyReducer, { past: [], present: defaultSettings, future: [] });
  const value: SettingsValue = {
    ...history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
  return (
    <DispatchContext value={dispatch}>
      <SettingsContext value={value}>{children}</SettingsContext>
    </DispatchContext>
  );
}

function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside <SettingsProvider>");
  return ctx;
}

function useSettingsDispatch() {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error("useSettingsDispatch must be used inside <SettingsProvider>");
  return ctx;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function UndoShortcuts() {
  const dispatch = useSettingsDispatch();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      dispatch({ type: e.shiftKey ? "redo" : "undo" });
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dispatch]); // dispatch is stable, so this subscribes once
  return null;
}

function SettingsPanel() {
  const s = useSettings();
  const dispatch = useSettingsDispatch();
  return (
    <div className="card stack" style={{ minWidth: 240 }}>
      <div className="row">
        {(["bar", "line"] as const).map((t) => (
          <button key={t} className={`btn ${s.chartType === t ? "primary" : ""}`} onClick={() => dispatch({ type: "typeChanged", chartType: t })}>
            {t}
          </button>
        ))}
      </div>
      <label className="row">
        Color <input type="color" value={s.color} onChange={(e) => dispatch({ type: "colorChanged", color: e.target.value })} />
      </label>
      <label>
        <input type="checkbox" checked={s.showGrid} onChange={() => dispatch({ type: "gridToggled" })} /> Show grid
      </label>
      <label>
        Smoothing: {s.smoothing}
        <input
          type="range"
          min={1}
          max={10}
          value={s.smoothing}
          onChange={(e) => dispatch({ type: "smoothingChanged", smoothing: e.target.valueAsNumber })}
        />
      </label>
      <div className="row">
        <button className="btn" disabled={!s.canUndo} onClick={() => dispatch({ type: "undo" })}>
          ↶ Undo
        </button>
        <button className="btn" disabled={!s.canRedo} onClick={() => dispatch({ type: "redo" })}>
          ↷ Redo
        </button>
        <button className="btn" onClick={() => dispatch({ type: "reset" })}>
          Reset
        </button>
      </div>
      <span className="muted" style={{ fontSize: 12 }}>
        ⌘/Ctrl+Z undo · ⌘/Ctrl+Shift+Z redo
      </span>
    </div>
  );
}

function movingAverage(values: number[], window: number) {
  if (window <= 1) return values;
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

function PreviewChart() {
  const { chartType, color, showGrid, smoothing } = useSettings();
  const W = 440;
  const H = 220;
  const values = movingAverage(series, smoothing);
  const min = Math.min(...series) * 0.95;
  const max = Math.max(...series) * 1.05;
  const x = (i: number) => (i / values.length) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const step = W / values.length;

  return (
    <svg width={W} height={H} className="card" style={{ padding: 0 }}>
      {showGrid &&
        [0.25, 0.5, 0.75].map((f) => <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="var(--chart-grid)" />)}
      {chartType === "bar"
        ? values.map((v, i) => <rect key={i} x={x(i) + 1} y={y(v)} width={step - 2} height={H - y(v)} fill={color} />)
        : (
            <polyline
              points={values.map((v, i) => `${x(i) + step / 2},${y(v)}`).join(" ")}
              fill="none"
              stroke={color}
              strokeWidth={2.5}
            />
          )}
    </svg>
  );
}

export default function ChartSettingsStore() {
  return (
    <SettingsProvider>
      <UndoShortcuts />
      <div className="row" style={{ alignItems: "flex-start" }}>
        <SettingsPanel />
        <PreviewChart />
      </div>
    </SettingsProvider>
  );
}
