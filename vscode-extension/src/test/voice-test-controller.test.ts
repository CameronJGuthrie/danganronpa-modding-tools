import * as assert from "assert";
import { createCompleteFunctionRegex, isInsideQuotes, getArgumentsFromFunctionLike } from "../util/string-util";

suite("Voice Test Controller Test Suite", () => {
  test("Voice function regex matches correctly", () => {
    // Test valid Voice calls with 4 parameters
    assert.match("Voice(1, 1, 100, 100)", createCompleteFunctionRegex("Voice", 4));
    assert.match("Voice(1,1,100,100)", createCompleteFunctionRegex("Voice", 4));
    assert.match("Voice( 1 , 1 , 100 , 100 )", createCompleteFunctionRegex("Voice", 4));

    // Should not match invalid Voice calls
    assert.doesNotMatch("Voice(1, 1, 100)", createCompleteFunctionRegex("Voice", 4)); // Only 3 params
    assert.doesNotMatch("Voice(1, 1, 100, 100, 200)", createCompleteFunctionRegex("Voice", 4)); // 5 params
    assert.doesNotMatch("Voice", createCompleteFunctionRegex("Voice", 4)); // No params
  });

  test("0x08 opcode regex matches correctly", () => {
    // Should match valid 0x08 calls with 4 parameters
    assert.match("0x08(1, 1, 100, 100)", createCompleteFunctionRegex("0x08", 4));
    assert.match("0x08(1,1,100,100)", createCompleteFunctionRegex("0x08", 4));

    // Should not match invalid calls
    assert.doesNotMatch("0x08(1, 1, 100)", createCompleteFunctionRegex("0x08", 4)); // Only 3 params
    assert.doesNotMatch("0x08(1, 1, 100, 100, 200)", createCompleteFunctionRegex("0x08", 4)); // 5 params
  });

  test("Voice lines inside quotes are detected correctly", () => {
    const testContent = `ScriptType(2)
Text("Voice(1, 1, 100, 100)")
Voice(2, 1, 200, 100)
Text("This has Voice(3, 2, 300, 100) in it")`;

    const voiceRegex = createCompleteFunctionRegex("Voice", 4);
    const matches = [];
    let match;

    // Find all Voice matches
    while ((match = voiceRegex.exec(testContent)) !== null) {
      // Only count matches that are NOT inside quotes
      if (!isInsideQuotes(testContent, match.index)) {
        matches.push(match[0]);
      }
    }

    // Should only find 1 voice line (the one not in quotes)
    assert.strictEqual(matches.length, 1, "Should only find 1 voice line outside quotes");
    assert.strictEqual(matches[0], "Voice(2, 1, 200, 100)", "Should match the correct Voice line");
  });

  test("Voice parameters are extracted correctly", () => {
    const voiceCall = "Voice(1, 2, 300, 100)";
    const args = getArgumentsFromFunctionLike(voiceCall);

    assert.strictEqual(args.length, 4, "Should extract 4 parameters");
    assert.strictEqual(args[0].value, 1, "First param (characterId) should be 1");
    assert.strictEqual(args[1].value, 2, "Second param (chapter) should be 2");
    assert.strictEqual(args[2].value, 300, "Third param (voiceId) should be 300");
    assert.strictEqual(args[3].value, 100, "Fourth param (volume) should be 100");
  });

  test("Multiple Voice lines are detected in document", () => {
    const testContent = `ScriptType(2)

Voice(1, 1, 100, 100)
Voice(2, 1, 200, 100)
0x08(3, 2, 300, 100)

Speaker(1)
Text("This is not a voice line")
Voice(4, 3, 400, 100)`;

    const voiceRegex = createCompleteFunctionRegex("Voice", 4);
    const opcodeRegex = createCompleteFunctionRegex("0x08", 4);
    const matches = [];

    // Find Voice(...) matches
    let match;
    while ((match = voiceRegex.exec(testContent)) !== null) {
      if (!isInsideQuotes(testContent, match.index)) {
        matches.push(match[0]);
      }
    }

    // Find 0x08(...) matches
    while ((match = opcodeRegex.exec(testContent)) !== null) {
      if (!isInsideQuotes(testContent, match.index)) {
        matches.push(match[0]);
      }
    }

    // Should find 4 voice lines total (3 Voice + 1 0x08)
    assert.strictEqual(matches.length, 4, "Should find 4 voice lines total");
  });

  test("Voice line positions can be determined", () => {
    const testContent = `ScriptType(2)

Voice(1, 1, 100, 100)
Speaker(1)
Voice(2, 1, 200, 100)`;

    const voiceRegex = createCompleteFunctionRegex("Voice", 4);
    const positions = [];
    let match;

    while ((match = voiceRegex.exec(testContent)) !== null) {
      if (!isInsideQuotes(testContent, match.index)) {
        // Calculate line number
        const textBeforeMatch = testContent.substring(0, match.index);
        const lineNumber = (textBeforeMatch.match(/\n/g) || []).length;
        positions.push({ line: lineNumber, text: match[0] });
      }
    }

    assert.strictEqual(positions.length, 2, "Should find 2 voice lines");
    assert.strictEqual(positions[0].line, 2, "First voice line should be on line 2");
    assert.strictEqual(positions[1].line, 4, "Second voice line should be on line 4");
  });

  test("Test ID format is valid", () => {
    // Test that we can construct valid test IDs
    const uri = "file:///test.linscript";
    const line = 5;
    const characterId = 1;
    const chapter = 2;
    const voiceId = 300;
    const volume = 100;

    const testId = `${uri}:${line}:${characterId}:${chapter}:${voiceId}:${volume}`;

    // Verify we can parse it back
    const parts = testId.split(":");
    assert.ok(parts.length >= 6, "Test ID should have at least 6 parts");

    const parsedCharacterId = parseInt(parts[parts.length - 4]);
    const parsedChapter = parseInt(parts[parts.length - 3]);
    const parsedVoiceId = parseInt(parts[parts.length - 2]);
    const parsedVolume = parseInt(parts[parts.length - 1]);

    assert.strictEqual(parsedCharacterId, characterId, "Character ID should be parsed correctly");
    assert.strictEqual(parsedChapter, chapter, "Chapter should be parsed correctly");
    assert.strictEqual(parsedVoiceId, voiceId, "Voice ID should be parsed correctly");
    assert.strictEqual(parsedVolume, volume, "Volume should be parsed correctly");
  });

  test("Test label format is correct", () => {
    const characterId = 1;
    const chapter = 2;
    const voiceId = 300;

    const label = `Voice: Ch${chapter} #${voiceId} (Char:${characterId})`;

    assert.match(label, /Voice: Ch\d+ #\d+ \(Char:\d+\)/, "Label should match expected format");
    assert.strictEqual(label, "Voice: Ch2 #300 (Char:1)", "Label should be formatted correctly");
  });
});
