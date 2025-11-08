import React, { useCallback } from "react";
import { useGameDirectory } from "../hooks/useGameDirectory";

const GameDirectory: React.FC = () => {
  const { gameDirectory, setGameDirectory } = useGameDirectory();

  const handleSelectDirectory = useCallback(async () => {
    const result = await window.electron.openDirectoryDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      setGameDirectory(result.filePaths[0]);
    }
  }, [setGameDirectory]);

  return (
    <div className="flex gap-3">
      <div>
        <label className="text-sm">Game Directory</label>
        <div className="p-1 px-3 bg-slate-100 border-slate-300 border-2">{gameDirectory ?? "None"}</div>
      </div>
      <button className="p-1 px-3 bg-slate-300" onClick={handleSelectDirectory}>
        Browse
      </button>
    </div>
  );
};

export default GameDirectory;
