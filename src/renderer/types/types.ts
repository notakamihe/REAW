export type ID = string | number;

export enum SnapGridSize {
  None = 0,
  Whole = 4,
  Half = 2,
  Quarter = 1,
  Eighth = 0.5,
  Sixteenth = 0.25,
  ThirtySecond = 0.125,
  SixtyFourth = 0.0625,
  OneTwentyEighth = 0.03125,
  TwoFiftySixth = 0.015625,
  FiveHundredTwelfth = 0.0078125
}

export interface TimeSignature {
  beats : number
  noteValue : number
}

export interface ValidatedInput {
  value : string,
  valid : boolean
}
