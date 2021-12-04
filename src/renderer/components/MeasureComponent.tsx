import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { Unit } from "renderer/types/types"
import { BEAT_WIDTH } from "renderer/utils"
import { BeatComponent } from "."
import { Beat } from "./BeatComponent"

interface IProps {
  measure : Measure
}

interface IState {
  
}

export class Measure extends Unit {
  numberOfBeats : number
  
  constructor(pos : number, numberOfBeats : number) {
    super(pos)
    this.numberOfBeats = numberOfBeats
  }
}

export default class MeasureComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {horizontalScale, setHorizontalScale} = this.context!

    const showMeasure = () : boolean => {
      if (horizontalScale <= 0.08 && this.props.measure.pos % 2 === 0) return false
      if (horizontalScale <= 0.04 && (this.props.measure.pos - 1) % 4 !== 0) return false
      if (horizontalScale <= 0.024 && (this.props.measure.pos - 1) % 8 !== 0) return false
      if (horizontalScale <= 0.012 && (this.props.measure.pos - 1) % 16 !== 0) return false
      if (horizontalScale <= 0.006 && (this.props.measure.pos - 1) % 32 !== 0) return false
  
      return true
    }

    return (
      <div 
        className="d-flex position-relative" 
        style={{
          flexShrink: 0, 
          width: this.props.measure.numberOfBeats * BEAT_WIDTH * horizontalScale, 
          height: 30, 
          borderLeft: "1px solid #000", 
          alignItems: "flex-end",
          visibility: showMeasure() ? "visible" : "hidden"
        }}
      >
        {
          [...Array(this.props.measure.numberOfBeats)].map((_, i) => (
            <BeatComponent key={i} beat={new Beat(i+1, this.props.measure)} />
          ))
        }
        <span style={{position: "absolute", left: 3, fontSize: 11, top: -4}}>{this.props.measure.pos}</span>
      </div>
    )
  }
}