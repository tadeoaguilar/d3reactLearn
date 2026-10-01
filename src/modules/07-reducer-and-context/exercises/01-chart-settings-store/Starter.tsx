/**
 * Exercise 07.1: Chart settings store with undo. See README.md.
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

// TODO 1: Action union type

// TODO 3: History type

// TODO 2 + 3: reducer(history, action) => history

// TODO 4: contexts, SettingsProvider, useSettings(), useSettingsDispatch()

function SettingsPanel() {
  // TODO 5: controls + undo/redo buttons
  return <div className="todo-hint">SettingsPanel</div>;
}

function PreviewChart() {
  // TODO 5: draw `series` with the current settings
  return <div className="todo-hint">PreviewChart ({series.length} points)</div>;
}

export default function ChartSettingsStore() {
  // TODO 4: wrap in <SettingsProvider>
  // TODO 6: keyboard shortcuts (could live in a small <UndoShortcuts/> component)
  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <SettingsPanel />
      <PreviewChart />
    </div>
  );
}
