export type ID = string | number;

export class Unit {
  pos : number

  constructor(pos : number) {
    this.pos = pos
  }
}

export enum GridSize {
  Bar = 1,
  HalfBar = 2,
  QuarterBar = 4,
  EighthBar = 8,
  SixteenthBar = 16,
  ThirtySecondBar = 32
}

export enum SnapSize {
  None = 0,
  Measure = 0.25,
  HalfMeasure = 0.5,
  Bar = 1,
  HalfBar = 2,
  QuarterBar = 4,
  EighthBar = 8,
  SixteenthBar = 16,
  ThirtySecondBar = 32,
  SixtyFourthBar = 64,
  HundredTwentyEighthBar = 128
}

export enum SnapMode {
  Discrete,
  Nearest
}

export interface TimeSignature {
  beats : number
  noteValue : number
}