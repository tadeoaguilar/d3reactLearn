# Exercise 13.2: Classed choropleth with an interactive legend

Build a world choropleth of `countryIndex` (from `src/shared/geo.ts`) with **classed** colors and a legend you can interact with.

## Requirements

1. **Map**: `d3.geoEqualEarth()` fit to the container (`fitSize` with `{ type: "Sphere" }`), sphere background, graticule, countries and the `borders` mesh.
2. **Classification** switcher, with 5 classes and `d3.schemeBlues[5]`:
   - **Equal interval**: `d3.scaleQuantize().domain([0, 100])`
   - **Quantile**: `d3.scaleQuantile().domain(allValues)` (every class gets the same number of countries)
   - **Custom thresholds**: `d3.scaleThreshold().domain([20, 40, 60, 80])`
3. **Discrete legend**: 5 swatches with their value ranges. Get them from `scale.invertExtent(color)` (quantize/quantile) or from the threshold domain. Show how many countries fall in each class.
4. **Linked highlighting**
   - hovering a country shows a tooltip *and* highlights its legend class
   - hovering a legend class dims every country outside that class
5. Countries with no value are drawn with a hatch pattern (an SVG `<pattern>`) and listed in the legend as "No data".

## Done when

- [ ] All three classification methods work, and the legend ranges and counts update
- [ ] Hovering a map country highlights its legend class, and vice versa
- [ ] The map is responsive
