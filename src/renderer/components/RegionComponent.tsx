import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { Region } from "renderer/types/types";
import { marginToPos } from "renderer/utils/utils";
import { DNR } from ".";
import { DNRData, ResizeDirection } from "./DNR";

interface IProps {
  children? : JSX.Element
  containerStyle? : React.CSSProperties
  highlight? : boolean
  highlightStyle? : React.CSSProperties
  onClickAway? : () => void
  onContainerMouseDown? : (e : React.MouseEvent<HTMLDivElement>) => void
  onContextMenu? : (e : React.MouseEvent) => void
  onDelete? : () => void
  onSetRegion : (region : Region | null) => void
  region : Region | null
  regionStyle? : React.CSSProperties
}

interface IState {
  height : number;
  isCreatingNewRegion : boolean;
  newRegion: {start: number, end: number}
  tempNewRegion: {start: number, end: number}
}

export default class RegionComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext;
  context : React.ContextType<typeof WorkstationContext>;

  containerRef : React.RefObject<HTMLDivElement>

  constructor(props : any) {
    super(props);

    this.containerRef = React.createRef();

    this.state = {
      height: 0,
      isCreatingNewRegion: false,
      newRegion: {start: 0, end: 0},
      tempNewRegion: {start: 0, end: 0}
    }

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onRegionClickAway = this.onRegionClickAway.bind(this);
    this.onResizeStop = this.onResizeStop.bind(this);
  }

  componentDidMount() {
    this.setState({height: this.containerRef.current?.clientHeight || 0})
  }

  componentDidUpdate() {
    if (this.state.height !== this.containerRef.current?.clientHeight) {
      this.setState({height: this.containerRef.current?.clientHeight || 0})
    }
  }
  
  onMouseDown(e : React.MouseEvent<HTMLDivElement>) {
    this.props.onContainerMouseDown?.(e)

    if (e.button === 0) {
      const x = e.clientX - e.currentTarget.getBoundingClientRect().left
      const snapWidth = TimelinePosition.fromInterval(this.context!.snapGridSize).toMargin(this.context!.timelinePosOptions) || 0.00001
      const snapX = snapWidth * Math.round(x / snapWidth)
      
      this.setState({isCreatingNewRegion: true, newRegion: {start: snapX, end: snapX}, tempNewRegion: {start: snapX, end: snapX}});
  
      document.addEventListener("mousemove", this.onMouseMove)
      document.addEventListener("mouseup", this.onMouseUp)
    }
  }

  onMouseMove(e : MouseEvent) {
    e.preventDefault()
    
    const containerRect = this.containerRef.current?.getBoundingClientRect();

    if (containerRect) {
      const margin = Math.min(Math.max(0, this.state.tempNewRegion.end + e.movementX), containerRect.width)
      const snapWidth = TimelinePosition.fromInterval(this.context!.snapGridSize).toMargin(this.context!.timelinePosOptions) || 0.00001
      const end = snapWidth * Math.round(margin / snapWidth)

      this.setState({newRegion: {...this.state.newRegion, end}, tempNewRegion: {...this.state.tempNewRegion, end: margin}})

      this.props.onSetRegion(null)
    }
  }

  onMouseUp(e : MouseEvent) {
    document.removeEventListener("mousemove", this.onMouseMove)
    document.removeEventListener("mouseup", this.onMouseUp)

    this.setState({isCreatingNewRegion: false})

    const {start, end} = this.state.newRegion
    
    if (start - end !== 0) {
      const startPos = marginToPos(this.state.newRegion.start, this.context!.timelinePosOptions);
      const endPos = marginToPos(this.state.newRegion.end, this.context!.timelinePosOptions);

      if (startPos.compare(endPos) <= 0)
        this.props.onSetRegion({start: startPos, end: endPos})
      else
        this.props.onSetRegion({start: endPos, end: startPos})
    }
  }

  onRegionClickAway(e : Event) {
    if (this.containerRef.current?.contains(e.target as Node))
      this.props.onClickAway?.()
  }

  onResizeStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    if (this.props.region) {
      let newRegion = {...this.props.region}

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
        this.props.onSetRegion(null)
      else
        this.props.onSetRegion(newRegion)
    }
  }

  render() {
    const {snapGridSize, timelinePosOptions} = this.context!
    const {start, end} = this.state.newRegion
    const left = start <= end ? start : end
    const snapWidth = TimelinePosition.fromInterval(snapGridSize).toMargin(timelinePosOptions)

    return (
      <div 
        onMouseDown={this.onMouseDown} 
        ref={this.containerRef} 
        style={{width: "100%", height: "100%", position: "relative", ...this.props.containerStyle}}
      >
        {
          this.state.isCreatingNewRegion &&
          <div style={{...this.props.regionStyle, position: "absolute", top: 0, left, width: Math.abs(end - start), height: "100%"}}>
            {
              this.props.highlight &&
              <div
                className="position-absolute pe-none"
                style={{...this.props.highlightStyle, top: this.state.height, left: 0, width: "100%"}}
              ></div>
            }
          </div>
        }
        {
          this.props.region &&
          <DNR
            coords={{
              startX: this.props.region.start.toMargin(timelinePosOptions), 
              startY: 0, 
              endX: this.props.region.end.toMargin(timelinePosOptions), 
              endY: this.state.height
            }}
            disableDragging
            enableResizing={{left: true, right: true}}
            minWidth={0}
            onClickAway={this.onRegionClickAway}
            onContextMenu={this.props.onContextMenu}
            onDoubleClick={this.props.onDelete}
            onMouseDown={e => e.stopPropagation()}
            onResizeStop={this.onResizeStop}
            snapGridSize={{horizontal: snapWidth || 0.00001}}
            style={this.props.regionStyle}
          >
            {
              this.props.highlight &&
              <div
                className="position-absolute pe-none"
                style={{...this.props.highlightStyle, top: this.state.height, left: 0, width: "100%"}}
              ></div>
            }
          </DNR>
        }
      </div>
    )
  }
}