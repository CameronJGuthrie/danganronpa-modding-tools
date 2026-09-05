import { useEffect } from "react";
import { useAppContext } from "../state/AppContext";

export function useGameDirectory() {
  const { gameDirectory, setGameDirectory } = useAppContext();

  useEffect(() => {
    window.electron.getDefaultGameDirectory().then((defaultDir) => {
      setGameDirectory(defaultDir);
    });
  }, [setGameDirectory]);

  return { gameDirectory, setGameDirectory };
}
