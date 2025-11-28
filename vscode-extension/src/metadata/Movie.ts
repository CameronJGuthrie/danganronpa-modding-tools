import { movies } from "../data/movie-data";
import { type OpcodeMeta, OpcodeName } from "../enum/opcode";

export const movie: OpcodeMeta = {
  name: OpcodeName.Movie,
  opcode: "0x05",
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
