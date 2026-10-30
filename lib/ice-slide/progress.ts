import { previousDate } from "./engine";

const KEY = "ice-slide";

interface Saved {
  results: Record<string, number>;
  progress: { date: string; moves: string } | null;
}

function load(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved && typeof saved.results === "object") return saved;
  } catch {}
  return { results: {}, progress: null };
}

function save(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {}
}

export function loadMoves(date: string): string {
  const { progress } = load();
  return progress?.date === date ? progress.moves : "";
}

export function saveMoves(date: string, moves: string) {
  save({ ...load(), progress: { date, moves } });
}

export function loadResult(date: string): number | undefined {
  return load().results[date];
}

export function saveResult(date: string, moves: number) {
  const saved = load();
  if (saved.results[date] === undefined) save({ ...saved, results: { ...saved.results, [date]: moves } });
}

export function streak(today: string): number {
  const { results } = load();
  let day = results[today] === undefined ? previousDate(today) : today;
  let count = 0;
  while (results[day] !== undefined) {
    count++;
    day = previousDate(day);
  }
  return count;
}
