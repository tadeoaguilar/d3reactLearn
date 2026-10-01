/**
 * Example 06.03: useDeferredValue and useTransition.
 *
 * The "slow chart" deliberately takes ~1ms per bar to render. Type into
 * the box:
 *   - "direct": every keystroke waits for the slow chart, so the input lags
 *   - "deferred": the input stays smooth and the chart catches up
 */
import { memo, useDeferredValue, useState, useTransition } from "react";

function slowWork(ms: number) {
  const end = performance.now() + ms;
  while (performance.now() < end) {
    /* simulate expensive rendering */
  }
}

const SlowBars = memo(function SlowBars({ text }: { text: string }) {
  // One bar per character code in the text, padded to 120 bars.
  const values = Array.from({ length: 120 }, (_, i) => {
    const ch = text.charCodeAt(i % Math.max(1, text.length)) || 60;
    return ((ch * (i + 7)) % 97) + 3;
  });
  return (
    <svg width={480} height={100}>
      {values.map((v, i) => {
        slowWork(1); // ~1ms each → ~120ms per render
        return <rect key={i} x={i * 4} y={100 - v} width={3} height={v} fill="#7b5cd6" />;
      })}
    </svg>
  );
});

type Tab = "overview" | "heavy" | "notes";

function HeavyTab() {
  slowWork(400);
  return <p>This tab takes 400ms to render. Thanks to the transition, the old tab stayed interactive meanwhile.</p>;
}

export default function DeferredAndTransition() {
  const [mode, setMode] = useState<"direct" | "deferred">("deferred");
  const [text, setText] = useState("");
  const deferredText = useDeferredValue(text);
  const chartInput = mode === "deferred" ? deferredText : text;
  const isStale = text !== chartInput;

  const [tab, setTab] = useState<Tab>("overview");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="stack">
      <h4>useDeferredValue</h4>
      <div className="row">
        {(["direct", "deferred"] as const).map((m) => (
          <button key={m} className={`btn ${mode === m ? "primary" : ""}`} onClick={() => setMode(m)}>
            {m}
          </button>
        ))}
        <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="type quickly…" />
      </div>
      <div style={{ opacity: isStale ? 0.5 : 1, transition: "opacity 0.2s" }}>
        <SlowBars text={chartInput} />
      </div>

      <h4>useTransition</h4>
      <div className="row">
        {(["overview", "heavy", "notes"] as const).map((t) => (
          <button
            key={t}
            className={`btn ${tab === t ? "primary" : ""}`}
            onClick={() => startTransition(() => setTab(t))}
          >
            {t}
          </button>
        ))}
        {isPending && <span className="muted">loading tab…</span>}
      </div>
      <div className="card">
        {tab === "overview" && <p>Overview tab. Click "heavy", then click "notes" right away.</p>}
        {tab === "heavy" && <HeavyTab />}
        {tab === "notes" && <p>Notes tab: React dropped the unfinished "heavy" render to show this sooner.</p>}
      </div>
    </div>
  );
}
