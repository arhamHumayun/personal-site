"use client";

import { Eraser, Pencil, RotateCcw, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { BOX, COL, conflicts, generate, PEERS, ROW, type Difficulty, type Grid } from "@/lib/sudoku/engine";
import { cn } from "@/lib/utils";

const LEVELS: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
const KEY = "sudoku";
const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface State {
  difficulty: Difficulty;
  puzzle: Grid;
  solution: Grid;
  entries: Grid;
  notes: number[];
  elapsed: number;
}

function fresh(difficulty: Difficulty): State {
  const { puzzle, solution } = generate(difficulty);
  return { difficulty, puzzle, solution, entries: puzzle.slice(), notes: Array(81).fill(0), elapsed: 0 };
}

function load(): State {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved?.difficulty in LEVELS && saved.entries?.length === 81) return saved;
  } catch {}
  const state = fresh("easy");
  save(state);
  return state;
}

function save(state: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

function clock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

const subscribe = () => () => {};

export function Sudoku() {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  return <div className="mx-auto w-full max-w-[30rem]">{mounted ? <Game /> : <Header />}</div>;
}

function Header({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Sudoku</h1>
      {children}
    </div>
  );
}

function Game() {
  const [state, setState] = useState(load);
  const [history, setHistory] = useState<Pick<State, "entries" | "notes">[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [noting, setNoting] = useState(false);
  const [startedAt, setStartedAt] = useState(() => Date.now() - state.elapsed * 1000);
  const [now, setNow] = useState(() => Date.now());

  const solved = state.entries.every((d, i) => d === state.solution[i]);
  const seconds = solved ? state.elapsed : Math.floor((now - startedAt) / 1000);
  const bad = conflicts(state.entries);
  const placed = DIGITS.map((d) => state.entries.filter((e) => e === d).length);
  const focus = selected === null ? 0 : state.entries[selected];

  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [solved]);

  const commit = useCallback(
    (entries: Grid, notes: number[]) => {
      setHistory((h) => [...h, { entries: state.entries, notes: state.notes }]);
      const done = entries.every((d, i) => d === state.solution[i]);
      const next = { ...state, entries, notes, elapsed: Math.floor((Date.now() - startedAt) / 1000) };
      setState(next);
      save(next);
      if (done) setSelected(null);
    },
    [state, startedAt],
  );

  const enter = useCallback(
    (digit: number) => {
      if (selected === null || solved || state.puzzle[selected]) return;
      const entries = state.entries.slice();
      const notes = state.notes.slice();
      if (noting && digit) {
        if (entries[selected]) return;
        notes[selected] ^= 1 << digit;
      } else {
        entries[selected] = entries[selected] === digit ? 0 : digit;
        notes[selected] = 0;
        if (entries[selected]) for (const j of PEERS[selected]) notes[j] &= ~(1 << digit);
      }
      commit(entries, notes);
    },
    [selected, solved, state, noting, commit],
  );

  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last || solved) return;
    setHistory(history.slice(0, -1));
    const next = { ...state, ...last };
    setState(next);
    save(next);
  }, [history, solved, state]);

  const restart = (difficulty: Difficulty = state.difficulty) => {
    const next = fresh(difficulty);
    setState(next);
    save(next);
    setHistory([]);
    setSelected(null);
    setStartedAt(Date.now());
    setNow(Date.now());
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        return undo();
      }
      if (e.metaKey || e.ctrlKey) return;
      if (/^[1-9]$/.test(e.key)) return enter(Number(e.key));
      if (["0", "Backspace", "Delete"].includes(e.key)) return enter(0);
      if (e.key.toLowerCase() === "n") return setNoting((n) => !n);
      const move = { ArrowUp: -9, ArrowDown: 9, ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (move === undefined) return;
      e.preventDefault();
      setSelected((s) => {
        if (s === null) return 40;
        const next = s + move;
        if (next < 0 || next > 80 || (Math.abs(move) === 1 && ROW(next) !== ROW(s))) return s;
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enter, undo]);

  return (
    <>
      <Header>
        <div className="flex gap-3">
          {(Object.keys(LEVELS) as Difficulty[]).map((key) => (
            <button
              key={key}
              onClick={() => restart(key)}
              className={cn(
                "meta-label transition-colors hover:text-foreground",
                key === state.difficulty && "text-link hover:text-link",
              )}
              aria-pressed={key === state.difficulty}
            >
              {LEVELS[key]}
            </button>
          ))}
        </div>
      </Header>

      <div className="mb-3 flex items-baseline gap-2">
        <span className="meta-label">Time</span>
        <span className="font-mono text-sm tabular-nums">{clock(seconds)}</span>
      </div>

      <div className="rounded-md border border-border bg-card p-1.5 lcd-bezel sm:p-2 [container-type:inline-size]">
        <div
          role="grid"
          aria-label="Sudoku"
          className="grid grid-cols-9 select-none overflow-hidden rounded-[3px] border-2 border-foreground/45"
          style={{ fontSize: "calc(100cqw / 9 * 0.5)" }}
        >
          {state.entries.map((digit, i) => {
            const given = state.puzzle[i] !== 0;
            const peer =
              selected !== null &&
              (ROW(i) === ROW(selected) || COL(i) === COL(selected) || BOX(i) === BOX(selected));
            return (
              <button
                key={i}
                role="gridcell"
                aria-label={`Row ${ROW(i) + 1} column ${COL(i) + 1}${digit ? `, ${digit}` : ""}`}
                aria-selected={selected === i}
                onClick={() => setSelected(i)}
                className={cn(
                  "relative flex aspect-square items-center justify-center border-border outline-none",
                  COL(i) % 3 === 2 && COL(i) < 8 ? "border-r-2 border-r-foreground/45" : COL(i) < 8 && "border-r",
                  ROW(i) % 3 === 2 && ROW(i) < 8 ? "border-b-2 border-b-foreground/45" : ROW(i) < 8 && "border-b",
                  peer && "bg-muted/45",
                  focus !== 0 && digit === focus && "bg-link/15",
                  selected === i && "bg-link/25",
                  solved && "bg-transparent",
                )}
              >
                {digit ? (
                  <span
                    className={cn(
                      given ? "font-semibold text-foreground" : "text-link",
                      bad.has(i) && !given && "text-destructive",
                      bad.has(i) && given && "underline decoration-destructive decoration-2 underline-offset-4",
                    )}
                  >
                    {digit}
                  </span>
                ) : (
                  state.notes[i] !== 0 && (
                    <span className="grid h-full w-full grid-cols-3 p-[6%] text-[0.36em] leading-none text-muted-foreground">
                      {DIGITS.map((d) => (
                        <span key={d} className="flex items-center justify-center">
                          {state.notes[i] & (1 << d) ? d : ""}
                        </span>
                      ))}
                    </span>
                  )
                )}
              </button>
            );
          })}
        </div>
      </div>

      {solved ? (
        <div className="mt-3 flex min-h-9 items-center justify-between gap-3">
          <span className="font-mono text-sm" aria-live="polite">
            Solved in {clock(seconds)}
          </span>
          <Button variant="outline" size="sm" onClick={() => restart()} autoFocus>
            New puzzle
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-9 gap-1">
            {DIGITS.map((d) => (
              <Button
                key={d}
                variant="ghost"
                className={cn("h-11 px-0 font-mono text-lg", placed[d - 1] >= 9 && "text-muted-foreground/40")}
                onClick={() => enter(d)}
              >
                {d}
              </Button>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="Undo" disabled={!history.length} onClick={undo}>
              <Undo2 />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Erase" onClick={() => enter(0)}>
              <Eraser />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notes"
              aria-pressed={noting}
              className={cn(noting && "bg-accent text-link")}
              onClick={() => setNoting(!noting)}
            >
              <Pencil />
            </Button>
            <Button variant="ghost" size="icon" aria-label="New puzzle" className="ml-auto" onClick={() => restart()}>
              <RotateCcw />
            </Button>
          </div>
        </>
      )}
    </>
  );
}
