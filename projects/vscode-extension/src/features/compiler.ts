import * as path from "node:path";
import { Worker } from "node:worker_threads";
import type * as vscode from "vscode";
import type { CompilerOp, CompilerRequest, CompilerResponse, DirectoryResult } from "../worker/compiler-worker";

/**
 * Host-side handle on the compiler worker thread. The worker is started on the first request and
 * kept for later ones, so compiling never blocks the extension host; `dispose` stops it. A worker
 * that dies rejects everything in flight, and the next request starts a fresh one.
 */
export class CompilerClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private readonly pending = new Map<
    number,
    { resolve: (result: DirectoryResult | null) => void; reject: (error: Error) => void }
  >();

  constructor(private readonly workerScript: string) {}

  compileFile(input: string, output: string): Promise<void> {
    return this.request("compileFile", [input, output]).then(() => undefined);
  }

  decompileFile(input: string, output: string): Promise<void> {
    return this.request("decompileFile", [input, output]).then(() => undefined);
  }

  compileDirectory(directory: string): Promise<DirectoryResult> {
    return this.request("compileDirectory", [directory]).then(directoryResult);
  }

  decompileDirectory(directory: string): Promise<DirectoryResult> {
    return this.request("decompileDirectory", [directory]).then(directoryResult);
  }

  /** Stop the worker, failing any request still in flight. */
  dispose(): void {
    const worker = this.worker;
    this.worker = null;
    this.failPending(new Error("Compiler worker was disposed"));
    void worker?.terminate();
  }

  private request(op: CompilerOp, args: string[]): Promise<DirectoryResult | null> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ensureWorker().postMessage({ id, op, args } satisfies CompilerRequest);
    });
  }

  private ensureWorker(): Worker {
    if (this.worker !== null) {
      return this.worker;
    }
    const worker = new Worker(this.workerScript);
    worker.on("message", (response: CompilerResponse) => {
      const entry = this.pending.get(response.id);
      if (entry === undefined) {
        return;
      }
      this.pending.delete(response.id);
      if (response.ok) {
        entry.resolve(response.result);
      } else {
        entry.reject(new Error(response.error));
      }
    });
    worker.on("error", (error: unknown) =>
      this.workerDied(worker, error instanceof Error ? error : new Error(String(error))),
    );
    worker.on("exit", (code) => this.workerDied(worker, new Error(`Compiler worker exited with code ${code}`)));
    this.worker = worker;
    return worker;
  }

  private workerDied(worker: Worker, error: Error): void {
    if (this.worker !== worker) {
      return; // already replaced or disposed
    }
    this.worker = null;
    this.failPending(error);
  }

  private failPending(error: Error): void {
    for (const entry of this.pending.values()) {
      entry.reject(error);
    }
    this.pending.clear();
  }
}

function directoryResult(result: DirectoryResult | null): DirectoryResult {
  if (result === null) {
    throw new Error("Compiler worker returned no result for a directory conversion");
  }
  return result;
}

let shared: CompilerClient | null = null;

/** The extension's compiler worker, created on first use next to the bundled extension and stopped on deactivate. */
export function getCompiler(context: vscode.ExtensionContext): CompilerClient {
  if (shared === null) {
    const client = new CompilerClient(path.join(context.extensionPath, "out", "compiler-worker.js"));
    shared = client;
    context.subscriptions.push({
      dispose: () => {
        client.dispose();
        if (shared === client) {
          shared = null;
        }
      },
    });
  }
  return shared;
}
