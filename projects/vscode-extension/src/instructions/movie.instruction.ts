import { LinscriptInstructionName, movies } from "linscript-definitions";
import type { LinscriptInstruction } from "../types/linscript-instruction";

export const movieInstruction: LinscriptInstruction = {
  name: LinscriptInstructionName.Movie,
  description: "Plays a full-screen video by id, optionally keeping the last frame on screen afterwards.",
  parameters: [
    {
      name: "movieId",
      values: movies,
    },
    {
      name: "clearFrameBuffer",
      description: `
        When this is 0, the screen is black after the movie.
        When this is 1, it keeps wherever you skipped it from.
        I suspect this allows for nicer transition effects.
      `,
      values: {
        0: "false",
        1: "true",
      },
    },
  ] as const,
  decorations([movieId, _]) {
    const movieName = movies[movieId as keyof typeof movies] ?? "Unknown";
    return `🎬 ${movieName}`;
  },
};
