# Module 02 — State & Events

## 1. Why regular variables don't work

```tsx
function Counter() {
  let count = 0;
  return <button onClick={() => { count++; }}>Clicked {count} times</button>;
}
```

Clicking does nothing visible, for two reasons:

1. Changing a local variable **doesn't tell React to re-render**.
2. Even if React re-rendered, `Counter()` would run again from the top and `let count = 0` would reset it.

We need a value that **survives between renders** and **triggers a re-render when it changes**. That's state.

## 2. `useState`

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  //     ↑ current value  ↑ setter      ↑ initial value (used only on the first render)

  return <button onClick={() => setCount(count + 1)}>Clicked {count} times</button>;
}
```

What happens on click:

```
click → setCount(1) → React schedules a re-render
      → Counter() runs again → useState(0) now returns [1, setCount]
      → new JSX → React updates only the text node that changed
```

With TypeScript, the state type is inferred from the initial value. Pass it explicitly when the initial value doesn't show the full type:

```tsx
const [name, setName] = useState("");                    // string (inferred)
const [user, setUser] = useState<User | null>(null);     // explicit: null now, User later
const [items, setItems] = useState<string[]>([]);        // explicit: [] alone would be never[]
```

## 3. The Rules of Hooks

Hooks (functions starting with `use`) have two rules:

1. **Only call hooks at the top level** of a component or custom hook. Never inside `if`, loops or nested functions.
2. **Only call hooks from React function components or custom hooks.**

React tells hooks apart by **call order**. If one render calls `useState` A, B, C and the next calls A, C, React mixes them up.

## 4. State is a snapshot

Inside one render, `count` is a **constant**. Calling `setCount` doesn't change it right away. It asks for a *new render* with a new value.

```tsx
function handleClick() {
  setCount(count + 1);
  setCount(count + 1);
  setCount(count + 1);
  console.log(count); // still the old value!
}
// Result: count goes up by 1, not 3. All three calls computed "0 + 1".
```

### Functional updates

When the next state depends on the previous one, pass a **function**:

```tsx
setCount((c) => c + 1);
setCount((c) => c + 1);
setCount((c) => c + 1);   // count goes up by 3 ✅
```

React queues the functions and runs them in order, each with the latest value. **Use the function form whenever the new value is computed from the old one.** It matters later with intervals and effects, where `count` may be a stale value from an old render.

### Batching

React batches all `setX` calls in one event handler into a **single** re-render, so calling three setters doesn't cause three renders.

## 5. Events

```tsx
<button onClick={handleClick}>          // pass the function
<button onClick={() => remove(id)}>     // wrap it when you need arguments
<input onChange={(e) => setText(e.target.value)} />
<form onSubmit={(e) => { e.preventDefault(); save(); }}>
<rect onMouseMove={(e) => console.log(e.clientX)} />   // SVG elements get events too
```

Typed handlers, when you define them separately:

```tsx
import type { ChangeEvent, MouseEvent } from "react";

function handleChange(e: ChangeEvent<HTMLInputElement>) { setText(e.target.value); }
function handleBarClick(e: MouseEvent<SVGRectElement>, datum: Datum) { … }
```

> 💡 Tip: write the handler inline first (`onChange={(e) => …}`) and hover over `e`. VS Code shows the exact event type, which you can copy.

## 6. Updating objects and arrays immutably

React decides whether to re-render by comparing the **old and new values by reference** (`Object.is`). If you mutate an object and set it again, the reference is the same, so React thinks nothing changed.

```tsx
// ❌ mutation: same object, no re-render, bugs
user.name = "Ada";
setUser(user);

// ✅ new object
setUser({ ...user, name: "Ada" });
```

Cheat sheet for arrays:

| Goal | ❌ Mutating | ✅ Immutable |
| --- | --- | --- |
| add | `arr.push(x)` | `[...arr, x]` |
| remove | `arr.splice(i, 1)` | `arr.filter((item) => item.id !== id)` |
| replace | `arr[i] = x` | `arr.map((item) => item.id === id ? { ...item, done: true } : item)` |
| sort | `arr.sort()` | `[...arr].sort()` or `arr.toSorted()` |
| reverse | `arr.reverse()` | `arr.toReversed()` |

Nested objects need a spread at every level you change:

```tsx
setChart((c) => ({ ...c, axis: { ...c.axis, label: "Revenue" } }));
```

## 7. What should be state?

Ask these three questions about each piece of data:

1. Does it **stay the same** over time? → Not state (a constant).
2. Is it **passed in** from a parent? → Not state (a prop).
3. Can you **compute** it from other state or props? → **Not state!** Compute it during render.

```tsx
// ❌ redundant state that can drift out of sync
const [items, setItems] = useState<Item[]>([]);
const [total, setTotal] = useState(0);

// ✅ derive it
const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
```

This rule matters a lot for charts: scales, paths and summaries are almost always **derived** from data, not stored in state.

## ✅ Checklist

- [ ] I can explain why `let` variables don't cause re-renders
- [ ] I know when to use `setX(x => …)` instead of `setX(value)`
- [ ] I can add, remove and update items in an array without mutating it
- [ ] I can type event handlers for inputs and SVG elements
- [ ] I compute derived values instead of storing them in state
