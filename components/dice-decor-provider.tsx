"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const STORAGE_KEY = "personal-site-dice-decor";

interface DiceDecorContextValue {
  enabled: boolean;
  mounted: boolean;
  toggle: () => void;
}

const DiceDecorContext = createContext<DiceDecorContextValue | null>(null);

export function DiceDecorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setEnabled(stored === "true");
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <DiceDecorContext.Provider value={{ enabled, mounted, toggle }}>
      {children}
    </DiceDecorContext.Provider>
  );
}

export function useDiceDecor(): DiceDecorContextValue {
  const context = useContext(DiceDecorContext);
  if (!context) {
    throw new Error("useDiceDecor must be used within DiceDecorProvider");
  }
  return context;
}
