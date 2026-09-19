import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type RunGameResult = { ok: boolean; output: string };

type RunGameState = {
  running: boolean;
  /** Output of the last run, until dismissed. */
  log: RunGameResult | null;
  dismissLog: () => void;
  /** Run the pre-run hook (saving the open script), build every mod, then launch the game. */
  runGame: () => Promise<void>;
  /**
   * Register a step to run first, e.g. the open editor saving pending edits. It resolves false to
   * abort the run. Returns the unregister function.
   */
  registerBeforeRun: (hook: () => Promise<boolean>) => () => void;
};

const RunGameContext = createContext<RunGameState | null>(null);

export function RunGameProvider({ children }: { children: ReactNode }) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RunGameResult | null>(null);
  const beforeRun = useRef<(() => Promise<boolean>) | null>(null);

  const registerBeforeRun = useCallback((hook: () => Promise<boolean>) => {
    beforeRun.current = hook;
    return () => {
      if (beforeRun.current === hook) {
        beforeRun.current = null;
      }
    };
  }, []);

  const runGame = useCallback(async () => {
    setRunning(true);
    setLog(null);
    try {
      if (beforeRun.current !== null && !(await beforeRun.current())) {
        setLog({ ok: false, output: "Not run: the open script could not be saved." });
        return;
      }
      setLog(await window.electron.runGame());
    } catch (error) {
      setLog({ ok: false, output: error instanceof Error ? error.message : String(error) });
    } finally {
      setRunning(false);
    }
  }, []);

  const value = useMemo<RunGameState>(
    () => ({ running, log, dismissLog: () => setLog(null), runGame, registerBeforeRun }),
    [running, log, runGame, registerBeforeRun],
  );

  return <RunGameContext.Provider value={value}>{children}</RunGameContext.Provider>;
}

export function useRunGame(): RunGameState {
  const context = useContext(RunGameContext);
  if (!context) {
    throw new Error("useRunGame must be used within a RunGameProvider");
  }
  return context;
}

/** Register `hook` as the step that runs before the game is built and launched, while mounted. */
export function useBeforeRunGame(hook: () => Promise<boolean>): void {
  const { registerBeforeRun } = useRunGame();
  useEffect(() => registerBeforeRun(hook), [registerBeforeRun, hook]);
}
