"use client";

import { ArrowRight, RotateCcw, Undo2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import {
  begin,
  complete,
  emptyLines,
  isWon,
  linesOf,
  reach,
  restore,
  type Drag,
  type Lines,
  type Point,
  type Puzzle,
} from "@/lib/dot-link/engine";
import { levelPuzzle } from "@/lib/dot-link/levels";
import { loadProgress, saveProgress } from "@/lib/dot-link/progress";

// Ordered so the small boards get the most distinct hues.
const COLORS = [
  "oklch(0.62 0.21 27)",
  "oklch(0.58 0.17 255)",
  "oklch(0.68 0.17 145)",
  "oklch(0.84 0.16 92)",
  "oklch(0.72 0.17 55)",
  "oklch(0.62 0.24 330)",
  "oklch(0.76 0.12 210)",
  "oklch(0.52 0.19 295)",
  "oklch(0.52 0.09 50)",
  "oklch(0.82 0.18 128)",
  "oklch(0.8 0.1 0)",
  "oklch(0.55 0.09 185)",
];

const MOVES: Record<string, Point> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

const subscribe = () => () => {};

export function DotLink() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      {mounted ? (
        <Levels />
      ) : (
        <>
          <Header />
          <div className="aspect-square rounded-md border border-border bg-card lcd-bezel" />
        </>
      )}
      <a
        href="https://bend-lang.com"
        className="meta-label mt-10 block text-center transition-colors hover:text-link"
      >
        Made with Bend
      </a>
    </div>
  );
}

function Levels() {
  const [saved] = useState(loadProgress);
  const [level, setLevel] = useState(saved.level);
  const found = levelPuzzle(level);

  const next = useCallback(() => {
    saveProgress({ level: level + 1, lines: [] });
    setLevel(level + 1);
  }, [level]);

  if (!found) {
    return (
      <>
        <Header level={level} />
        <div className="flex aspect-square items-center justify-center rounded-md border border-border bg-card lcd-bezel">
          <p className="meta-label">No puzzle for this level</p>
        </div>
      </>
    );
  }

  return (
    <Game
      key={level}
      puzzle={found.puzzle}
      initialLines={level === saved.level ? saved.lines : []}
      onNext={next}
    />
  );
}

function Header({ level }: { level?: number }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Dot Link</h1>
      {level !== undefined && <span className="meta-label">Level {level}</span>}
    </div>
  );
}

