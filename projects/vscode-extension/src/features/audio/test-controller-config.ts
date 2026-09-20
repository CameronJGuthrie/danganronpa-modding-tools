import type * as vscode from "vscode";
import type { LinscriptInstructionMeta } from "../../types/linscript-instruction-meta";
import type { ArgumentNameSource } from "../../util/string-util";

/**
 * Configuration for creating an audio test controller
 */
export type AudioTestConfig<TInfo> = {
  /** Unique identifier for the test controller */
  controllerId: string;
  /** Display label for the test controller */
  controllerLabel: string;
  /** Display label for the run profile */
  runProfileLabel: string;
  /** Playback channel; only one process plays per channel at a time */
  channel: string;
  /** Function patterns to match (e.g., ["Voice", "0x08"]); calls may omit trailing optional arguments */
  functionPatterns: Array<{ name: string; paramCount: number; requiredParamCount: number }>;
  /** Default for every argument position, used where a call omits a trailing optional argument */
  defaults: Array<number | undefined>;
  /** Name table for every argument position, so `Voice(Toko, Chapter_99, 16)` resolves to numbers */
  argumentNames: readonly ArgumentNameSource[];
  /**
   * True when these arguments mean "stop this channel" rather than "play something".
   * For example Music(255, ...) stops the current music. Omit if the opcode has no stop value.
   */
  isStopRequest?: (info: TInfo) => boolean;
  /** Parse test info from test ID */
  parseInfoFromTest: (test: vscode.TestItem) => TInfo | null;
  /** Get audio file path from parsed info */
  getAudioFilePath: (info: TInfo) => string | null;
  /** Format label for test item */
  formatTestLabel: (info: TInfo, args: Array<{ value: number }>) => string;
  /** Format display name for notification */
  formatDisplayName: (info: TInfo) => string;
  /** Create test ID from components */
  createTestId: (uri: string, line: number, args: Array<{ value: number }>) => string;
  /** Parse info from arguments */
  parseInfoFromArgs: (args: Array<{ value: number }>) => TInfo | null;
};

export type AudioTestConfigBuilder<TInfo> = {
  /** The opcode relating to this test configuration */
  opcode: LinscriptInstructionMeta;
  /** And all other properties not derived from the opcode */
} & Omit<
  AudioTestConfig<TInfo>,
  | "controllerId"
  | "controllerLabel"
  | "runProfileLabel"
  | "channel"
  | "functionPatterns"
  | "defaults"
  | "argumentNames"
>;

export function createConfiguration<T>(builder: AudioTestConfigBuilder<T>): AudioTestConfig<T> {
  const { opcode, ...rest } = builder;
  const requiredParamCount = opcode.parameters.filter((param) => param.defaultValue === undefined).length;

  return {
    controllerId: `${opcode.name}-playback-controller`,
    controllerLabel: `${opcode.name} Playback`,
    runProfileLabel: `Play ${opcode.name}`,
    channel: opcode.name,
    functionPatterns: [
      {
        name: opcode.name,
        paramCount: opcode.parameters.length,
        requiredParamCount,
      },
      {
        name: opcode.hexcode,
        paramCount: opcode.parameters.length,
        requiredParamCount,
      },
    ],
    defaults: opcode.parameters.map((param) => param.defaultValue),
    argumentNames: opcode.parameters.map((param) => param.namesBy ?? param.names),
    ...rest,
  };
}
