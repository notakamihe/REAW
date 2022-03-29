import { FastForward, FastRewind, FiberManualRecord, Loop, PlayArrow, Redo, Save, SkipNext, SkipPrevious, Stop, Undo } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapGridSize } from "renderer/types/types";
import Holdable from "./Holdable";
import styled from "styled-components"
import { NumberInput, SelectSpinBox } from "./ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnet } from "@fortawesome/free-solid-svg-icons";
import Metronome from "./Metronome";

const PlaybackControlButton = styled(IconButton)`
background-color: #0000;
border-radius: 0!important;
padding: 2px!important;

&:hover {
  background-color: var(--bg4);
  transition: background-color 0.2s ease-in-out;
}
`


enum SnapSizeOption {
  None,
  Auto,
  Measure,
  HalfMeasure,
  Beat,
  HalfBeat,
  QuarterBeat,
  EighthBeat,
  SixteenthBeat,
  ThirtySecondBeat,
  SixtyFourthBeat,
  HundredTwentyEighthBeat
}
  
interface IProps {
}

interface IState {
  noteValue : number
  showTime : boolean
  tempoInput : string
  snapSizeOptionValue : SnapSizeOption
}


export default class Header extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props: IProps) {
    super(props)

    this.state = {
      noteValue: 1,
      showTime: false,
      tempoInput: "",
      snapSizeOptionValue: SnapSizeOption.None
    }

