import { TimeSignature } from "./types"

export interface TimelinePositionOptions {
  snapSize : TimelineInterval
  beatWidth : number
  horizontalScale : number,
  timeSignature : TimeSignature,
  tempo : number
}

export interface TimelineInterval {
  measures : number
  beats : number
  fraction : number
}

export default class TimelinePosition {
  static start : TimelinePosition = new TimelinePosition(1, 1, 0)

  measure : number
  beat : number
  fraction : number

  constructor (measure : number, beat : number, fraction : number) {
    this.measure = measure
    this.beat = beat
    this.fraction = fraction
  }

  add(measures : number, beats : number, fraction : number, mutate : boolean = true, 
    options : TimelinePositionOptions) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.addMeasures(measures)
    pos.addBeats(beats, options)
    pos.addFraction(fraction, options)

    return pos
  }

  private addBeats(numBeats : number, options : TimelinePositionOptions) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const remainder = numBeats % options.timeSignature.beats

    this.addMeasures(measures)

    let beat = this.beat + remainder

    if (beat > options.timeSignature.beats) {
      this.addMeasures(1)
      beat -= options.timeSignature.beats
    }

    this.beat = beat
  }
  
  private addFraction(fraction : number, options : TimelinePositionOptions) {
    const beats = Math.floor(fraction / 1000)
    const remainder = fraction % 1000

    this.addBeats(beats, options)

    let frac = this.fraction + remainder

    if (frac >= 1000) {
      this.addBeats(Math.floor(frac / 1000), options)
      frac %= 1000
    }

    this.fraction = frac
  }
  
  private addMeasures(numMeasures : number) {
    this.measure += numMeasures
  }

  compare(other : TimelinePosition) : number {
    if (this.measure > other.measure)
      return 1
    else if (this.measure < other.measure)
      return -1
    else if (this.beat > other.beat)
      return 1
    else if (this.beat < other.beat)
      return -1
    else if (this.fraction > other.fraction)
      return 1
    else if (this.fraction < other.fraction)
      return -1
    else return 0
  }

  static fromFraction (frac : number, options : TimelinePositionOptions) : TimelineInterval {
    const measures = Math.floor(frac / (1000 * options.timeSignature.beats))
    const beats = Math.floor((frac - measures * 1000 * options.timeSignature.beats) / 1000)
    const fraction = frac % 1000

    return {measures, beats, fraction}
  }

  static fromPos(pos : TimelinePosition) : TimelinePosition {
    return new TimelinePosition(pos.measure, pos.beat, pos.fraction)
  }

  static fromInterval(interval : TimelineInterval) {
    return new TimelinePosition(interval.measures + 1, interval.beats + 1, interval.fraction);
  }

  static fromWidth(width: number, options : TimelinePositionOptions) : TimelineInterval {
    const beatWidth = options.beatWidth * options.horizontalScale * (4 / options.timeSignature.noteValue)
    const measureWidth = options.timeSignature.beats * beatWidth

    const measures = Math.floor(Math.abs(width) / measureWidth)
    const beats = Math.floor((Math.abs(width) - measures * measureWidth) / beatWidth)
    const fraction = (Math.abs(width) - measures * measureWidth - beats * beatWidth) / beatWidth * 1000

    return {measures, beats, fraction}
  }

  static isStringValid(str : string) {
    let arr = str.split('.')

    if (arr.length < 3) return false

    let parts = arr.slice(0, 2)
    parts.push(arr.slice(2).join('.'))

    return !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))
  }

  normalize(options : TimelinePositionOptions) : TimelinePosition {
    let measure = this.measure
    let beat = this.beat
    let fraction = this.fraction

    if (measure < 1)
      measure = 1

    if (beat < 1)
      beat = 1

    if (fraction < 0)
      fraction = 0

    this.setPos(TimelinePosition.start)
    this.add(measure - 1, beat - 1, fraction, true, options)

    return this
  }

  static parseFromString(str : string, options : TimelinePositionOptions) {
    if (!TimelinePosition.isStringValid(str))
      return undefined

    let arr = str.split('.')
    let parts = arr.slice(0, 2)

    parts.push(arr.slice(2).join('.'))

    let pos = new TimelinePosition(Number(parts[0]), Number(parts[1]), Number(parts[2]))
    
    pos.normalize(options)

    return pos
  }

  setPos(pos : TimelinePosition) {
    this.measure = pos.measure
    this.beat = pos.beat
    this.fraction = pos.fraction
  }

  snap(options : TimelinePositionOptions, floor : boolean = false) {
    const {measures, beats, fraction} = options.snapSize;
    const snapSizeFraction = (new TimelinePosition(measures + 1, beats + 1, fraction)).toFraction(options);
    
    if (snapSizeFraction > 0) {
      const posFraction = this.toFraction(options);
      const newFraction = floor ? snapSizeFraction * Math.floor(posFraction / snapSizeFraction) : 
        snapSizeFraction * Math.round(posFraction / snapSizeFraction);
      const newSpan = TimelinePosition.fromFraction(newFraction, options);
  
      this.setPos(new TimelinePosition(newSpan.measures + 1, newSpan.beats + 1, newSpan.fraction));
    }
  }

  subtract(measures : number, beats : number, fraction : number, mutate : boolean = true,
    options : TimelinePositionOptions) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.subtractMeasures(measures)
    pos.subtractBeats(beats, options)
    pos.subtractFraction(fraction, options)

    return pos
  }
  
  private subtractBeats(numBeats : number, options : TimelinePositionOptions) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const remainder = numBeats % options.timeSignature.beats

    this.subtractMeasures(measures)

    let beat = this.beat - remainder

    if (beat < 1) {
      beat = options.timeSignature.beats - Math.abs(beat)
      this.subtractMeasures(1)
    }

    this.beat = beat
  }
  
  private subtractFraction(fraction : number, options : TimelinePositionOptions) {
    const beats = Math.floor(fraction / 1000)
    const remainder = fraction % 1000

    this.subtractBeats(beats, options)

    let frac = this.fraction - remainder

    if (frac < 0) {
      this.subtractBeats(1, options)
      frac = 1000 - Math.abs(frac)
    }

    this.fraction = frac
  }
  
  private subtractMeasures(numMeasures : number) {
    this.measure -= numMeasures
  }

  toFraction(options : TimelinePositionOptions) {
    return options.timeSignature.beats * 1000 * (this.measure - 1) + (this.beat - 1) * 1000 + this.fraction
  }
  
  toMargin(options : TimelinePositionOptions) {
    const beatWidth = options.beatWidth * options.horizontalScale * (4 / options.timeSignature.noteValue)

    const measureMargin = (this.measure - 1) * options.timeSignature.beats * beatWidth
    const beatMargin = (this.beat - 1) * beatWidth
    const fractionMargin = beatWidth * (this.fraction / 1000)
    
    return measureMargin + beatMargin + fractionMargin
  }
  
  static toInterval(pos1 : TimelinePosition | null, pos2 : TimelinePosition | null, options: TimelinePositionOptions) : TimelineInterval {
    if (!pos1 || !pos2) return {measures: 0, beats: 0, fraction: 0}

    const width = TimelinePosition.toWidth(pos1, pos2, options)
    const {measures, beats, fraction} = TimelinePosition.fromWidth(width, options)

    return {measures, beats, fraction}
  }

  toString() {
    return `${this.measure}.${this.beat}.${Math.trunc(this.fraction)}`
  }

  toTime(options : TimelinePositionOptions) {
    const beatsPerSecond = options.tempo / 60
    let beats = (this.measure - 1) * options.timeSignature.beats + this.beat - 1
    
    beats += this.fraction / 1000

    const totalSeconds = (beats / beatsPerSecond) * (4 / options.timeSignature.noteValue)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60)
    const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60)
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000)

    return {hours, minutes, seconds, milliseconds}
  }
  
  toTimeString(options : TimelinePositionOptions) {
    const time = this.toTime(options)
    
    const hours = time.hours.toString().padStart(2, '0')
    const minutes = time.minutes.toString().padStart(2, '0')
    const seconds = time.seconds.toString().padStart(2, '0')
    const milliseconds = time.milliseconds.toString().padStart(3, '0')

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }

  static toWidth(pos1 : TimelinePosition | null, pos2 : TimelinePosition | null, options: TimelinePositionOptions) {
    if (!pos1 || !pos2) return 0
    
    return pos2.toMargin(options) - pos1.toMargin(options)
  }
}