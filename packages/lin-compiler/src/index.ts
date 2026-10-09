export * from "./definitions/opcode.definition.ts";
export {
  type NamedValues,
  type Parameter,
  type ParameterScope,
  ParameterType,
  type ScopeTables,
} from "./definitions/parameter.definition.ts";
export { type Script, type ScriptEntry, type ScriptMeta, ScriptType } from "./definitions/script.definition.ts";
export { BinaryError, SourceError } from "./errors.ts";
export {
  type BatchFailure,
  type BatchResult,
  compileDirectory,
  compileFile,
  decompileDirectory,
  decompileFile,
} from "./io/batch.ts";
export { readCompiled, readCompiledFile } from "./io/lin-reader.ts";
export { writeCompiledBytes, writeCompiledFile } from "./io/lin-writer.ts";
export { readSource, readSourceFile } from "./io/linscript-reader.ts";
export {
  DEFAULT_INDENT_SPACES,
  type WriteSourceOptions,
  writeSourceFile,
  writeSourceText,
} from "./io/linscript-writer.ts";
export { argByteCount, type FormatArgsOptions, formatArgs, parseEntry } from "./opcodes/arguments.ts";
export { getOpcode, type OpcodeInfo } from "./opcodes/lookup.ts";
export {
  formatMeta,
  META,
  META_CHARACTER,
  META_LABEL,
  META_OBJECT,
  META_OPTION,
  parseMeta,
  scopeTables,
} from "./opcodes/meta.ts";
export { dropEmptyStyles, formatStyledText, parseStyledText } from "./opcodes/textStyles.ts";
export { TEXT_EAGER, TEXT_SUGAR } from "./opcodes/textSugar.ts";
export { decodeValue, encodeValue } from "./parameter.ts";