    this.fastForward = this.fastForward.bind(this)
    this.fastRewind = this.fastRewind.bind(this)
    this.onChangeNoteValue = this.onChangeNoteValue.bind(this)
    this.onChangeSnapSizeOption = this.onChangeSnapSizeOption.bind(this)
    this.onChangeTempo = this.onChangeTempo.bind(this)
    this.stop = this.stop.bind(this)
  }

  componentDidMount() {
    this.setState({
      noteValue: this.context!.timeSignature.noteValue,
      tempoInput: this.context!.tempo.toString(),
      snapSizeOptionValue: this.getOptionBySnapSize()
    })
  }

  fastForward() {
    let newPos = TimelinePosition.fromPos(this.context!.cursorPos)
    newPos.add(0, 0, 250, true, this.context!.timelinePosOptions, false)
    this.context!.setCursorPos(newPos)
  }

  fastRewind() {
    let newPos = TimelinePosition.fromPos(this.context!.cursorPos)
    newPos.subtract(0, 0, 250, true, this.context!.timelinePosOptions)

    if (newPos.compare(TimelinePosition.start) < 0)
      newPos = TimelinePosition.fromPos(TimelinePosition.start)
    
    this.context!.setCursorPos(newPos)
  }

  getOptionBySnapSize = () => {
    if (this.context?.autoSnap)
      return SnapSizeOption.Auto

    switch (this.context?.snapGridSize) {
      case SnapGridSize.Measure: return SnapSizeOption.Measure
      case SnapGridSize.HalfMeasure: return SnapSizeOption.HalfMeasure
      case SnapGridSize.Beat: return SnapSizeOption.Beat
      case SnapGridSize.HalfBeat: return SnapSizeOption.HalfBeat
      case SnapGridSize.QuarterBeat: return SnapSizeOption.QuarterBeat
      case SnapGridSize.EighthBeat: return SnapSizeOption.EighthBeat
      case SnapGridSize.SixteenthBeat: return SnapSizeOption.SixteenthBeat
      case SnapGridSize.ThirtySecondBeat: return SnapSizeOption.ThirtySecondBeat
      case SnapGridSize.SixtyFourthBeat: return SnapSizeOption.SixtyFourthBeat
      case SnapGridSize.HundredTwentyEighthBeat: return SnapSizeOption.HundredTwentyEighthBeat
      default: return SnapSizeOption.None
    }
  }

  onChangeNoteValue = (value : string | number) => {
    const val = Number(value)

    this.setState({noteValue: val})
    this.context!.setTimeSignature({...this.context!.timeSignature, noteValue: val})
  }

  onChangeSnapSizeOption(value : string | number) {
    const val = Number(value) as SnapSizeOption
    
    this.setState({snapSizeOptionValue: val})

    if (val === SnapSizeOption.Auto) {
      this.context!.setAutoSnap(true)
    } else {
      this.context!.setAutoSnap(false)

      switch (val) {
        case SnapSizeOption.None: 
          this.context!.setSnapGridSize(SnapGridSize.None) 
          break
        case SnapSizeOption.Measure:
          this.context!.setSnapGridSize(SnapGridSize.Measure)
          break
        case SnapSizeOption.HalfMeasure:
          this.context!.setSnapGridSize(SnapGridSize.HalfMeasure)
          break
        case SnapSizeOption.Beat:
          this.context!.setSnapGridSize(SnapGridSize.Beat)
          break
        case SnapSizeOption.HalfBeat:
          this.context!.setSnapGridSize(SnapGridSize.HalfBeat)
          break
        case SnapSizeOption.QuarterBeat:
          this.context!.setSnapGridSize(SnapGridSize.QuarterBeat)
          break
        case SnapSizeOption.EighthBeat:
          this.context!.setSnapGridSize(SnapGridSize.EighthBeat)
          break
        case SnapSizeOption.SixteenthBeat:
          this.context!.setSnapGridSize(SnapGridSize.SixteenthBeat)
          break
        case SnapSizeOption.ThirtySecondBeat:
          this.context!.setSnapGridSize(SnapGridSize.ThirtySecondBeat)
          break
        case SnapSizeOption.SixtyFourthBeat:
          this.context!.setSnapGridSize(SnapGridSize.SixtyFourthBeat)
          break
        case SnapSizeOption.HundredTwentyEighthBeat:
          this.context!.setSnapGridSize(SnapGridSize.HundredTwentyEighthBeat)
          break
      }
    }
  }

  onChangeTempo(value : number) {
    const masterTrack = this.context!.tracks.find(t => t.isMaster)
    
    if (masterTrack) {
      const automationLanes = masterTrack.automationLanes
      const tempoLaneIndex = automationLanes.findIndex(l => l.isTempo)
      
      if (tempoLaneIndex > -1) {
        if (automationLanes[tempoLaneIndex].nodes.length === 1) {
          automationLanes[tempoLaneIndex].nodes[0].value = value
        }
      }
      
      this.context!.setTempo(value)
      this.context!.setTrack({...masterTrack, automationLanes})
    }
  }

  stop() {
    this.context!.setIsPlaying(false)
    this.context!.setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
  }

  render() {
    const {
      cursorPos, 
      setCursorPos,
      timeSignature, 
      setTimeSignature, 
      tempo, 
      isPlaying,
      setIsPlaying,
      isLooping,
      setIsLooping,
      isRecording,
      setIsRecording,
      timelinePosOptions
    } = this.context!

    const masterTrack = this.context!.tracks.find(t => t.isMaster)

    return (
      <div
        className="disable-highlighting d-flex"
        style={{
          width: "100%", 
          height: 45, 
          zIndex: 19, 
          backgroundColor: "var(--bg2)", 
          flexShrink: 0,
          position: "relative",
          borderBottom: "1px solid var(--border1)"
        }}
      >
        <div className="d-flex align-items-center p-2" style={{height: "100%"}}>
          <IconButton className="btn1 mx-1 h-btn1">
            <Undo style={{fontSize: 14, color: "var(--border7)"}} />
          </IconButton>
          <IconButton className="btn1 mx-1 h-btn1">
            <Redo style={{fontSize: 14, color: "var(--border7)"}} />
          </IconButton>
          <Metronome />
        </div>
        <div className="d-flex" style={{width: 280, height: "100%", borderLeft: "1px solid var(--border1)", borderRight: "1px solid var(--border1)"}}>
          <div style={{width: 82, height: "100%", borderRight: "1px solid var(--border1)"}}>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, transform: "translateY(1px)"}}
            >
              <NumberInput
                hoverStyle={{verticalContainer: {visibility: "visible"}}}
                min={1}
                max={16}
                onChange={(value) => setTimeSignature({...timeSignature, beats: value})}
                reverseDirection
                style={{
                  container: {width: 26, height: 18, backgroundColor: "#0000"},
                  incr: {backgroundColor: "#0000"},
                  incrIcon: {color: "var(--fg2)", fontSize: 20},
                  input: {fontWeight: "bold", color: "var(--fg1)"},
                  decr: {backgroundColor: "#0000"},
                  decrIcon: {color: "var(--fg2)", fontSize: 20},
                  verticalContainer: {visibility: "hidden"}
                }}
                value={timeSignature.beats}
                vertical
              />
              <span style={{fontSize: 14, color: "var(--fg1)", margin: "0 0 0 2px"}}>|</span>
              <SelectSpinBox
                enableOptions={false}
                hoverStyle={{buttonsContainer: {visibility: "visible"}}}
                onChange={this.onChangeNoteValue}
                style={{
                  buttonsContainer: {visibility: "hidden"},
                  container: {height: 18, width: 26, backgroundColor: "#0000", transform: "translateY(-1px)"},
                  next: {backgroundColor: "#0000"},
                  nextIcon: {color: "var(--fg2)", fontSize: 20},
                  prev: {backgroundColor: "#0000"},
                  prevIcon: {color: "var(--fg2)", fontSize: 20},
                  select: {fontWeight: "bold", textAlign: "center", transform: "translateY(-1px)", color: "var(--fg1)"},
                }}
                value={this.state.noteValue}
              >
                <option value={32}>32</option>
                <option value={16}>16</option>
                <option value={8}>8</option>
                <option value={4}>4</option>
                <option value={2}>2</option>
                <option value={1}>1</option>
              </SelectSpinBox>
            </div>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, textAlign: "center", padding: "0 2px", borderTop: "1px solid var(--border1)"}}
              title="Tempo"
            >
              {
                (masterTrack?.automationLanes.find(l => l.isTempo)?.nodes.length || 0) > 1 ?
                <p style={{margin: 0, fontSize: 14, fontWeight: "bold", color: "var(--fg1)", transform: "translateY(1px)"}}>Automated</p> :
                <NumberInput
                  hoverStyle={{verticalContainer: {visibility: "visible"}}}
                  min={10}
                  max={1000}
                  onChange={this.onChangeTempo}
                  style={{
                    container: {width: "100%", height: 18, backgroundColor: "#0000", marginTop: 2, flexDirection: "row-reverse"},
                    incr: {backgroundColor: "#0000"},
                    incrIcon: {color: "var(--fg2)", fontSize: 20},
                    input: {fontWeight: "bold", padding: 0, textAlign: "center", paddingRight: 10, color: "var(--fg1)"},
                    decr: {backgroundColor: "#0000"},
                    decrIcon: {color: "var(--fg2)", fontSize: 20},
                    verticalContainer: {visibility: "hidden"}
                  }}
                  typing
                  value={tempo}
                  vertical
                />
              }
            </div>
          </div>
          <div className="d-flex" style={{flex: 1}}>
            <div 
              onClick={() => this.setState({showTime: !this.state.showTime})}
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, cursor: "pointer", borderRight: "1px solid var(--border1)", backgroundColor: "var(--bg7)"}}
            >
              <h1 className="p-0 m-0" style={{fontSize: 18, textAlign: "center", fontWeight: 100, color: "var(--fg1)"}}>
                {
                  this.state.showTime ?
                  cursorPos.toTimeString(timelinePosOptions) :
                  cursorPos.toString()
                }
              </h1>
            </div>
            <div 
            style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column'}}>
              <div className="d-flex" style={{margin: 0, height: "50%", marginTop: -1}}>
                <PlaybackControlButton onClick={() => setIsPlaying(!isPlaying)}>  
                  <PlayArrow style={{fontSize: 17, color: isPlaying ? "var(--color1)" : "var(--fg1)"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={this.stop} >  
                  <Stop style={{fontSize: 17, color: "var(--fg1)"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsRecording(!isRecording)}>  
                  <FiberManualRecord style={{fontSize: 17, color: isRecording ? "var(--color1)" : "var(--fg1)"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsLooping(!isLooping)}> 
                  <Loop style={{fontSize: 17, color: isLooping ? "var(--color1)" : "var(--fg1)"}} />
                </PlaybackControlButton>
              </div>
              <div className="d-flex" style={{margin: 0, height: "50%", borderTop: "1px solid var(--border1)"}}>
                <PlaybackControlButton 
                  onClick={() => setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))} 
                > 
                  <SkipPrevious style={{fontSize: 17, color: "var(--fg1)"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => {}}> 
                  <SkipNext style={{fontSize: 17, color: "var(--fg1)"}} />
                </PlaybackControlButton>
                <Holdable timeout={500} interval={250} onMouseDown={this.fastForward} onHold={this.fastForward}>
                  <PlaybackControlButton> 
                    <FastForward style={{fontSize: 17, color: "var(--fg1)"}} />
                  </PlaybackControlButton>
                </Holdable>
                <Holdable timeout={500} interval={250} onMouseDown={this.fastRewind} onHold={this.fastRewind}>
                  <PlaybackControlButton> 
                    <FastRewind style={{fontSize: 17, color: "var(--fg1)"}} />
                  </PlaybackControlButton>
                </Holdable>
              </div>
            </div>
          </div>
        </div>
        <div className="p-2 d-flex align-items-center" style={{width: 275, height: "100%"}}>
          <SelectSpinBox
            classes={{container: "rb-spin-buttons rounded"}}
            icon={<FontAwesomeIcon icon={faMagnet} style={{fontSize: 10, transform: "translateY(1px)", color: "var(--fg1)"}} />}
            onChange={this.onChangeSnapSizeOption}
            style={{
              container: {height: 25, width: 130, padding: 2, border: "1px solid var(--fg1)", backgroundColor: "#0000"},
              next: {backgroundColor: "#0000"},
              nextIcon: {color: "var(--fg2)", fontSize: 20},
              prev: {backgroundColor: "#0000"},
              prevIcon: {color: "var(--fg2)", fontSize: 20},
              select: {marginLeft: 4, color: "var(--fg1)"},
            }}
            value={this.state.snapSizeOptionValue}
          >
            <option value={SnapSizeOption.None}>None</option>
            <option value={SnapSizeOption.Auto}>Auto</option>
            <option value={SnapSizeOption.Measure}>Measure</option>
            <option value={SnapSizeOption.HalfMeasure}>1/2 Measure</option>
            <option value={SnapSizeOption.Beat}>Beat</option>
            <option value={SnapSizeOption.HalfBeat}>1/2 Beat</option>
            <option value={SnapSizeOption.QuarterBeat}>1/4 Beat</option>
            <option value={SnapSizeOption.EighthBeat}>1/8 Beat</option>
            <option value={SnapSizeOption.SixteenthBeat}>1/16 Beat</option>
            <option value={SnapSizeOption.ThirtySecondBeat}>1/32 Beat</option>
            <option value={SnapSizeOption.SixtyFourthBeat}>1/64 Beat</option>
            <option value={SnapSizeOption.HundredTwentyEighthBeat}>1/128 Beat</option>
          </SelectSpinBox>
        </div>
      </div>
    )
  }
}