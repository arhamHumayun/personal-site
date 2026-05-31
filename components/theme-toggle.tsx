"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("size-8 shrink-0 p-0", className)}
        aria-label="Toggle color theme"
        disabled
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "size-8 shrink-0 p-0 text-muted-foreground hover:text-foreground font-mono",
        className
      )}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      <span
        className={cn(
          "text-[10px] font-medium tracking-widest",
          isDark ? "text-link/90" : "text-muted-foreground"
        )}
      >
        {isDark ? "DAY" : "NGT"}
      </span>
    </Button>
  );
}
