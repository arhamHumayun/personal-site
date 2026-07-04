"use client";

import { useEffect, useRef } from "react";

export interface MouseTrackerState {
  x: number;
  y: number;
  active: boolean;
}

export function useMouseTracker() {
  const mouseRef = useRef<MouseTrackerState>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      mouseRef.current = {
        x: event.clientX,
        y: event.clientY,
        active: true,
      };
    };

    const onLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return mouseRef;
}

function usePrefersReducedMotionRef() {
  const ref = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    ref.current = mediaQuery.matches;

    const handleChange = (event: MediaQueryListEvent) => {
      ref.current = event.matches;
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return ref;
}

export function useMouseTrackerWithMotionPreference() {
  const mouseRef = useMouseTracker();
  const reducedMotionRef = usePrefersReducedMotionRef();

  return { mouseRef, reducedMotionRef };
}

export type PanelSide = "left" | "right";

export function computePanelMouseInfluence(
  side: PanelSide,
  mouse: MouseTrackerState,
  panelRect: DOMRect
): { influence: number; lx: number; ly: number } {
  if (!mouse.active) {
    return { influence: 0, lx: 0, ly: 0 };
  }

  const nx = mouse.x / window.innerWidth;
  const sideWeight =
    side === "left"
      ? 1 - Math.max(0, (nx - 0.5) / 0.5)
      : Math.max(0, (nx - 0.5) / 0.5);

  if (sideWeight < 0.08) {
    return { influence: 0, lx: 0, ly: 0 };
  }

  const centerX = panelRect.left + panelRect.width / 2;
  const centerY = panelRect.top + panelRect.height / 2;
  const dx = mouse.x - centerX;
  const dy = mouse.y - centerY;
  const dist = Math.hypot(dx, dy);
  const falloff = Math.hypot(panelRect.width, panelRect.height) * 0.75;
  const proximity = Math.max(0.45, 1 - dist / falloff);
  const influence = Math.pow(sideWeight * proximity, 0.65);

  const lx = Math.max(-1, Math.min(1, dx / (panelRect.width * 0.3)));
  const ly = Math.max(-1, Math.min(1, dy / (panelRect.height * 0.3)));

  return { influence, lx, ly };
}
