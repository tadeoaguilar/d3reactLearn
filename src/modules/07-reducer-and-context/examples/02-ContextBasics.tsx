/**
 * Example 07.02: Context for "global-ish" settings.
 *
 * `ChartTheme` and `Locale` are provided at the top. Deeply nested
 * components read them directly, without prop drilling.
 */
import { createContext, useContext, useState, type ReactNode } from "react";

interface ChartTheme {
  name: string;
  bar: string;
  accent: string;
  radius: number;
}

const themes: Record<string, ChartTheme> = {
  ocean: { name: "ocean", bar: "#2f6fdf", accent: "#e0803a", radius: 2 },
  forest: { name: "forest", bar: "#2c9a6a", accent: "#a08a2b", radius: 6 },
  berry: { name: "berry", bar: "#c2477f", accent: "#7b5cd6", radius: 0 },
};

// A context WITH a sensible default
const ThemeContext = createContext<ChartTheme>(themes.ocean);

// A context WITHOUT a default: use null + a hook that throws
const LocaleContext = createContext<{ locale: string; currency: string } | null>(null);
function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleContext>");
  return ctx;
}

// --- deeply nested components -------------------------------------------------

function Money({ value }: { value: number }) {
  const { locale, currency } = useLocale();
  return <>{value.toLocaleString(locale, { style: "currency", currency, maximumFractionDigits: 0 })}</>;
}

function Bar({ value, max, highlight }: { value: number; max: number; highlight?: boolean }) {
  const theme = useContext(ThemeContext);
  const w = (value / max) * 260;
  return (
    <svg width={270} height={18} style={{ display: "block" }}>
      <rect width={w} height={16} rx={theme.radius} fill={highlight ? theme.accent : theme.bar} />
    </svg>
  );
}

function Row({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="row" style={{ gap: 8 }}>
      <span style={{ width: 70 }}>{label}</span>
      <Bar value={value} max={max} highlight={value === max} />
      <Money value={value} />
    </div>
  );
}

function RevenueCard({ children }: { children: ReactNode }) {
  // This component doesn't know or care about theme or locale.
  return <div className="card stack">{children}</div>;
}

export default function ContextBasics() {
  const [themeName, setThemeName] = useState("ocean");
  const [locale, setLocale] = useState({ locale: "en-US", currency: "USD" });
  const data = [
    { label: "North", value: 42_000 },
    { label: "South", value: 61_500 },
    { label: "East", value: 28_900 },
    { label: "West", value: 50_200 },
  ];
  const max = Math.max(...data.map((d) => d.value));

  return (
    <div className="stack">
      <div className="row">
        Theme:
        {Object.keys(themes).map((name) => (
          <button key={name} className={`btn ${name === themeName ? "primary" : ""}`} onClick={() => setThemeName(name)}>
            {name}
          </button>
        ))}
        Locale:
        <select
          value={locale.locale}
          onChange={(e) =>
            setLocale(
              { "en-US": { locale: "en-US", currency: "USD" }, "de-DE": { locale: "de-DE", currency: "EUR" }, "ja-JP": { locale: "ja-JP", currency: "JPY" } }[
                e.target.value
              ]!,
            )
          }
        >
          <option value="en-US">en-US ($)</option>
          <option value="de-DE">de-DE (€)</option>
          <option value="ja-JP">ja-JP (¥)</option>
        </select>
      </div>

      {/* React 19: the context object itself is the provider */}
      <ThemeContext value={themes[themeName]}>
        <LocaleContext value={locale}>
          <RevenueCard>
            {data.map((d) => (
              <Row key={d.label} label={d.label} value={d.value} max={max} />
            ))}
          </RevenueCard>
        </LocaleContext>
      </ThemeContext>
    </div>
  );
}
