import { useState } from "react";
import { useRootFontSize } from "../hooks/useRootFontSize";
import { useTheme } from "../hooks/useTheme";
import { useWorkbenchRoot } from "../hooks/useWorkbenchRoot";
import { useRunGame } from "../state/RunGameContext";
import { Button } from "./base/Button";
import { TabLayout } from "./base/TabLayout";
import { AssetPreview } from "./asset-preview/AssetPreview";
import { RunLog } from "./RunLog";
import { ScriptBrowser } from "./script-browser/ScriptBrowser";

type ExplorerTab = "ScriptBrowser" | "AssetPreview";

const tabs: Record<ExplorerTab, string> = {
  ScriptBrowser: "Script Browser",
  AssetPreview: "Asset Preview",
};

export function Layout() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>("ScriptBrowser");
  const [theme, toggleTheme] = useTheme();
  const zoom = useRootFontSize();
  const { running, log, dismissLog, runGame } = useRunGame();
  const workbench = useWorkbenchRoot();

  return (
    <main className="max-h-full h-full p-8">
      <TabLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <Button
              onClick={() => void workbench.choose()}
              title={
                workbench.workbenchRoot === null
                  ? "Choose the workbench folder holding the extracted game data"
                  : `Workbench: ${workbench.workbenchRoot} (click to change)`
              }
            >
              📁 {workbench.workbenchRoot === null ? "Choose workbench…" : folderName(workbench.workbenchRoot)}
            </Button>
            <Button onClick={zoom.zoomOut} title="Zoom out (Ctrl+-)" aria-label="Zoom out">
              −
            </Button>
            <Button onClick={zoom.reset} title="Reset zoom to 100% (Ctrl+0)">
              {zoom.percent}%
            </Button>
            <Button onClick={zoom.zoomIn} title="Zoom in (Ctrl+=)" aria-label="Zoom in">
              +
            </Button>
            <Button onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
            <Button
              color="green"
              onClick={() => void runGame()}
              disabled={running}
              title="Save the open script, compile every mod into the game's .wad files, then launch the game through Steam"
            >
              {running ? "Building…" : "▶ Run game"}
            </Button>
          </div>
        }
      >
        {activeTab === "ScriptBrowser" && <ScriptBrowser />}
        {activeTab === "AssetPreview" && <AssetPreview />}
      </TabLayout>
      {log !== null && <RunLog result={log} onDismiss={dismissLog} />}
    </main>
  );
}

/** The last path segment, for either path separator. */
function folderName(folder: string): string {
  const parts = folder.split(/[\\/]/).filter((part) => part !== "");
  return parts[parts.length - 1] ?? folder;
}
