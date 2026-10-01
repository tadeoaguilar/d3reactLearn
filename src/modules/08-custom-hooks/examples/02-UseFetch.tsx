/**
 * Example 08.02: useFetch<T>, a reusable, abortable data-fetching hook.
 */
import { useCallback, useEffect, useState } from "react";

export type FetchResult<T> =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "error"; data?: undefined; error: Error }
  | { status: "success"; data: T; error?: undefined };

export function useFetch<T>(url: string) {
  const [result, setResult] = useState<FetchResult<T>>({ status: "loading" });
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setResult({ status: "loading" });
    fetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return (await res.json()) as T;
      })
      .then((data) => setResult({ status: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setResult({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
      });
    return () => controller.abort();
  }, [url, reloadToken]); // changing reloadToken re-runs the effect

  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);
  return { ...result, isLoading: result.status === "loading", refetch };
}

// ---------------------------------------------------------------------------

interface City {
  city: string;
  country: string;
  population: number;
}

export default function UseFetchExample() {
  const [url, setUrl] = useState("/data/cities.json");
  const { status, data, error, isLoading, refetch } = useFetch<City[]>(url);

  const top = data ? [...data].sort((a, b) => b.population - a.population).slice(0, 10) : [];
  const max = top[0]?.population ?? 1;

  return (
    <div className="stack">
      <div className="row">
        <select value={url} onChange={(e) => setUrl(e.target.value)}>
          <option value="/data/cities.json">/data/cities.json</option>
          <option value="/data/does-not-exist.json">/data/does-not-exist.json (error)</option>
        </select>
        <button className="btn" onClick={refetch}>
          Refetch
        </button>
        <span className="muted">status: {status}</span>
      </div>

      {isLoading && <p>Loading…</p>}
      {error && <p style={{ color: "var(--danger)" }}>⚠ {error.message}</p>}
      {data && (
        <svg width={460} height={top.length * 22}>
          {top.map((c, i) => (
            <g key={c.city} transform={`translate(0,${i * 22})`}>
              <text x={100} y={14} textAnchor="end">
                {c.city}
              </text>
              <rect x={108} y={3} height={15} width={(c.population / max) * 300} fill="#2c9a6a" rx={2} />
              <text x={112 + (c.population / max) * 300} y={14}>
                {c.population}M
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
