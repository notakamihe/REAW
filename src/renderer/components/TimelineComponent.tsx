import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapSize } from "renderer/types/types";
import { marginToPos } from "renderer/utils/utils";
import { MeasureComponent } from ".";
import { Measure } from "./MeasureComponent";

interface IProps {
  numMeasures : number;
  style? : React.CSSProperties;
}

interface IState {

}

export default class TimelineComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : any) {
    super(props)

    this.onClick = this.onClick.bind(this)
  }

  onClick(e : React.MouseEvent<HTMLDivElement>) {
    const options = {...this.context!.timelinePosOptions}

    if (this.context!.autoSnap && options.horizontalScale >= 19)
      options.snapSize = SnapSize.None
    
    const x = e.clientX - e.currentTarget.getBoundingClientRect().x
    const newCursorPos = marginToPos(x, options)

    newCursorPos.snap(options)

    this.context!.setCursorPos(newCursorPos)
  }

  render() {
    const {timelinePosOptions} = this.context!


    return (
      <div 
        className="d-flex disable-highlighting" 
        onClick={this.onClick}
        onDragStart={e => e.preventDefault()}
        style={{width: "100%", height: "100%", alignItems: "flex-end", ...this.props.style}}
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
