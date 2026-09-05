import { PNG } from "pngjs";
import { Writable } from "stream";
import TGA from "tga";

import { loadFile } from "./file";

export async function convertTgaToPngDataUrl(filePath: string): Promise<string> {
  const tga = new TGA(await loadFile(filePath));
  const png = new PNG({
    width: tga.width,
    height: tga.height,
  });
  png.data = tga.pixels;

  const chunks: Buffer[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });

  png.pack().pipe(writable);

  await new Promise((resolve) => writable.on("finish", resolve));

  const buffer = Buffer.concat(chunks);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  return dataUrl;
}
