import { type Script, type ScriptEntry, ScriptType } from "../script.js";
import { OP_TEXT, OP_TEXT_STYLE, OP_WAIT_FRAME, OP_WAIT_INPUT } from "./ids.js";
import { parseQuotedString, TextOpcode } from "./textOpcode.js";

/** Matches `<CLT N>` opening tags, `<CLT>` closing tags, and literal newlines. */
const CLT_PATTERN = /<CLT\s+(\d+)>|<CLT>|\n/g;
const HAS_CLT = /<CLT\s+\d+>|<CLT>/;

/**
 * Auto-Text opcode - generates WaitFrame/WaitInput automatically based on newlines.
 * This is syntactic sugar that expands to Text + WaitFrame(s) + WaitInput.
 */
export class AutoTextOpcode extends TextOpcode {
  constructor() {
    super("AutoText");
  }

  override readSource(argsString: string, lineNum: number, script: Script): ScriptEntry[] {
    // Mutate script type and increment number of entries
    script.type = ScriptType.Text;
    script.textEntries++;

    const text = parseQuotedString(argsString, lineNum);

    if (HAS_CLT.test(text)) {
      // Parse CLT tags and generate opcodes
      return parseCLTTags(text);
    }

    // No CLT tags - generate Text with WaitFrame for each \n and WaitInput at end
    const entries: ScriptEntry[] = [{ opcode: OP_TEXT, text, args: [0, 0] }];

    // Count newlines and add WaitFrame for each
    const newlineCount = [...text].filter((c) => c === "\n").length;
    for (let i = 0; i < newlineCount; i++) {
      entries.push({ opcode: OP_WAIT_FRAME, args: [] });
    }

    // Add WaitInput at the end
    entries.push({ opcode: OP_WAIT_INPUT, args: [] });

    return entries;
  }
}

function parseCLTTags(text: string): ScriptEntry[] {
  const entries: ScriptEntry[] = [];
  const matches = [...text.matchAll(CLT_PATTERN)];

  // If no matches, just create a simple Text entry with WaitInput
  if (matches.length === 0) {
    entries.push({ opcode: OP_TEXT, text, args: [0, 0] });
    entries.push({ opcode: OP_WAIT_INPUT, args: [] });
    return entries;
  }

  // Extract the first CLT style number to set before Text
  const firstMatch = matches[0];
  const initialStyle = firstMatch[1] !== undefined ? Number.parseInt(firstMatch[1], 10) : 0;

  // Add initial TextStyle before Text
  entries.push({ opcode: OP_TEXT_STYLE, args: [initialStyle & 0xff] });

  // Add the Text entry (with CLT tags preserved)
  entries.push({ opcode: OP_TEXT, text, args: [0, 0] });

  // Process all matches to generate TextStyle and WaitFrame opcodes
  for (const match of matches) {
    if (match[0] === "<CLT>") {
      // <CLT> without number - closing tag, reset style to 0
      entries.push({ opcode: OP_TEXT_STYLE, args: [0] });
    } else if (match[0] === "\n") {
      // Newline - add WaitFrame
      entries.push({ opcode: OP_WAIT_FRAME, args: [] });
    } else if (match[1] !== undefined) {
      // <CLT N> opening tag - but skip the first one since we already handled it
      if (match.index > firstMatch.index) {
        entries.push({ opcode: OP_TEXT_STYLE, args: [Number.parseInt(match[1], 10) & 0xff] });
      }
    }
  }

  // Add WaitInput at the end
  entries.push({ opcode: OP_WAIT_INPUT, args: [] });

  return entries;
}
