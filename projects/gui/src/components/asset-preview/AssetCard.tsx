import type { AssetKind, AssetMeta } from "../../data/asset";
import { useTgaImage } from "../../hooks/useBase64PngFromTgaFile";

type Props = {
  asset: AssetMeta;
  kind: AssetKind;
  /** Absolute path of the asset's TGA, or null while no asset directory is known. */
  filePath: string | null;
};

/** The image box keeps the source's proportions: bust-ups are 960x560 and stands 512x1024. */
const aspectClass: Readonly<Record<AssetKind, string>> = {
  bustup: "aspect-[12/7]",
  stand: "aspect-[1/2]",
};

/** One image in the Asset Preview grid: the picture above, its name and file name below. */
export function AssetCard({ asset, kind, filePath }: Props) {
  const image = useTgaImage(filePath);
  const fileName = asset.path.slice(asset.path.lastIndexOf("/") + 1);

  return (
    <li className="flex flex-col rounded border border-slate-300 bg-white shadow-sm dark:border-slate-600 dark:bg-slate-800">
      <div
        className={`flex ${aspectClass[kind]} items-center justify-center overflow-hidden rounded-t bg-slate-100 dark:bg-slate-900`}
      >
        {image.status === "ready" ? (
          <img src={image.dataUrl} alt={`${asset.name} (${fileName})`} className="h-full w-full object-contain" />
        ) : (
          <span className="p-2 text-center text-xs text-slate-500 dark:text-slate-400">
            {placeholder(image.status)}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2">
        <span className="truncate font-semibold" title={asset.name}>
          {asset.name}
        </span>
        <code className="truncate text-xs text-slate-500 dark:text-slate-400" title={asset.path}>
          {fileName}
        </code>
      </div>
    </li>
  );
}

function placeholder(status: "empty" | "loading" | "failed"): string {
  switch (status) {
    case "empty":
      return "No asset directory";
    case "loading":
      return "Loading…";
    case "failed":
      return "File not found";
  }
}
