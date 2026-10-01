/**
 * Example 02.01: useState basics, and why a plain variable doesn't work.
 */
import { useState } from "react";

function BrokenCounter() {
  let count = 0; // resets to 0 on every render, and changing it doesn't re-render
  return (
    <button
      className="btn"
      onClick={() => {
        count++;
        console.log("BrokenCounter local variable is now", count);
      }}
    >
      Broken: {count} (check the console)
    </button>
  );
}

function Counter({ step = 1 }: { step?: number }) {
  const [count, setCount] = useState(0);
  return (
    <div className="row">
      <button className="btn" onClick={() => setCount(count - step)}>
        −{step}
      </button>
      <strong style={{ minWidth: 40, textAlign: "center" }}>{count}</strong>
      <button className="btn" onClick={() => setCount(count + step)}>
        +{step}
      </button>
      <button className="btn" onClick={() => setCount(0)}>
        reset
      </button>
    </div>
  );
}

export default function CounterExample() {
  return (
    <div className="stack">
      <BrokenCounter />
      {/* Each <Counter> has its OWN state. State belongs to the component instance. */}
      <Counter />
      <Counter step={5} />
      <Counter step={10} />
    </div>
  );
}
