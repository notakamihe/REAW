import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { marginToPos } from "renderer/utils/utils";
import { DNR } from ".";
import { DNRData, ResizeDirection } from "./DNR";

export interface Region {
  start : TimelinePosition
  end : TimelinePosition
}


interface IState {
  newRegionStartPos : TimelinePosition | null
  newRegionEndPos : TimelinePosition | null
  isCreatingNewRegion : boolean
}

export default class RegionComponent extends React.Component<{}, IState> {
  static contextType = WorkstationContext;
  context : React.ContextType<typeof WorkstationContext>;

  constructor(props : any) {
    super(props);

    this.state = {
      newRegionStartPos: null,
      newRegionEndPos: null,
      isCreatingNewRegion: false
    }

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onResizeStop = this.onResizeStop.bind(this);
  }

  getNewRegionMarginAndWidth() {
    const options = this.context!.timelinePosOptions
    const mw = {left: 0, width: 0}

    if (this.state.newRegionStartPos && this.state.newRegionEndPos) {
      if (this.state.newRegionEndPos.compare(this.state.newRegionStartPos) < 0) {
        mw.left = this.state.newRegionEndPos.toMargin(options)
        mw.width = TimelinePosition.toWidth(this.state.newRegionEndPos, this.state.newRegionStartPos, options)
      } else {
        mw.left = this.state.newRegionStartPos.toMargin(options)
        mw.width = TimelinePosition.toWidth(this.state.newRegionStartPos, this.state.newRegionEndPos, options)
      }
    }

    return mw
  }

  onMouseDown(e : React.MouseEvent<HTMLDivElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left
    const newRegionStartPos = marginToPos(x, this.context!.timelinePosOptions)

    newRegionStartPos.snap(this.context!.timelinePosOptions)
    
    this.setState({newRegionStartPos, newRegionEndPos: null, isCreatingNewRegion: true});

    document.addEventListener("mousemove", this.onMouseMove)
    document.addEventListener("mouseup", this.onMouseUp)
  }

  onMouseMove(e : MouseEvent) {
    e.preventDefault()

    let margin = 0

    if (this.state.newRegionEndPos) {
      margin = this.state.newRegionEndPos.toMargin(this.context!.timelinePosOptions)
    } else if (this.state.newRegionStartPos) {
      margin = this.state.newRegionStartPos.toMargin(this.context!.timelinePosOptions)
    }

    margin = Math.max(0, margin + e.movementX)

    const newRegionEndPos = marginToPos(margin, this.context!.timelinePosOptions)
    
    this.setState({newRegionEndPos})
    this.context!.setRegion(null)
  }

  onMouseUp(e : MouseEvent) {
    document.removeEventListener("mousemove", this.onMouseMove)
    document.removeEventListener("mouseup", this.onMouseUp)

    this.setState({isCreatingNewRegion: false})

    if (this.state.newRegionStartPos && this.state.newRegionEndPos) {
      const newRegionEndPos = TimelinePosition.fromPos(this.state.newRegionEndPos)
      newRegionEndPos.snap(this.context!.timelinePosOptions)
      
      if (newRegionEndPos.compare(this.state.newRegionStartPos) !== 0) {
        this.setState({newRegionEndPos}, () => {
          if (this.state.newRegionEndPos!.compare(this.state.newRegionStartPos!) < 0)
            this.context!.setRegion({start: this.state.newRegionEndPos!, end: this.state.newRegionStartPos!})
          else
            this.context!.setRegion({start: this.state.newRegionStartPos!, end: this.state.newRegionEndPos!})
        })
      }
    }
  }

  onResizeStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    if (this.context!.region) {
      let newRegion = {...this.context!.region}

      if (dir === ResizeDirection.Left) {
        const startPos = marginToPos(data.coords.startX, this.context!.timelinePosOptions)
        startPos.snap(this.context!.timelinePosOptions)
        newRegion.start = startPos
      } else if (dir === ResizeDirection.Right) {
        const endPos = marginToPos(data.coords.endX, this.context!.timelinePosOptions)
        endPos.snap(this.context!.timelinePosOptions)
        newRegion.end = endPos
      }

      if (newRegion.start.compare(newRegion.end) >= 0)
        this.context!.setRegion(null)
      else
        this.context!.setRegion(newRegion)
    }
  }

  render() {
    const {isLooping, region, timelinePosOptions} = this.context!
    const {left, width} = this.getNewRegionMarginAndWidth()

    return (
      <div onMouseDown={this.onMouseDown} style={{width: "100%", height: "100%", position: "relative"}}>
        {
          this.state.isCreatingNewRegion &&
          <div 
            style={{
              position: "absolute", 
              top: 0, 
              left, 
              width,
              height: "100%",
              backgroundColor: isLooping ? "var(--color-primary-light)" : "#0004"
            }}
          ></div>
        }
        {
          region &&
          <DNR
            coords={{
              startX: region.start.toMargin(timelinePosOptions), 
              startY: 0, 
              endX: region.end.toMargin(timelinePosOptions), 
              endY: 10
            }}
            disableDragging
            enableResizing={{left: true, right: true}}
            onDoubleClick={() => this.context!.setRegion(null)}
            onResizeStop={this.onResizeStop}
            style={{backgroundColor: isLooping ? "var(--color-primary-light)" : "#0004"}}
          />
        }
      </div>
    )
  }
}