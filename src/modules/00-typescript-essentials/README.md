# Module 00 — TypeScript Essentials for React

You know JavaScript. TypeScript is JavaScript plus **type annotations**, which the compiler checks and then strips away. Types add no runtime behavior. They catch mistakes while you type.

This module covers the ~10% of TypeScript you'll use 90% of the time in React + D3 code.

## 1. Annotating variables and functions

```ts
let count: number = 0;          // usually unnecessary: TS *infers* number from 0
const name = "Ada";             // inferred as the literal type "Ada"

function add(a: number, b: number): number {
  return a + b;
}

const greet = (who: string) => `Hello ${who}`;  // return type inferred: string
```

**Rule of thumb:** annotate function **parameters**. Let TypeScript infer most other things.

## 2. Object types: `interface` and `type`

```ts
interface User {
  id: number;
  name: string;
  email?: string;          // optional: string | undefined
  readonly createdAt: Date; // can't be reassigned
}

type Point = { x: number; y: number };  // a type alias works almost the same
```

Use either. This repo uses `interface` for object shapes (props, data rows) and `type` for unions and other combinations.

## 3. Arrays, tuples, records

```ts
const scores: number[] = [1, 2, 3];
const users: Array<User> = [];                 // same as User[]
const range: [number, number] = [0, 100];      // tuple: fixed length and types
const byId: Record<string, User> = {};          // object used as a dictionary
```

D3 uses tuples a lot. `scale.domain()` returns `[number, number]`, and `d3.extent()` returns `[number, number] | [undefined, undefined]`.

## 4. Union types and narrowing

A union says "one of these":

```ts
type Status = "idle" | "loading" | "success" | "error";

function label(s: Status) {
  if (s === "loading") return "…";   // TS knows s is exactly "loading" here
  return s.toUpperCase();
}
```

**Discriminated unions** model state that has different shapes. You'll use this pattern for data fetching:

```ts
type FetchState<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

function render(state: FetchState<User[]>) {
  switch (state.status) {
    case "loading": return "Loading…";
    case "error":   return state.error;        // ✅ error exists here
    case "success": return state.data.length;  // ✅ data exists here
  }
}
```

## 5. `null`, `undefined`, and the `!` / `?.` / `??` operators

With `strict: true` (which this repo uses), `null` and `undefined` are **not** allowed unless you say so.

```ts
const el = document.getElementById("root");  // HTMLElement | null
el.textContent = "hi";        // ❌ error: el might be null
el?.focus();                  // ✅ optional chaining: does nothing if null
const text = el?.textContent ?? "(none)";   // ✅ nullish coalescing: fallback value
document.getElementById("root")!.focus();   // ✅ "trust me, it's not null". Use sparingly
```

You'll see `ref.current` (which can be `null`) in almost every D3 + React component.

## 6. Generics: types that take parameters

A generic is a type with a placeholder, like a function parameter but for types.

```ts
function first<T>(items: T[]): T | undefined {
  return items[0];
}
first([1, 2, 3]);      // T = number
first(["a", "b"]);     // T = string
```

React and D3 use generics everywhere:

```ts
const [users, setUsers] = useState<User[]>([]);           // state holds User[]
const ref = useRef<SVGSVGElement>(null);                  // ref to an <svg>
const x = d3.scaleLinear<number>();                       // scale outputs numbers
d3.select<SVGGElement, unknown>(gRef.current!);           // selection of a <g>
```

## 7. `typeof`, `keyof`, and utility types

```ts
const config = { width: 600, height: 400 };
type Config = typeof config;          // { width: number; height: number }
type ConfigKey = keyof Config;        // "width" | "height"

type PartialUser = Partial<User>;     // every field optional
type UserPreview = Pick<User, "id" | "name">;
type NoEmail = Omit<User, "email">;
```

## 8. The React types you'll meet

| Type | Used for |
| --- | --- |
| `React.ReactNode` | Anything renderable: JSX, string, number, null, arrays of those |
| `React.ChangeEvent<HTMLInputElement>` | `onChange` of an `<input>` |
| `React.MouseEvent<SVGRectElement>` | `onClick` / `onMouseMove` on an SVG `<rect>` |
| `React.FormEvent<HTMLFormElement>` | `onSubmit` of a form |
| `React.CSSProperties` | The `style` prop object |
| `React.ComponentProps<"button">` | All props a `<button>` accepts |
| `React.Dispatch<React.SetStateAction<T>>` | The type of a `setState` function |

You can import them by name: `import type { ReactNode, ChangeEvent } from "react";`

## 9. Handy habits

- **Hover** over anything in VS Code to see its inferred type. This is the fastest way to learn.
- Prefer `unknown` over `any`. `unknown` makes you check before you use the value. `any` switches checking off.
- Red squiggles are messages that help you. Read the **last** line of a TS error first. It's usually the most specific.

## ✅ Checklist

- [ ] I can write an `interface` for a data row
- [ ] I can type function parameters and understand inferred return types
- [ ] I can write a discriminated union and narrow it with `switch`
- [ ] I understand `T | null`, `?.`, `??`, and `!`
- [ ] I can read `useState<User[]>([])` and explain the `<User[]>` part

**Next:** open the example, then do the exercise *Type the data*.
