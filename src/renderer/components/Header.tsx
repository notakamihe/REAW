import { FastForward, FastRewind, FiberManualRecord, Loop, PlayArrow, SkipNext, SkipPrevious, Stop } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapSize } from "renderer/types/types";
import Holdable from "./Holdable";
import styled from "styled-components"
import metronomeIcon from "../../../assets/svg/metronome.svg"
import metronomeIconPink from "../../../assets/svg/metronome-pink.svg"
import { EditableDisplay } from "./ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnet } from "@fortawesome/free-solid-svg-icons";
import SelectSpinBox, { SelectSpinBoxOption } from "./ui/SelectSpinBox";

interface IProps {
}

interface IState {
  beatInput : string
  noteValueInput : string
  tempoInput : string
  showTime : boolean
  optionIdx : number
}

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

interface PlaybackControlButtonProps {
  isactivated : boolean
  activatedbgcolor? : string
}

const PlaybackControlButton = styled(IconButton)`
  background-color: ${(props : PlaybackControlButtonProps) => props.isactivated ? props.activatedbgcolor || "#ff5db8!important" : "#333!important"};
  border-radius: 0!important;
  border-width: 1px!important;
  border-color: #555!important;
  border-style: solid!important;
  padding: 2px!important;

  &:active {
    background-color: #ff6db8!important;
  }
`

