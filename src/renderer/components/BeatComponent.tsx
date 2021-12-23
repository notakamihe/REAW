import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { Unit } from "renderer/types/types"
import { BEAT_WIDTH } from "renderer/utils"
import { Measure } from "./MeasureComponent"

interface IProps {
  beat : Beat
}

interface IState {

}

export class Beat extends Unit {
  measure : Measure

  constructor(pos : number, measure : Measure) {
    super(pos)
    this.measure = measure
  }
}

export default class BeatComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {horizontalScale, setHorizontalScale, gridSize} = this.context!

    const getWidth = () => {
      return BEAT_WIDTH * horizontalScale
    }
    
    const showGridTick = (idx : number) : boolean => {
      if (horizontalScale > 12) return true
      if (horizontalScale > 5.6 && idx % (0.25 * (gridSize as number)) === 0) return true
      if (horizontalScale > 1.4 && idx % (0.5 * (gridSize as number)) === 0) return true

      return false
    }

    return (
      <div 
        className="d-flex position-relative" 
        style={{
          flexShrink: 0, 
          width: getWidth(), 
          height: 15, 
          borderLeft: this.props.beat.pos === 1 ? "none" : "1px solid #000", 
          alignItems: "flex-end",
          visibility: horizontalScale > 0.16 ? "visible" : "hidden",
          boxSizing: "border-box"
        }}
      >
        {
          [...Array(gridSize as number)].map((grid, idx) => (
            showGridTick(idx) &&
            <div 
              key={idx}
              className="position-relative" 
              style={{
                flexShrink: 0, 
                marginRight: "auto",
                height: idx % ((1/8) * (gridSize as number)) === 0 ? 4 : 2, 
                borderLeft: idx === 0 ? "none" : "1px solid #000", 
                alignItems: "flex-end"
            }}
            >
              {
                idx !== 0 && idx % ((1/8) * (gridSize as number)) === 0 &&
                <p style={{position: "absolute", fontSize: 10, top: -14, left: -14, color: "#0006", letterSpacing: -0.75}}>
                  {this.props.beat.measure.pos}.{this.props.beat.pos}.{idx / (gridSize as number) * 1000}
                </p>
              }
            </div>
          ))   
        }
        {
          this.props.beat.pos !== 1 && horizontalScale > 0.42 &&
          <span style={{position: "absolute", left: 3, fontSize: 10, top: -4}}>
            {this.props.beat.measure.pos}.{this.props.beat.pos}
          </span>
        }
      </div>
    )
  }
}