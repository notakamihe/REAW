export type ID = string | number;

export enum SnapGridSizeOption {
  None,
  Auto,
  EightMeasures,
  FourMeasures,
  TwoMeasures,
  Measure,
  Beat,
  HalfBeat,
  QuarterBeat,
  EighthBeat,
  SixteenthBeat,
  ThirtySecondBeat,
  SixtyFourthBeat,
  HundredTwentyEighthBeat
}

export interface SVGIconStyleProps {
  iconStyle? : {color? : string, size? : number};
  style? : React.CSSProperties;
}

export interface TimeSignature {
  beats : number
  noteValue : number
}

export interface ValidatedInput {
  value : string,
  valid : boolean
}
