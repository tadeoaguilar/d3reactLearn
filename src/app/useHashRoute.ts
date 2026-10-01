import { useSyncExternalStore } from "react";

/**
 * A tiny hash router: "#/04-use-effect/example/02-Cleanup".
 *
 * It subscribes to an external source (the browser's location.hash) with
 * useSyncExternalStore. Module 08 explains this hook.
 */
function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getSnapshot() {
  return window.location.hash;
}

export type Route =
  | { kind: "home" }
  | { kind: "lesson"; moduleId: string }
  | { kind: "example"; moduleId: string; itemId: string }
  | { kind: "exercise"; moduleId: string; itemId: string };

export function parseRoute(hash: string): Route {
  const [moduleId, kind, itemId] = hash.replace(/^#\/?/, "").split("/");
  if (!moduleId) return { kind: "home" };
  if (kind === "example" && itemId) return { kind: "example", moduleId, itemId };
  if (kind === "exercise" && itemId) return { kind: "exercise", moduleId, itemId };
  return { kind: "lesson", moduleId };
}

export function routeHref(route: Route): string {
  switch (route.kind) {
    case "home":
      return "#/";
    case "lesson":
      return `#/${route.moduleId}`;
    case "example":
    case "exercise":
      return `#/${route.moduleId}/${route.kind}/${route.itemId}`;
  }
}

export function useHashRoute(): Route {
  const hash = useSyncExternalStore(subscribe, getSnapshot);
  return parseRoute(hash);
}
