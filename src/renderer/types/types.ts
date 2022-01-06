export type ID = string | number;

export class Unit {
  pos : number

  constructor(pos : number) {
    this.pos = pos
  }
}

export enum GridSize {
  Beat = 1,
  HalfBeat = 2,
  QuarterBeat = 4,
  EighthBeat = 8,
  SixteenthBeat = 16,
  ThirtySecondBeat = 32
}

export enum SnapSize {
  None = 0,
  Measure = 0.25,
  HalfMeasure = 0.5,
  Beat = 1,
  HalfBeat = 2,
  QuarterBeat = 4,
  EighthBeat = 8,
  SixteenthBeat = 16,
  ThirtySecondBeat = 32,
  SixtyFourthBeat = 64,
  HundredTwentyEighthBeat = 128
}

export interface TimeSignature {
  beats : number
  noteValue : number
}

export interface ValidatedInput {
  value : string,
  valid : boolean
}
