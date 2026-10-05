const BAR_WIDTH = 30;

/**
 * A single-line progress bar redrawn in place on stdout. When stdout is not a terminal nothing
 * is drawn until `finish`, so piped output stays one line per bar.
 */
export class ProgressBar {
  private readonly label: string;
  private total: number;
  private current = 0;
  private status = "";
  private readonly interactive = process.stdout.isTTY === true;

  constructor(label: string, total: number) {
    this.label = label;
    this.total = total;
    this.render();
  }

  /** Change the number of steps, e.g. once the work is counted. */
  setTotal(total: number): void {
    this.total = total;
    this.render();
  }

  /** Advance by `steps` and show `status` after the counter. */
  tick(status = "", steps = 1): void {
    this.current = Math.min(this.total, this.current + steps);
    this.status = status;
    this.render();
  }

  /** Show `status` without advancing. */
  setStatus(status: string): void {
    this.status = status;
    this.render();
  }

  /** Erase the bar so other output can be printed; the next update redraws it. */
  clear(): void {
    if (this.interactive) {
      process.stdout.write("\r\x1b[K");
    }
  }

  /** Replace the bar with a final line. */
  finish(message: string): void {
    this.clear();
    console.log(message);
  }

  private render(): void {
    if (!this.interactive) {
      return;
    }
    const fraction = this.total === 0 ? 0 : this.current / this.total;
    const filled = Math.round(fraction * BAR_WIDTH);
    const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
    const line = `${this.label} [${bar}] ${this.current}/${this.total} ${this.status}`;
    // Truncate so the line never wraps, which would break the in-place redraw
    const columns = process.stdout.columns ?? 80;
    process.stdout.write(`\r\x1b[K${line.slice(0, columns - 1)}`);
  }
}
