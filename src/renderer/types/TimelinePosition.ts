import { SnapSize, TimeSignature } from "./types"

export interface TimelinePositionOptions {
  snapSize : SnapSize
  beatWidth : number
  horizontalScale : number,
  timeSignature : TimeSignature,
  tempo : number
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
    options : TimelinePositionOptions, snap : boolean = true) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.addMeasures(measures)
    pos.addBeats(beats, options)
    pos.addFraction(fraction, options, snap)

    return pos
  }

  private addBeats(numBeats : number, options : TimelinePositionOptions) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const beats = numBeats % options.timeSignature.beats
    
    this.addMeasures(measures)

    let newBeat = this.beat + beats

    if (newBeat > options.timeSignature.beats) {
      this.beat = newBeat % options.timeSignature.beats
      this.addMeasures(1)
    } else {
      this.beat = newBeat
    }
  }
  
  private addFraction(fraction : number, options : TimelinePositionOptions, snap : boolean = true) {
    const beats = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000
    
    this.addBeats(beats, options)

    let newFraction = this.fraction + leftoverFraction

    if (options && options.snapSize !== SnapSize.None && snap) {
      const interval = 1000 / options.snapSize
      
      if (options.snapSize >= SnapSize.Beat) {
        newFraction = Math.round(newFraction / interval) * interval
      } else {
        const fractionFromMeasure = Math.round(((this.beat - 1) * 1000 + newFraction) / interval) * interval
        const {measures, beats, fraction} = TimelinePosition.fromFraction(fractionFromMeasure, options)
        
        this.measure += measures
        this.beat = beats + 1
        this.fraction = fraction

        return
      }
    }
    
    if (newFraction >= 1000) {
      this.fraction = newFraction % 1000
      this.addBeats(Math.floor(newFraction / 1000), options)
    } else {
      this.fraction = newFraction
    }
  }
  
  private addMeasures(numMeasures : number) {
    this.measure += numMeasures
  }

  compare(other : TimelinePosition) : number {
    if (this.measure > other.measure) {
      return 1
    } else if (this.measure < other.measure) {
      return -1
    } else if (this.beat > other.beat) {
      return 1
    } else if (this.beat < other.beat) {
      return -1
    } else if (this.fraction > other.fraction) {
      return 1
    } else if (this.fraction < other.fraction) {
      return -1
    } else {
      return 0
    }
  }

  static fromFraction (frac : number, options : TimelinePositionOptions) {
    const measures = Math.floor(frac / (1000 * options.timeSignature.beats))
    const beats = Math.floor((frac - measures * 1000 * options.timeSignature.beats) / 1000)
    const fraction = frac % 1000

    return {measures, beats, fraction}
  }

  static fromPos(pos : TimelinePosition) : TimelinePosition {
    return new TimelinePosition(pos.measure, pos.beat, pos.fraction)
  }

  static fromWidth(width: number, options : TimelinePositionOptions) {
    const measureWidth = options.timeSignature.beats * options.beatWidth * options.horizontalScale
    const beatWidth = options.beatWidth * options.horizontalScale

    const measures = Math.floor(Math.abs(width) / measureWidth)
    const beats = Math.floor((Math.abs(width) - measures * measureWidth) / beatWidth)
    const fraction = (Math.abs(width) - measures * measureWidth - beats * beatWidth) / beatWidth * 1000

    return {
      measures,
      beats,
      fraction
    }
  }

  static isStringValid(str : string) {
    let arr = str.split('.')

    if (arr.length < 3) {
      return false
    }

    let parts = arr.slice(0, 2)
    parts.push(arr.slice(2).join('.'))

    return !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))
  }

  normalize(options : TimelinePositionOptions) {
    let measure = this.measure
    let beat = this.beat
    let fraction = this.fraction

    if (measure < 1)
      measure = 1

    if (beat < 1)
      beat = 1

    if (fraction < 0)
      fraction = 0

    this.measure = measure
    this.beat = 1
    this.fraction = 0

    options.snapSize = SnapSize.None

    this.addBeats(beat - 1, options)
    this.addFraction(fraction, options)
  }

  static parseFromString(str : string, options : TimelinePositionOptions) {
    if (!TimelinePosition.isStringValid(str)) {
      return undefined
    }

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

  snap(options : TimelinePositionOptions) {
    this.add(0, 0, 0, true, options, true)
  }

  subtract(measures : number, beats : number, fraction : number, mutate : boolean = true,
    options : TimelinePositionOptions, snap : boolean = true) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.subtractMeasures(measures)
    pos.subtractBeats(beats, options)
    pos.subtractFraction(fraction, options, snap)

    return pos
  }
  
  private subtractBeats(numBeats : number, options : TimelinePositionOptions) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const beats = numBeats % options.timeSignature.beats
    
    this.subtractMeasures(measures)

    let newBeat = this.beat - beats

    if (newBeat < 1) {
      this.beat = options.timeSignature.beats + newBeat
      this.subtractMeasures(1)
    } else {
      this.beat = newBeat
    }
  }
  
  private subtractFraction(fraction : number, options : TimelinePositionOptions, snap : boolean = true) {
    const beats = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000

    this.subtractBeats(beats, options)

    let newFraction = this.fraction - leftoverFraction

    if (options && options.snapSize !== SnapSize.None && snap) {
      const interval = 1000 / options.snapSize

      if (options.snapSize >= SnapSize.Beat) {
        newFraction = Math.round(newFraction / interval) * interval
      } else {
        const fractionFromMeasure = Math.round(((this.beat - 1) * 1000 + newFraction) / interval) * interval
        const {measures, beats, fraction} = TimelinePosition.fromFraction(fractionFromMeasure, options)
        
        this.measure += measures
        this.beat = beats + 1
        this.fraction = fraction

        return
      }
    }
    
    if (newFraction < 0) {
      this.fraction = (1000 - Math.abs(newFraction)) % 1000
      this.subtractBeats(1, options)
    } else {
      this.fraction = newFraction
    }
  }
  
  private subtractMeasures(numMeasures : number) {
    this.measure -= numMeasures
  }

  static toWidth(pos1 : TimelinePosition, pos2 : TimelinePosition, options : TimelinePositionOptions) {
    return pos2.toMargin(options) - pos1.toMargin(options)
  }
  
  toMargin(options : TimelinePositionOptions) {
    const measureMargin = (this.measure-1)* options.timeSignature.beats * options.beatWidth * options.horizontalScale
    const beatMargin = (this.beat - 1) * options.beatWidth * options.horizontalScale
    const fractionMargin = options.beatWidth * options.horizontalScale * (this.fraction / 1000)
    
    return measureMargin + beatMargin + fractionMargin
  }

  toString() {
    return `${this.measure}.${this.beat}.${Math.trunc(this.fraction)}`
  }

  toTime(options : TimelinePositionOptions) {
    const beatsPerSecond = options.tempo / 60
    let beats = (this.measure - 1) * options.timeSignature.beats + this.beat - 1
    
    beats += this.fraction / 1000

    const totalSeconds = beats / beatsPerSecond
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds - hours * 3600) / 60)
    const seconds = Math.floor(totalSeconds - hours * 3600 - minutes * 60)
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000)

    return {
      hours,
      minutes,
      seconds,
      milliseconds
    }
  }
  
  toTimeString(options : TimelinePositionOptions) {
    const time = this.toTime(options)
    
    const hours = time.hours.toString().padStart(2, '0')
    const minutes = time.minutes.toString().padStart(2, '0')
    const seconds = time.seconds.toString().padStart(2, '0')
    const milliseconds = time.milliseconds.toString().padStart(3, '0')

    return `${hours}:${minutes}:${seconds}.${milliseconds}`
  }
}