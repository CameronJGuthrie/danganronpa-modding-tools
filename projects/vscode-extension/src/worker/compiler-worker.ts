/**
 * Worker-thread entry point that runs lin-compiler off the extension host thread. Bundled by
 * esbuild to `out/compiler-worker.js`; the host side is `features/compiler.ts`. One request in,
 * one response out, correlated by `id`.
 */
import { parentPort } from "node:worker_threads";
import { compileDirectory, compileFile, decompileDirectory, decompileFile } from "lin-compiler";

export type CompilerOp = "compileFile" | "decompileFile" | "compileDirectory" | "decompileDirectory";

export interface CompilerRequest {
  id: number;
  op: CompilerOp;
  args: string[];
}

/** A directory conversion's outcome, with errors flattened to messages so it can cross the thread boundary. */
export interface DirectoryResult {
  succeeded: string[];
  failed: { file: string; message: string }[];
}

export type CompilerResponse =
  | { id: number; ok: true; result: DirectoryResult | null }
  | { id: number; ok: false; error: string };

async function handle(request: CompilerRequest): Promise<DirectoryResult | null> {
  const [first, second] = request.args;
  switch (request.op) {
    case "compileFile":
      await compileFile(first, second);
      return null;
    case "decompileFile":
      await decompileFile(first, second);
      return null;
    case "compileDirectory":
      return flatten(await compileDirectory(first));
    case "decompileDirectory":
      return flatten(await decompileDirectory(first));
  }
}

function flatten(result: Awaited<ReturnType<typeof compileDirectory>>): DirectoryResult {
  return {
    succeeded: result.succeeded,
    failed: result.failed.map((failure) => ({ file: failure.file, message: failure.error.message })),
  };
}

const port = parentPort;
if (port === null) {
  throw new Error("compiler-worker must be started as a worker thread");
}

port.on("message", (request: CompilerRequest) => {
  handle(request).then(
    (result) => port.postMessage({ id: request.id, ok: true, result } satisfies CompilerResponse),
    (error: unknown) =>
      port.postMessage({
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      } satisfies CompilerResponse),
  );
});
