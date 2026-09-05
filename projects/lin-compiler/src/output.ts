/** Accumulates decompiled source text. Line endings match the host, as the C# StringBuilder did. */
import { EOL } from "node:os";

export class SourceBuilder {
  private readonly parts: string[] = [];

  append(text: string): void {
    this.parts.push(text);
  }

  appendLine(text = ""): void {
    this.parts.push(text, EOL);
  }

  appendJoin(separator: string, values: readonly string[]): void {
    this.parts.push(values.join(separator));
  }

  toString(): string {
    return this.parts.join("");
  }
}
