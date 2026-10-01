/**
 * Example 05.04: passing refs to your own components (React 19) and
 * exposing an imperative API with useImperativeHandle.
 */
import { useImperativeHandle, useRef, useState, type ComponentProps, type Ref } from "react";

// 1. ref is just a prop in React 19. Forward it to the DOM element.
function LabeledInput({ label, ref, ...rest }: { label: string } & ComponentProps<"input">) {
  return (
    <label className="row">
      {label} <input ref={ref} {...rest} />
    </label>
  );
}

// 2. Expose methods instead of the raw node.
export interface CanvasHandle {
  clear(): void;
  randomDots(n: number): void;
  toDataURL(): string;
}

function DotCanvas({ ref, width = 320, height = 160 }: { ref?: Ref<CanvasHandle>; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useImperativeHandle(
    ref,
    () => ({
      clear() {
        const ctx = canvasRef.current?.getContext("2d");
        ctx?.clearRect(0, 0, width, height);
      },
      randomDots(n) {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) return;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = `hsl(${Math.random() * 360} 70% 55%)`;
          ctx.beginPath();
          ctx.arc(Math.random() * width, Math.random() * height, 3 + Math.random() * 6, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      toDataURL() {
        return canvasRef.current?.toDataURL() ?? "";
      },
    }),
    [width, height],
  );

  return <canvas ref={canvasRef} width={width} height={height} style={{ border: "1px solid var(--border)", borderRadius: 8 }} />;
}

export default function RefsToChildComponents() {
  const nameRef = useRef<HTMLInputElement>(null);
  const canvas = useRef<CanvasHandle>(null);
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="stack">
      <div className="row">
        <LabeledInput ref={nameRef} label="Name" placeholder="focus me from the parent" />
        <button className="btn" onClick={() => nameRef.current?.focus()}>
          Focus
        </button>
      </div>

      <DotCanvas ref={canvas} />
      <div className="row">
        <button className="btn" onClick={() => canvas.current?.randomDots(20)}>
          Add 20 dots
        </button>
        <button className="btn" onClick={() => canvas.current?.clear()}>
          Clear
        </button>
        <button className="btn" onClick={() => setPreview(canvas.current?.toDataURL() ?? null)}>
          Snapshot
        </button>
      </div>
      {preview && <img src={preview} alt="canvas snapshot" width={160} style={{ border: "1px solid var(--border)" }} />}
    </div>
  );
}