export default class Header extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  options = [
    {value: SnapSizeOption.None, label: "None"},
    {value: SnapSizeOption.Auto, label: "Auto"},
    {value: SnapSizeOption.Measure, label: "Measure"},
    {value: SnapSizeOption.HalfMeasure, label: "1/2 Measure"},
    {value: SnapSizeOption.Beat, label: "Beat"},
    {value: SnapSizeOption.HalfBeat, label: "1/2 Beat"},
    {value: SnapSizeOption.QuarterBeat, label: "1/4 Beat"},
    {value: SnapSizeOption.EighthBeat, label: "1/8 Beat"},
    {value: SnapSizeOption.SixteenthBeat, label: "1/16 Beat"},
    {value: SnapSizeOption.ThirtySecondBeat, label: "1/32 Beat"},
    {value: SnapSizeOption.SixtyFourthBeat, label: "1/64 Beat"},
    {value: SnapSizeOption.HundredTwentyEighthBeat, label: "1/128 Beat"}
  ]

  constructor(props: IProps) {
    super(props)

    this.state = {
      beatInput: "",
      noteValueInput: "",
      tempoInput: "",
      showTime: false,
      optionIdx: 0
    }
  }

  componentDidMount() {
    this.setState({
      beatInput: this.context!.timeSignature.beats.toString(), 
      noteValueInput: this.context!.timeSignature.noteValue.toString(),
      tempoInput: this.context!.tempo.toString(),
      optionIdx: this.getOptionIdxBySnapSize()
    })
  }

  getOptionIdxBySnapSize = () => {
    if (this.context?.autoSnap)
      return 1

    switch (this.context?.snapSize) {
      case SnapSize.None: return 0
      case SnapSize.Measure: return 2
      case SnapSize.HalfMeasure: return 3
      case SnapSize.Beat: return 4
      case SnapSize.HalfBeat: return 5
      case SnapSize.QuarterBeat: return 6
      case SnapSize.EighthBeat: return 7
      case SnapSize.SixteenthBeat: return 8
      case SnapSize.ThirtySecondBeat: return 9
      case SnapSize.SixtyFourthBeat: return 10
      case SnapSize.HundredTwentyEighthBeat: return 11
      default: return 0
    }
  }

  render() {
    const {
      cursorPos, 
      setCursorPos,
      timeSignature, 
      setTimeSignature, 
      autoSnap,
      setAutoSnap,
      snapSize,
      setSnapSize,
      tempo, 
      setTempo,
      isPlaying,
      setIsPlaying,
      isLooping,
      setIsLooping,
      isRecording,
      setIsRecording,
      timelinePosOptions,
      metronome,
      setMetronome
    } = this.context!

    const fastForward = () => {
      let newPos = TimelinePosition.fromPos(cursorPos)
      const newTimelinePosOptions = {...timelinePosOptions}

      newTimelinePosOptions.snapSize = SnapSize.None
      newPos.add(0, 0, 250, true, newTimelinePosOptions)

      setCursorPos(newPos)
    }
    
    const fastRewind = () => {
      let newPos = TimelinePosition.fromPos(cursorPos)
      const newTimelinePosOptions = {...timelinePosOptions}

      newTimelinePosOptions.snapSize = SnapSize.None
      newPos.subtract(0, 0, 250, true, newTimelinePosOptions)

      if (newPos.compare(TimelinePosition.start) < 0)
        newPos = TimelinePosition.fromPos(TimelinePosition.start)
      
      setCursorPos(newPos)
    }

    const onChange = (option : SelectSpinBoxOption<SnapSizeOption>) => {
      const idx = this.options.findIndex(o => o.value === option.value)
      this.setState({optionIdx: idx})
      setSnapSizeByOption(option)
    }

    const onNext = () => {
      const newIdx = Math.min(this.state.optionIdx + 1, this.options.length - 1)
      this.setState({optionIdx: newIdx})
      setSnapSizeByOption(this.options[newIdx])
    }

    const onPrev = () => {
      const newIdx = Math.max(this.state.optionIdx - 1, 0)
      this.setState({optionIdx: newIdx})
      setSnapSizeByOption(this.options[newIdx])
    }

    const onTimeSignatureBeatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value && parseInt(e.target.value) > 0) {
        console.log(timeSignature)
        const newTimeSignature = {...timeSignature, beats: parseInt(e.target.value)}
        setTimeSignature(newTimeSignature)
      }
    }

    const onTimeSignatureNoteValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value && parseInt(e.target.value) > 0) {
        const newTimeSignature = {...timeSignature, noteValue: parseInt(e.target.value)}
        setTimeSignature(newTimeSignature)
      }
    }

    const onTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.value && parseInt(e.target.value) > 0) {
        const newTempo = parseInt(e.target.value)
        setTempo(newTempo)
      }
    }

    const stop = () => {
      setIsPlaying(false)
      setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
    }

    const setSnapSizeByOption = (option : SelectSpinBoxOption<SnapSizeOption>) => {
      if (option.value === SnapSizeOption.Auto) {
        setAutoSnap(true)
      } else {
        setAutoSnap(false)

        switch (option.value) {
          case SnapSizeOption.None:
            setSnapSize(SnapSize.None)
            break
          case SnapSizeOption.Measure:
            setSnapSize(SnapSize.Measure)
            break
          case SnapSizeOption.HalfMeasure:
            setSnapSize(SnapSize.HalfMeasure)
            break
          case SnapSizeOption.Beat:
            setSnapSize(SnapSize.Beat)
            break
          case SnapSizeOption.HalfBeat:
            setSnapSize(SnapSize.HalfBeat)
            break
          case SnapSizeOption.QuarterBeat:
            setSnapSize(SnapSize.QuarterBeat)
            break
          case SnapSizeOption.EighthBeat:
            setSnapSize(SnapSize.EighthBeat)
            break
          case SnapSizeOption.SixteenthBeat:
            setSnapSize(SnapSize.SixteenthBeat)
            break
          case SnapSizeOption.ThirtySecondBeat:
            setSnapSize(SnapSize.ThirtySecondBeat)
            break
          case SnapSizeOption.SixtyFourthBeat:
            setSnapSize(SnapSize.SixtyFourthBeat)
            break
          case SnapSizeOption.HundredTwentyEighthBeat:
            setSnapSize(SnapSize.HundredTwentyEighthBeat)
            break
        }
      }
    }

    return (
      <div
        className="disable-highlighting d-flex"
        style={{
          width: "100%", 
          height: 70, 
          zIndex: 19, 
          backgroundColor: "#fff", 
          boxShadow: "0 1px 10px 1px #0007", 
          flexShrink: 0,
          position: "relative"
        }}
      >
        <div 
          className="d-flex" 
          style={{width: 275, backgroundColor: "#0001", height: "100%", flexDirection: "column"}}
        >
          <div className="d-flex" style={{backgroundColor: "#fff5", height: 25}}>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1}}
            >
              <EditableDisplay 
                value={this.state.beatInput} 
                style={{
                  fontSize: 14, 
                  width: 20, 
                  textAlign: "center", 
                  backgroundColor: "#0000", 
                  border: "none",
                  outline: "none",
                  height: 18
                }}
                onChange={e => {this.setState({beatInput: e.target.value}); onTimeSignatureBeatChange(e)}}
                focusedStyle={{backgroundColor: "#0001"}}
              />
              <span className="mx-1" style={{fontSize: 14}}>/</span>
              <EditableDisplay 
                value={this.state.noteValueInput}
                style={{
                  fontSize: 14, 
                  width: 20, 
                  textAlign: "center", 
                  backgroundColor: "#0000", 
                  border: "none",
                  outline: "none",
                  height: 18,
                  marginBottom: 3,
                }} 
                onChange={e => {this.setState({noteValueInput: e.target.value}); onTimeSignatureNoteValueChange(e)}}
                type="select"
                className="hide-dropdown-arrow"
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
              </EditableDisplay>
            </div>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, textAlign: "center"}}
              title="Tempo"
            >
              <EditableDisplay 
                value={this.state.tempoInput}
                style={{
                  fontSize: 14, 
                  maxWidth: 50, 
                  textAlign: "center", 
                  backgroundColor: "#0000", 
                  border: "none",
                  outline: "none",
                  height: 18
                }}
                type="number" 
                onChange={e => {this.setState({tempoInput: e.target.value}); onTempoChange(e)}}
                focusedStyle={{backgroundColor: "#0001"}}
              />
            </div>
            <div 
              className="d-flex justify-content-center align-items-center"
              style={{flex: 1, textAlign: "center"}}
            >
              <IconButton onClick={() => setMetronome(!metronome)}>
                <img src={metronome ? metronomeIconPink : metronomeIcon} style={{height: 16}} />
              </IconButton>
            </div>
          </div>
          <div className="d-flex" style={{flex: 1}}>
            <div 
              onClick={() => this.setState({showTime: !this.state.showTime})}
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, backgroundColor: "#ff6db822", cursor: "pointer"}}
            >
              <h1 className="p-0 m-0" style={{fontSize: 28, textAlign: "center"}}>
                {
                  this.state.showTime ?
                  cursorPos.toTimeFomat(timelinePosOptions) :
                  `${cursorPos.measure}.${cursorPos.beat}.${Math.trunc(cursorPos.fraction)}`
                }
              </h1>
            </div>
            <div 
            style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column'}}>
              <div className="d-flex" style={{margin: "0"}}>
                <PlaybackControlButton onClick={() => setIsPlaying(!isPlaying)} isactivated={isPlaying}>  
                  <PlayArrow style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => stop()} isactivated={false} >  
                  <Stop style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsRecording(!isRecording)} isactivated={false} >  
                  <FiberManualRecord style={{fontSize: 17, color: isRecording ? "#f00" : "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsLooping(!isLooping)} isactivated={isLooping}> 
                  <Loop style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
              </div>
              <div className="d-flex" style={{margin: "0"}}>
                <PlaybackControlButton 
                  onClick={() => setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))} 
                  isactivated={false}
                > 
                  <SkipPrevious style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton 
                  onClick={() => {}} 
                  isactivated={false}
                > 
                  <SkipNext style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <Holdable 
                  style={{display: "inline-flex"}} 
                  timeout={500} 
                  interval={250} 
                  onMouseDown={fastForward} 
                  onHold={fastForward}
                >
                  <PlaybackControlButton isactivated={false} > 
                    <FastForward style={{fontSize: 17, color: "#fff"}} />
                  </PlaybackControlButton>
                </Holdable>
                <Holdable 
                  style={{display: "inline-flex"}} 
                  timeout={500} 
                  interval={250} 
                  onMouseDown={fastRewind} 
                  onHold={fastRewind}
                >
                  <PlaybackControlButton isactivated={false} > 
                    <FastRewind style={{fontSize: 17, color: "#fff"}} />
                  </PlaybackControlButton>
                </Holdable>
              </div>
            </div>
          </div>
        </div>
        <div
          className="m-2" 
          style={{width: 275, height: "100%"}}
        >
          <SelectSpinBox
            value={this.options[this.state.optionIdx].value}
            options={this.options}
            style={{height: 25, width: 130, borderRadius: 5, backgroundColor: "#ff6db822"}}
            icon={<FontAwesomeIcon icon={faMagnet} style={{fontSize: 10}} />}
            onChange={o => onChange(o)}
            onNext={onNext}
            onPrev={onPrev}
            leftClickOpen
          />
        </div>
      </div>
    )
  }
}