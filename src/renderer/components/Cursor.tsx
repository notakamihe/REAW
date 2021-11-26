import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import cursorHead from "../../../assets/svg/cursor-head.svg"

interface IProps {
  pos : TimelinePosition
  top : boolean
}

export default class Cursor extends React.Component<IProps> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {timelinePosOptions} = this.context!

    return (
      <div 
        className="disable-highlighting"
        style={{
          position: "absolute", 
          height: "100%",
          top: 0, 
          left: -4 + this.props.pos.toMargin(timelinePosOptions), 
          zIndex: 400,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {
          this.props.top ?
          <React.Fragment >
            <img src={cursorHead} style={{height: 25}} />
            <div style={{width: 2, flex: 1, backgroundColor: "#ff6db8", marginLeft: 4}}></div>
          </React.Fragment> :
          <div style={{width: 2, flex: 1, backgroundColor: "#ff6db8", marginLeft: 4}}></div>
        }
      </div>
    )
  }
}