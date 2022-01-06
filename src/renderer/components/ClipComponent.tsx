import { ClickAwayListener, ListItemText, Menu, MenuItem, MenuList, Popper } from "@mui/material";
import React from "react";
import { DraggableData, Position, ResizableDelta, Rnd } from "react-rnd";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { ID } from "renderer/types/types";
import { shadeColor } from "renderer/utils/helpers";
import { Track } from "./TrackComponent";
import trimToLeft from "../../../assets/svg/trim-to-left.svg";
import trimToRight from "../../../assets/svg/trim-to-right.svg";
import Draggable, { DraggableEvent } from "react-draggable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRedo } from "@fortawesome/free-solid-svg-icons";
import GuideLine from "./GuideLine";
import { AnywhereClickAnchorEl } from ".";
import { MenuIcon } from "./icons";
import { ContentCopy, ContentCut, Delete } from "@mui/icons-material";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";

interface IProps {
  clip : Clip
  track : Track
  isSelected : boolean
  color? : string
  onSelect : (clip : Clip) => void
  onClickAway : (clip : Clip) => void
  onTrackChange : (e : React.MouseEvent<HTMLDivElement,MouseEvent>,rect : DOMRect,track : Track,clip : Clip) => void
  setClip : (clip : Clip) => void
}

interface IState {
  start : TimelinePosition
  end : TimelinePosition
  startLimit : TimelinePosition | null
  endLimit : TimelinePosition | null
  loopEnd : TimelinePosition
  keepSelection : boolean
  isDragging : boolean
  isResizing : boolean
  isLooping : boolean
  tempLoopContainerWidth : number
  tempRepititionWidth : number
  prevLoopEnd : TimelinePosition
  prevX : number
  resizeDir : string
  anchorEl : HTMLElement | null
  guideLineMargins : number[]
}

export enum TrackChangeMode { Top, Bottom }

export interface Clip {
  id : ID
  start : TimelinePosition
  end : TimelinePosition
  startLimit : TimelinePosition | null
  endLimit : TimelinePosition | null
  loopEnd : TimelinePosition
}

const ResizeHandleComponent : React.FC<{dir : string, width : number, isSelected : boolean}> = (props) => {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "100%",
        backgroundColor: "#000", 
        width: 10,
        borderRadius: props.dir === "left" ? "5px 0 0 5px" : "0 5px 5px 0",
        visibility: props.width > 25 && props.isSelected ? "visible" : "hidden"
      }}
    >
      <img src={props.dir==="left"?trimToRight:trimToLeft} style={{width:10}} onDragStart={e=>e.preventDefault()} />
    </div>
  )
}

class ClipComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  ref : React.RefObject<Rnd>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      start: this.props.clip.start,
      end: this.props.clip.end,
      startLimit: this.props.clip.startLimit,
      endLimit: this.props.clip.endLimit,
      loopEnd: this.props.clip.loopEnd,
      keepSelection: false,
      isDragging: false,
      isResizing: false,
      isLooping: false,
      tempLoopContainerWidth: 0,
      tempRepititionWidth: 0,
      prevLoopEnd: this.props.clip.loopEnd,
      prevX: 0,
      resizeDir: "none",
      anchorEl: null,
      guideLineMargins: []
    }
  }

  componentDidMount() {
    this.setState({prevX: this.state.start.toMargin(this.context!.timelinePosOptions)})
  }

  render() {
    const {timelinePosOptions, deleteClip} = this.context!

    const getLength = (pos1 : TimelinePosition = this.state.start, pos2 : TimelinePosition = this.state.end) => {
      return pos2.toMargin(timelinePosOptions) - pos1.toMargin(timelinePosOptions)
    }

    const onClickAway = () => {
      if (!this.state.keepSelection) {
        this.props.onClickAway(this.props.clip)
      }

      this.setState({keepSelection: false})
    }

    const getLoopContainerWidth = () => {
      if (this.state.isResizing || this.state.isLooping)
        return this.state.tempLoopContainerWidth

      return getLength(this.state.end, this.state.loopEnd)
    }

    const getMaxWidth = () => {
      if (this.state.resizeDir === "right") {
        return this.state.endLimit ? getLength(this.state.start, this.state.endLimit) : "none"
      }

      return this.state.startLimit ? getLength(this.state.startLimit, this.state.end) : "none"
    }

    const getNumRepititions = (repititionWidth : number) => {
      if (repititionWidth)
        return Math.ceil(getLoopContainerWidth() / repititionWidth)

      return 0
    }

    const getRepititionWidth = () => {
      if (this.state.isResizing)
        return this.state.tempRepititionWidth

      return getLength()
    }

    const onDrag = (e : DraggableEvent, data : DraggableData) => {
      const rect = (this.ref.current?.draggable as Draggable).props.nodeRef?.current?.getBoundingClientRect()
      this.props.onTrackChange(e as React.MouseEvent<HTMLDivElement, MouseEvent>, rect!, this.props.track, this.props.clip)

      const newGuidlineMargins = [data.x, data.x + getLength()]

      if (getLoopContainerWidth()) 
        newGuidlineMargins.push(data.x + getLength() + getLoopContainerWidth())
        
      this.setState({guideLineMargins: newGuidlineMargins})
    }

    const onDragStop = (e : DraggableEvent, data : DraggableData) => {
      if (data.x === this.state.prevX) {
        this.setState({isDragging: false})
        return
      }

      let start = TimelinePosition.fromPos(TimelinePosition.start)
      let end = TimelinePosition.fromPos(this.state.end)
      let startLimit = this.state.startLimit ? TimelinePosition.fromPos(this.state.startLimit) : null
      let endLimit = this.state.endLimit ? TimelinePosition.fromPos(this.state.endLimit) : null
      let loopEnd = TimelinePosition.fromPos(this.state.loopEnd)

      let {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(data.x), timelinePosOptions)
      const widthMBF = TimelinePosition.fromWidth(getLength(), timelinePosOptions)
      const loopEndMBF = TimelinePosition.fromWidth(getLength(this.state.end, this.state.loopEnd), timelinePosOptions)

      if (this.state.startLimit) {
        const startLimitMBF = TimelinePosition.fromWidth(getLength(this.state.startLimit, this.state.start), timelinePosOptions)
        startLimit = start.subtract(startLimitMBF.measures, startLimitMBF.beats, startLimitMBF.fraction, false, timelinePosOptions, false)
      }

      if (this.state.endLimit) {
        const endLimitMBF = TimelinePosition.fromWidth(getLength(this.state.start, this.state.endLimit), timelinePosOptions)
        endLimit = start.add(endLimitMBF.measures, endLimitMBF.beats, endLimitMBF.fraction, false, timelinePosOptions, false)
      }
      
      start.add(measures, beats, fraction, true, timelinePosOptions) 
      end = start.add(widthMBF.measures, widthMBF.beats, widthMBF.fraction, false, timelinePosOptions, false)
      
      if (this.state.end.compare(this.state.loopEnd) >= 0) {
        loopEnd.setPos(end)
        this.setState({prevLoopEnd: loopEnd})
      } else {
        loopEnd = end.add(loopEndMBF.measures, loopEndMBF.beats, loopEndMBF.fraction, false, timelinePosOptions, false)
      }

      this.setState({start, end, startLimit, endLimit, loopEnd, prevX: data.x, isDragging: false}, setClip)
    }

    const onLoop = (e : MouseEvent | TouchEvent, direction : string, ref : HTMLElement, delta : ResizableDelta, position : Position) => {
      this.setState({
        tempLoopContainerWidth: ref.offsetWidth, 
        guideLineMargins: [this.state.end.toMargin(timelinePosOptions) + ref.offsetWidth]
    })
    }

    const onLoopStop = (e : MouseEvent | TouchEvent, direction : string, ref : HTMLElement, delta : ResizableDelta, position : Position) => {
      let loopEnd = TimelinePosition.fromPos(this.state.loopEnd)
      let {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(delta.width), timelinePosOptions)

      if (delta.width < 0)
        loopEnd = loopEnd.subtract(measures, beats, fraction, true, timelinePosOptions)
      else
        loopEnd = loopEnd.add(measures, beats, fraction, true, timelinePosOptions)

      if (loopEnd.compare(this.state.end) < 0)
        loopEnd = TimelinePosition.fromPos(this.state.end)

      if (delta.width === 0) {
        this.setState({isLooping: false})
        return
      }

      this.setState({loopEnd, isLooping: false}, setClip)
    }

    const onResizeStart = (e : React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>, dir : string, ref : HTMLElement) => {
      selectClip()

      this.setState({
        tempLoopContainerWidth: getLength(this.state.start, this.state.loopEnd) - ref.offsetWidth,
        tempRepititionWidth: ref.offsetWidth,
        isResizing: true,
        resizeDir: dir
      })
    }

    const onResize = (e : MouseEvent | TouchEvent, direction : string, ref : HTMLElement, delta : ResizableDelta, position : Position) => {
      let tempLoopContainerWidth = 0 
      let guidelineMargins

      if (direction === "right") {
        const end = TimelinePosition.fromPos(this.state.end)
        const {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(delta.width), timelinePosOptions)
  
        if (delta.width < 0)
          end.subtract(measures, beats, fraction, true, timelinePosOptions, false)
        else
          end.add(measures, beats, fraction, true, timelinePosOptions, false)
  
        if (end.compare(this.state.loopEnd) >= 0 || this.state.prevLoopEnd.compare(this.state.loopEnd) === 0) {
          this.setState({loopEnd: end, prevLoopEnd: end})
        } else {
          tempLoopContainerWidth = getLength(this.state.start, this.state.loopEnd) - ref.offsetWidth
        }
        
        guidelineMargins = [position.x + ref.offsetWidth]
      } else {
        tempLoopContainerWidth = getLength(this.state.end, this.state.loopEnd)
        guidelineMargins = [position.x]
      }
    
      this.setState({tempLoopContainerWidth, tempRepititionWidth: ref.offsetWidth, guideLineMargins: guidelineMargins})
    }

    const onResizeStop = (e : MouseEvent | TouchEvent, direction : string, ref : HTMLElement, delta : ResizableDelta, position : Position) => {
      let start = TimelinePosition.fromPos(this.state.start)
      let end = TimelinePosition.fromPos(this.state.end)
      let loopEnd = TimelinePosition.fromPos(this.state.loopEnd)
      let prevEnd = TimelinePosition.fromPos(this.state.prevLoopEnd)
      
      let {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(delta.width), timelinePosOptions)

      switch (direction) {
        case "left":
          if (delta.width < 0)
            start.add(measures, beats, fraction, true, timelinePosOptions)
          else
            start.subtract(measures, beats, fraction, true, timelinePosOptions)
            
          break
        case "right":
          if (delta.width < 0)
            end.subtract(measures, beats, fraction, true, timelinePosOptions)
          else
            end.add(measures, beats, fraction, true, timelinePosOptions)

          if (end.compare(this.state.loopEnd) >= 0 || this.state.prevLoopEnd.compare(this.state.loopEnd) === 0) {
            loopEnd.setPos(end)
            prevEnd.setPos(end)
          }

          break
      }

      if (end.compare(start) <= 0 || delta.width === 0) {
        this.setState({isResizing: false})
        return
      }

      this.setState({start, end, isResizing: false, loopEnd, prevLoopEnd: prevEnd, resizeDir: "none"}, setClip)
    }

    const selectClip = () => {
      this.props.onSelect(this.props.clip)
    }

    const setClip = () => {
      this.props.setClip({
        id: this.props.clip.id, 
        start: this.state.start, 
        end: this.state.end, 
        startLimit: this.state.startLimit, 
        endLimit: this.state.endLimit, 
        loopEnd: this.state.loopEnd
      })
    }

    return (
      <ClipboardContext.Consumer>
        {clipboard => {
          return (
            <ClickAwayListener onClickAway={onClickAway}>
              <Rnd
                ref={this.ref}
                dragAxis="x"
                bounds="parent"
                enableUserSelectHack
                position={{x: this.state.start.toMargin(timelinePosOptions), y: 0}}
                size={{width: getLength(), height: "100%"}}
                maxWidth={getMaxWidth()}
                onDragStart={(e, data) => {selectClip(); this.setState({isDragging: true})}}
                onDrag={onDrag}
                onDragStop={onDragStop}
                enableResizing={{left: true, right: true}}
                onResizeStart={onResizeStart}
                onResize={onResize}
                onResizeStop={onResizeStop}
                resizeHandleStyles={{left: {left: -1}, right: {right: -1}}}
                resizeHandleComponent={{
                  left: <ResizeHandleComponent width={getLength()} isSelected={this.props.isSelected} dir="left" />,
                  right: <ResizeHandleComponent width={getLength()} isSelected={this.props.isSelected} dir="right" />
                }}
                style={{
                  backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 20),
                  border: "1px solid #0002",
                  borderRadius: 5,
                  zIndex: this.props.isSelected ? 10 : 9
                }}
              >
                <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
                  <div style={{width: "100%", height: "100%"}}></div>
                </AnywhereClickAnchorEl>
                {
                  (this.state.isDragging || this.state.isResizing || this.state.isLooping) &&
                  this.state.guideLineMargins.map((m, idx) => <GuideLine key={idx} margin={m} />)
                }
                <Menu
                  className="p-0"
                  anchorEl={this.state.anchorEl}
                  open={Boolean(this.state.anchorEl)}
                  onClose={() => this.setState({anchorEl: null})}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => this.setState({anchorEl: null})}
                >
                  <MenuList className="p-0" dense style={{outline: "none"}}>
                    <MenuItem onClick={e => {
                      clipboard?.copy({item: this.props.clip, type: ClipboardItemType.Clip, container: this.props.track.id})
                      deleteClip(this.props.clip)
                    }}>
                      <MenuIcon icon={<ContentCut />} />
                      <ListItemText>Cut</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={e => clipboard?.copy({item: this.props.clip, type: ClipboardItemType.Clip, container: this.props.track.id})}>
                      <MenuIcon icon={<ContentCopy />} />
                      <ListItemText>Copy</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={e => deleteClip(this.props.clip)}>
                      <MenuIcon icon={<Delete />} />
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </MenuList>
                </Menu>
                <Rnd
                  className="clip-loop-container pe-none"
                  disableDragging={true}
                  size={{width: getLoopContainerWidth(), height: "100%"}}
                  minWidth={0}
                  enableResizing={{right: true}}
                  onResize={onLoop}
                  onResizeStart={() => {selectClip(); this.setState({isLooping: true})}}
                  onResizeStop={onLoopStop}
                  resizeHandleStyles={{right: {right: 0}}}
                  resizeHandleComponent={{
                    right: (
                      <div style={{height: "100%", display: "flex", flexDirection: "column", width: 10}}>
                        <div 
                          className="d-flex justify-content-center align-items-center" 
                          style={{
                            height: 10, 
                            backgroundColor: "#777", 
                            pointerEvents: "auto", 
                            zIndex: 11,
                            visibility: this.props.isSelected && getLength() > 25 ? "visible" : "hidden"
                          }}
                        >
                          <FontAwesomeIcon icon={faRedo} style={{color: "#fff", fontSize: 10, padding: 1}} />
                        </div>
                        <div style={{flex: 1, width: "100%"}}></div>
                      </div>
                    )
                  }}
                  style={{zIndex: 11, backgroundColor: this.state.isLooping || this.state.isResizing ? "#0002": "#0000"}}
                >
                  <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
                    <div className="pe-auto d-flex col-12 h-100 overflow-hidden">
                      {
                        [...Array(getNumRepititions(getRepititionWidth()))].map((_, i) => (
                          <div 
                            key={i} 
                            style={{
                              width: getRepititionWidth(), 
                              flexShrink: 0, 
                              height: "100%", 
                              backgroundColor: this.props.isSelected ? "#fffc" : shadeColor(this.props.track.color, 40),
                              borderRadius: 5,
                              border: "1px solid #0002"
                            }}
                          ></div>  
                        ))
                      }
                    </div>
                  </AnywhereClickAnchorEl>
                </Rnd>
              </Rnd>
            </ClickAwayListener>
          )
        }}
      </ClipboardContext.Consumer>
    )
  }
}

export default React.memo(ClipComponent)