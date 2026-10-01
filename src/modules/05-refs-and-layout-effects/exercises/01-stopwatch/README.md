# Exercise 05.1: Stopwatch with lap chart

Build a stopwatch that shows the difference between refs (bookkeeping) and state (what's on screen).

## Requirements

1. **Display** `mm:ss.cc` (minutes, seconds, centiseconds).
2. **Start / Stop / Reset / Lap** buttons.
   - Store the `setInterval` ID in a **ref**.
   - Store the start timestamp in a **ref** too. Compute elapsed time as `performance.now() - startRef.current` instead of adding 10ms per tick. Intervals drift, and the clock doesn't.
   - Stopping and starting again should **continue** from where it stopped (hint: keep an "accumulated before this run" value in a ref).
3. **Laps**: each Lap click records the time since the previous lap. Show them in a list, newest first, and highlight the **fastest** (green) and **slowest** (red) laps.
4. **Lap chart**: an SVG bar chart of lap durations (one vertical bar per lap, in order). Scale the bar heights so the longest lap is 100px tall.
5. **Keyboard**: `Space` toggles start/stop and `L` records a lap. Add the listener in an effect with cleanup. The handler needs the *current* running state, so think about stale closures. Either include the right dependencies, or keep a ref pointing at the latest handler.
6. **Focus**: after Reset, move keyboard focus back to the Start button with a DOM ref.
7. Clear the interval when the component unmounts.

## Done when

- [ ] The time is accurate even when you switch browser tabs (intervals slow down in background tabs; `performance.now()` doesn't)
- [ ] Laps, highlights and the chart are correct
- [ ] Keyboard shortcuts work and don't fire twice
