import { WorkflowContextType, WorkstationContext } from "renderer/context/WorkstationContext"
import { BAR_WIDTH } from "renderer/utils"
import { SnapMode, SnapSize, TimeSignature } from "./types"

export interface TimelinePositionOptions {
  snapSize : SnapSize
  barWidth : number
  horizontalScale : number,
  timeSignature : TimeSignature
}

export default class TimelinePosition {
  static start : TimelinePosition = new TimelinePosition(1, 1, 0)

  measure : number
  bar : number
  fraction : number

  constructor (measure : number, bar : number, fraction : number) {
    this.measure = measure
    this.bar = bar
    this.fraction = fraction
  }

  add(measures : number, bars : number, fraction : number, mutate : boolean = true, 
    options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.addMeasures(measures)
    pos.addBars(bars, options, snapMode)
    pos.addFraction(fraction, options, snapMode)

    return pos
  }

  private addBars(numBars : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const measures = Math.floor(numBars / options.timeSignature.beats)
    const bars = numBars % options.timeSignature.beats
    
    this.addMeasures(measures)

    let newBar = this.bar + bars

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize < SnapSize.Bar) {
        switch (snapMode) {
          case SnapMode.Discrete:
            if ((newBar - 1) % (-8 * options.snapSize + 6) !== 0)
              return
            else {
              if (numBars > 1)
                this.fraction = 0
            }
            break
          case SnapMode.Nearest:
            let interval = (-8 * options.snapSize + 6)
            let lowerBar, upperBar

            switch(options.snapSize) {
              case SnapSize.Measure:
                lowerBar = Math.floor(newBar / interval) * interval + 1
                upperBar = Math.ceil(newBar / interval) * interval + 1

                if (upperBar - newBar <= newBar - lowerBar) {
                  newBar = upperBar
                } else {
                  newBar = lowerBar
                }

                break
              case SnapSize.HalfMeasure:
                lowerBar = Math.ceil(newBar / interval) * interval - 1
                upperBar = Math.ceil(newBar / interval) * interval + 1

                if (upperBar - newBar <= newBar - lowerBar) {
                  newBar = upperBar
                } else {
                  newBar = lowerBar
                }

                break
            }

            this.fraction = 0
        }
      }
    }

    if (newBar > options.timeSignature.beats) {
      this.bar = newBar % options.timeSignature.beats
      this.addMeasures(1)
    } else {
      this.bar = newBar
    }
  }
  
  private addFraction(fraction : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const bars = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000
    
    this.addBars(bars, options)

    let newFraction = this.fraction + leftoverFraction

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize >= SnapSize.Bar) {
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
      this.addBars(1, options)
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
    } else if (this.bar > other.bar) {
      return 1
    } else if (this.bar < other.bar) {
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
    return new TimelinePosition(pos.measure, pos.bar, pos.fraction)
  }

  static fromWidth(width: number, options : TimelinePositionOptions) {
    const measureWidth = options.timeSignature.beats * options.barWidth * options.horizontalScale
    const barWidth = options.barWidth * options.horizontalScale

    const measures = Math.floor(Math.abs(width) / measureWidth)
    const bars = Math.floor((Math.abs(width) - measures * measureWidth) / barWidth)
    const fraction = (Math.abs(width) - measures * measureWidth - bars * barWidth) / barWidth * 1000

    return {
      measures,
      bars,
      fraction
    }
  }

  normalize(options : TimelinePositionOptions) {
    let measure = this.measure
    let bar = this.bar
    let fraction = this.fraction

    if (measure < 1)
      measure = 1

    if (bar < 1)
      bar = 1

    if (fraction < 0)
      fraction = 0

    this.measure = measure
    this.bar = 1
    this.fraction = 0

    options.snapSize = SnapSize.None

    this.addBars(bar - 1, options)
    this.addFraction(fraction, options)
  }

  subtract(measures : number, bars : number, fraction : number, mutate : boolean = true,
    options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) : TimelinePosition {
    let pos = mutate ? this : TimelinePosition.fromPos(this)

    pos.subtractFraction(fraction, options, snapMode)
    pos.subtractBars(bars, options, snapMode)
    pos.subtractMeasures(measures)

    return pos
  }
  
  private subtractBars(numBars : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const measures = Math.floor(numBars / options.timeSignature.beats)
    const bars = numBars % options.timeSignature.beats
    
    this.subtractMeasures(measures)
    
    let newBar = this.bar - bars

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize < SnapSize.Bar) {
        switch (snapMode) {
          case SnapMode.Discrete:
            if ((newBar - 1) % (-8 * options.snapSize + 6) !== 0)
              return
            else {
              if (numBars > 1)
                this.fraction = 0
            }
            break
          case SnapMode.Nearest:
            let interval = (-8 * options.snapSize + 6)
            let lowerBar, upperBar

            switch(options.snapSize) {
              case SnapSize.Measure:
                lowerBar = Math.floor(newBar / interval) * interval + 1
                upperBar = Math.ceil(newBar / interval) * interval + 1

                if (upperBar - newBar <= newBar - lowerBar) {
                  newBar = upperBar
                } else {
                  newBar = lowerBar
                }

                break
              case SnapSize.HalfMeasure:
                lowerBar = Math.ceil(newBar / interval) * interval - 1
                upperBar = Math.ceil(newBar / interval) * interval + 1

                if (upperBar - newBar <= newBar - lowerBar) {
                  newBar = upperBar
                } else {
                  newBar = lowerBar
                }

                break
            }

            this.fraction = 0
        }
      }
    }

    if (newBar < 1) {
      this.bar = options.timeSignature.beats + newBar
      this.subtractMeasures(1)
    } else {
      this.bar = newBar
    }
  }
  
  private subtractFraction(fraction : number, options : TimelinePositionOptions, snapMode : SnapMode = SnapMode.Discrete) {
    const bars = Math.floor(fraction / 1000)
    const leftoverFraction = fraction % 1000

    this.subtractBars(bars, options)

    let newFraction = this.fraction - leftoverFraction

    if (options && options.snapSize !== SnapSize.None) {
      if (options.snapSize >= SnapSize.Bar) {
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
      this.subtractBars(1, options)
    } else {
      this.fraction = newFraction
    }
  }
  
  private subtractMeasures(numMeasures : number) {
    this.measure -= numMeasures
  }
  
  toMargin(options : TimelinePositionOptions) {
    const measureMargin = (this.measure-1)* options.timeSignature.beats * options.barWidth * options.horizontalScale
    const barMargin = (this.bar - 1) * options.barWidth * options.horizontalScale
    const fractionMargin = options.barWidth * options.horizontalScale * (this.fraction / 1000)
    
    return measureMargin + barMargin + fractionMargin
  }
}