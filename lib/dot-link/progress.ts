const KEY = "dot-link";

interface Saved {
  level: number;
  lines: unknown;
}

export function loadProgress(): Saved {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Number.isInteger(saved?.level) && saved.level >= 1) return { level: saved.level, lines: saved.lines };
  } catch {}
  return { level: 1, lines: [] };
}

export function saveProgress(saved: Saved) {
  try {
    localStorage.setItem(KEY, JSON.stringify(saved));
  } catch {}
}
