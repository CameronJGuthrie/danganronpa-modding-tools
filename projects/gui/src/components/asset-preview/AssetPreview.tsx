import { useCallback, useEffect, useState } from "react";
import { type AssetKind, type AssetMeta, assetKinds } from "../../data/asset";
import { bustups } from "../../data/bustup";
import { sprites } from "../../data/sprite";
import { useAppContext } from "../../state/AppContext";
import { Button } from "../base/Button";
import { AssetCard } from "./AssetCard";

const tables: Readonly<Record<AssetKind, Readonly<Record<string, readonly AssetMeta[]>>>> = {
  bustup: bustups,
  stand: sprites,
};

/** Grid column width per kind; bust-ups are landscape and stands are tall, so each gets its own. */
const gridClass: Readonly<Record<AssetKind, string>> = {
  bustup: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(30rem,1fr))]",
  stand: "grid gap-4 grid-cols-[repeat(auto-fill,minmax(20rem,1fr))]",
};

/** Browses the character images, one tab per character, as a grid of named cards. */
export function AssetPreview() {
  const [kind, setKind] = useState<AssetKind>("bustup");
  const [selectedCharacter, setSelectedCharacter] = useState("Makoto");
  const { assetDirectory, lookedUp, chooseDirectory } = useAssetDirectory();

  const table = tables[kind];
  const characterNames = Object.keys(table);
  const character = selectedCharacter in table ? selectedCharacter : characterNames[0];
  const assets = table[character] ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <fieldset className="flex gap-2" aria-label="Asset kind">
          {(Object.keys(assetKinds) as AssetKind[]).map((option) => (
            <Button
              key={option}
              size="small"
              color={kind === option ? "blue" : "white"}
              aria-pressed={kind === option}
              title={assetKinds[option].description}
              onClick={() => setKind(option)}
            >
              {kind === option ? <strong>{assetKinds[option].label}</strong> : assetKinds[option].label}
            </Button>
          ))}
        </fieldset>
        <span className="ml-auto text-sm">Asset directory</span>
        <code className="p-1 px-3 rounded bg-slate-100 border-slate-300 border dark:bg-slate-800 dark:border-slate-600">
          {assetDirectory ?? (lookedUp ? "None" : "Looking…")}
        </code>
        <Button size="small" onClick={() => void chooseDirectory()}>
          Browse
        </Button>
        {lookedUp && assetDirectory === null && (
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Extract the game files (pnpm run unpack) or choose the folder that contains dr1_data
          </span>
        )}
      </div>

      <nav aria-label="Characters">
        <ul className="flex flex-wrap gap-2 border-b border-slate-300 dark:border-slate-600 pb-3">
          {characterNames.map((name) => {
            const isSelected = name === character;
            return (
              <li key={name}>
                <Button
                  size="small"
                  color={isSelected ? "blue" : "white"}
                  aria-current={isSelected ? "page" : undefined}
                  onClick={() => setSelectedCharacter(name)}
                >
                  {isSelected ? <strong>{name}</strong> : name}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>

      {assets.length === 0 ? (
        <p className="text-sm">
          No {assetKinds[kind].label.toLowerCase()} for {character}.
        </p>
      ) : (
        <ul className={gridClass[kind]}>
          {assets.map((asset) => (
            <AssetCard
              key={asset.path}
              asset={asset}
              kind={kind}
              filePath={assetDirectory === null ? null : assetDirectory + asset.path}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

/** The app-wide asset directory, filled from the main process default on first use. */
function useAssetDirectory() {
  const { assetDirectory, setAssetDirectory } = useAppContext();
  const [lookedUp, setLookedUp] = useState(assetDirectory !== null);

  useEffect(() => {
    if (lookedUp) {
      return;
    }
    let isMounted = true;
    window.electron.getDefaultAssetDirectory().then((defaultDirectory) => {
      if (!isMounted) {
        return;
      }
      if (defaultDirectory !== null) {
        setAssetDirectory(defaultDirectory);
      }
      setLookedUp(true);
    });
    return () => {
      isMounted = false;
    };
  }, [lookedUp, setAssetDirectory]);

  const chooseDirectory = useCallback(async () => {
    const result = await window.electron.openDirectoryDialog();
    if (!result.canceled && result.filePaths.length > 0) {
      setAssetDirectory(result.filePaths[0]);
      setLookedUp(true);
    }
  }, [setAssetDirectory]);

  return { assetDirectory, lookedUp, chooseDirectory };
}
