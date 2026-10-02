import { useCallback } from "react";
import type { Setters } from "../types/setter";
import type { AppData } from "./AppContext";

export function useStateSetters(setData: React.Dispatch<React.SetStateAction<AppData>>): Setters<AppData> {
  const setWorkbenchRoot = useCallback(
    (workbenchRoot: string | null) => {
      setData((prevState) => ({ ...prevState, workbenchRoot }));
    },
    [setData],
  );

  const setWorkbenchRootLoaded = useCallback(
    (workbenchRootLoaded: boolean) => {
      setData((prevState) => ({ ...prevState, workbenchRootLoaded }));
    },
    [setData],
  );

  const setGameDirectory = useCallback(
    (gameDirectory: string | null) => {
      setData((prevState) => ({ ...prevState, gameDirectory }));
    },
    [setData],
  );

  const setAssetDirectory = useCallback(
    (assetDirectory: string | null) => {
      setData((prevState) => ({ ...prevState, assetDirectory }));
    },
    [setData],
  );

  const setCharacterStandingSpriteFilePath = useCallback(
    (characterStandingFilePath: string | null) => {
      setData((prevState) => ({ ...prevState, characterStandingSpriteFilePath: characterStandingFilePath }));
    },
    [setData],
  );

  return {
    setWorkbenchRoot,
    setWorkbenchRootLoaded,
    setGameDirectory,
    setAssetDirectory,
    setCharacterStandingSpriteFilePath,
  };
}
