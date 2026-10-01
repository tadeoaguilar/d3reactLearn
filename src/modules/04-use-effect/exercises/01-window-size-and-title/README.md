# Exercise 04.1: Window size & document title

Practice **subscribing and cleaning up**.

## Part A: `WindowSize`

Show the current `window.innerWidth × window.innerHeight` and keep it up to date while the window resizes.

- Start the state with the real size (use a lazy initializer: `useState(() => ({ … }))`).
- Subscribe to `"resize"` in an effect, and **remove the listener in the cleanup**.
- Show a label: `"mobile"` below 640px, `"tablet"` below 1024px, otherwise `"desktop"`. This is **derived**, so it isn't state.
- Draw an SVG rectangle whose width is `innerWidth / 10` px. It should shrink and grow as you resize.

## Part B: `TitleUpdater`

- A text input. Whatever you type becomes the browser **tab title**.
- When the component unmounts, **restore the original title**.

## Part C: `IdleDetector`

- Show "👋 Active" or "💤 Idle". The user becomes idle after **3 seconds** without mouse movement or key presses.
- Listen to `pointermove` and `keydown` on `window`. Each event resets a `setTimeout`.
- Clean up **both** listeners and the pending timeout.

A toggle button in the starter mounts and unmounts all three, so you can check the cleanups.

## Done when

- [ ] Resizing updates the numbers, the label and the rectangle
- [ ] Unmounting restores the page title
- [ ] After unmounting, nothing keeps running. Add a `console.log` to each cleanup to confirm it runs.
