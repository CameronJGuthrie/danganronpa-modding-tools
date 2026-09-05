/** A problem in `.linscript` source text, annotated with its 1-based line number. */
export class SourceError extends Error {
  readonly line: number;

  constructor(line: number, message: string) {
    super(`line ${line}: ${message}`);
    this.name = "SourceError";
    this.line = line;
  }
}

/** A problem in compiled `.lin` bytes. */
export class BinaryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BinaryError";
  }
}
