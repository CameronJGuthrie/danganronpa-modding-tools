import { useBase64PngFromTgaFile } from "../hooks/useBase64PngFromTgaFile";

type Props = {
  filePath: string | null;
  width: number;
  height: number;
};

export function TgaImage({ filePath, width, height }: Props) {
  const dataUrl = useBase64PngFromTgaFile(filePath);

  if (filePath === null) {
    return null;
  }

  return <img src={dataUrl ?? undefined} width={width} height={height} className="" />;
}
