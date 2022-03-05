export type ID = string | number;

export enum SnapGridSize {
  None = 0,
  Measure = 4,
  HalfMeasure = 2,
  Beat = 1,
  HalfBeat = 0.5,
  QuarterBeat = 0.25,
  EighthBeat = 0.125,
  SixteenthBeat = 0.0625,
  ThirtySecondBeat = 0.03125,
  SixtyFourthBeat = 0.015625,
  HundredTwentyEighthBeat = 0.0078125
}

export interface TimeSignature {
  beats : number
  noteValue : number
}

export interface ValidatedInput {
  value : string,
  valid : boolean
}
