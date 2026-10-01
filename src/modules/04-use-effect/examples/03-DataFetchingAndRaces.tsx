/**
 * Example 04.03: data fetching, loading/error states and race conditions.
 *
 * Both panels fetch /data/users.json with a RANDOM delay (to simulate a
 * slow network). Click through the user buttons quickly:
 *   - the naive panel sometimes shows the wrong user (a race condition)
 *   - the safe panel always shows the last one you clicked
 */
import { useEffect, useState } from "react";

interface User {
  id: number;
  name: string;
  role: string;
  country: string;
}

type FetchState<T> = { status: "loading" } | { status: "error"; error: string } | { status: "success"; data: T };

/** Fetches one user after a random delay. Respects an AbortSignal. */
async function fetchUser(id: number, signal?: AbortSignal): Promise<User> {
  const delay = 200 + Math.random() * 1500;
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, delay);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  const res = await fetch("/data/users.json", { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const users = (await res.json()) as User[];
  const user = users.find((u) => u.id === id);
  if (!user) throw new Error(`User ${id} not found`);
  return user;
}

function NaiveUser({ id }: { id: number }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    // ❌ no cleanup: every response calls setUser, even stale ones
    fetchUser(id).then(setUser);
  }, [id]);
  return <UserCard title="❌ Naive" requested={id} user={user} loading={user?.id !== id} />;
}

function SafeUser({ id }: { id: number }) {
  const [state, setState] = useState<FetchState<User>>({ status: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });
    fetchUser(id, controller.signal)
      .then((data) => setState({ status: "success", data }))
      .catch((err: unknown) => {
        // An abort is expected, not a real error.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ status: "error", error: err instanceof Error ? err.message : String(err) });
      });
    // ✅ When id changes (or we unmount), cancel the in-flight request.
    return () => controller.abort();
  }, [id]);

  return (
    <UserCard
      title="✅ Abort on cleanup"
      requested={id}
      user={state.status === "success" ? state.data : null}
      loading={state.status === "loading"}
      error={state.status === "error" ? state.error : undefined}
    />
  );
}

function UserCard(props: { title: string; requested: number; user: User | null; loading: boolean; error?: string }) {
  const wrong = props.user && props.user.id !== props.requested;
  return (
    <div className="card" style={{ flex: 1, minWidth: 240, borderColor: wrong ? "var(--danger)" : undefined }}>
      <strong>{props.title}</strong>
      <div className="muted">requested id: {props.requested}</div>
      {props.error ? (
        <p style={{ color: "var(--danger)" }}>{props.error}</p>
      ) : props.loading && !props.user ? (
        <p>Loading…</p>
      ) : props.user ? (
        <p>
          {props.loading && "⏳ "}#{props.user.id} {props.user.name}
          <br />
          <span className="muted">
            {props.user.role}, {props.user.country}
          </span>
          {wrong && <div style={{ color: "var(--danger)" }}>⚠ wrong user shown!</div>}
        </p>
      ) : null}
    </div>
  );
}

export default function DataFetchingAndRaces() {
  const [id, setId] = useState(1);
  return (
    <div className="stack">
      <div className="row">
        {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
          <button key={n} className={`btn ${n === id ? "primary" : ""}`} onClick={() => setId(n)}>
            {n}
          </button>
        ))}
        <button className="btn" onClick={() => setId(99)}>
          99 (missing)
        </button>
      </div>
      <div className="row" style={{ alignItems: "stretch" }}>
        <NaiveUser id={id} />
        <SafeUser id={id} />
      </div>
    </div>
  );
}
