import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { Unit } from "renderer/types/types"
import { BAR_WIDTH } from "renderer/utils"
import { BarComponent } from "."
import { Bar } from "./BarComponent"

interface IProps {
  measure : Measure
}

interface IState {
  
}

export class Measure extends Unit {
  numberOfBars : number
  
  constructor(pos : number, numberOfBars : number) {
    super(pos)
    this.numberOfBars = numberOfBars
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
          width: this.props.measure.numberOfBars * BAR_WIDTH * horizontalScale, 
          height: 30, 
          borderLeft: "1px solid #000", 
          alignItems: "flex-end",
          visibility: showMeasure() ? "visible" : "hidden"
        }}
      >
        {
          [...Array(this.props.measure.numberOfBars)].map((_, i) => (
            <BarComponent key={i} bar={new Bar(i+1, this.props.measure)} />
          ))
        }
        <span style={{position: "absolute", left: 3, fontSize: 11, top: -4}}>{this.props.measure.pos}</span>
      </div>
    )
  }
}