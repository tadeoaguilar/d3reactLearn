import { Component, Suspense, lazy, useMemo, useState, type ComponentType, type ReactNode } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Loader = () => Promise<{ default: ComponentType }>;

/** Renders one of the lesson / exercise markdown files. */
export function MarkdownView({ source }: { source: string }) {
  return (
    <article className="markdown">
      <Markdown remarkPlugins={[remarkGfm]}>{source}</Markdown>
    </article>
  );
}

/**
 * Catches errors thrown while rendering a demo, so one broken exercise
 * doesn't blank the whole app. Error boundaries are still class
 * components; React has no hook version.
 */
class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="demo-error">
          <strong>This demo threw an error:</strong>
          <pre>{this.state.error.message}</pre>
          <p>Check the browser console for the full stack trace.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Lazy-loads a demo component and renders it in a framed stage. */
export function DemoStage({ load, id }: { load: Loader; id: string }) {
  // useMemo keeps the same lazy component across re-renders. Without it,
  // React would see a "new" component each render and remount it.
  const LazyDemo = useMemo(() => lazy(load), [load]);
  return (
    <div className="demo-stage">
      <ErrorBoundary resetKey={id}>
        <Suspense fallback={<p className="muted">Loading…</p>}>
          <LazyDemo />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export function SourceView({ source, title = "Source" }: { source?: string; title?: string }) {
  const [open, setOpen] = useState(false);
  if (!source) return null;
  return (
    <section className="source">
      <button className="link-button" onClick={() => setOpen((o) => !o)}>
        {open ? "▾" : "▸"} {title}
      </button>
      {open && (
        <pre className="code">
          <code>{source}</code>
        </pre>
      )}
    </section>
  );
}
