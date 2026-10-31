"use client";

import { Flag, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { count, emptyBoard, flagsLeft, reveal, toggleFlag, type Board } from "@/lib/minesweeper/engine";
import { cn } from "@/lib/utils";

const LEVELS = {
  beginner: { label: "Beginner", width: 9, height: 9, mines: 10, max: "max-w-[22rem]" },
  intermediate: { label: "Intermediate", width: 16, height: 16, mines: 40, max: "max-w-[34rem]" },
  expert: { label: "Expert", width: 30, height: 16, mines: 99, max: "max-w-none" },
} as const;

type Level = keyof typeof LEVELS;

const NUMBER = [
  "",
  "text-blue-600 dark:text-blue-400",
  "text-green-700 dark:text-green-400",
  "text-red-600 dark:text-red-400",
  "text-indigo-800 dark:text-indigo-300",
  "text-rose-800 dark:text-rose-300",
  "text-teal-700 dark:text-teal-300",
  "text-foreground",
  "text-muted-foreground",
];

const KEY = "minesweeper";
const LONG_PRESS = 400;

interface Saved {
  level: Level;
  best: Partial<Record<Level, number>>;
}

function load(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && saved.level in LEVELS) return saved;
  } catch {}
  return { level: "beginner", best: {} };
}

function save(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {}
}

function newBoard(level: Level): Board {
  const { width, height, mines } = LEVELS[level];
  const portrait = width > height && window.innerWidth < 640;
  return portrait ? emptyBoard(height, width, mines) : emptyBoard(width, height, mines);
}

const subscribe = () => () => {};

export function Minesweeper() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return mounted ? <Game /> : <Header />;
}

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Minesweeper</h1>
      {children}
    </div>
  );
}

function Readout({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="meta-label">{label}</span>
      <span className="font-mono text-sm tabular-nums">{value}</span>
    </div>
  );
}

function Game() {
  const [saved, setSaved] = useState(load);
  const [board, setBoard] = useState(() => newBoard(saved.level));
  const [flagMode, setFlagMode] = useState(false);
  const [started, setStarted] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; fired: boolean; touch: boolean }>({
    fired: false,
    touch: false,
  });

  const level = LEVELS[saved.level];
  const done = board.status === "won" || board.status === "lost";
  const seconds = started === null ? 0 : Math.floor((now - started) / 1000);

  useEffect(() => {
    if (board.status !== "playing") return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [board.status]);

  const restart = (next: Level = saved.level) => {
    const updated = { ...saved, level: next };
    setSaved(updated);
    save(updated);
    setBoard(newBoard(next));
    setStarted(null);
    setNow(0);
  };

  const apply = (next: Board) => {
    if (next === board) return;
    const time = Date.now();
    if (board.status === "ready") {
      setStarted(time);
    }
    setNow(time);
    setBoard(next);
    if (next.status === "won") {
      const secs = Math.floor((time - (started ?? time)) / 1000);
      const best = saved.best[saved.level];
      if (best === undefined || secs < best) {
        const updated = { ...saved, best: { ...saved.best, [saved.level]: secs } };
        setSaved(updated);
        save(updated);
      }
    }
  };

  const cellAt = (e: { target: EventTarget }) => {
    const i = (e.target as HTMLElement).closest<HTMLElement>("[data-i]")?.dataset.i;
    return i === undefined ? null : Number(i);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const i = cellAt(e);
    press.current = { fired: false, touch: e.pointerType !== "mouse" };
    if (i === null || e.pointerType === "mouse") return;
    press.current.timer = setTimeout(() => {
      press.current.fired = true;
      apply(toggleFlag(board, i));
      navigator.vibrate?.(15);
    }, LONG_PRESS);
  };

  const cancelPress = () => clearTimeout(press.current.timer);

  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    cancelPress();
    const i = cellAt(e);
    if (i === null || press.current.fired) return;
    apply(flagMode && !board.open[i] ? toggleFlag(board, i) : reveal(board, i));
  };

  const onContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const i = cellAt(e);
    if (i !== null && !press.current.touch) apply(toggleFlag(board, i));
  };

  return (
    <div className={cn("mx-auto w-full", level.max)}>
      <Header>
        <div className="flex gap-3">
          {(Object.keys(LEVELS) as Level[]).map((key) => (
            <button
              key={key}
              onClick={() => restart(key)}
              className={cn(
                "meta-label transition-colors hover:text-foreground",
                key === saved.level && "text-link hover:text-link",
              )}
              aria-pressed={key === saved.level}
            >
              {LEVELS[key].label}
            </button>
          ))}
        </div>
      </Header>

      <div className="mb-3 flex items-center gap-5">
        <Readout label="Mines" value={flagsLeft(board)} />
        <Readout label="Time" value={seconds} />
        {saved.best[saved.level] !== undefined && <Readout label="Best" value={saved.best[saved.level]!} />}
      </div>

      <div className="rounded-md border border-border bg-card p-1.5 lcd-bezel sm:p-2 [container-type:inline-size]">
        <div
          role="grid"
          aria-label={`Minesweeper, ${board.width} by ${board.height}, ${board.mines} mines`}
          className="grid touch-manipulation select-none font-mono font-semibold"
          style={{
            gridTemplateColumns: `repeat(${board.width}, minmax(0, 1fr))`,
            fontSize: `calc(100cqw / ${board.width} * 0.5)`,
          }}
          onPointerDown={onPointerDown}
          onPointerUp={cancelPress}
          onPointerLeave={cancelPress}
          onPointerCancel={cancelPress}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          {board.mine.map((mine, i) => {
            const open = board.open[i];
            const flagged = board.flag[i];
            const n = open && !mine ? count(board, i) : 0;
            return (
              <div key={i} data-i={i} className="aspect-square p-px">
                <div
                  role="gridcell"
                  aria-label={open ? (mine ? "mine" : String(n)) : flagged ? "flagged" : "hidden"}
                  className={cn(
                    "flex h-full w-full items-center justify-center rounded-[2px]",
                    open ? "bg-muted/35" : "bg-muted-foreground/30",
                    !open && !done && "cursor-pointer hover:bg-muted-foreground/40",
                    board.exploded === i && "bg-destructive/70",
                  )}
                >
                  {open && mine && <div className="size-[42%] rounded-full bg-foreground" />}
                  {open && !mine && n > 0 && <span className={NUMBER[n]}>{n}</span>}
                  {!open && flagged && (
                    <Flag
                      className={cn(
                        "size-[58%]",
                        board.status === "lost" && !mine ? "text-muted-foreground" : "text-link",
                      )}
                      strokeWidth={2.5}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex min-h-9 items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="New game" onClick={() => restart()}>
            <RotateCcw />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Flag mode"
            aria-pressed={flagMode}
            className={cn(flagMode && "bg-accent text-link")}
            onClick={() => setFlagMode(!flagMode)}
          >
            <Flag />
          </Button>
        </div>
        {board.status === "won" && (
          <span className="font-mono text-sm" aria-live="polite">
            Cleared in {seconds}s
          </span>
        )}
      </div>
    </div>
  );
}
