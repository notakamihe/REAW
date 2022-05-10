import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";

interface IProps {
  height? : number
  pos : TimelinePosition
}

const Cursor = React.forwardRef<HTMLDivElement, IProps>((props, ref) => {
  const {timelinePosOptions} = React.useContext(WorkstationContext)!

  return (
    <div 
      className="disable-highlighting position-absolute"
      ref={ref}
      style={{top: 14, left: -5 + props.pos.toMargin(timelinePosOptions), zIndex: 24, pointerEvents: "none"}}
    >
      <div 
        style={{
          position: "absolute", 
          bottom: 0,
          left: 4,
          backgroundColor: "var(--color1)", 
          height: (props.height || 0) - 5, 
          width: 2, 
          transform: "translate(0px, 100%)"
        }}
      ></div>
    </div>
  )
});

export default Cursor