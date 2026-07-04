"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useDiceDecor } from "@/components/dice-decor-provider";
import { getDiceLayoutMode, type DiceLayoutState } from "./use-dice-layout";
import { useThemeColors } from "./use-theme-colors";

const AsciiEffectPanel = dynamic(
  () => import("./AsciiEffectPanel").then((mod) => mod.AsciiEffectPanel),
  { ssr: false }
);

function usePageHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setHidden(document.hidden);
    const onVisibilityChange = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
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

const PANEL_CLASS =
  "absolute top-1/2 -translate-y-1/2 h-[min(52rem,calc(100vh-8rem))] w-[calc(50%-21rem-2.5rem-1rem)]";

export function AsciiCubesDecor() {
  const colors = useThemeColors();
  const { enabled, mounted } = useDiceDecor();
  const diceLayout = useDiceLayout();
  const pageHidden = usePageHidden();

  if (!mounted || !enabled || !colors || diceLayout === "hidden") return null;

  const columns = diceLayout === "grid" ? 2 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <AsciiEffectPanel
        className={`${PANEL_CLASS} right-[calc(50%+21rem+2.5rem)]`}
        colors={colors}
        columns={columns}
        spinDirection={1}
        paused={pageHidden}
      />
      <AsciiEffectPanel
        className={`${PANEL_CLASS} left-[calc(50%+21rem+2.5rem)]`}
        colors={colors}
        columns={columns}
        spinDirection={-1}
        paused={pageHidden}
      />
    </div>
  );
}
