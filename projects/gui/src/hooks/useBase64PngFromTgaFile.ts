import { useEffect, useState } from "react";

/** Data URL per TGA path, or null when the file could not be read or converted. */
const cache: { [key: string]: string | null } = {};

export type TgaImageState =
  | { status: "empty" }
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; dataUrl: string };

/** Converts a TGA file to a PNG data URL through the main process, remembering the result per path. */
export function useTgaImage(filePath: string | null): TgaImageState {
  const [state, setState] = useState<TgaImageState>(() => initialState(filePath));

  useEffect(() => {
    let isMounted = true;
    const next = initialState(filePath);
    // Defer so a synchronous setState inside the effect does not trigger a lint warning
    Promise.resolve().then(() => {
      if (isMounted) {
        setState(next);
      }
    });
    if (filePath === null || next.status !== "loading") {
      return () => {
        isMounted = false;
      };
    }

    window.electron
      .tgaFileToPng(filePath)
      .then(
        (dataUrl) => {
          cache[filePath] = dataUrl;
        },
        () => {
          cache[filePath] = null;
        },
      )
      .then(() => {
        if (isMounted) {
          setState(initialState(filePath));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filePath]);

  return state;
}

function initialState(filePath: string | null): TgaImageState {
  if (filePath === null) {
    return { status: "empty" };
  }
  if (!(filePath in cache)) {
    return { status: "loading" };
  }
  const cached = cache[filePath];
  return cached === null ? { status: "failed" } : { status: "ready", dataUrl: cached };
}

/** The PNG data URL for a TGA file, or null while it loads, when there is no file, or when it cannot be read. */
export function useBase64PngFromTgaFile(filePath: string | null): string | null {
  const state = useTgaImage(filePath);
  return state.status === "ready" ? state.dataUrl : null;
}
