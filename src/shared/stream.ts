/**
 * A fake real-time feed that behaves like a WebSocket or server-sent-events
 * source: you subscribe, it pushes events, and you unsubscribe.
 * Used in Module 14.
 *
 *   const feed = createMetricFeed({ intervalMs: 100 });
 *   const unsubscribe = feed.subscribe((event) => …);
 *   unsubscribe();
 */

export interface MetricEvent {
  time: number; // ms timestamp
  cpu: number; // 0–100
  memory: number; // 0–100
  requests: number; // requests in this tick
  latency: number; // ms
  region: "us-east" | "eu-west" | "ap-south";
}

export const REGIONS: MetricEvent["region"][] = ["us-east", "eu-west", "ap-south"];

export interface Feed<T> {
  subscribe(listener: (event: T) => void): () => void;
  setInterval(ms: number): void;
}

export function createMetricFeed({ intervalMs = 200 }: { intervalMs?: number } = {}): Feed<MetricEvent> {
  const listeners = new Set<(e: MetricEvent) => void>();
  let timer: ReturnType<typeof setInterval> | null = null;
  let interval = intervalMs;
  // Random-walk state
  let cpu = 40;
  let memory = 55;
  let latency = 120;
  let t = 0;

  function emit() {
    t++;
    const spike = Math.random() < 0.02 ? 30 : 0; // occasional spikes
    cpu = clamp(cpu + (Math.random() - 0.5) * 8 + spike - (cpu - 45) * 0.05, 2, 100);
    memory = clamp(memory + (Math.random() - 0.48) * 2 - (memory - 60) * 0.01, 10, 98);
    latency = clamp(latency + (Math.random() - 0.5) * 20 + spike * 3 - (latency - 120) * 0.08, 20, 900);
    const event: MetricEvent = {
      time: Date.now(),
      cpu,
      memory,
      latency,
      requests: Math.round(40 + Math.sin(t / 30) * 15 + Math.random() * 20 + spike),
      region: REGIONS[Math.floor(Math.random() * REGIONS.length)],
    };
    listeners.forEach((l) => l(event));
  }

  function start() {
    if (timer === null) timer = setInterval(emit, interval);
  }
  function stop() {
    if (timer !== null) clearInterval(timer);
    timer = null;
  }

  return {
    subscribe(listener) {
      listeners.add(listener);
      start(); // start lazily when the first listener arrives
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) stop(); // stop when nobody is listening
      };
    },
    setInterval(ms) {
      interval = ms;
      if (timer !== null) {
        stop();
        start();
      }
    },
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * A fixed-size buffer that keeps the last `capacity` items. Pushing to a
 * full buffer drops the oldest item. Returns a NEW array, so React state
 * updates stay immutable.
 */
export function pushWindow<T>(buffer: T[], item: T | T[], capacity: number): T[] {
  const next = buffer.concat(item);
  return next.length > capacity ? next.slice(next.length - capacity) : next;
}
