import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapMode, SnapSize } from "renderer/types/types";
import { MeasureComponent } from ".";
import { Measure } from "./MeasureComponent";

interface IProps {
  width : number;
  numMeasures : number;
  setCursorPos : (pos : TimelinePosition) => void;
}

interface IState {

}

export default class TimelineComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {timelinePosOptions} = this.context!

    const onClick = (e : React.MouseEvent<HTMLDivElement>) => {
      const newTimelinePosOptions = {...timelinePosOptions}

      if (timelinePosOptions.horizontalScale >= 19)
        newTimelinePosOptions.snapSize = SnapSize.None
      
      const xDiff = e.clientX - e.currentTarget.getBoundingClientRect().x
      const {measures, bars, fraction} = TimelinePosition.fromWidth(xDiff, newTimelinePosOptions)
      
      let newPos = TimelinePosition.fromPos(TimelinePosition.start)
      newPos.add(measures, bars, fraction, true, newTimelinePosOptions, SnapMode.Nearest)

      this.props.setCursorPos(newPos)
    }

    return (
      <div 
        className="d-flex disable-highlighting" 
        style={{backgroundColor: "#eee", width: this.props.width, height: "100%", alignItems: "flex-end"}}
        onClick={onClick}
      >
        {
          [...Array(this.props.numMeasures)].map((_, i) => (
            <MeasureComponent key={i} measure={new Measure(i+1, timelinePosOptions.timeSignature.beats)} />
          ))
        }
      </div>
    )
  }
} 
