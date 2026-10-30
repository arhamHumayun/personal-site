"use client";

import { RotateCcw, Share2, Undo2 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { dailyPuzzle } from "@/lib/ice-slide/daily";
import {
  localDate,
  puzzleNumber,
  replay,
  samePoint,
  slide,
  type Dir,
  type Point,
  type Puzzle,
} from "@/lib/ice-slide/engine";
import { loadMoves, loadResult, saveMoves, saveResult, streak } from "@/lib/ice-slide/progress";
import { cn } from "@/lib/utils";

const KEYS: Record<string, Dir> = {
  ArrowUp: "U",
  ArrowDown: "D",
  ArrowLeft: "L",
  ArrowRight: "R",
  w: "U",
  s: "D",
  a: "L",
  d: "R",
};

const SWIPE = 24;

const subscribe = () => () => {};

function distance(a: Point, b: Point) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function duration(cells: number) {
  return Math.min(70 + 45 * cells, 600);
}

function towards(dx: number, dy: number): Dir {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "R" : "L") : dy > 0 ? "D" : "U";
}

export function IceSlide() {
  const today = useSyncExternalStore(subscribe, localDate, () => null);
  const daily = useMemo(() => (today ? dailyPuzzle(today) : null), [today]);
  if (daily) return <Game key={daily.puzzle.date} puzzle={daily.puzzle} />;

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <Header />
      <div className="flex aspect-square items-center justify-center rounded-md border border-border bg-card lcd-bezel">
        {today && <p className="meta-label">No puzzle today</p>}
      </div>
    </div>
  );
}

function Header({ number }: { number?: number }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Ice Slide</h1>
      {number !== undefined && <span className="font-mono text-sm text-muted-foreground">#{number}</span>}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="meta-label">{label}</span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}

function Game({ puzzle }: { puzzle: Puzzle }) {
  const [view, setView] = useState(() => ({ moves: loadMoves(puzzle.date), ms: 0 }));
  const [result, setResult] = useState(() => loadResult(puzzle.date));
  const [streakDays, setStreakDays] = useState(() => streak(puzzle.date));
  const [copied, setCopied] = useState(false);

  const moves = useRef(view.moves);
  const queue = useRef<Dir[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pointer = useRef<{ x: number; y: number } | null>(null);

  const pos = replay(puzzle, view.moves);
  const solved = samePoint(pos, puzzle.exit);

  const commit = useCallback(
    (next: string, from: Point, to: Point) => {
      moves.current = next;
      setView({ moves: next, ms: duration(distance(from, to)) });
      saveMoves(puzzle.date, next);
      if (samePoint(to, puzzle.exit)) {
        queue.current = [];
        saveResult(puzzle.date, next.length);
        setResult(loadResult(puzzle.date));
        setStreakDays(streak(puzzle.date));
      }
    },
    [puzzle],
  );

  const step = useCallback(
    function advance() {
      timer.current = undefined;
      for (let dir = queue.current.shift(); dir; dir = queue.current.shift()) {
        const from = replay(puzzle, moves.current);
        const to = slide(puzzle, from, dir);
        if (samePoint(from, puzzle.exit) || samePoint(from, to)) continue;
        commit(moves.current + dir, from, to);
        timer.current = setTimeout(advance, duration(distance(from, to)));
        return;
      }
    },
    [puzzle, commit],
  );

  const push = useCallback(
    (dir: Dir) => {
      queue.current.push(dir);
      if (!timer.current) step();
    },
    [step],
  );

  const rewind = useCallback(
    (next: string) => {
      clearTimeout(timer.current);
      timer.current = undefined;
      queue.current = [];
      commit(next, replay(puzzle, moves.current), replay(puzzle, next));
    },
    [puzzle, commit],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      const dir = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
      if (!dir) return;
      e.preventDefault();
      push(dir);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [push]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    pointer.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) >= SWIPE) return push(towards(dx, dy));
    const rect = e.currentTarget.getBoundingClientRect();
    const cell = rect.width / puzzle.width;
    const tx = (e.clientX - rect.left) / cell - (pos[0] + 0.5);
    const ty = (e.clientY - rect.top) / cell - (pos[1] + 0.5);
    if (Math.max(Math.abs(tx), Math.abs(ty)) > 0.5) push(towards(tx, ty));
  };

  const share = async () => {
    const number = puzzleNumber(puzzle.date);
    const text = `Ice Slide #${number} — ${result} moves (par ${puzzle.par})\n${location.origin}/puzzle`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-[30rem]">
      <Header number={puzzleNumber(puzzle.date)} />

      <div className="mb-3 flex items-center gap-5">
        <Readout label="Moves" value={view.moves.length} />
        <Readout label="Par" value={puzzle.par} />
        <Readout label="Streak" value={streakDays} />
      </div>

      <div className="rounded-md border border-border bg-card p-1.5 lcd-bezel sm:p-2">
        <div
          role="application"
          aria-label={`Ice Slide board, ${puzzle.width} by ${puzzle.height}`}
          className="relative touch-none select-none"
          style={{ aspectRatio: `${puzzle.width} / ${puzzle.height}` }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (pointer.current = null)}
        >
          <div
            className="grid h-full w-full"
            style={{ gridTemplateColumns: `repeat(${puzzle.width}, minmax(0, 1fr))` }}
          >
            {puzzle.tiles.flatMap((row, y) =>
              [...row].map((tile, x) => {
                const exit = samePoint([x, y], puzzle.exit);
                return (
                  <div key={`${x},${y}`} className="p-[1.5px]">
                    <div
                      className={cn(
                        "flex h-full w-full items-center justify-center rounded-[3px]",
                        tile === "#" ? "bg-muted-foreground/45" : "bg-muted/55",
                      )}
                    >
                      {exit && <div className="size-[58%] rounded-full border-2 border-link" />}
                    </div>
                  </div>
                );
              }),
            )}
          </div>
          <div
            aria-hidden
            className="absolute left-0 top-0 ease-[cubic-bezier(0.2,0.7,0.3,1)]"
            style={{
              width: `${100 / puzzle.width}%`,
              height: `${100 / puzzle.height}%`,
              transform: `translate(${pos[0] * 100}%, ${pos[1] * 100}%)`,
              transitionProperty: "transform",
              transitionDuration: `${view.ms}ms`,
            }}
          >
            <div
              className={cn(
                "absolute inset-[18%] rounded-full bg-primary shadow-sm transition-transform duration-300",
                solved && "scale-[0.82] bg-link",
              )}
            />
          </div>
        </div>
      </div>

      <div className="mt-3 flex min-h-9 items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Undo"
            disabled={view.moves.length === 0}
            onClick={() => rewind(view.moves.slice(0, -1))}
          >
            <Undo2 />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Restart"
            disabled={view.moves.length === 0}
            onClick={() => rewind("")}
          >
            <RotateCcw />
          </Button>
        </div>
        {result !== undefined && (
          <div className="flex items-center gap-3">
            <span className="whitespace-nowrap font-mono text-sm" aria-live="polite">
              Solved in {result} (par {puzzle.par})
            </span>
            <Button variant="outline" size="sm" onClick={share}>
              <Share2 />
              {copied ? "Copied" : "Share"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
