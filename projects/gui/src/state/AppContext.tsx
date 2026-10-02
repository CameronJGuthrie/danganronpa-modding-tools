import { createContext, useContext, useState } from "react";
import type { Setters } from "../types/setter";
import { useStateSetters } from "./useStateSetters";

export type AppState = AppData & Setters<AppData>;

export type AppData = {
  /** The workbench folder the main process resolved; null when none. Meaningful once `workbenchRootLoaded`. */
  workbenchRoot: string | null;
  workbenchRootLoaded: boolean;
  gameDirectory: string | null;
  /** Folder the Asset Preview resolves sprite paths against; null until the default is looked up or one is chosen. */
  assetDirectory: string | null;
  characterStandingSpriteFilePath: string | null;
};

const initialData: AppData = {
  workbenchRoot: null,
  workbenchRootLoaded: false,
  gameDirectory: null,
  assetDirectory: null,
  characterStandingSpriteFilePath: null,
};

const AppContext = createContext<AppState | null>(null);

export const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setData] = useState<AppData>(initialData);
  const setters = useStateSetters(setData);

  const appState: AppState = {
    ...data,
    ...setters,
  };

  return <AppContext.Provider value={appState}>{children}</AppContext.Provider>;
};

// Export hook separately for fast refresh compatibility
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
