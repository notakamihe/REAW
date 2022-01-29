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
  Whole = 0.25,
  Half = 0.5,
  Quarter = 1,
  Eighth = 2,
  Sixteenth = 4,
  ThirtySecond = 8,
  SixtyFourth = 16,
  OneTwentyEighth = 32,
  TwoFiftySixth = 64,
  FiveHundredTwelfth = 128
}

export interface TimeSignature {
  beats : number
  noteValue : number
}

export interface ValidatedInput {
  value : string,
  valid : boolean
}
