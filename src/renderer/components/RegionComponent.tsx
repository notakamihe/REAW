import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { marginToPos } from "renderer/utils/utils";
import { AnywhereClickAnchorEl, DNR } from ".";
import { DNRData, ResizeDirection } from "./DNR";

export interface Region {
  start : TimelinePosition
  end : TimelinePosition
}

interface IProps {
  containerStyle? : React.CSSProperties
  onClickAway? : () => void
  onContainerMouseDown? : (e : React.MouseEvent<HTMLDivElement>) => void
  onDelete? : () => void
  onRightClickAnywhere? : (e : HTMLElement | null) => void
  onSetRegion : (region : Region | null) => void
  region : Region | null
  regionStyle? : React.CSSProperties
}

interface IState {
  height : number
  newRegionStartPos : TimelinePosition | null
  newRegionEndPos : TimelinePosition | null
  isCreatingNewRegion : boolean
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
      newRegionStartPos: null,
      newRegionEndPos: null,
      isCreatingNewRegion: false
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
    this.props.onContainerMouseDown?.(e)

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
    this.props.onSetRegion(null)
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
            this.props.onSetRegion({start: this.state.newRegionEndPos!, end: this.state.newRegionStartPos!})
          else
            this.props.onSetRegion({start: this.state.newRegionStartPos!, end: this.state.newRegionEndPos!})
        })
      }
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
    const {isLooping, timelinePosOptions} = this.context!
    const {left, width} = this.getNewRegionMarginAndWidth()

    return (
      <div 
        onMouseDown={this.onMouseDown} 
        ref={this.containerRef} 
        style={{width: "100%", height: "100%", position: "relative", ...this.props.containerStyle}}
      >
        {
          this.state.isCreatingNewRegion &&
          <div 
            style={{
              ...this.props.regionStyle,
              position: "absolute", 
              top: 0, 
              left, 
              width,
              height: "100%",
            }}
          ></div>
        }
        {
          this.props.region &&
          <AnywhereClickAnchorEl onRightClickAnywhere={e => this.props.onRightClickAnywhere?.(e)}>
            <DNR
              coords={{
                startX: this.props.region.start.toMargin(timelinePosOptions), 
                startY: 0, 
                endX: this.props.region.end.toMargin(timelinePosOptions), 
                endY: this.state.height
              }}
              disableDragging
              enableResizing={{left: true, right: true}}
              onClickAway={this.onRegionClickAway}
              onDoubleClick={this.props.onDelete}
              onMouseDown={e => e.stopPropagation()}
              onResizeStop={this.onResizeStop}
              style={this.props.regionStyle}
            />
          </AnywhereClickAnchorEl>
        }
      </div>
    )
  }
}