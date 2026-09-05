import { useState, useCallback } from "react";
import { TabLayout } from "./base/TabLayout";
import { CharacterPreview } from "./CharacterPreview";
import { ScriptViewer } from "./ScriptViewer";
import { Button } from "./base/Button";

type ExplorerTab = "Character" | "Script" | "Instructions";

const tabs: Record<ExplorerTab, string> = {
  Character: "Character",
  Script: "Script",
  Instructions: "Instructions",
};

export function Layout() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>("Character");
  const [assetDirectory, setAssetDirectory] = useState<string | null>(null);

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
          <Button color="green" onClick={handleChooseAssetDirectory}>
            {assetDirectory ? `Assets: ${assetDirectory}` : "Choose Asset Directory"}
          </Button>
        }
      >
        {activeTab === "Character" && <CharacterPreview />}
        {activeTab === "Script" && <ScriptViewer />}
        {/* {activeTab === "Instructions" && <InstructionDetails />} */}
      </TabLayout>
    </main>
  );
}
