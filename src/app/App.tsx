import { useEffect, useState } from "react";
import { modules, type Module } from "./registry";
import { routeHref, useHashRoute, type Route } from "./useHashRoute";
import { DemoStage, MarkdownView, SourceView } from "./components";
import homeDoc from "../../README.md?raw";
import cheatsheetDoc from "../../CHEATSHEET.md?raw";

export default function App() {
  const route = useHashRoute();
  const current = route.kind === "home" ? undefined : modules.find((m) => m.id === route.moduleId);

  // Scroll to top whenever the page changes.
  useEffect(() => {
    document.querySelector(".content")?.scrollTo(0, 0);
  }, [route.kind, current?.id, "itemId" in route ? route.itemId : ""]);

  return (
    <div className="layout">
      <Sidebar route={route} />
      <main className="content">
        {route.kind === "lesson" && route.moduleId === "cheatsheet" ? (
          <MarkdownView source={cheatsheetDoc} />
        ) : route.kind === "home" || !current ? (
          <MarkdownView source={homeDoc} />
        ) : (
          <ModulePage module={current} route={route} />
        )}
      </main>
    </div>
  );
}

function Sidebar({ route }: { route: Route }) {
  const activeModule = route.kind === "home" ? "" : route.moduleId;
  return (
    <nav className="sidebar">
      <a className="brand" href="#/">
        React + D3 Lab
      </a>
      <ol className="module-list" style={{ marginBottom: 8 }}>
        <li className={activeModule === "cheatsheet" ? "active" : ""}>
          <a href="#/cheatsheet">
            <span className="num">📄</span> Cheat sheet
          </a>
        </li>
      </ol>
      <ol className="module-list">
        {modules.map((m) => (
          <li key={m.id} className={m.id === activeModule ? "active" : ""}>
            <a href={routeHref({ kind: "lesson", moduleId: m.id })}>
              <span className="num">{m.number}</span> {m.title.replace(/^Module \d+\s*[—:-]\s*/, "")}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function ModulePage({ module, route }: { module: Module; route: Route }) {
  const tabs = (
    <div className="tabs">
      <TabLink route={{ kind: "lesson", moduleId: module.id }} current={route} label="📖 Lesson" />
      {module.examples.map((e) => (
        <TabLink
          key={e.id}
          route={{ kind: "example", moduleId: module.id, itemId: e.id }}
          current={route}
          label={`▶ ${e.title}`}
        />
      ))}
      {module.exercises.map((x) => (
        <TabLink
          key={x.id}
          route={{ kind: "exercise", moduleId: module.id, itemId: x.id }}
          current={route}
          label={`✎ ${x.title.replace(/^Exercise[^:]*:\s*/, "")}`}
        />
      ))}
    </div>
  );

  let body;
  if (route.kind === "example") {
    const example = module.examples.find((e) => e.id === route.itemId);
    body = example ? (
      <>
        <h2>{example.title}</h2>
        <DemoStage load={example.load} id={example.id} />
        <SourceView source={example.source} title={`Source — examples/${example.id}.tsx`} />
      </>
    ) : (
      <p>Example not found.</p>
    );
  } else if (route.kind === "exercise") {
    const exercise = module.exercises.find((x) => x.id === route.itemId);
    body = exercise ? <ExercisePage key={exercise.id} exercise={exercise} moduleId={module.id} /> : <p>Not found.</p>;
  } else {
    body = <MarkdownView source={module.lesson} />;
  }

  return (
    <>
      {tabs}
      {body}
    </>
  );
}

function ExercisePage({ exercise, moduleId }: { exercise: Module["exercises"][number]; moduleId: string }) {
  const [mode, setMode] = useState<"starter" | "solution">("starter");
  const load = mode === "starter" ? exercise.loadStarter : exercise.loadSolution;
  const folder = `src/modules/${moduleId}/exercises/${exercise.id}`;
  return (
    <>
      <MarkdownView source={exercise.doc} />
      <div className="mode-switch">
        <button className={mode === "starter" ? "on" : ""} onClick={() => setMode("starter")}>
          My work (Starter.tsx)
        </button>
        <button className={mode === "solution" ? "on" : ""} onClick={() => setMode("solution")}>
          Reference solution
        </button>
        <code className="muted">{folder}</code>
      </div>
      {load ? <DemoStage key={mode} load={load} id={`${exercise.id}-${mode}`} /> : <p>No file for this mode.</p>}
      {mode === "solution" && <SourceView source={exercise.solutionSource} title="Solution source" />}
    </>
  );
}

function TabLink({ route, current, label }: { route: Route; current: Route; label: string }) {
  const href = routeHref(route);
  const active = href === routeHref(current);
  return (
    <a className={`tab ${active ? "active" : ""}`} href={href}>
      {label}
    </a>
  );
}
