import { formatDuration, measureSeconds, truncate } from "../utils/general";
import { BASE_BEAT_WIDTH } from "../utils/utils"
import { TimeSignature } from "./types"

export interface TimelineSettings {
  horizontalScale: number;
  timeSignature: TimeSignature;
  tempo: number;
}

export interface TimelineSpan {
  measures: number;
  beats: number;
  fraction: number;
}

export interface DirectionalTimelineSpan extends TimelineSpan {
  sign: number;
}

export default class TimelinePosition {
  static start: TimelinePosition = new TimelinePosition(1, 1, 0);
  static timelineSettings: TimelineSettings = {
    horizontalScale: 1,
    timeSignature: { beats: 4, noteValue: 4 },
    tempo: 120
  };

  measure: number;
  beat: number;
  fraction: number;

  constructor(measure: number, beat: number, fraction: number) {
    this.measure = measure;
    this.beat = beat;
    this.fraction = fraction;
  }

  add(measures: number, beats: number, fraction: number, mutate: boolean = true) : TimelinePosition {
    let pos = mutate ? this : this.copy();

    pos.addMeasures(measures);
    pos.addBeats(beats);
    pos.addFraction(fraction);

    return pos;
  }

  private addBeats(beats: number) {
    let numBeatsPastMeasureStart = this.beat - 1 + beats;

    const measures = Math.floor(numBeatsPastMeasureStart / TimelinePosition.timelineSettings.timeSignature.beats);
    this.addMeasures(measures);
    numBeatsPastMeasureStart -= measures * TimelinePosition.timelineSettings.timeSignature.beats;
    
    this.beat = numBeatsPastMeasureStart + 1;
  }
  
  private addFraction(fraction: number) {
    this.fraction += fraction;

    const beats = Math.floor(this.fraction / 1000);
    this.addBeats(beats);
    this.fraction -= beats * 1000;
  }
  
  private addMeasures(measures: number) {
    this.measure += measures;
  }

  compareTo(other: TimelinePosition): number {
    const fraction = this.toFraction();
    const otherFraction = other.toFraction();

    if (fraction > otherFraction)
      return 1;
    else if (fraction < otherFraction)
      return -1;
    return 0;
  }

  copy(): TimelinePosition {
    return new TimelinePosition(this.measure, this.beat, this.fraction);
  }

  diff(other: TimelinePosition): DirectionalTimelineSpan {
    const fractionDiff = this.toFraction() - other.toFraction();
    const { measures, beats, fraction } = TimelinePosition.fractionToSpan(fractionDiff);
    return { measures, beats, fraction, sign: fractionDiff < 0 ? -1 : 1 };
  }

  diffInMargin(other: TimelinePosition) {
    return this.toMargin() - other.toMargin();
  }

  static durationToSpan(duration: number): TimelineSpan {
    const settings = TimelinePosition.timelineSettings;
    const beatsPerSecond = settings.tempo / 60;
    let remainingBeats = beatsPerSecond * duration / (4 / settings.timeSignature.noteValue);

    const measures = Math.floor(remainingBeats / settings.timeSignature.beats);
    remainingBeats -= measures * settings.timeSignature.beats;
    const beats = Math.floor(remainingBeats);
    remainingBeats -= beats;

    return { measures, beats, fraction: remainingBeats * 1000 };
  }

  equals(other: TimelinePosition): boolean {
    return this.compareTo(other) === 0;
  }
  
  static fractionToSpan(fraction: number): DirectionalTimelineSpan {
    const sign = fraction < 0 ? -1 : 1;

    fraction = Math.abs(fraction);
    const measures = Math.floor(fraction / (1000 * TimelinePosition.timelineSettings.timeSignature.beats));
    fraction -= measures * 1000 * TimelinePosition.timelineSettings.timeSignature.beats;
    const beats = Math.floor(fraction / 1000);
    fraction -= beats * 1000;

    return { measures, beats, fraction, sign };
  }

  static fromMargin(margin: number): TimelinePosition {
    return TimelinePosition.fromSpan(TimelinePosition.measureMargin(margin));
  }

  static fromSpan(span: TimelineSpan) {
    const pos = TimelinePosition.start.copy();

    if ((span as DirectionalTimelineSpan).sign && (span as DirectionalTimelineSpan).sign < 0)
      pos.subtract(span.measures, span.beats, span.fraction);
    else
      pos.add(span.measures, span.beats, span.fraction);

    return pos;
  }
  
  static max(...positions: TimelinePosition[]): TimelinePosition {
    return positions.reduce((a, b) => a.compareTo(b) > 0 ? a : b);
  }

  static measureMargin(margin: number): DirectionalTimelineSpan {
    const { horizontalScale, timeSignature } = TimelinePosition.timelineSettings;
    const beatWidth = BASE_BEAT_WIDTH * horizontalScale * (4 / timeSignature.noteValue);
    const measureWidth = beatWidth * timeSignature.beats;
    const sign = margin < 0 ? -1 : 1;

    margin = Math.abs(margin);
    const measures = Math.floor(Math.round((margin / measureWidth) * 1e9) / 1e9);
    const beats = Math.floor(Math.round((margin / beatWidth) * 1e9) / 1e9) % timeSignature.beats;
    const fraction = (Math.round((margin / beatWidth) * 1e9) / 1e9) % 1 * 1000;

    return { measures, beats, fraction, sign };
  }

