/**
 * Exercise 02.1: reference solution.
 */
import { useState } from "react";

const TIP_OPTIONS = [10, 15, 20, 25];
const DEFAULTS = { bill: 50, tipPercent: 15, people: 2 };
const BAR_WIDTH = 300;

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function TipCalculator() {
  // Minimal state: three inputs.
  const [bill, setBill] = useState(DEFAULTS.bill);
  const [tipPercent, setTipPercent] = useState(DEFAULTS.tipPercent);
  const [people, setPeople] = useState(DEFAULTS.people);

  // Everything else is derived during render.
  const tip = bill * (tipPercent / 100);
  const total = bill + tip;
  const perPerson = total / people;
  const tipPerPerson = tip / people;

  // SVG widths are proportional to the amounts (a "linear scale" by hand;
  // D3 will do this for us in Module 09).
  const billWidth = total > 0 ? (bill / total) * BAR_WIDTH : 0;
  const tipWidth = BAR_WIDTH - billWidth;

  function reset() {
    setBill(DEFAULTS.bill);
    setTipPercent(DEFAULTS.tipPercent);
    setPeople(DEFAULTS.people);
  }

  return (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="row">
        Bill
        <input
          type="number"
          min={0}
          value={bill}
          // valueAsNumber is NaN for an empty field; fall back to 0.
          onChange={(e) => setBill(Number.isNaN(e.target.valueAsNumber) ? 0 : e.target.valueAsNumber)}
        />
      </label>

      <div className="row">
        Tip
        {TIP_OPTIONS.map((pct) => (
          <button key={pct} className={`btn ${pct === tipPercent ? "primary" : ""}`} onClick={() => setTipPercent(pct)}>
            {pct}%
          </button>
        ))}
        <input
          type="number"
          min={0}
          style={{ width: 70 }}
          placeholder="custom"
          value={TIP_OPTIONS.includes(tipPercent) ? "" : tipPercent}
          onChange={(e) => setTipPercent(Number(e.target.value) || 0)}
        />
      </div>

      <div className="row">
        People
        <button className="btn" onClick={() => setPeople((p) => Math.max(1, p - 1))} disabled={people <= 1}>
          −
        </button>
        <strong>{people}</strong>
        <button className="btn" onClick={() => setPeople((p) => p + 1)}>
          +
        </button>
      </div>

      <div className="card">
        <div>Tip: {money(tip)}</div>
        <div>Total: {money(total)}</div>
        <div>
          Per person: <strong>{money(perPerson)}</strong> (tip {money(tipPerPerson)})
        </div>
      </div>

      <svg width={BAR_WIDTH} height={40} role="img" aria-label="Bill versus tip">
        <rect x={0} y={0} width={billWidth} height={24} fill="#2f6fdf" />
        <rect x={billWidth} y={0} width={tipWidth} height={24} fill="#e0803a" />
        <text x={0} y={37}>
          bill {Math.round((bill / (total || 1)) * 100)}%
        </text>
        <text x={BAR_WIDTH} y={37} textAnchor="end">
          tip {Math.round((tip / (total || 1)) * 100)}%
        </text>
      </svg>

      <button className="btn" onClick={reset} style={{ alignSelf: "flex-start" }}>
        Reset
      </button>
    </div>
  );
}
