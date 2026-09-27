/** One previewable image: its path relative to the asset directory and a display name. */
export type AssetMeta = {
  name: string;
  path: string;
};

export type AssetKind = "bustup" | "stand";

export const assetKinds: Readonly<Record<AssetKind, { label: string; description: string }>> = {
  bustup: { label: "Bust-ups", description: "Landscape close-ups from cg/bustup_*.tga" },
  stand: { label: "Standing sprites", description: "Tall stand_*.tga textures drawn by the Sprite opcode" },
};
