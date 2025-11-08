import { useCallback } from "react";
import { Setters } from "../types/setter";
import { AppData } from "./AppContext";

export function useStateSetters(setData: React.Dispatch<React.SetStateAction<AppData>>): Setters<AppData> {
  const setGameDirectory = useCallback(
    (gameDirectory: string | null) => {
      setData((prevState) => ({ ...prevState, gameDirectory }));
    },
    [setData]
  );

  const setCharacterStandingSpriteFilePath = useCallback(
    (characterStandingFilePath: string | null) => {
      setData((prevState) => ({ ...prevState, characterStandingSpriteFilePath: characterStandingFilePath }));
    },
    [setData]
  );

  return {
    setGameDirectory,
    setCharacterStandingSpriteFilePath,
  };
}
