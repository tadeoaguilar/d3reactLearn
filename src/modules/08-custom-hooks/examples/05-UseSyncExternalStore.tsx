/**
 * Example 08.05: useSyncExternalStore for browser APIs and a tiny global store.
 */
import { useCallback, useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// 1. A media query hook (e.g. dark mode, narrow screens)
// ---------------------------------------------------------------------------
export function useMediaQuery(query: string): boolean {
  // useCallback: a new subscribe function would make React unsubscribe and
  // re-subscribe on every render. Now it only happens when `query` changes.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  // The snapshot is a boolean: a stable primitive ✅
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches);
}

// ---------------------------------------------------------------------------
// 2. Online status
// ---------------------------------------------------------------------------
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}
export const useOnlineStatus = () => useSyncExternalStore(subscribeOnline, () => navigator.onLine);

// ---------------------------------------------------------------------------
// 3. A minimal global store: shared state WITHOUT context
// ---------------------------------------------------------------------------
function createStore<T>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(updater: (s: T) => T) {
      state = updater(state); // must produce a NEW object for changes
      listeners.forEach((l) => l());
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

const selectionStore = createStore<{ selected: string | null; clicks: number }>({ selected: null, clicks: 0 });

function useSelection() {
  return useSyncExternalStore(selectionStore.subscribe, selectionStore.get);
}

function Picker() {
  return (
    <div className="row">
      {["🍎", "🍌", "🍒", "🥝"].map((f) => (
        <button key={f} className="btn" onClick={() => selectionStore.set((s) => ({ selected: f, clicks: s.clicks + 1 }))}>
          {f}
        </button>
      ))}
    </div>
  );
}

function Display() {
  const { selected, clicks } = useSelection();
  return (
    <div className="card">
      Selected: {selected ?? "—"} · total clicks: {clicks}
    </div>
  );
}

export default function UseSyncExternalStoreExample() {
  const narrow = useMediaQuery("(max-width: 900px)");
  const dark = useMediaQuery("(prefers-color-scheme: dark)");
  const online = useOnlineStatus();

  return (
    <div className="stack">
      <div className="card">
        <div>Viewport ≤ 900px: {narrow ? "yes 📱" : "no 🖥"} (resize the window)</div>
        <div>Prefers dark mode: {dark ? "yes 🌙" : "no ☀️"} (switch your OS theme)</div>
        <div>Online: {online ? "yes 🟢" : "no 🔴"} (DevTools → Network → Offline)</div>
      </div>
      <p>
        Two components, no shared parent state, no context. They share a module-level store through{" "}
        <code>useSyncExternalStore</code>:
      </p>
      <Picker />
      <Display />
      <Display />
    </div>
  );
}