function Game({
  puzzle,
  initialLines,
  onNext,
}: {
  puzzle: Puzzle;
  initialLines: unknown;
  onNext: () => void;
}) {
  const n = puzzle.size;
  const [history, setHistory] = useState<Lines[]>(() => [restore(puzzle, initialLines)]);
  const [drag, setDrag] = useState<Drag | null>(null);
  // Events can outrun renders, so handlers read the live drag, not the state.
  const live = useRef<Drag | null>(null);
  const [cursor, setCursor] = useState<Point | null>(null);

  const committed = history[history.length - 1];
  const lines = drag ? linesOf(drag) : committed;
  const solved = useMemo(() => isWon(puzzle, committed), [puzzle, committed]);

  const hold = useCallback((next: Drag | null) => {
    live.current = next;
    setDrag(next);
  }, []);

  const commit = useCallback(
    (next: Lines) => {
      hold(null);
      if (JSON.stringify(next) === JSON.stringify(committed)) return;
      setHistory((h) => [...h, next]);
      saveProgress({ level: puzzle.level, lines: next });
    },
    [puzzle, committed, hold],
  );

  const rewind = (next: Lines[]) => {
    hold(null);
    setHistory(next);
    saveProgress({ level: puzzle.level, lines: next[next.length - 1] });
  };

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Enter" || !solved) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (!target?.closest("button, a, input, textarea, select")) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [solved, onNext]);

  const cellAt = (e: PointerEvent<SVGSVGElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clamp = (v: number) => Math.min(n - 1, Math.max(0, Math.floor(v * n)));
    return [clamp((e.clientX - rect.left) / rect.width), clamp((e.clientY - rect.top) / rect.height)];
  };

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (solved || e.button !== 0) return;
    const started = begin(puzzle, committed, cellAt(e));
    if (!started) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setCursor(null);
    hold(started);
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    if (live.current) hold(reach(puzzle, live.current, cellAt(e)));
  };

  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (live.current) commit(linesOf(reach(puzzle, live.current, cellAt(e))));
  };

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey || solved) return;
    const at = cursor ?? [0, 0];
    const move = MOVES[e.key];
    if (move) {
      e.preventDefault();
      if (!cursor) return setCursor(at);
      const to: Point = [Math.min(n - 1, Math.max(0, at[0] + move[0])), Math.min(n - 1, Math.max(0, at[1] + move[1]))];
      if (live.current) {
        const moved = reach(puzzle, live.current, to);
        hold(moved);
        setCursor(moved.line[moved.line.length - 1]);
      } else {
        setCursor(to);
      }
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      if (live.current) commit(linesOf(live.current));
      else hold(begin(puzzle, committed, at));
      setCursor(at);
    } else if (e.key === "Escape") {
      hold(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <Header level={puzzle.level} />

      <div className="rounded-md border border-border bg-card p-1.5 lcd-bezel sm:p-2">
        <svg
          role="application"
          aria-label={`Dot Link board, ${n} by ${n}, ${puzzle.pairs.length} colors`}
          tabIndex={0}
          viewBox={`0 0 ${n} ${n}`}
          className="block aspect-square w-full touch-none select-none rounded-[3px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onBlur={() => {
            setCursor(null);
            if (live.current) commit(linesOf(live.current));
          }}
        >
          {Array.from({ length: n * n }, (_, i) => (
            <rect
              key={i}
              x={(i % n) + 0.03}
              y={Math.floor(i / n) + 0.03}
              width={0.94}
              height={0.94}
              rx={0.08}
              className="fill-muted/55"
            />
          ))}
          {lines.map((line, c) =>
            line.map(([x, y]) => (
              <rect
                key={`${c}:${x},${y}`}
                x={x + 0.03}
                y={y + 0.03}
                width={0.94}
                height={0.94}
                rx={0.08}
                fill={COLORS[c]}
                opacity={complete(puzzle, c, line) ? 0.28 : 0.14}
              />
            )),
          )}
          {lines.map(
            (line, c) =>
              line.length > 1 && (
                <polyline
                  key={c}
                  points={line.map(([x, y]) => `${x + 0.5},${y + 0.5}`).join(" ")}
                  fill="none"
                  stroke={COLORS[c]}
                  strokeWidth={0.32}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ),
          )}
          {puzzle.pairs.map((pair, c) =>
            pair.map(([x, y]) => (
              <circle key={`${c}:${x},${y}`} cx={x + 0.5} cy={y + 0.5} r={0.34} fill={COLORS[c]} />
            )),
          )}
          {cursor && (
            <rect
              x={cursor[0] + 0.06}
              y={cursor[1] + 0.06}
              width={0.88}
              height={0.88}
              rx={0.1}
              fill="none"
              strokeWidth={0.06}
              className="stroke-foreground/70"
              strokeDasharray={drag ? undefined : "0.15 0.1"}
            />
          )}
        </svg>
      </div>

      <div className="mt-3 flex min-h-9 items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Undo"
            disabled={history.length === 1}
            onClick={() => rewind(history.slice(0, -1))}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Restart"
            disabled={committed.every((line) => line.length === 0)}
            onClick={() => rewind([...history, emptyLines(puzzle)])}
          >
            <RotateCcw />
          </Button>
        </div>
        {solved && (
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap font-mono text-sm" aria-live="polite">
              Solved
            </span>
            <Button variant="outline" size="sm" onClick={onNext} autoFocus>
              Next
              <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
