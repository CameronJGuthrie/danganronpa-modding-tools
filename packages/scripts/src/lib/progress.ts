import chalk from "chalk";

const BAR_WIDTH = 30;

const interactive = process.stdout.isTTY === true;

/** One step of a run whose progress bar counts towards the whole. */
export interface OverallStep {
  name: string;
  /** How long the step is expected to take, from a previous run. */
  seconds: number;
}

/** How long a step of a run actually took. */
export interface StepTiming {
  name: string;
  seconds: number;
}

/**
 * The full-width bar under the step bars: the whole run's progress with the estimated time
 * remaining written across it. Each step advances it in proportion to the time the step is
 * expected to take, and the estimate is scaled by how fast this run is going against the
 * expectation. Step bars created with an `OverallProgress` drive it themselves; a step without a
 * bar is bracketed with `begin` and `end`.
 */
export class OverallProgress {
  private readonly steps: OverallStep[];
  private readonly totalSeconds: number;
  private readonly startedAt = Date.now();
  private doneSeconds = 0;
  private current: { step: OverallStep; fraction: number; startedAt: number } | null = null;
  private readonly timings: StepTiming[] = [];

  constructor(steps: OverallStep[]) {
    this.steps = steps;
    this.totalSeconds = steps.reduce((sum, step) => sum + step.seconds, 0);
  }

  /** Start the step called `name`; it must be one of the steps given to the constructor. */
  begin(name: string): void {
    const step = this.steps.find((candidate) => candidate.name === name);
    if (step === undefined) {
      throw new Error(`Unknown step: ${name}`);
    }
    this.current = { step, fraction: 0, startedAt: Date.now() };
  }

  /** How far through the current step the run is, 0 to 1. */
  setFraction(fraction: number): void {
    if (this.current !== null) {
      this.current.fraction = Math.min(1, Math.max(0, fraction));
    }
  }

  /** Finish the current step, recording how long it took. */
  end(): void {
    if (this.current === null) {
      return;
    }
    this.timings.push({ name: this.current.step.name, seconds: (Date.now() - this.current.startedAt) / 1000 });
    this.doneSeconds += this.current.step.seconds;
    this.current = null;
  }

  /** How long each finished step took, in order. */
  getTimings(): readonly StepTiming[] {
    return this.timings;
  }

  /** Progress of the whole run, 0 to 1, weighted by the steps' expected durations. */
  get fraction(): number {
    if (this.totalSeconds === 0) {
      return 0;
    }
    const current = this.current === null ? 0 : this.current.step.seconds * this.current.fraction;
    return Math.min(1, (this.doneSeconds + current) / this.totalSeconds);
  }

  /** Expected seconds left, scaled by this run's speed once enough of it has been seen. */
  get remainingSeconds(): number {
    const expectedDone = this.fraction * this.totalSeconds;
    const expectedRemaining = this.totalSeconds - expectedDone;
    const elapsed = (Date.now() - this.startedAt) / 1000;
    const speed = expectedDone >= 5 ? elapsed / expectedDone : 1;
    return expectedRemaining * speed;
  }

  /** The bar as one line of `columns` characters, with the estimate written across it. */
  renderLine(columns: number): string {
    const fraction = this.fraction;
    const label = `${Math.round(fraction * 100)}%  ${formatRemaining(this.remainingSeconds)}`;
    const padding = Math.max(0, columns - label.length);
    const left = Math.floor(padding / 2);
    const text = `${" ".repeat(left)}${label}${" ".repeat(padding - left)}`.slice(0, columns);
    const filled = Math.round(fraction * columns);
    return chalk.bgCyan.black(text.slice(0, filled)) + chalk.bgGray.white(text.slice(filled));
  }

  /** Draw the bar on the current line, leaving the cursor at its start. */
  draw(): void {
    if (interactive) {
      process.stdout.write(`\r\x1b[K${this.renderLine(columns())}\r`);
    }
  }

  /** Erase the bar so other output can be printed. */
  clear(): void {
    if (interactive) {
      process.stdout.write("\r\x1b[K");
    }
  }
}

function formatRemaining(seconds: number): string {
  if (seconds < 1) {
    return "finishing up";
  }
  if (seconds < 60) {
    return `about ${Math.ceil(seconds)}s remaining`;
  }
  const minutes = Math.floor(seconds / 60);
  const rest = Math.ceil(seconds - minutes * 60);
  return `about ${minutes}m ${String(rest).padStart(2, "0")}s remaining`;
}

function columns(): number {
  return process.stdout.columns ?? 80;
}

/**
 * A single-line progress bar redrawn in place on stdout. When stdout is not a terminal nothing
 * is drawn until `finish`, so piped output stays one line per bar. Given an `OverallProgress`,
 * the bar is a step of it named by the bar's label: it begins the step, advances it as the bar
 * advances, ends it on `finish`, and draws the overall bar on the line below its own.
 */
export class ProgressBar {
  private readonly label: string;
  private total: number;
  private current = 0;
  private status = "";
  private readonly overall: OverallProgress | null;

  constructor(label: string, total: number, overall: OverallProgress | null = null) {
    this.label = label;
    this.total = total;
    this.overall = overall;
    overall?.begin(label);
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

  /** Erase the bar (and the overall bar under it) so other output can be printed; the next update redraws it. */
  clear(): void {
    if (interactive) {
      process.stdout.write(this.overall === null ? "\r\x1b[K" : "\r\x1b[K\n\x1b[K\x1b[1A\r");
    }
  }

  /** Replace the bar with a final line; the overall bar, if any, moves down under it. */
  finish(message: string): void {
    this.clear();
    console.log(message);
    if (this.overall !== null) {
      this.overall.end();
      this.overall.draw();
    }
  }

  private render(): void {
    const fraction = this.total === 0 ? 0 : this.current / this.total;
    this.overall?.setFraction(fraction);
    if (!interactive) {
      return;
    }
    const filled = Math.round(fraction * BAR_WIDTH);
    const bar = "█".repeat(filled) + "░".repeat(BAR_WIDTH - filled);
    const line = `${this.label} [${bar}] ${this.current}/${this.total} ${this.status}`;
    // Truncate so the line never wraps, which would break the in-place redraw
    const width = columns();
    const own = `\r\x1b[K${line.slice(0, width - 1)}`;
    if (this.overall === null) {
      process.stdout.write(own);
    } else {
      process.stdout.write(`${own}\n\x1b[K${this.overall.renderLine(width)}\x1b[1A\r`);
    }
  }
}