  static min(...positions: TimelinePosition[]): TimelinePosition {
    return positions.reduce((a, b) => a.compareTo(b) < 0 ? a : b);
  }

  normalize(): TimelinePosition {
    if (this.beat < 1)
      this.beat = 1;

    if (this.fraction < 0)
      this.fraction = 0;
    
    this.set(TimelinePosition.fromSpan(this.toSpan()));
    
    return this;
  }

  static parseFromString(str: string) {
    const posArr = [1, 1, 0];
    const parts = str.split(".");
  
    if (!str || parts.length > 4)
      return null;

    for (let i = 0; i < parts.length; i++) {
      if (!parts[i].trim() && i < parts.length - 1)
        return null;

      if (i < 3) {
        const part = (i === 2 ? parts.slice(i).join(".") : parts[i]).trim();
  
        if (isNaN(Number(part)) || !Number.isFinite(Number(part)))
          return null;
        if (part)
          posArr[i] = Number(part);
      }
    }

    return new TimelinePosition(posArr[0], posArr[1], posArr[2]).normalize();
  }

  set(pos: TimelinePosition) {
    this.measure = pos.measure;
    this.beat = pos.beat;
    this.fraction = pos.fraction;
  }

  snap(snapGridSize: TimelineSpan, mode: "round" | "floor" | "ceil" = "round"): TimelinePosition {
    let snapSizeFraction = TimelinePosition.fromSpan(snapGridSize).toFraction();
    
    if (snapSizeFraction > 0) {
      let newFraction;

      switch (mode) {
        case "floor":
          newFraction = snapSizeFraction * Math.floor(this.toFraction() / snapSizeFraction);
          break;
        case "ceil":
          newFraction = snapSizeFraction * Math.ceil(this.toFraction() / snapSizeFraction);
          break;
        default:
          newFraction = snapSizeFraction * Math.round(this.toFraction() / snapSizeFraction);
      }
      
      this.set(TimelinePosition.fromSpan(TimelinePosition.fractionToSpan(newFraction)));
    }

    return this;
  }

  subtract(measures: number, beats: number, fraction: number, mutate: boolean = true): TimelinePosition {
    let pos = mutate ? this : this.copy();

    pos.subtractMeasures(measures);
    pos.subtractBeats(beats);
    pos.subtractFraction(fraction);

    return pos;
  }
  
  private subtractBeats(beats: number) {
    let numBeatsPastMeasureStart = this.beat - 1 - beats;

    const measures = Math.ceil(numBeatsPastMeasureStart / -TimelinePosition.timelineSettings.timeSignature.beats);
    this.subtractMeasures(measures);
    numBeatsPastMeasureStart += measures * TimelinePosition.timelineSettings.timeSignature.beats;

    this.beat = numBeatsPastMeasureStart + 1;
  }
  
  private subtractFraction(fraction: number) {
    this.fraction -= fraction;

    const beats = Math.ceil(this.fraction / -1000);
    this.subtractBeats(beats);
    this.fraction += beats * 1000;
  }
  
  private subtractMeasures(measures: number) {
    this.measure -= measures;
  }

  toFraction() {
    const numBeatsInMeasure = TimelinePosition.timelineSettings.timeSignature.beats;
    return numBeatsInMeasure * 1000 * (this.measure - 1) + (this.beat - 1) * 1000 + this.fraction;
  }
  
  toMargin() {
    const { horizontalScale, timeSignature } = TimelinePosition.timelineSettings;
    const beatWidth = BASE_BEAT_WIDTH * horizontalScale * (4 / timeSignature.noteValue);
    const { measures, beats, fraction, sign } = this.toSpan();

    const measureMargin = measures * timeSignature.beats * beatWidth;
    const beatMargin = beats * beatWidth;
    const fractionMargin = beatWidth * (fraction / 1000);
    
    return (measureMargin + beatMargin + fractionMargin) * sign;
  }

  toSeconds() {
    const settings = TimelinePosition.timelineSettings;
    const beatsPerSecond = settings.tempo / 60;
    const { measures, beats, fraction, sign } = this.toSpan();
    const totalBeats = (measures * settings.timeSignature.beats + beats + fraction / 1000) * sign;

    return totalBeats / beatsPerSecond * (4 / settings.timeSignature.noteValue);
  }

  toSpan() {
    return TimelinePosition.fractionToSpan(this.toFraction());
  }

  toString(fractionDigits?: number) {
    return `${this.measure}.${this.beat}.${truncate(this.fraction, fractionDigits ?? 0)}`;
  }

  toTime() {
    const seconds = this.toSeconds();
    return { ...measureSeconds(Math.abs(seconds)), sign: seconds < 0 ? -1 : 1 };
  }
  
  toTimeString() {
    const time = this.toTime();
    return `${time.sign < 0 ? "-" : ""}${formatDuration(time, true)}`;
  }

  translate(by: DirectionalTimelineSpan, mutate = true) {
    const { measures, beats, fraction, sign } = by;

    if (sign < 0)
      return this.subtract(measures, beats, fraction, mutate);
    else
      return this.add(measures, beats, fraction, mutate);
  }
}