declare module "tga" {
  /** Decoder for Truevision TGA images; `pixels` is top-down RGBA, four bytes per pixel. */
  export default class TGA {
    constructor(buffer: Buffer, options?: { dontFixAlpha?: boolean });
    width: number;
    height: number;
    pixels: Uint8Array;
  }
}
