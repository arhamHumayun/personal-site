"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDiceDecor } from "@/components/dice-decor-provider";
import {
  getDiceLayoutMode,
  type DiceLayoutState,
} from "./use-dice-layout";
import { useMouseTrackerWithMotionPreference } from "./use-mouse-tracker";
import { useThemeColors } from "./use-theme-colors";

const AsciiEffectPanel = dynamic(
  () =>
    import("./AsciiEffectPanel").then((mod) => mod.AsciiEffectPanel),
  { ssr: false }
);

function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(document.hidden);

    const handleVisibilityChange = () => {
      setHidden(document.hidden);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return hidden;
}

function useDiceLayout(): DiceLayoutState {
  const [layout, setLayout] = useState<DiceLayoutState>("hidden");

  useEffect(() => {
    const update = () => setLayout(getDiceLayoutMode(window.innerWidth));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return layout;
}

const PANEL_ANCHOR =
  "absolute top-1/2 -translate-y-1/2 w-[calc(50%-21rem-2.5rem-1rem)]";

const PANEL_COLUMN_CLASS = `${PANEL_ANCHOR} h-[min(52rem,calc(100vh-8rem))]`;
const PANEL_GRID_CLASS = `${PANEL_ANCHOR} h-[min(48rem,calc(100vh-8rem))]`;

export function AsciiCubesDecor() {
  const colors = useThemeColors();
  const { enabled, mounted } = useDiceDecor();
  const diceLayout = useDiceLayout();
  const pageHidden = usePageHidden();
  const { mouseRef, reducedMotionRef } = useMouseTrackerWithMotionPreference();

  if (!mounted || !enabled || !colors || diceLayout === "hidden") return null;

  const panelClass =
    diceLayout === "grid" ? PANEL_GRID_CLASS : PANEL_COLUMN_CLASS;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <AsciiEffectPanel
        className={`${panelClass} right-[calc(50%+21rem+2.5rem)]`}
        colors={colors}
        layout={diceLayout}
        side="left"
        mouseRef={mouseRef}
        reducedMotionRef={reducedMotionRef}
        spinDirection={1}
        paused={pageHidden}
      />
      <AsciiEffectPanel
        className={`${panelClass} left-[calc(50%+21rem+2.5rem)]`}
        colors={colors}
        layout={diceLayout}
        side="right"
        mouseRef={mouseRef}
        reducedMotionRef={reducedMotionRef}
        spinDirection={-1}
        paused={pageHidden}
      />
    </div>
  );
}
