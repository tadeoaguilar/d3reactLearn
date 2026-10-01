/**
 * World geography for the map examples (Module 13 and later).
 *
 * `world-atlas` ships Natural Earth country outlines as TopoJSON through
 * npm, so this works offline. topojson.feature() turns it into GeoJSON,
 * which is what d3.geoPath() draws.
 */
import * as d3 from "d3";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry, MultiLineString } from "geojson";
import worldTopo from "world-atlas/countries-110m.json";

export interface CountryProps {
  name: string;
}
export type Country = Feature<Geometry, CountryProps>;

const topology = worldTopo as unknown as Topology<{ countries: GeometryCollection<CountryProps> }>;

/** All countries as a GeoJSON FeatureCollection (feature.id = ISO 3166 numeric code). */
export const countries: FeatureCollection<Geometry, CountryProps> = feature(topology, topology.objects.countries) as FeatureCollection<
  Geometry,
  CountryProps
>;

/** Only the borders BETWEEN countries (no coastlines), drawn as one thin path. */
export const borders: MultiLineString = mesh(topology, topology.objects.countries, (a, b) => a !== b);

/**
 * A synthetic "index" per country (0–100), seeded by the country id so it's
 * stable. About 6% of countries are left out on purpose, to practice
 * "no data" handling. It's made-up data, for practicing choropleths only.
 */
export const countryIndex: Map<string, number> = (() => {
  const values = new Map<string, number>();
  for (const f of countries.features) {
    const id = String(f.id);
    const rnd = d3.randomLcg(Number(id) || 1);
    if (rnd() < 0.06) continue; // no data for this country
    // Loosely tie the value to latitude so the map has visible geographic structure.
    const [, lat] = d3.geoCentroid(f);
    const value = Math.max(0, Math.min(100, 30 + Math.abs(lat) * 0.9 + (rnd() - 0.5) * 40));
    values.set(id, Math.round(value));
  }
  return values;
})();
