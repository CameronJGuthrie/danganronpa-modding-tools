import type * as vscode from "vscode";
import type { OpcodeMeta } from "../../types/opcode-meta";

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
  /** Name for the terminal player */
  playerName: string;
  /** Function patterns to match (e.g., ["Voice", "0x08"]) */
  functionPatterns: Array<{ name: string; paramCount: number }>;
  /** Timeout in milliseconds before disposing the terminal */
  timeoutMs: number;
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
  opcode: OpcodeMeta;
  /** And all other properties not derived from the opcode */
} & Omit<
  AudioTestConfig<TInfo>,
  "controllerId" | "controllerLabel" | "runProfileLabel" | "playerName" | "functionPatterns"
>;

export function createConfiguration<T>(builder: AudioTestConfigBuilder<T>): AudioTestConfig<T> {
  const { opcode, ...rest } = builder;

  return {
    controllerId: `${opcode.name}-playback-controller`,
    controllerLabel: `${opcode.name} Playback`,
    runProfileLabel: `Play ${opcode.name}`,
    playerName: `${opcode.name} Player`,
    functionPatterns: [
      {
        name: opcode.name,
        paramCount: opcode.parameters.length,
      },
      {
        name: opcode.opcode,
        paramCount: opcode.parameters.length,
      },
    ],
    ...rest,
  };
}
