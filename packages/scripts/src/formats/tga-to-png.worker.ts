/**
 * Worker thread for `convertTgasUnder` (`lib/extract-tree.ts`): converts one TGA per message. The
 * TGA decoder runs on the JavaScript thread, so a pool of these spreads the work over the cores.
 */

import { parentPort } from "node:worker_threads";
import { errorMessage } from "../lib/errors.ts";
import { convertTgaToPng, NotTgaError } from "./tga-to-png.ts";

export interface TgaJob {
  id: number;
  tgaPath: string;
  pngPath: string;
}

export type TgaJobResult = { id: number; ok: true } | { id: number; ok: false; notTga: boolean; error: string };

if (parentPort === null) {
  throw new Error("tga-to-png.worker.ts must be run as a worker thread");
}
const port = parentPort;

port.on("message", async (job: TgaJob) => {
  let result: TgaJobResult;
  try {
    await convertTgaToPng(job.tgaPath, job.pngPath);
    result = { id: job.id, ok: true };
  } catch (error) {
    result = { id: job.id, ok: false, notTga: error instanceof NotTgaError, error: errorMessage(error) };
  }
  port.postMessage(result);
});
