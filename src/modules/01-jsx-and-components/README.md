# Module 01 — JSX & Components

## 1. The big idea: UI = f(data)

In "vanilla" JavaScript you **change** the page step by step: find an element, set its text, add a class, append a child. In React you **describe** what the page should look like for the current data, and React works out which DOM changes are needed.

```
         ┌──────────────┐        ┌──────────────┐        ┌──────────┐
 data ──▶│  component   │──JSX──▶│ React (diff) │──DOM──▶│  screen  │
         └──────────────┘        └──────────────┘        └──────────┘
```

A **component** is a function that takes data (props) and returns a description of UI (JSX). This declarative model matters when we reach D3, which is imperative: it changes the DOM directly. A big part of this course is getting the two models to cooperate.

## 2. JSX is just function calls

```tsx
const el = <h1 className="title">Hello {name}</h1>;
```

compiles to roughly:

```ts
const el = jsx("h1", { className: "title", children: ["Hello ", name] });
```

So JSX is an **expression**. You can store it in variables, return it, put it in arrays and pass it as a prop.

### JSX rules that differ from HTML

| HTML | JSX | Why |
| --- | --- | --- |
| `class="x"` | `className="x"` | `class` is a reserved word in JS |
| `for="id"` | `htmlFor="id"` | same reason |
| `onclick="…"` | `onClick={fn}` | camelCase, and you pass a **function**, not a string |
| `style="color: red"` | `style={{ color: "red" }}` | an object: outer `{}` = JS expression, inner `{}` = object |
| `<br>` | `<br />` | every tag must be closed |
| `stroke-width="2"` | `strokeWidth={2}` | SVG attributes are camelCased too (important for D3!) |
| `<!-- comment -->` | `{/* comment */}` | |

### Curly braces `{}` = "insert a JS expression here"

```tsx
<p>2 + 2 = {2 + 2}</p>
<p>{user.name.toUpperCase()}</p>
<img src={user.avatarUrl} alt="" />
```

Only **expressions** work, not statements. `if` or `for` inside `{}` is not allowed. Use a ternary `a ? b : c`, `&&`, or `.map()` instead (Module 03).

### One root element

A component returns **one** element. To return siblings without an extra `<div>`, use a **Fragment**:

```tsx
return (
  <>
    <h1>Title</h1>
    <p>Body</p>
  </>
);
```

## 3. Components

```tsx
function Greeting() {
  return <p>Hello!</p>;
}

// use it like an HTML tag. The name MUST start with a capital letter
<Greeting />
```

A lowercase tag (`<div>`) means a built-in DOM element. A capitalized tag (`<Greeting>`) means your component.

## 4. Props: a component's inputs

Props are to components what arguments are to functions. In TypeScript you describe them with an interface:

```tsx
interface GreetingProps {
  name: string;
  excited?: boolean;          // optional
}

function Greeting({ name, excited = false }: GreetingProps) {   // destructure + default
  return <p>Hello, {name}{excited ? "!" : "."}</p>;
}

<Greeting name="Ada" excited />     // `excited` alone means excited={true}
<Greeting name={42} />              // ❌ TypeScript error: number isn't string
```

**Props are read-only.** A component must never change its props. If something needs to change over time, that's **state** (Module 02).

## 5. `children` and composition

Whatever you put *between* a component's tags arrives as the `children` prop:

```tsx
import type { ReactNode } from "react";

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

<Card title="Revenue">
  <BarChart data={revenue} />     {/* ← this is `children` */}
</Card>
```

This is **composition**: you build complex UIs by nesting small, general components. Later we'll compose charts from `<Axis>`, `<Bars>` and `<Tooltip>` pieces the same way.

## 6. Passing components and functions as props

Props can be any value, including functions (callbacks) and JSX:

```tsx
<Panel header={<h2>Stats</h2>} onClose={() => console.log("closed")} />
```

Callbacks are how a **child tells its parent** that something happened. Data flows down through props, and events flow up through callbacks.

## 7. Where do components go?

- One component per file for anything reusable. Small helper components can live next to their parent.
- A component should do **one** thing. If you need "and" to describe it ("shows the chart *and* fetches data *and* handles filters"), split it.

## Common mistakes

| Mistake | Fix |
| --- | --- |
| `<greeting />` renders nothing useful | Component names must be Capitalized |
| `onClick={handleClick()}` runs on every render | Pass the function: `onClick={handleClick}` or `onClick={() => handleClick(id)}` |
| Mutating a prop: `props.items.push(x)` | Never. Ask the parent to change it through a callback |
| Returning two siblings | Wrap them in `<>…</>` |

## ✅ Checklist

- [ ] I can explain what JSX compiles to
- [ ] I can write a component with typed props, including optional props with defaults
- [ ] I can use `children` to build a wrapper component
- [ ] I know data flows down (props) and events flow up (callbacks)
