import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import cursorHead from "../../../assets/svg/cursor-head.svg"

interface IProps {
  height? : number
  pos : TimelinePosition
}

const Cursor = React.forwardRef<HTMLDivElement, IProps>((props, ref) => {
  const {timelinePosOptions} = React.useContext(WorkstationContext)!

  return (
    <div 
      className="disable-highlighting"
      ref={ref}
      style={{
        position: "absolute", 
        top: 14,
        left: -5 + props.pos.toMargin(timelinePosOptions), 
        zIndex: 24,
        pointerEvents: "none"
      }}
    >
      <img src={cursorHead} style={{height: 25}} />
      <div 
        style={{
          position: "absolute", 
          bottom: 0,
          left: 4,
          backgroundColor: "var(--color-primary)", 
          height: (props.height || 0) - 5, 
          width: 2, 
          transform: "translate(0px, 100%)"
        }}
      ></div>
    </div>
  )
});

export default Cursor