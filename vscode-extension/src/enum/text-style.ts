export enum TextStyle {
  White = 0,
  Pink = 1,
  Yellow = 3,
  Cyan = 4,
  PaleGreen = 10,
  Red = 11,
  Green = 23
}

const textStyle = new Set(Object.values(TextStyle).filter(v => typeof v === "number"));

export function isTextStyle(style: number): style is TextStyle {
  return textStyle.has(style);
}
