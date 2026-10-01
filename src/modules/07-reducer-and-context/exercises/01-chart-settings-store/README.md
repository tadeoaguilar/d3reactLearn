# Exercise 07.1: Chart settings store with undo

Build a settings store for a chart using **reducer + context**, and add **undo/redo**. The same pattern handles zoom history in real dashboards.

## The state

```ts
interface Settings {
  chartType: "bar" | "line";
  color: string;          // hex
  showGrid: boolean;
  smoothing: number;      // 1 = raw data, 2–10 = moving-average window
}
```

## Tasks

1. **Actions**: write a discriminated union: `typeChanged`, `colorChanged`, `gridToggled`, `smoothingChanged`, `reset`.
2. **Reducer**: implement it. Keep it pure.
3. **Undo/redo**: wrap the state in a history structure:
   ```ts
   interface History { past: Settings[]; present: Settings; future: Settings[] }
   ```
   and add `undo` / `redo` actions.
   - Any normal action pushes `present` onto `past`, applies the change, and **clears `future`**.
   - `undo` moves `present` to the front of `future` and pops `past` into `present`.
   - `redo` does the opposite.
   - If an action doesn't change anything (for example, the same color twice), don't add a history entry.
4. **Provider + hooks**: `SettingsProvider`, `useSettings()` (the present settings plus `canUndo`/`canRedo`) and `useSettingsDispatch()`. Both hooks throw outside the provider. State and dispatch go in **separate contexts**.
5. **Components** (the starter has placeholders):
   - `SettingsPanel`: controls for every setting, plus Undo / Redo buttons (disabled when not possible)
   - `PreviewChart`: an SVG chart of `randomWalk(40)` using the settings. Bars or a polyline; optional horizontal grid lines; values smoothed with a moving average of window `smoothing`.
6. **Keyboard**: `Ctrl/Cmd + Z` undoes and `Ctrl/Cmd + Shift + Z` redoes (an effect with cleanup).

## Done when

- [ ] Every control updates the preview
- [ ] Undo/redo walk back and forth through the changes; a new change after undo clears redo
- [ ] Using either hook outside the provider throws a clear error
