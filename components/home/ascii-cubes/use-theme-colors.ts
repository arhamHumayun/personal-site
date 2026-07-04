"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export interface ThemeColors {
  foreground: string;
  cubeColor: number;
}

function readCssColor(variable: string): string {
  if (typeof window === "undefined") return "#ffffff";

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variable)
    .trim();

  return value || "#ffffff";
}

export function useThemeColors(): ThemeColors | null {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ThemeColors | null>(null);

  useEffect(() => {
    if (!resolvedTheme) return;

    setColors({
      foreground: readCssColor("--foreground"),
      cubeColor: resolvedTheme === "dark" ? 0xffffff : 0x1a1a1a,
    });
  }, [resolvedTheme]);

  return colors;
}
