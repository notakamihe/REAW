import TimelinePosition from "./TimelinePosition";

export interface AutomationLane {
  expanded : boolean
  id : ID
  isPan? : boolean
  isTempo? : boolean
  isVolume? : boolean
  label : string
  maxValue : number
  minValue : number
  nodes: AutomationNode[]
  show : boolean
}

export interface AutomationNode {
  id : string
  pos : TimelinePosition
  value : number
}

export interface Clip extends Region {
  end : TimelinePosition;
  endLimit : TimelinePosition | null;
  id : ID;
  loopEnd : TimelinePosition | null;
  muted : boolean;
  name: string;
  start : TimelinePosition;
  startLimit : TimelinePosition | null;
}

export interface ClipAudio extends Region {
  buffer: Buffer;
  duration: number;
  src: {extension: string, data: string};
}

export interface AudioClip extends Clip {
  audio: ClipAudio;
}

export interface MidiClip extends Clip {
  notes: MidiNote[];
}

export interface Effect {
  id : ID
  name : string
  enabled : boolean
}

export interface FX {
  chainId? : ID | null
  effects : Effect[]
}

export interface FXChain {
  id : ID
  name : string
  effects : Effect[]
}

export type ID = string | number;

interface MidiNote extends Region {
  note: MusicalNote;
  velocity: number;
}

enum MusicalNote {
  C0, Cs0, D0, Ds0, E0, F0, Fs0, G0, Gs0, A0, As0,
  C1, Cs1, D1, Ds1, E1, F1, Fs1, G1, Gs1, A1, As1,
  C2, Cs2, D2, Ds2, E2, F2, Fs2, G2, Gs2, A2, As2,
  C3, Cs3, D3, Ds3, E3, F3, Fs3, G3, Gs3, A3, As3,
  C4, Cs4, D4, Ds4, E4, F4, Fs4, G4, Gs4, A4, As4, 
  C5, Cs5, D5, Ds5, E5, F5, Fs5, G5, Gs5, A5, As5,
  C6, Cs6, D6, Ds6, E6, F6, Fs6, G6, Gs6, A6, As6,
  C7, Cs7, D7, Ds7, E7, F7, Fs7, G7, Gs7, A7, As7,
  C8, Cs8, D8, Ds8, E8, F8, Fs8, G8, Gs8, A8, As8,
  C9, Cs9, D9, Ds9, E9, F9, Fs9, G9, Gs9, A9, As9
}

export interface Preferences {
  color: string;
  theme: string;
}

export interface Region {
  start : TimelinePosition
  end : TimelinePosition
}

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

export interface Track {
  armed: boolean;
  automationEnabled: boolean;
  automationLanes: AutomationLane[];
  clips: Clip[];
  color: string;
  fx: FX;
  id: ID;
  isMaster?: boolean;
  mute: boolean;
  name: string;
  pan: number;
  solo: boolean;
  type: TrackType;
  volume : number;
};


export enum TrackType {Audio, Midi, StepSequencer, Master};

export interface ValidatedInput {
  value : string,
  valid : boolean
}
