import { useCallback, useState } from "react";
import { useTheme } from "../hooks/useTheme";
import { Button } from "./base/Button";
import { TabLayout } from "./base/TabLayout";
import { CharacterPreview } from "./CharacterPreview";
import { ScriptBrowser } from "./script-browser/ScriptBrowser";

type ExplorerTab = "ScriptBrowser" | "Character";

const tabs: Record<ExplorerTab, string> = {
  ScriptBrowser: "Script Browser",
  Character: "Character",
};

export function Layout() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>("ScriptBrowser");
  const [assetDirectory, setAssetDirectory] = useState<string | null>(null);
  const [theme, toggleTheme] = useTheme();

  const handleChooseAssetDirectory = useCallback(() => {
    window.electron.openDirectoryDialog().then((result) => {
      if (!result.canceled && result.filePaths.length > 0) {
        setAssetDirectory(result.filePaths[0]);
        console.log("Asset directory selected:", result.filePaths[0]);
      }
    });
  }, []);

  return (
    <main className="max-h-full h-full p-8">
      <TabLayout
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        actions={
          <div className="flex items-center gap-2">
            <Button color="green" onClick={handleChooseAssetDirectory}>
              {assetDirectory ? `Assets: ${assetDirectory}` : "Choose Asset Directory"}
            </Button>
            <Button onClick={toggleTheme} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
            </Button>
          </div>
        }
      >
        {activeTab === "ScriptBrowser" && <ScriptBrowser />}
        {activeTab === "Character" && <CharacterPreview />}
      </TabLayout>
    </main>
  );
}
