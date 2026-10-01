/**
 * Example 08.01: useLocalStorage, a generic hook that persists state.
 * Change the settings, then reload the page. They're still there.
 */
import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Lazy initializer: read storage only once, on mount.
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue; // private mode, corrupted JSON, …
    }
  });

  // Sync to storage whenever the value changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or unavailable: ignore */
    }
  }, [key, value]);

  // `as const` → typed as [T, Dispatch<SetStateAction<T>>], not an array of unions.
  return [value, setValue] as const;
}

interface ChartPrefs {
  palette: "cool" | "warm";
  barCount: number;
}

export default function UseLocalStorageExample() {
  const [name, setName] = useLocalStorage("lab:name", "");
  const [prefs, setPrefs] = useLocalStorage<ChartPrefs>("lab:chartPrefs", { palette: "cool", barCount: 6 });

  const colors = prefs.palette === "cool" ? ["#2f6fdf", "#2c9a6a", "#7b5cd6"] : ["#e0803a", "#c2477f", "#a08a2b"];

  return (
    <div className="stack">
      <label className="row">
        Your name: <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      {name && <p>Welcome back, {name}! 👋</p>}

      <div className="row">
        Palette:
        {(["cool", "warm"] as const).map((p) => (
          <button key={p} className={`btn ${prefs.palette === p ? "primary" : ""}`} onClick={() => setPrefs((x) => ({ ...x, palette: p }))}>
            {p}
          </button>
        ))}
        <label>
          Bars: {prefs.barCount}{" "}
          <input
            type="range"
            min={2}
            max={12}
            value={prefs.barCount}
            onChange={(e) => setPrefs((x) => ({ ...x, barCount: e.target.valueAsNumber }))}
          />
        </label>
      </div>
      <svg width={prefs.barCount * 30} height={80}>
        {Array.from({ length: prefs.barCount }, (_, i) => {
          const h = 20 + ((i * 37) % 60);
          return <rect key={i} x={i * 30} y={80 - h} width={24} height={h} fill={colors[i % colors.length]} rx={3} />;
        })}
      </svg>
      <button
        className="btn"
        style={{ alignSelf: "flex-start" }}
        onClick={() => {
          setName("");
          setPrefs({ palette: "cool", barCount: 6 });
        }}
      >
        Reset saved values
      </button>
    </div>
  );
}
