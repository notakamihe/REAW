import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { ID } from "renderer/types/types";
import { shadeColor } from "renderer/utils/helpers";
import { copyClip, marginToPos, clipAtPos, ipcRenderer } from "renderer/utils/utils";
import { Track } from "./TrackComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRedo } from "@fortawesome/free-solid-svg-icons";
import DNR, { DragAxis, DNRData, ResizeDirection } from "./DNR";
import { GuideLine } from ".";
import { Region } from "./RegionComponent";
import channels from "renderer/utils/channels";
import { TrimToLeft, TrimToRight } from "./icons";

export interface Clip extends Region {
  end : TimelinePosition
  endLimit : TimelinePosition | null
  id : ID
  loopEnd : TimelinePosition | null
  muted : boolean
  start : TimelinePosition
  startLimit : TimelinePosition | null
}


function Loop(props: {width : number, clipWidth : number, color : string, style? : React.CSSProperties}) {
  const numRepetitions = Math.max(props.clipWidth ? props.width / props.clipWidth : 0, 0)
  const borderRight = numRepetitions === Math.floor(numRepetitions) ? "none" : "1px solid #0002"

  return (
    <div 
      className="position-absolute d-flex overflow-hidden"
      style={{width: props.width, height: "100%", borderRight: borderRight, ...props.style}}>
      {
        [...Array(Math.ceil(numRepetitions))].map((_, i) => (
          <div 
            key={i}
            className="clip-loop"
            style={{width: props.clipWidth, height: "100%", backgroundColor: props.color, flexShrink: 0}}
          ></div>
        ))
      }
    </div>
  )
}


enum ResizeHandleType {ResizeLeft, ResizeRight, Loop}

function ResizeHandle({type, show} : {type : ResizeHandleType, show : boolean}) {
  if (show) {
    switch (type) {
      case ResizeHandleType.ResizeLeft:
        return (
          <div className="d-flex justify-content-center align-items-center" style={{width: 10, height: "100%"}}>
            <TrimToRight iconStyle={{size: 11, color: "#000"}} style={{transform: "translateX(7px)", opacity: 0.5}} />
          </div>
        )
      case ResizeHandleType.ResizeRight:
        return (
          <div className="d-flex justify-content-center align-items-center" style={{width: 10, height: "100%"}}>
            <TrimToLeft iconStyle={{size: 11, color: "#000"}} style={{transform: "translateX(-7px)", opacity: 0.5}} />
          </div>
        )
      case ResizeHandleType.Loop:
        return (
          <FontAwesomeIcon 
            icon={faRedo} 
            style={{color: "#000", fontSize: 9, transform: "translate(-8px, 2px)", opacity: 0.5, zIndex: 14}} 
          />
        )
    }
  }

  return null
}


interface IProps {
  clip : Clip
  track : Track
  isSelected : boolean
  onSelect : (clip : Clip) => void
  onClickAway : (clip : Clip) => void
  onChangeLane : (track : Track, clip : Clip, changeToAbove : boolean) => void
  setClip : (clip : Clip) => void
}

interface IState {
  guideLineMargins : number[]
  isDragging : boolean
  isLooping : boolean
  isResizing : boolean
  tempLoopWidth : number
  tempWidth : number
}

