const KEY = "ice-slide";

interface Saved {
  level: number;
  moves: string;
}

export function loadProgress(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Number.isInteger(saved?.level) && saved.level >= 1 && typeof saved.moves === "string") return saved;
  } catch {}
  return { level: 1, moves: "" };
}

export function saveProgress(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {}
}
