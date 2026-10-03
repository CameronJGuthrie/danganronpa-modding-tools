import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from "react";

export type RunGameResult = { ok: boolean; output: string };

type RunGameState = {
  running: boolean;
  /** Output of the last run, until dismissed. */
  log: RunGameResult | null;
  dismissLog: () => void;
  /** Build every mod, then launch the game. */
  runGame: () => Promise<void>;
};

const RunGameContext = createContext<RunGameState | null>(null);

export function RunGameProvider({ children }: { children: ReactNode }) {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<RunGameResult | null>(null);
  const runGame = useCallback(async () => {
    setRunning(true);
    setLog(null);
    try {
      setLog(await window.electron.runGame());
    } catch (error) {
      setLog({ ok: false, output: error instanceof Error ? error.message : String(error) });
    } finally {
      setRunning(false);
    }
  }, []);

  const value = useMemo<RunGameState>(
    () => ({ running, log, dismissLog: () => setLog(null), runGame }),
    [running, log, runGame],
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
