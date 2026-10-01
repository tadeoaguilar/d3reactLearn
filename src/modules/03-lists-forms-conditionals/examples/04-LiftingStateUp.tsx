/**
 * Example 03.04: lifting state up.
 *
 * The picker and both "charts" need the same `selectedMonth`, so the state
 * lives in their common parent. Clicking a bar also updates it, so the
 * data flows both ways through props and callbacks.
 */
import { useState } from "react";
import { monthlyFinance } from "../../../shared/data";

interface MonthPickerProps {
  value: string | null;
  onChange: (month: string | null) => void;
}

function MonthPicker({ value, onChange }: MonthPickerProps) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">All months</option>
      {monthlyFinance.map((m) => (
        <option key={m.month} value={m.month}>
          {m.month}
        </option>
      ))}
    </select>
  );
}

interface BarsProps {
  field: "revenue" | "expenses";
  color: string;
  selected: string | null;
  onSelect: (month: string) => void;
}

/** A tiny hand-rolled bar chart (D3 isn't needed for this). */
function Bars({ field, color, selected, onSelect }: BarsProps) {
  const max = Math.max(...monthlyFinance.map((m) => m[field]));
  const w = 26;
  const h = 100;
  return (
    <svg width={monthlyFinance.length * (w + 4)} height={h + 16}>
      {monthlyFinance.map((m, i) => {
        const bh = (m[field] / max) * h;
        const dim = selected !== null && selected !== m.month;
        return (
          <g key={m.month} transform={`translate(${i * (w + 4)},0)`} onClick={() => onSelect(m.month)} style={{ cursor: "pointer" }}>
            <rect y={h - bh} width={w} height={bh} fill={color} opacity={dim ? 0.25 : 1} rx={2} />
            <text x={w / 2} y={h + 12} textAnchor="middle" fontSize={9}>
              {m.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function LiftingStateUp() {
  // The single source of truth, shared by three children.
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const record = monthlyFinance.find((m) => m.month === selectedMonth);

  return (
    <div className="stack">
      <div className="row">
        Filter: <MonthPicker value={selectedMonth} onChange={setSelectedMonth} />
        {record && (
          <span>
            Revenue ${record.revenue.toLocaleString()} · Expenses ${record.expenses.toLocaleString()} · Profit{" "}
            <strong>${record.profit.toLocaleString()}</strong>
          </span>
        )}
      </div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="card">
          <div className="muted">Revenue</div>
          <Bars field="revenue" color="#2f6fdf" selected={selectedMonth} onSelect={setSelectedMonth} />
        </div>
        <div className="card">
          <div className="muted">Expenses</div>
          <Bars field="expenses" color="#e0803a" selected={selectedMonth} onSelect={setSelectedMonth} />
        </div>
      </div>
    </div>
  );
}
