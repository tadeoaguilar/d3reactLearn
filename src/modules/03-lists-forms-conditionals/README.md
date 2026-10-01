# Module 03 — Lists, Conditionals & Forms

## 1. Rendering lists with `map`

JSX can render arrays, so you turn data into elements with `.map()`:

```tsx
<ul>
  {users.map((user) => (
    <li key={user.id}>{user.name}</li>
  ))}
</ul>
```

In D3 terms, this **is** the data join. Every data item becomes one element. In Module 10 we'll draw chart bars exactly like this: `data.map(d => <rect key={d.id} … />)`.

### Why `key` matters

`key` tells React **which element is which** from one render to the next. Without stable keys, React matches elements by **position**.

```
Before:  [A, B, C]         After removing A:  [B, C]
key=index:  0=A 1=B 2=C    →   0=B 1=C          React thinks A became B, B became C, and C was deleted
key=id:     a   b   c      →   b   c            React knows A was deleted ✅
```

With index keys, **state inside list items** (input text, checkboxes, animations) sticks to the wrong item. Example 01 shows this bug.

Key rules:

- Keys must be **unique among siblings** and **stable** (the same item always gets the same key).
- Use an ID from your data. Index keys are only OK for lists that never reorder, insert or delete.
- **Never** use `Math.random()` as a key. It gives every element a new identity on every render.
- The key goes on the **outermost** element returned from the `map`.

## 2. Conditional rendering

```tsx
// if/else before the return
if (loading) return <Spinner />;

// ternary: one of two things
{isLoggedIn ? <Dashboard /> : <Login />}

// &&: something or nothing
{error && <p className="error">{error}</p>}

// ⚠️ && with numbers: 0 is rendered as "0"!
{items.length && <List />}        // renders "0" when empty ❌
{items.length > 0 && <List />}    // ✅
```

For more than two branches, use a lookup object or a small helper component with a `switch`:

```tsx
const icons = { success: "✅", warning: "⚠️", error: "❌" } as const;
<span>{icons[status]}</span>
```

`null`, `undefined`, `false` and `true` render **nothing**. Return `null` from a component to hide it.

## 3. Controlled inputs

A **controlled** input gets its value from React state and reports changes through `onChange`. React state is the single source of truth.

```tsx
const [query, setQuery] = useState("");
<input value={query} onChange={(e) => setQuery(e.target.value)} />
```

The loop: **type → onChange → setState → re-render → input shows the new value**.

| Element | Value prop | Read from event |
| --- | --- | --- |
| `<input type="text">` | `value` | `e.target.value` |
| `<input type="number">` | `value` | `e.target.valueAsNumber` (or `Number(e.target.value)`) |
| `<input type="checkbox">` | `checked` | `e.target.checked` |
| `<input type="range">` | `value` | `e.target.valueAsNumber` |
| `<select>` | `value` | `e.target.value` |
| `<textarea>` | `value` | `e.target.value` |

### One handler for many fields

```tsx
const [form, setForm] = useState({ name: "", email: "", subscribe: false });

function handleChange(e: ChangeEvent<HTMLInputElement>) {
  const { name, value, type, checked } = e.target;
  setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
}

<input name="email" value={form.email} onChange={handleChange} />
```

### Submitting

```tsx
<form onSubmit={(e) => { e.preventDefault(); save(form); }}>
```

`preventDefault()` stops the browser's default full-page reload.

### Validation is derived state

```tsx
const emailError = form.email && !form.email.includes("@") ? "Invalid email" : null;
const canSubmit = form.name.length > 0 && !emailError;
```

## 4. Lifting state up

When **two components need the same data**, move the state to their **closest common parent** and pass it down:

```
          ┌──────────── Dashboard ────────────┐
          │  const [year, setYear] = useState │
          └───────┬──────────────────┬────────┘
       year, onChange                year
          ▼                          ▼
     <YearPicker/>              <RevenueChart/>
```

- The parent **owns** the state.
- Children get the **value** as a prop and a **callback** to request changes.

This is the backbone of every interactive dashboard: filters, selections and hovered items live in a parent and are shared by several charts.

## 5. Filtering and sorting are derived

```tsx
const visible = products
  .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
  .filter((p) => !inStockOnly || p.stock > 0)
  .toSorted((a, b) => a.price - b.price);
```

Keep **filters** in state (`query`, `inStockOnly`, `sortKey`). Compute the visible list during render. Don't store `filteredProducts` in state.

## ✅ Checklist

- [ ] I can render a list with stable keys and explain what goes wrong with index keys
- [ ] I avoid the `0 &&` pitfall
- [ ] I can build a controlled form with text, number, checkbox and select inputs
- [ ] I can lift shared state into a parent and pass value + callback down
- [ ] I compute filtered and sorted lists instead of storing them
