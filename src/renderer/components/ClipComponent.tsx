import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { BAR_WIDTH, shadeColor } from "renderer/utils";
import { Track } from "./TrackComponent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight, faRedo } from "@fortawesome/free-solid-svg-icons";
import trimToLeft from "../../../assets/svg/trim-to-left.svg"
import trimToRight from "../../../assets/svg/trim-to-right.svg"
import { minWidth } from "@mui/system";
import { SnapSize } from "renderer/types/types";

interface IProps {
  clip : Clip
  track : Track
  isSelected? : boolean
  onSelect : () => void
}

interface IState {
  start : TimelinePosition,
  end : TimelinePosition,
  startLimit : TimelinePosition,
  endLimit : TimelinePosition,
  loopEnd : TimelinePosition,
  isResizing : boolean,
  isDragging : boolean,
  isLooping : boolean,
  resizeMode : ResizeMode,
  prevX : number
}

enum ResizeMode { Start, End }

export class Clip {
  idx : number
  start : TimelinePosition
  end : TimelinePosition
  startLimit : TimelinePosition
  endLimit : TimelinePosition
  loopEnd : TimelinePosition

  constructor(idx : number, start : TimelinePosition, end : TimelinePosition, originalStart : TimelinePosition, originalEnd : TimelinePosition, loopEnd : TimelinePosition | null = null) {
    this.idx = idx
    this.start = start
    this.end = end
    this.startLimit = originalStart
    this.endLimit = originalEnd
    this.loopEnd = loopEnd || TimelinePosition.fromPos(end)
  }
}

