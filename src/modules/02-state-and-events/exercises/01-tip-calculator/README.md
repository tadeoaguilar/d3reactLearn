# Exercise 02.1: Tip calculator

Build a tip calculator. It's small, but it covers the most important state rule: **keep the minimum state and derive everything else**.

## Requirements

| Input | Type | Default |
| --- | --- | --- |
| Bill amount | number input | `50` |
| Tip percentage | buttons for 10 / 15 / 20 / 25% **and** a custom number input | `15` |
| Number of people | number input with − / + buttons, minimum 1 | `2` |

Outputs (these are **derived**, so they are *not* state):

- Tip amount
- Total
- Total per person
- Tip per person

## Tasks

1. Decide which values are state. (Hint: exactly three.)
2. Wire up the inputs. A number input's `e.target.value` is a **string**, so convert it with `Number(...)` or `e.target.valueAsNumber`.
3. Make the − button stop at 1. Use a **functional update** (`setPeople(p => …)`).
4. Highlight the active tip button.
5. Add a **Reset** button that restores all defaults.
6. Draw a small SVG bar under the results: a rectangle for the bill and, next to it, another for the tip. The widths should be proportional to the amounts, and the full bar should be 300px wide.

## Done when

- [ ] Changing any input updates all four outputs immediately
- [ ] People can never drop below 1
- [ ] There is no `useState` for tip amount, total or per-person values
- [ ] The SVG bar shows the bill/tip split
