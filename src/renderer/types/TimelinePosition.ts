import { WorkflowContextType, WorkstationContext } from "renderer/context/WorkstationContext"
import { BEAT_WIDTH } from "renderer/utils"
import { SnapMode, SnapSize, TimeSignature } from "./types"

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
    options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.addMeasures(measures)
    pos.addBeats(beats, options, snapMode)
    pos.addFraction(fraction, options, snapMode)

    return pos
  }

  private addBeats(numBeats : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const beats = numBeats % options.timeSignature.beats
    
    this.addMeasures(measures)

    let newBeat = this.beat + beats

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize < SnapSize.Beat) {
        switch (snapMode) {
          case SnapMode.Discrete:
            if ((newBeat - 1) % (-8 * options.snapSize + 6) !== 0)
              return
            else {
              if (numBeats > 1)
                this.fraction = 0
            }
            break
          case SnapMode.Nearest:
            let interval = (-8 * options.snapSize + 6)
            let lowerBeat, upperBeat

            switch(options.snapSize) {
              case SnapSize.Measure:
                lowerBeat = Math.floor(newBeat / interval) * interval + 1
                upperBeat = Math.ceil(newBeat / interval) * interval + 1

                if (upperBeat - newBeat <= newBeat - lowerBeat) {
                  newBeat = upperBeat
                } else {
                  newBeat = lowerBeat
                }

                break
              case SnapSize.HalfMeasure:
                lowerBeat = Math.ceil(newBeat / interval) * interval - 1
                upperBeat = Math.ceil(newBeat / interval) * interval + 1

                if (upperBeat - newBeat <= newBeat - lowerBeat) {
                  newBeat = upperBeat
                } else {
                  newBeat = lowerBeat
                }

                break
            }

            this.fraction = 0
        }
      }
    }

    if (newBeat > options.timeSignature.beats) {
      this.beat = newBeat % options.timeSignature.beats
      this.addMeasures(1)
    } else {
      this.beat = newBeat
    }
  }
  
  private addFraction(fraction : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const beats = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000
    
    this.addBeats(beats, options)

    let newFraction = this.fraction + leftoverFraction

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize >= SnapSize.Beat) {
        let interval

        switch(snapMode) {
          case SnapMode.Discrete:
            interval = 1000 / options.snapSize
            const multiple = interval * Math.floor(newFraction / interval);
      
            if (newFraction - multiple < Math.min(20, 20 * options.horizontalScale)) {
              newFraction = multiple;
            } else {
              return
            }
            break
          case SnapMode.Nearest:
            interval = 1000 / options.snapSize 
            const lowerMultiple = Math.floor(newFraction / interval) * interval
            const upperMultiple = Math.ceil(newFraction / interval) * interval
    
            if (upperMultiple - newFraction < newFraction - lowerMultiple) {
              newFraction = upperMultiple
            } else {
              newFraction = lowerMultiple
            }
            break
        }
      } else {
        return
      }
    }
    
    if (newFraction >= 1000) {
      this.fraction = newFraction % 1000
      this.addBeats(1, options)
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

  subtract(measures : number, beats : number, fraction : number, mutate : boolean = true,
    options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.subtractFraction(fraction, options, snapMode)
    pos.subtractBeats(beats, options, snapMode)
    pos.subtractMeasures(measures)

    return pos
  }
  
  private subtractBeats(numBeats : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const measures = Math.floor(numBeats / options.timeSignature.beats)
    const beats = numBeats % options.timeSignature.beats
    
    this.subtractMeasures(measures)
    
    let newBeat = this.beat - beats

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize < SnapSize.Beat) {
        switch (snapMode) {
          case SnapMode.Discrete:
            if ((newBeat - 1) % (-8 * options.snapSize + 6) !== 0)
              return
            else {
              if (numBeats > 1)
                this.fraction = 0
            }
            break
          case SnapMode.Nearest:
            let interval = (-8 * options.snapSize + 6)
            let lowerBeat, upperBeat

            switch(options.snapSize) {
              case SnapSize.Measure:
                lowerBeat = Math.floor(newBeat / interval) * interval + 1
                upperBeat = Math.ceil(newBeat / interval) * interval + 1

                if (upperBeat - newBeat <= newBeat - lowerBeat) {
                  newBeat = upperBeat
                } else {
                  newBeat = lowerBeat
                }

                break
              case SnapSize.HalfMeasure:
                lowerBeat = Math.ceil(newBeat / interval) * interval - 1
                upperBeat = Math.ceil(newBeat / interval) * interval + 1

                if (upperBeat - newBeat <= newBeat - lowerBeat) {
                  newBeat = upperBeat
                } else {
                  newBeat = lowerBeat
                }

                break
            }

            this.fraction = 0
        }
      }
    }

    if (newBeat < 1) {
      this.beat = options.timeSignature.beats + newBeat
      this.subtractMeasures(1)
    } else {
      this.beat = newBeat
    }
  }
  
  private subtractFraction(fraction : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const beats = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000

    this.subtractBeats(beats, options)

    let newFraction = this.fraction - leftoverFraction

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize >= SnapSize.Beat) {
        let interval

        switch(snapMode) {
          case SnapMode.Discrete:
            interval = 1000 / options.snapSize
            const multiple = interval * Math.floor(newFraction / interval);
      
            if (newFraction - multiple < Math.min(20, 20 * options.horizontalScale)) {
              newFraction = multiple;
            } else {
              return
            }
            break
          case SnapMode.Nearest:
            interval = 1000 / options.snapSize 
            const lowerMultiple = Math.floor(newFraction / interval) * interval
            const upperMultiple = Math.ceil(newFraction / interval) * interval
    
            if (upperMultiple - newFraction < newFraction - lowerMultiple) {
              newFraction = upperMultiple
            } else {
              newFraction = lowerMultiple
            }
            break
        }
      } else {
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
  
  toMargin(options : TimelinePositionOptions) {
    const measureMargin = (this.measure-1)* options.timeSignature.beats * options.beatWidth * options.horizontalScale
    const beatMargin = (this.beat - 1) * options.beatWidth * options.horizontalScale
    const fractionMargin = options.beatWidth * options.horizontalScale * (this.fraction / 1000)
    
    return measureMargin + beatMargin + fractionMargin
  }

  toTime(options : TimelinePositionOptions) {
    const beatsPerSecond = options.tempo / 60
    let beatsPassed = (this.measure - 1) * options.timeSignature.beats + this.beat - 1
    
    beatsPassed += this.fraction / 1000

    const totalSeconds = beatsPassed / beatsPerSecond
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = Math.floor(totalSeconds % 60)
    const milliseconds = Math.floor((totalSeconds - Math.floor(totalSeconds)) * 1000)

    return {
      minutes,
      seconds,
      milliseconds
    }
  }
  
  toTimeFomat(options : TimelinePositionOptions) {
    const time = this.toTime(options)
    
    return `${time.minutes}:${time.seconds < 10 ? '0' : ''}${time.seconds}:${time.milliseconds < 10 ? '0' : ''}${time.milliseconds}`
  }
}