export default class ClipComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext;
  context!: React.ContextType<typeof WorkstationContext>;

  private ref : React.RefObject<DNR>

  constructor(props : IProps) {
    super(props);

    this.ref = React.createRef();

    this.state = {
      guideLineMargins : [],
      isDragging: false,
      isLooping: false,
      isResizing: false,
      tempLoopWidth: 0,
      tempWidth: 0
    }

    this.onContextMenu = this.onContextMenu.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.onLoopStart = this.onLoopStart.bind(this);
    this.onLoopStop = this.onLoopStop.bind(this);
    this.onMouseMove =  this.onMouseMove.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onResizeStart = this.onResizeStart.bind(this);
    this.onResizeStop = this.onResizeStop.bind(this);
  }

  getBounds() {
    const options = this.context!.timelinePosOptions

    if (this.state.isDragging)
      return {}

    return {left: this.props.clip.startLimit?.toMargin(options), right: this.props.clip.endLimit?.toMargin(options)}
  }

  getLoopOffset() {
    const offsetPos = TimelinePosition.fromPos(this.props.clip.start);
    offsetPos.snap(this.context!.timelinePosOptions, true);
    
    return TimelinePosition.toWidth(offsetPos, this.props.clip.start, this.context!.timelinePosOptions);
  }

  getLoopWidth() {
    return TimelinePosition.toWidth(this.props.clip.end, this.props.clip.loopEnd, this.context!.timelinePosOptions)
  }

  moveClipByMargin(margin : number) {
    const newStartPos = marginToPos(margin, this.context!.timelinePosOptions)
    const newClip = clipAtPos(newStartPos, this.props.clip, this.context!.timelinePosOptions)
    this.props.setClip(newClip)
  }

  onContextMenu(e : React.MouseEvent) {
    e.stopPropagation();
    this.props.onSelect(this.props.clip);

    ipcRenderer.send(channels.OPEN_CLIP_CONTEXT_MENU, this.props.clip)

    ipcRenderer.on(channels.DELETE_CLIP, () => {
      this.context!.deleteClip(this.props.clip)
    })

    ipcRenderer.on(channels.DUPLICATE_CLIP, () => {
      this.context!.duplicateClip(this.props.clip)
    })

    ipcRenderer.on(channels.SPLIT_CLIP, () => {
      this.context!.splitClip(this.props.clip, this.context!.cursorPos)
    })

    ipcRenderer.on(channels.SET_SONG_REGION_TO_CLIP, () => {
      this.context!.setSongRegion({start: this.props.clip.start, end: this.props.clip.end})
    })

    ipcRenderer.on(channels.MUTE_CLIP, () => {
      this.context!.toggleMuteClip(this.props.clip)
    })

    ipcRenderer.on(channels.CLOSE_CLIP_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.DELETE_CLIP)
      ipcRenderer.removeAllListeners(channels.DUPLICATE_CLIP)
      ipcRenderer.removeAllListeners(channels.SPLIT_CLIP)
      ipcRenderer.removeAllListeners(channels.SET_SONG_REGION_TO_CLIP)
      ipcRenderer.removeAllListeners(channels.MUTE_CLIP)
      ipcRenderer.removeAllListeners(channels.CLOSE_CLIP_CONTEXT_MENU)
    })
  }

  onDrag(e : MouseEvent, data : DNRData) {
    this.setGuideLineMargins(data.coords.startX, data.coords.endX, null)
  }

  onDragStart(e : React.MouseEvent, data : DNRData) {
    document.addEventListener("mousemove", this.onMouseMove)

    this.props.onSelect(this.props.clip);
    this.setState({isDragging: true}, () => this.setGuideLineMargins(data.coords.startX, data.coords.endX, null))
    this.context!.setTrackRegion(null)
  }

  onDragStop(e : MouseEvent, data : DNRData) {
    document.removeEventListener("mousemove", this.onMouseMove)
    this.setState({isDragging: false})
    
    if (data.deltaWidth != 0) {
      this.moveClipByMargin(data.coords.startX)
    }
  }
  
  onLoop (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    this.setGuideLineMargins(null, null, data.width)
    this.setState({tempLoopWidth: data.width})
  }

  onLoopStart(e : React.MouseEvent, dir : ResizeDirection, ref : HTMLElement) {
    this.props.onSelect(this.props.clip)
    this.setState({isLooping: true, tempLoopWidth: ref.offsetWidth}, () => this.setGuideLineMargins(null, null, ref.offsetWidth))
  }

  onLoopStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    const options = this.context!.timelinePosOptions
    const {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(data.width), options)
    const newClip = copyClip(this.props.clip)
    const newLoopEnd = newClip.end.add(measures, beats, fraction, false, options)
    
    newClip.loopEnd = newLoopEnd.compare(newClip.end) > 0 ? newLoopEnd : null

    this.setState({isLooping: false})
    this.props.setClip(newClip)
  }

  onMouseMove(e : MouseEvent) {
    if (this.ref.current) {
      const el = this.ref.current.ref?.current

      if (el) {
        const {top, bottom} = el.getBoundingClientRect()
     
        const topDiff = e.clientY - top
        const bottomDiff = bottom - e.clientY
    
        if (topDiff <= -20) {
          this.moveClipByMargin(this.ref.current.state.coords.startX)
          this.props.onChangeLane(this.props.track, this.props.clip, true)
        } else if (bottomDiff <= -20) {
          this.moveClipByMargin(this.ref.current.state.coords.startX)
          this.props.onChangeLane(this.props.track, this.props.clip, false)
        }
      }
    }
  }

  onResize (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    const options = this.context!.timelinePosOptions
    const totalWidth = TimelinePosition.toWidth(this.props.clip.start, this.props.clip.loopEnd, options)
    const loopWidth = this.getLoopWidth()
    const tempLoopWidth = dir === ResizeDirection.Right ? Math.max(0,totalWidth - ref.offsetWidth) : loopWidth      
    
    if (dir === ResizeDirection.Right) {
      this.setGuideLineMargins(null, data.coords.endX, null)

      if (ref.offsetWidth > totalWidth && this.props.clip.loopEnd) {
        const clip = copyClip(this.props.clip)
        
        clip.loopEnd = null
        this.props.setClip(clip)
      }
    } else {
      this.setGuideLineMargins(data.coords.startX, null, null)
    }

    this.setState({tempWidth: data.width, tempLoopWidth})
  }

  onResizeStart (e : React.MouseEvent, dir : ResizeDirection, ref : HTMLElement) {
    this.props.onSelect(this.props.clip)
    this.setState({isResizing: true, tempWidth: ref.offsetWidth, tempLoopWidth: this.getLoopWidth()}, () => {
      if (dir === ResizeDirection.Right)
        this.setGuideLineMargins(null, this.props.clip.end.toMargin(this.context!.timelinePosOptions), null)
      else
        this.setGuideLineMargins(this.props.clip.start.toMargin(this.context!.timelinePosOptions), null, null)
    })
  }

  onResizeStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    this.setState({isResizing: false})

    if (data.deltaWidth != 0) {
      const newClip = copyClip(this.props.clip)
  
      if (dir === ResizeDirection.Left) {
        const newStartPos = marginToPos(data.coords.startX, this.context!.timelinePosOptions)
        newStartPos.snap(this.context!.timelinePosOptions)
        newClip.start = newStartPos
      } else if (dir === ResizeDirection.Right) {
        const newEndPos = marginToPos(data.coords.endX, this.context!.timelinePosOptions)
        newEndPos.snap(this.context!.timelinePosOptions)
        newClip.end = newEndPos 
      }
  
      if (newClip.loopEnd && newClip.end.compare(newClip.loopEnd) >= 0)
        newClip.loopEnd = null
  
      if (newClip.start.compare(newClip.end) >= 0) return
  
      if (newClip.startLimit && newClip.start.compare(newClip.startLimit) <= 0)
        newClip.start.setPos(newClip.startLimit)
      
      if (newClip.endLimit && newClip.end.compare(newClip.endLimit) >= 0)
        newClip.end.setPos(newClip.endLimit)
  
      this.props.setClip(newClip)
    }
  }

  setGuideLineMargins(startX : number | null, endX : number | null, width : number | null) {
    let guideLineMargins : number[] = []

    if (this.state.isDragging) {
      if (startX && endX)
        guideLineMargins = [startX, endX].concat(this.props.clip.loopEnd ? [endX + this.getLoopWidth()] : [])
    } else if (this.state.isResizing) {
      if (!startX && endX)
        guideLineMargins = [endX]
      else if (startX && !endX)
        guideLineMargins = [startX]
    } else if (this.state.isLooping) {
      if (width)
        guideLineMargins = [this.props.clip.end.toMargin(this.context!.timelinePosOptions) + width]
    }

    this.setState({guideLineMargins})
  }

  render() {
    const {snapGridSize, timelinePosOptions, verticalScale} = this.context!
    const bounds = this.getBounds()
    const width = this.state.isResizing ? this.state.tempWidth : 
      TimelinePosition.toWidth(this.props.clip.start, this.props.clip.end, timelinePosOptions)
    const loopWidth = this.state.isResizing || this.state.isLooping ? this.state.tempLoopWidth : this.getLoopWidth()
    const snapWidth = TimelinePosition.fromInterval(snapGridSize).toMargin(timelinePosOptions)
    const threshold = Math.max(2, snapWidth / 4.282);
    const loopOffset = this.getLoopOffset();

    return (
      <React.Fragment>
        <DNR
          bounds={bounds}
          className="clip"
          coords={{
            startX: this.props.clip.start.toMargin(timelinePosOptions), 
            startY: 0, 
            endX: this.props.clip.end.toMargin(timelinePosOptions), 
            endY: 100 * verticalScale
          }}
          dragAxis={DragAxis.X}
          enableResizing={{left: true, right: true}}
          onClickAway={() => this.props.onClickAway(this.props.clip)}
          onContextMenu={this.onContextMenu}
          onDrag={this.onDrag}
          onDragStart={this.onDragStart}
          onDragStop={this.onDragStop}
          onResize={this.onResize}
          onResizeStart={this.onResizeStart}
          onResizeStop={this.onResizeStop}
          ref={this.ref}
          resizeHandles={{
            left: <ResizeHandle type={ResizeHandleType.ResizeLeft} show={this.props.isSelected && width >= 20}/>,
            right: <ResizeHandle type={ResizeHandleType.ResizeRight} show={this.props.isSelected && width >= 20} />,
          }}
          resizeHandleStyles={{left: {zIndex: 11}, right: {zIndex: 11}}}
          snapGridSize={{horizontal: snapWidth || 0.00001}}
          style={{
            backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 15),
            zIndex: this.props.isSelected ? 10 : 9,
            opacity: this.props.clip.muted ? 0.5 : 1
          }}
        >
          {
            this.props.clip.muted && (width > 25 || loopWidth > 5) &&
            <p style={{position: "absolute", top: 0, left: 2, fontSize: 12, color: "#0008", fontWeight: "bold"}}>M</p>
          }
          <div className="position-absolute" style={{top: 0, left: -1 - loopOffset}}>
            <DNR 
              constrainToParent={{vertical: false, horizontal: false}}
              coords={{
                startX: (width + loopOffset),
                startY: 0,
                endX: (width + loopOffset) + loopWidth,
                endY: 10
              }}
              disableDragging
              enableResizing={{right: true}}
              minWidth={0}
              onResizeStart={this.onLoopStart}
              onResize={this.onLoop}
              onResizeStop={this.onLoopStop}
              resizeHandleClasses={{right: "center-by-flex"}}
              resizeHandles={{
                right: <ResizeHandle type={ResizeHandleType.Loop} show={this.props.isSelected && (width > 25 || loopWidth > 5)} /> 
              }}
              resizeHandleStyles={{right: {zIndex: 14}}}
              snapGridSize={{horizontal: snapWidth || 0.00001}}
              snapThreshold={{horizontal: threshold}}
              style={{zIndex: 12}}
            >
              <Loop
                clipWidth={width}   
                color={this.props.isSelected ? "#eee" : shadeColor(this.props.track.color, 30) } 
                style={{height: 100 * verticalScale, transform: "translateY(-1px)"}}
                width={loopWidth}   
              />
            </DNR>
          </div>
          <div className="position-absolute pe-none" style={{bottom: 0, left: -1, transform: "translate(0, 100%)", opacity: 0.3}}>
            {
              this.props.track.automationEnabled &&
              this.props.track.automationLanes.filter(l => l.show).map((l, idx) => (
                <div 
                  key={idx} 
                  className="clip"
                  style={{width: width, height: l.expanded ? 100 * verticalScale : 25, backgroundColor: this.props.track.color, opacity: 0.5}}
                >
                  <Loop
                    clipWidth={width}   
                    color={shadeColor(this.props.track.color, 45)} 
                    style={{right: 0, transform: "translate(100%, -1px)", height: l.expanded ? 100 * verticalScale : 25}}
                    width={loopWidth}   
                  />
                </div>
              ))
            }
          </div>
        </DNR>
        {
          (this.state.isDragging || this.state.isResizing || this.state.isLooping) &&
          this.state.guideLineMargins.map((m, idx) => <GuideLine key={idx} margin={m} />)
        }
      </React.Fragment>
    )
  }
}