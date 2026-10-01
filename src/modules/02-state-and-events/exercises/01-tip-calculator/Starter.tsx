/**
 * Exercise 02.1: Tip calculator. See README.md.
 */
import { useState } from "react";

const TIP_OPTIONS = [10, 15, 20, 25];

const money = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export default function TipCalculator() {
  // TODO 1: declare exactly three pieces of state: bill, tipPercent, people.

  // TODO: derive tip, total, perPerson and tipPerPerson from the state.
  const tip = 0;
  const total = 0;
  const perPerson = 0;
  const tipPerPerson = 0;

  return (
    <div className="stack" style={{ maxWidth: 420 }}>
      <label className="row">
        Bill
        {/* TODO 2: make this a controlled input */}
        <input type="number" min={0} />
      </label>

      <div className="row">
        Tip
        {TIP_OPTIONS.map((pct) => (
          // TODO 4: add the "primary" class when this is the active option, and set the tip on click
          <button key={pct} className="btn">
            {pct}%
          </button>
        ))}
        {/* TODO 2: custom percentage input */}
        <input type="number" min={0} style={{ width: 70 }} placeholder="custom" />
      </div>

      <div className="row">
        People
        {/* TODO 3: − and + buttons; people never below 1 */}
        <button className="btn">−</button>
        <strong>?</strong>
        <button className="btn">+</button>
      </div>

      <div className="card">
        <div>Tip: {money(tip)}</div>
        <div>Total: {money(total)}</div>
        <div>
          Per person: <strong>{money(perPerson)}</strong> (tip {money(tipPerPerson)})
        </div>
      </div>

      {/* TODO 6: SVG bar showing the bill vs tip split */}

      {/* TODO 5: Reset button */}
    </div>
  );
}
