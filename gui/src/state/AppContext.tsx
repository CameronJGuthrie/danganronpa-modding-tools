import { createContext, useContext, useState } from "react";
import { Setters } from "../types/setter";
import { useStateSetters } from "./useStateSetters";

export type AppState = AppData & Setters<AppData>;

export type AppData = {
  gameDirectory: string | null;
  characterStandingSpriteFilePath: string | null;
};

const initialData: AppData = {
  gameDirectory: null,
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
// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppContextProvider");
  }
  return context;
}
