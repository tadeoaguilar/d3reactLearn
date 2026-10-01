# Exercise 04.2: Debounced user search

Build a search box that loads users from `/data/users.json` and filters them. Along the way you'll handle every data-fetching concern.

## Requirements

1. **Initial load**: fetch `/data/users.json` once on mount. Show "Loading…" while waiting and an error message if it fails. Model this with a **discriminated union** (`status: "loading" | "error" | "success"`).
2. **Search input**: filter users by name or role (case-insensitive).
3. **Debounce**: don't filter on every keystroke. Keep two values:
   - `query`: updates on every keystroke (drives the input)
   - `debouncedQuery`: updates **300ms after the user stops typing** (drives the filtering)

   Use an effect with `setTimeout` that depends on `query`, and clear the timeout in the cleanup. Every keystroke cancels the previous timer.
4. Show "Searching…" while `query !== debouncedQuery`.
5. **Role chart**: under the results, draw a small horizontal SVG bar chart that counts the matching users per `role`. The widest bar should be 200px.
6. **Abort**: use an `AbortController` in the fetch effect and abort in the cleanup. (In dev, StrictMode will abort the first request right away. Check the Network tab.)
7. Make it fail on purpose: change the URL to `/data/nope.json` and check that your error state appears. Two things to know:
   - An HTTP error such as a 404 does **not** make `fetch` reject. You have to check `res.ok` yourself.
   - Vite's dev server may answer a missing file with `index.html` and status 200. Then `res.json()` throws a JSON parse error. Your error state should handle both.

## Done when

- [ ] Loading, error and success states all render
- [ ] Filtering happens 300ms after typing stops
- [ ] The role chart updates with the filtered results
- [ ] No effect is missing a cleanup
