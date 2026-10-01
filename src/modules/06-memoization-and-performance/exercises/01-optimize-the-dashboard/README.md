# Exercise 06.1: Optimize the dashboard

`Starter.tsx` is a **working but sluggish** mini-dashboard:

- a search input that filters 3,000 points by label
- a scatter plot of the filtered points
- a stats panel (mean, median, standard deviation, and a correlation that is deliberately computed slowly)
- hovering a point shows its details

Type in the search box or move the mouse over the plot. Both feel laggy. Your job is to make them smooth **without changing what the dashboard shows**.

## Steps

1. **Profile first.** Open React DevTools → Profiler, record while hovering, and look at which components re-render and how long they take. Write down what you find in a comment at the top of the file.
2. `useMemo` the **filtered data**, the **scales**, and the **stats**.
3. Wrap `Scatter` and `StatsPanel` in `memo`.
4. Make the hover handler stable with `useCallback`.
5. Make sure hovering no longer re-renders `Scatter` or `StatsPanel`. The render counters in the starter show this.
6. Use `useDeferredValue` for the search query so typing stays smooth while the plot catches up. Dim the plot while it's stale.

## Done when

- [ ] Hovering changes only the details panel and the highlight circle (the Scatter/Stats render counters stay still)
- [ ] Typing is responsive, even with the 6× CPU slowdown in DevTools
- [ ] The output is the same as before

## Stretch

Replace the `slowCorrelation` function with an efficient single-pass version. That's the best optimization of all: don't do the slow work in the first place.
