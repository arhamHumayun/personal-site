"use client";

import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiceDecor } from "@/components/dice-decor-provider";
import { cn } from "@/lib/utils";

export function DiceToggle({ className }: { className?: string }) {
  const { enabled, mounted, toggle } = useDiceDecor();

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn("size-8 shrink-0 p-0", className)}
        aria-label="Toggle dice decoration"
        disabled
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "size-8 shrink-0 p-0 text-muted-foreground hover:text-foreground",
        !enabled && "opacity-45",
        className
      )}
      onClick={toggle}
      aria-label={enabled ? "Hide dice decoration" : "Show dice decoration"}
      aria-pressed={enabled}
    >
      <Dices className="size-4" />
    </Button>
  );
}
