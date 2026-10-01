/**
 * Example 03.03: a controlled form that configures a chart.
 * Every input is driven by state; validation is derived.
 */
import { useState, type ChangeEvent, type FormEvent } from "react";

interface ChartForm {
  title: string;
  type: "bar" | "line" | "area";
  points: number;
  color: string;
  showGrid: boolean;
}

const initialForm: ChartForm = { title: "My chart", type: "bar", points: 8, color: "#2f6fdf", showGrid: true };

export default function ControlledForms() {
  const [form, setForm] = useState<ChartForm>(initialForm);
  const [submitted, setSubmitted] = useState<ChartForm | null>(null);

  // One handler for every input, using the `name` attribute.
  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const target = e.target;
    const value =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target instanceof HTMLInputElement && (target.type === "number" || target.type === "range")
          ? target.valueAsNumber
          : target.value;
    setForm((f) => ({ ...f, [target.name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the page reload
    setSubmitted(form);
  }

  // Derived validation
  const titleError = form.title.trim().length === 0 ? "Title is required" : null;
  const pointsError = form.points < 2 || form.points > 30 ? "Points must be 2–30" : null;
  const canSubmit = !titleError && !pointsError;

  return (
    <div className="row" style={{ alignItems: "flex-start" }}>
      <form className="card stack" onSubmit={handleSubmit} style={{ minWidth: 280 }}>
        <label>
          Title <input type="text" name="title" value={form.title} onChange={handleChange} />
          {titleError && <div style={{ color: "var(--danger)", fontSize: 12 }}>{titleError}</div>}
        </label>
        <label>
          Type{" "}
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="area">Area</option>
          </select>
        </label>
        <label>
          Points: {form.points}
          <input type="range" name="points" min={2} max={30} value={form.points} onChange={handleChange} />
          {pointsError && <div style={{ color: "var(--danger)", fontSize: 12 }}>{pointsError}</div>}
        </label>
        <label>
          Color <input type="color" name="color" value={form.color} onChange={handleChange} />
        </label>
        <label>
          <input type="checkbox" name="showGrid" checked={form.showGrid} onChange={handleChange} /> Show grid
        </label>
        <div className="row">
          <button className="btn primary" type="submit" disabled={!canSubmit}>
            Apply
          </button>
          <button className="btn" type="button" onClick={() => setForm(initialForm)}>
            Reset
          </button>
        </div>
      </form>

      <div className="card" style={{ flex: 1, minWidth: 260 }}>
        <strong>Live state</strong>
        <pre className="log">{JSON.stringify(form, null, 2)}</pre>
        <strong>Last submitted</strong>
        <pre className="log">{submitted ? JSON.stringify(submitted, null, 2) : "—"}</pre>
      </div>
    </div>
  );
}
