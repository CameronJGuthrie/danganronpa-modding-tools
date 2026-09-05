import * as assert from "node:assert";
import { mapProperty } from "../util/data-util";

suite("Data Util Test Suite", () => {
  test("mapProperty extracts color property to name", () => {
    const input = {
      1: { color: "red", size: "large" },
      2: { color: "blue", size: "small" },
    };

    const result = mapProperty(input, "color");

    assert.strictEqual(result[1].name, "red", "Should map color 'red' to name");
    assert.strictEqual(result[2].name, "blue", "Should map color 'blue' to name");
  });

  test("mapProperty works with string keys", () => {
    const input = {
      apple: { color: "red", taste: "sweet" },
      banana: { color: "yellow", taste: "sweet" },
      lemon: { color: "yellow", taste: "sour" },
    };

    const result = mapProperty(input, "color");

    assert.strictEqual(result.apple.name, "red");
    assert.strictEqual(result.banana.name, "yellow");
    assert.strictEqual(result.lemon.name, "yellow");
  });

  test("mapProperty works with different property keys", () => {
    const input = {
      1: { title: "First", description: "The first item" },
      2: { title: "Second", description: "The second item" },
    };

    const resultTitle = mapProperty(input, "title");
    const resultDesc = mapProperty(input, "description");

    assert.strictEqual(resultTitle[1].name, "First");
    assert.strictEqual(resultTitle[2].name, "Second");
    assert.strictEqual(resultDesc[1].name, "The first item");
    assert.strictEqual(resultDesc[2].name, "The second item");
  });

  test("mapProperty preserves all keys from input", () => {
    const input = {
      10: { value: "ten" },
      20: { value: "twenty" },
      30: { value: "thirty" },
    };

    const result = mapProperty(input, "value");

    assert.ok(result[10], "Key 10 should exist");
    assert.ok(result[20], "Key 20 should exist");
    assert.ok(result[30], "Key 30 should exist");
    assert.strictEqual(Object.keys(result).length, 3, "Should have 3 keys");
  });

  test("mapProperty works with single entry", () => {
    const input = {
      1: { name: "solo" },
    };

    const result = mapProperty(input, "name");

    assert.strictEqual(result[1].name, "solo");
  });

  test("mapProperty handles empty strings", () => {
    const input = {
      1: { label: "" },
      2: { label: "not empty" },
    };

    const result = mapProperty(input, "label");

    assert.strictEqual(result[1].name, "", "Should preserve empty string");
    assert.strictEqual(result[2].name, "not empty");
  });

  test("mapProperty output has correct structure", () => {
    const input = {
      a: { prop: "value" },
    };

    const result = mapProperty(input, "prop");

    assert.strictEqual(typeof result.a, "object", "Result value should be an object");
    assert.ok("name" in result.a, "Result should have 'name' property");
    assert.strictEqual(Object.keys(result.a).length, 1, "Result should only have 'name' property");
  });
});
