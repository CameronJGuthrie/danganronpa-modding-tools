import * as vscode from "vscode";

/**
 * Play an audio file using a terminal command
 */
export function playAudio(
  audioPath: string,
  playerName: string,
  timeoutMs: number
) {
  // Create a hidden terminal to play the audio
  const terminal = vscode.window.createTerminal({
    name: playerName,
    hideFromUser: true
  });

  // Try different audio players in order of preference
  const players = [
    ffmpeg(audioPath),
    mpv(audioPath),
    paplay(audioPath)
  ];

  terminal.sendText(`(${players.join(" || ")}) && exit`);

  // Clean up the terminal after a delay
  setTimeout(() => {
    terminal.dispose();
  }, timeoutMs);
}

// ffplay: comes with ffmpeg, supports many formats, auto-closes when done
function ffmpeg(audioPath: string) {
  return `ffplay -nodisp -autoexit -volume 50 "${audioPath}" 2>/dev/null`;
}

// mpv: popular media player
function mpv(audioPath: string) {
  return `mpv --really-quiet "${audioPath}" 2>/dev/null`;
}

// paplay: PulseAudio player (common on Linux)
function paplay(audioPath: string) {
  return `paplay "${audioPath}" 2>/dev/null`;
}