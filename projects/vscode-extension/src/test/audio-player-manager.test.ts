import * as assert from "node:assert";
import type { ChildProcess } from "node:child_process";
import { EventEmitter } from "node:events";
import { AudioPlayerManager } from "../features/audio/audio-player-manager";

/** Stand-in for a player process that records kill() and can be told to exit. */
class FakeProcess extends EventEmitter {
  static nextPid = 1000;
  readonly pid = FakeProcess.nextPid++;
  killed = false;

  constructor(readonly audioPath: string) {
    super();
  }

  kill(): boolean {
    this.killed = true;
    return true;
  }

  exitNormally(): void {
    this.emit("exit", 0, null);
  }
}

function createManager() {
  const spawned: FakeProcess[] = [];
  const manager = new AudioPlayerManager((audioPath) => {
    const child = new FakeProcess(audioPath);
    spawned.push(child);
    return child as unknown as ChildProcess;
  });
  return { manager, spawned };
}

suite("AudioPlayerManager", () => {
  test("playing on a channel kills the previous process on that channel", () => {
    const { manager, spawned } = createManager();

    manager.play("Music", "a.ogg");
    manager.play("Music", "b.ogg");

    assert.equal(spawned.length, 2);
    assert.equal(spawned[0].killed, true);
    assert.equal(spawned[1].killed, false);
    assert.equal(manager.isPlaying("Music"), true);
  });

  test("channels are independent", () => {
    const { manager, spawned } = createManager();

    manager.play("Music", "bgm.ogg");
    manager.play("Voice", "line.ogg");

    assert.equal(spawned[0].killed, false);
    assert.equal(spawned[1].killed, false);
    assert.equal(manager.isPlaying("Music"), true);
    assert.equal(manager.isPlaying("Voice"), true);
  });

  test("stop kills the current process and reports whether anything was playing", () => {
    const { manager, spawned } = createManager();

    assert.equal(manager.stop("Music"), false);

    manager.play("Music", "bgm.ogg");
    assert.equal(manager.stop("Music"), true);
    assert.equal(spawned[0].killed, true);
    assert.equal(manager.isPlaying("Music"), false);
    assert.equal(manager.stop("Music"), false);
  });

  test("a process that exits on its own is forgotten", () => {
    const { manager, spawned } = createManager();

    manager.play("Sound", "se.wav");
    spawned[0].exitNormally();

    assert.equal(manager.isPlaying("Sound"), false);
    assert.equal(manager.stop("Sound"), false);
  });

  test("a late exit from a replaced process does not forget its replacement", () => {
    const { manager, spawned } = createManager();

    manager.play("Music", "a.ogg");
    manager.play("Music", "b.ogg");
    spawned[0].exitNormally();

    assert.equal(manager.isPlaying("Music"), true);
    assert.equal(manager.stop("Music"), true);
    assert.equal(spawned[1].killed, true);
  });

  test("dispose stops every channel", () => {
    const { manager, spawned } = createManager();

    manager.play("Music", "a.ogg");
    manager.play("Voice", "b.ogg");
    manager.dispose();

    assert.ok(spawned.every((child) => child.killed));
    assert.equal(manager.isPlaying("Music"), false);
    assert.equal(manager.isPlaying("Voice"), false);
  });
});
