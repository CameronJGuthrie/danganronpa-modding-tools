import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rootFontSize";

export const DEFAULT_ROOT_FONT_SIZE = 16;
const MIN_ROOT_FONT_SIZE = 10;
const MAX_ROOT_FONT_SIZE = 28;
const STEP = 1;

function clamp(size: number): number {
  return Math.min(MAX_ROOT_FONT_SIZE, Math.max(MIN_ROOT_FONT_SIZE, Math.round(size)));
}

function initialRootFontSize(): number {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(stored) && stored > 0) {
      return clamp(stored);
    }
  } catch {
    // storage unavailable; fall through to the default
  }
  return DEFAULT_ROOT_FONT_SIZE;
}

export type RootFontSizeControls = {
  /** Current root font size in pixels. */
  size: number;
  /** Current size as a percentage of the default, e.g. 100. */
  percent: number;
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

/**
 * The root font size (in px) applied to <html>, so every rem-based size scales with it.
 * Remembered in localStorage and bound to Ctrl/Cmd + `=`/`+`, `-` and `0`.
 */
export function useRootFontSize(): RootFontSizeControls {
  const [size, setSize] = useState<number>(initialRootFontSize);

  useEffect(() => {
    document.documentElement.style.fontSize = `${size}px`;
    try {
      window.localStorage.setItem(STORAGE_KEY, String(size));
    } catch {
      // storage unavailable; the choice just does not persist
    }
  }, [size]);

  const zoomIn = useCallback(() => setSize((previous) => clamp(previous + STEP)), []);
  const zoomOut = useCallback(() => setSize((previous) => clamp(previous - STEP)), []);
  const reset = useCallback(() => setSize(DEFAULT_ROOT_FONT_SIZE), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) {
        return;
      }
      switch (event.key) {
        case "=":
        case "+":
          event.preventDefault();
          zoomIn();
          break;
        case "-":
        case "_":
          event.preventDefault();
          zoomOut();
          break;
        case "0":
          event.preventDefault();
          reset();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomIn, zoomOut, reset]);

  return { size, percent: Math.round((size / DEFAULT_ROOT_FONT_SIZE) * 100), zoomIn, zoomOut, reset };
}