export default class ClipComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private clipRef : React.RefObject<HTMLDivElement>
  private loopRef : React.RefObject<HTMLDivElement>

  constructor(props : any) {
    super(props)

    this.clipRef = React.createRef()
    this.loopRef = React.createRef()
    
    this.state = {
      start: this.props.clip.start,
      end: this.props.clip.end,
      isResizing : false,
      isDragging : false,
      isLooping : false,
      resizeMode: ResizeMode.Start,
      startLimit: this.props.clip.startLimit,
      endLimit: this.props.clip.endLimit,
      loopEnd: this.props.clip.loopEnd,
      prevX : 0
    }
  }

  componentDidMount() {
  }

  render() {
    const {horizontalScale, timelinePosOptions} = this.context!

    const getLength = (pos1 : TimelinePosition = this.state.start, pos2 : TimelinePosition = this.state.end) => {
      return pos2.toMargin(timelinePosOptions) - pos1.toMargin(timelinePosOptions)
    }
  
    const getNumRepititions = () => {
      const width = getLength(this.state.end, this.state.loopEnd!)
      
      if (Math.ceil(width / getLength()) > 0)
        return Math.ceil(width / getLength())
      else return 0
    }
  
    const onMouseMove = (e : React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
      let start = TimelinePosition.fromPos(this.state.start)
      let end = TimelinePosition.fromPos(this.state.end)
      let loopEnd = TimelinePosition.fromPos(this.state.loopEnd)
      let startLimit = TimelinePosition.fromPos(this.state.startLimit)
      let endLimit = TimelinePosition.fromPos(this.state.endLimit)
      let prevX = this.state.prevX
      
      if (this.state.isDragging) {
        let xDiff = (e.clientX - this.state.prevX) * Math.min((0.0556 * Math.abs(e.movementX) + 0.95), 1.3)
  
        const {measures, bars, fraction} = TimelinePosition.fromWidth(Math.abs(xDiff), timelinePosOptions)
        const prevNewStart = TimelinePosition.fromPos(start)
  
        const widthMBF = TimelinePosition.fromWidth(getLength(), timelinePosOptions)
        const loopEndMBF = TimelinePosition.fromWidth(
          getLength(this.state.end, this.state.loopEnd!), 
          timelinePosOptions
        )
        const startLimitMBF = TimelinePosition.fromWidth(
          getLength(this.state.startLimit!, this.state.start), 
          timelinePosOptions
        )

        const posOptionsWOSnap : TimelinePositionOptions = {...timelinePosOptions, snapSize: SnapSize.None}
  
        if (xDiff < 0) {
          start.subtract(measures, bars, fraction, true, timelinePosOptions)
          end = start.add(widthMBF.measures, widthMBF.bars, widthMBF.fraction, false, posOptionsWOSnap)
          loopEnd = end.add(loopEndMBF.measures, loopEndMBF.bars, loopEndMBF.fraction, false, posOptionsWOSnap)
          startLimit = start.subtract(startLimitMBF.measures, startLimitMBF.bars, startLimitMBF.fraction, false, posOptionsWOSnap)
        } else {
          start.add(measures, bars, fraction, true, timelinePosOptions)
          end = start.add(widthMBF.measures, widthMBF.bars, widthMBF.fraction, false, posOptionsWOSnap)
          loopEnd = end.add(loopEndMBF.measures, loopEndMBF.bars, loopEndMBF.fraction, false, posOptionsWOSnap)
          startLimit = start.subtract(startLimitMBF.measures, startLimitMBF.bars, startLimitMBF.fraction, false, posOptionsWOSnap)
        }
  
        if (prevNewStart.compare(start) !== 0)
          prevX = e.clientX
  
        if (start.compare(TimelinePosition.start) < 0) {
          start = TimelinePosition.fromPos(TimelinePosition.start)
          end = start.add(widthMBF.measures, widthMBF.bars, widthMBF.fraction, false, posOptionsWOSnap)
  
          if (loopEnd)
            loopEnd = end.add(loopEndMBF.measures, loopEndMBF.bars, loopEndMBF.fraction, false, posOptionsWOSnap)
        }
  
        this.setState({start, end, startLimit, endLimit, loopEnd, prevX})
      } else if (this.state.isResizing) {
        const x = this.state.resizeMode === ResizeMode.Start ? 
          this.clipRef.current!.getBoundingClientRect().x + 5 :
          this.clipRef.current!.getBoundingClientRect().x + this.clipRef.current!.offsetWidth - 5
  
        const xDiff = e.clientX - x
        const {measures, bars, fraction} = TimelinePosition.fromWidth(Math.abs(xDiff), timelinePosOptions)
  
        if (this.state.resizeMode === ResizeMode.Start) {
          if (xDiff < 0)
            start.subtract(measures, bars, fraction, true, timelinePosOptions)
          else  
            start.add(measures, bars, fraction, true, timelinePosOptions)
  
          if (start.compare(this.state.end) >= 0)
            return
  
          if (start.compare(this.state.startLimit) < 0) {
            start = TimelinePosition.fromPos(this.state.startLimit)
          }
  
          this.setState({start})
        } else if (this.state.resizeMode === ResizeMode.End) {
          if (xDiff < 0) {
            if (end.compare(this.state.loopEnd!) === 0) {
              loopEnd.subtract(measures, bars, fraction, true, timelinePosOptions)
            }
  
            end.subtract(measures, bars, fraction, true, timelinePosOptions)
          } else  
            end.add(measures, bars, fraction, true, timelinePosOptions)
  
          if (end.compare(this.state.start) <= 0)
            return
  
          if (end.compare(this.state.loopEnd!) > 0) {
            loopEnd = TimelinePosition.fromPos(end)
          }
  
          this.setState({end, loopEnd})
        }
      } else if (this.state.isLooping) {
        const x = this.loopRef.current!.getBoundingClientRect().x + this.loopRef.current!.offsetWidth
        const xDiff = e.clientX - x
        const {measures, bars, fraction} = TimelinePosition.fromWidth(Math.abs(xDiff), timelinePosOptions)
  
        if (xDiff < 0) {
          loopEnd?.subtract(measures, bars, fraction, true, timelinePosOptions)
  
          if (loopEnd!.compare(this.state.end) < 0)
            loopEnd = TimelinePosition.fromPos(this.state.end)
        } else  
          loopEnd?.add(measures, bars, fraction, true, timelinePosOptions)
  
        this.setState({loopEnd})
      }
    }
  
    const setResizeMode = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, mode : ResizeMode) => {
      e.stopPropagation()
      this.setState({isResizing: true, resizeMode: mode})
    }

    return (
      <div 
        ref={this.clipRef}
        onMouseUp={e => this.setState({isResizing: false, isDragging: false, isLooping: false})}
        onMouseDown={e => {this.props.onSelect(); this.setState({prevX: e.clientX, isDragging: true})}}
        onMouseLeave={e => this.setState({isResizing: false, isDragging: false, isLooping: false})}
        onMouseMove={onMouseMove}
        style={{
          width: getLength() + 1, 
          height: "100%", 
          backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 20), 
          position: "absolute", 
          left: this.state.start.toMargin(timelinePosOptions), 
          cursor: "pointer",
          borderRadius: 5,
          zIndex: this.props.isSelected ? 300 : 100,
          transition: "background-color 0.25s ease"
        }}
        onDragStart={e => e.preventDefault()}
      >
        {
          (this.state.isResizing || this.state.isDragging || this.state.isLooping) &&
          <div 
            style={{
              position: "absolute", 
              top: 0, 
              bottom: 0, 
              width: "300%", 
              left: "50%",
              transform: "translate(-50%, 0%)",
              zIndex: -500,
              minWidth: 500
            }}
          >
          </div>
        }
        {
          this.props.isSelected &&
          <div className="disable-highlighting" style={{borderRadius: "inherit"}}>
            <div
              onMouseDown={e => setResizeMode(e, ResizeMode.Start)}
              className="position-absolute d-flex justify-content-center align-items-center p-0"
              style={{
                left: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "#000",
                width: getLength() < 25 ? 2 : 11,
                padding: getLength() < 25 ? 0 : 6,
                cursor: "col-resize",
                borderRadius: "5px 0 0 5px",
                border: "none",
              }}
            >
              {
                getLength() >= 25 ?
                <img src={trimToRight} style={{width: 11, height: 11}} onDragStart={e => e.preventDefault()} /> : 
                <div 
                  className="position-absolute" 
                  style={{left: 0, top: 0, bottom: 0, width: 7, backgroundColor: "#0000"}}
                >

                </div>
              }
            </div>
            <div
              onMouseDown={e => setResizeMode(e, ResizeMode.End)}
              className="position-absolute d-flex justify-content-center align-items-center p-0"
              style={{
                right: 0,
                top: 0,
                bottom: 0,
                backgroundColor: "#000",
                width: getLength() < 25 ? 2 : 11,
                padding: getLength() < 25 ? 0 : 6,
                cursor: "col-resize",
                borderRadius: "0 0 5px 0",
                border: "none"
              }}
            >
              {
                getLength() >= 25 ?
                <img src={trimToLeft} style={{width: 11, height: 11}} onDragStart={e => e.preventDefault()} /> : 
                <div 
                  className="position-absolute" 
                  style={{left: 0, top: 0, bottom: 0, width: 7, backgroundColor: "#0000"}}
                >
                </div>
              }
            </div>
            <div
              onMouseDown={e => {e.stopPropagation(); this.setState({isLooping: true})}}
              style={{
                position: "absolute",
                top: -6,
                right: -getLength(this.state.end, this.state.loopEnd!) + 
                ((this.state.end.compare(this.state.loopEnd) === 0 && getLength() < 25) ? 2 : 0),
                width: 11,
                padding: "0 1px",
                backgroundColor: "#0000",
                zIndex: 200,
                cursor: "ew-resize"
              }}
            >
              {
                this.state.end.compare(this.state.loopEnd) === 0 && getLength() < 10 ?
                <div 
                  className="p-0 m-0"
                  style={{height: 20, width: 7, backgroundColor: "#0000"}}
                >
                </div> :
                <FontAwesomeIcon 
                  icon={faRedo} 
                  style={{
                    fontSize: 9, 
                    color: this.state.end.compare(this.state.loopEnd) === 0 && getLength() < 25 ? "#aaa" : "#fff"
                  }} 
                  className="p-0 m-0" 
                  onDragStart={e => e.preventDefault()}
                />
              }
            </div>
          </div>
        }
        <div className="position-absolute" style={{top: 0, bottom: 0, left: getLength() + 1, zIndex: -100}}>
          <div 
            ref={this.loopRef}
            className="d-flex"
            style={{
              width: getLength(this.state.end, this.state.loopEnd!), 
              height: "100%", 
              overflowX: "hidden"
            }}
          >
            {
              [...Array(getNumRepititions())].map((_, i) => (
                <div 
                  key={i}
                  style={{
                    height: "100%",
                    width: getLength(),
                    backgroundColor: this.props.isSelected ? "#000" : shadeColor(this.props.track.color, -20),
                    borderRadius: 10,
                    flexShrink: 0
                  }}
                >
                </div>
              ))
            }
          </div>
          {
            this.state.isLooping &&
            <div 
              style={{
                position: "absolute",
                width: 250 * horizontalScale,
                height: "100%",
                top: 0,
                right: -(250 * horizontalScale),
                backgroundColor: "#0000",
                zIndex: -600
              }}
            >
            </div>
          }
        </div>
      </div>
    )
  }
}