/**
 * Capstone: Sales analytics dashboard, the skeleton.
 * The spec is in the module lesson (src/modules/15-capstone/README.md).
 *
 * The architecture is laid out for you. Work through the milestones and
 * replace each TODO. Keep everything in this file, or split it into files
 * next to it (e.g. store.ts, KpiRow.tsx). The app only needs this default export.
 */
import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type Dispatch, type ReactNode } from "react";
import * as d3 from "d3";
import { useChartDimensions } from "../../../../shared/hooks/useChartDimensions";
import { Axis } from "../../../../shared/charts/Axis";
import { Tooltip } from "../../../../shared/charts/Tooltip";
import { CATEGORIES, REGIONS, orders, type Category, type Order, type Region } from "./salesData";

// ============================================================================
// Milestone 1: state
// ============================================================================
interface Filters {
  dateRange: [Date, Date] | null;
  regions: Set<Region>; // empty = all
  categories: Set<Category>; // empty = all
}
type FilterKey = keyof Filters;

// TODO: type FilterAction = …
// TODO: function filtersReducer(state: Filters, action: FilterAction): Filters
// TODO: contexts + DashboardProvider + useFilters() + useFiltersDispatch()

/** Apply every filter except `except` (for cross-filtering). */
function applyFilters(data: Order[], f: Filters, except?: FilterKey): Order[] {
  // TODO
  return data;
}

// TODO: function useFilteredOrders(except?: FilterKey): Order[]

// ============================================================================
// Milestone 3: KPIs
// ============================================================================
function KpiRow() {
  return <div className="todo-hint">KPI cards: revenue, orders, avg order value, top category</div>;
}

// ============================================================================
// Milestone 4: time series + brush
// ============================================================================
function TimeSeriesPanel() {
  return <div className="todo-hint">Weekly revenue + a brush on the mini timeline</div>;
}

// ============================================================================
// Milestone 5: donut + bars (cross-filtering)
// ============================================================================
function CategoryDonut() {
  return <div className="todo-hint">Revenue by category (donut): click to filter</div>;
}

function RegionBars() {
  return <div className="todo-hint">Revenue by region (bars): click to filter</div>;
}

// ============================================================================
// Milestone 6: table
// ============================================================================
function TopProductsTable() {
  return <div className="todo-hint">Top 10 products, sortable</div>;
}

function FilterBar() {
  return <div className="todo-hint">Region dropdown · category chips · reset</div>;
}

// ============================================================================
// Milestone 2: layout
// ============================================================================
export default function SalesDashboard() {
  return (
    // TODO: wrap in <DashboardProvider>
    <div className="stack">
      <h3 style={{ margin: 0 }}>Sales 2025 · {orders.length.toLocaleString()} orders</h3>
      <FilterBar />
      <KpiRow />
      <TimeSeriesPanel />
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
        <CategoryDonut />
        <RegionBars />
      </div>
      <TopProductsTable />
    </div>
  );
}
