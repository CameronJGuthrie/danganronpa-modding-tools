import { useCallback, useEffect } from "react";
import { useAppContext } from "../state/AppContext";

/**
 * The app-wide workbench folder, looked up from the main process on first use. `choose` opens a
 * folder picker and saves the pick as the setting. Call this from one place (the layout); other
 * components read `workbenchRoot` from the app context.
 */
export function useWorkbenchRoot() {
  const { workbenchRoot, workbenchRootLoaded, setWorkbenchRoot, setWorkbenchRootLoaded } = useAppContext();

  useEffect(() => {
    if (workbenchRootLoaded) {
      return;
    }
    let isMounted = true;
    window.electron.getWorkbenchRoot().then((root) => {
      if (!isMounted) {
        return;
      }
      setWorkbenchRoot(root.path);
      setWorkbenchRootLoaded(true);
    });
    return () => {
      isMounted = false;
    };
  }, [workbenchRootLoaded, setWorkbenchRoot, setWorkbenchRootLoaded]);

  const choose = useCallback(async () => {
    const picked = await window.electron.chooseWorkbenchRoot();
    if (picked !== null) {
      setWorkbenchRoot(picked);
    }
  }, [setWorkbenchRoot]);

  return { workbenchRoot, loaded: workbenchRootLoaded, choose };
}
