import { FastForward, FastRewind, FiberManualRecord, Loop, PlayArrow, Redo, Save, SkipNext, SkipPrevious, Stop, Undo } from "@mui/icons-material";
import { Button, IconButton } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapGridSize } from "renderer/types/types";
import Holdable from "./Holdable";
import styled from "styled-components"
import metronomeIcon from "../../../assets/svg/metronome.svg"
import { ButtonAndIcon, EditableDisplay, NumberInput } from "./ui";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExport, faMagnet, faRedo, faUndo } from "@fortawesome/free-solid-svg-icons";
import SelectSpinBox, { SelectSpinBoxOption } from "./ui/SelectSpinBox";
import Metronome from "./Metronome";

const PlaybackControlButton = styled(IconButton)`
background-color: #333;
border-radius: 0!important;
padding: 2px!important;

&:hover {
  background-color: #555;
    transition: background-color 0.2s ease-in-out;
  }
`


enum SnapSizeOption {
  None,
  Auto,
  Whole,
  Half,
  Quarter,
  Eighth,
  Sixteenth,
  ThirtySecond,
  SixtyFourth,
  OneTwentyEighth,
  TwoFiftySixth,
  FiveHundredTwelfth
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

  noteValueOptions = [
    {value: 32, label: "32"},
    {value: 16, label: "16"},
    {value: 8, label: "8"},
    {value: 4, label: "4"},
    {value: 2, label: "2"},
    {value: 1, label: "1"},
  ]

  options = [
    {value: SnapSizeOption.None, label: "None"},
    {value: SnapSizeOption.Auto, label: "Auto"},
    {value: SnapSizeOption.Whole, label: "Whole"},
    {value: SnapSizeOption.Half, label: "Half"},
    {value: SnapSizeOption.Quarter, label: "Quarter"},
    {value: SnapSizeOption.Eighth, label: "Eighth"},
    {value: SnapSizeOption.Sixteenth, label: "Sixteenth"},
    {value: SnapSizeOption.ThirtySecond, label: "1/32"},
    {value: SnapSizeOption.SixtyFourth, label: "1/64"},
    {value: SnapSizeOption.OneTwentyEighth, label: "1/128"},
    {value: SnapSizeOption.TwoFiftySixth, label: "1/256"},
    {value: SnapSizeOption.FiveHundredTwelfth, label: "1/512"}
  ]

  constructor(props: IProps) {
    super(props)

    this.state = {
      noteValue: 1,
      showTime: false,
      tempoInput: "",
      snapSizeOptionValue: SnapSizeOption.None
    }

    this.onChangeNoteValue = this.onChangeNoteValue.bind(this)
    this.onChangeSnapSizeOption = this.onChangeSnapSizeOption.bind(this)
  }

  componentDidMount() {
    this.setState({
      noteValue: this.context!.timeSignature.noteValue,
      tempoInput: this.context!.tempo.toString(),
      snapSizeOptionValue: this.getOptionBySnapSize()
    })
  }

  getOptionBySnapSize = () => {
    if (this.context?.autoSnap)
      return SnapSizeOption.Auto

    switch (this.context?.snapGridSize) {
      case SnapGridSize.Whole: return SnapSizeOption.Whole
      case SnapGridSize.Half: return SnapSizeOption.Half
      case SnapGridSize.Quarter: return SnapSizeOption.Quarter
      case SnapGridSize.Eighth: return SnapSizeOption.Eighth
      case SnapGridSize.Sixteenth: return SnapSizeOption.Sixteenth
      case SnapGridSize.ThirtySecond: return SnapSizeOption.ThirtySecond
      case SnapGridSize.SixtyFourth: return SnapSizeOption.SixtyFourth
      case SnapGridSize.OneTwentyEighth: return SnapSizeOption.OneTwentyEighth
      case SnapGridSize.TwoFiftySixth: return SnapSizeOption.TwoFiftySixth
      case SnapGridSize.FiveHundredTwelfth: return SnapSizeOption.FiveHundredTwelfth
      default: return SnapSizeOption.None
    }
  }

  onChangeNoteValue = (option : SelectSpinBoxOption) => {
    const value = option.value as number

    this.setState({noteValue: value})
    this.context!.setTimeSignature({...this.context!.timeSignature, noteValue: value})
  }

  onChangeSnapSizeOption(option : SelectSpinBoxOption) {
    const value = option.value as SnapSizeOption

    this.setState({snapSizeOptionValue: value})

    if (value === SnapSizeOption.Auto) {
      this.context!.setAutoSnap(true)
    } else {
      this.context!.setAutoSnap(false)

      switch (value) {
        case SnapSizeOption.None: 
          this.context!.setSnapGridSize(SnapGridSize.None) 
          break
        case SnapSizeOption.Whole:
          this.context!.setSnapGridSize(SnapGridSize.Whole)
          break
        case SnapSizeOption.Half:
          this.context!.setSnapGridSize(SnapGridSize.Half)
          break
        case SnapSizeOption.Quarter:
          this.context!.setSnapGridSize(SnapGridSize.Quarter)
          break
        case SnapSizeOption.Eighth:
          this.context!.setSnapGridSize(SnapGridSize.Eighth)
          break
        case SnapSizeOption.Sixteenth:
          this.context!.setSnapGridSize(SnapGridSize.Sixteenth)
          break
        case SnapSizeOption.ThirtySecond:
          this.context!.setSnapGridSize(SnapGridSize.ThirtySecond)
          break
        case SnapSizeOption.SixtyFourth:
          this.context!.setSnapGridSize(SnapGridSize.SixtyFourth)
          break
        case SnapSizeOption.OneTwentyEighth:
          this.context!.setSnapGridSize(SnapGridSize.OneTwentyEighth)
          break
        case SnapSizeOption.TwoFiftySixth:
          this.context!.setSnapGridSize(SnapGridSize.TwoFiftySixth)
          break
        case SnapSizeOption.FiveHundredTwelfth:
          this.context!.setSnapGridSize(SnapGridSize.FiveHundredTwelfth)
          break
      }
    }
  }

  render() {
    const {
      cursorPos, 
      setCursorPos,
      timeSignature, 
      setTimeSignature, 
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

      newTimelinePosOptions.snapSize = SnapGridSize.None
      newPos.add(0, 0, 250, true, newTimelinePosOptions)

      setCursorPos(newPos)
    }
    
    const fastRewind = () => {
      let newPos = TimelinePosition.fromPos(cursorPos)
      const newTimelinePosOptions = {...timelinePosOptions}

      newTimelinePosOptions.snapSize = SnapGridSize.None
      newPos.subtract(0, 0, 250, true, newTimelinePosOptions)

      if (newPos.compare(TimelinePosition.start) < 0)
        newPos = TimelinePosition.fromPos(TimelinePosition.start)
      
      setCursorPos(newPos)
    }

    const stop = () => {
      setIsPlaying(false)
      setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
    }

    return (
      <div
        className="disable-highlighting d-flex"
        style={{
          width: "100%", 
          height: 70, 
          zIndex: 19, 
          backgroundColor: "#fff", 
          boxShadow: "0 1px 5px 1px #0002", 
          flexShrink: 0,
          position: "relative"
        }}
      >
        <div style={{display: "flex", flexDirection: "column", height: "100%", width:80}}>
          <div className="d-flex justify-content-center" style={{flex: 1}}>
            <IconButton className="p-0" style={{borderRadius: 0, marginRight: 12}}>
              <FontAwesomeIcon icon={faUndo} style={{fontSize: 12, color: "#000"}} />
            </IconButton>
            <IconButton className="p-0" style={{borderRadius: 0}}>
              <FontAwesomeIcon icon={faRedo} style={{fontSize: 12, color: "#000"}} />
            </IconButton>
          </div>
          <ButtonAndIcon 
            className="col-12" 
            icon={<Save style={{fontSize: 14, marginRight: 4}} />} 
            style={{fontSize: 14, flex: 1, outline: "none"}}
          >
            Save
          </ButtonAndIcon>
          <ButtonAndIcon 
            className="col-12" 
            icon={<FontAwesomeIcon icon={faFileExport} style={{fontSize: 12, marginRight: 4}} />} 
            style={{fontSize: 14, flex: 1, outline: "none"}}
          >
            Export
          </ButtonAndIcon>
        </div>
        <div 
          className="d-flex" 
          style={{width: 275, height: "100%", flexDirection: "column", borderRight: "1px solid #333", borderLeft: "1px solid #333"}}
        >
          <div className="d-flex" style={{height: 25}}>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1}}
            >
              <NumberInput
                hoverStyle={{verticalContainer: {visibility: "visible"}}}
                min={1}
                max={16}
                onChange={(value) => setTimeSignature({...timeSignature, beats: value})}
                reverseDirection
                style={{
                  container: {width: 30, height: 18, backgroundColor: "#0000"},
                  incr: {backgroundColor: "#0000"},
                  incrIcon: {color: "#333"},
                  input: {fontWeight: "bold", transform: "translateY(1px)"},
                  decr: {backgroundColor: "#0000"},
                  decrIcon: {color: "#333"},
                  verticalContainer: {visibility: "hidden"}
                }}
                value={timeSignature.beats}
                vertical
              />
              <span style={{fontSize: 14, color: "#0008", margin: "0 2px"}}>|</span>
              <SelectSpinBox
                enableMenu={false}
                hoverStyle={{buttonsContainer: {visibility: "visible"}}}
                onChange={this.onChangeNoteValue}
                options={this.noteValueOptions}
                style={{
                  buttonsContainer: {visibility: "hidden"},
                  container: {height: 18, width: 30, backgroundColor: "#0000"},
                  next: {backgroundColor: "#0000"},
                  nextIcon: {color: "#333"},
                  prev: {backgroundColor: "#0000"},
                  prevIcon: {color: "#333"},
                  text: {fontWeight: "bold", textAlign: "center"}
                }}
                value={this.state.noteValue}
              />
            </div>
            <div 
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, textAlign: "center"}}
              title="Tempo"
            >
              <NumberInput
                hoverStyle={{verticalContainer: {visibility: "visible"}}}
                min={10}
                max={1000}
                onChange={(value) => setTempo(value)}
                style={{
                  container: {width: 45, height: 18, backgroundColor: "#0000"},
                  incr: {backgroundColor: "#0000"},
                  incrIcon: {color: "#333"},
                  input: {fontWeight: "bold", transform: "translateY(2px)"},
                  decr: {backgroundColor: "#0000"},
                  decrIcon: {color: "#333"},
                  verticalContainer: {visibility: "hidden"}
                }}
                typing
                value={tempo}
                vertical
              />
            </div>
            <div 
              className="d-flex justify-content-center align-items-center"
              style={{flex: 1, textAlign: "center"}}
            >
              <Metronome />
            </div>
          </div>
          <div className="d-flex" style={{flex: 1}}>
            <div 
              onClick={() => this.setState({showTime: !this.state.showTime})}
              className="d-flex justify-content-center align-items-center" 
              style={{flex: 1, backgroundColor: "var(--color-primary-muted)", cursor: "pointer"}}
            >
              <h1 className="p-0 m-0" style={{fontSize: 28, textAlign: "center"}}>
                {
                  this.state.showTime ?
                  cursorPos.toTimeString(timelinePosOptions) :
                  cursorPos.toString()
                }
              </h1>
            </div>
            <div 
            style={{display: "flex", justifyContent: "center", alignItems: "center", flexDirection: 'column'}}>
              <div className="d-flex" style={{margin: 0, height: "50%"}}>
                <PlaybackControlButton onClick={() => setIsPlaying(!isPlaying)}>  
                  <PlayArrow style={{fontSize: 17, color: isPlaying ? "var(--color-primary)" : "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => stop()} >  
                  <Stop style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsRecording(!isRecording)}>  
                  <FiberManualRecord style={{fontSize: 17, color: isRecording ? "#f00" : "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => setIsLooping(!isLooping)}> 
                  <Loop style={{fontSize: 17, color: isLooping ? "var(--color-primary)" : "#fff"}} />
                </PlaybackControlButton>
              </div>
              <div className="d-flex" style={{margin: 0, height: "50%"}}>
                <PlaybackControlButton 
                  onClick={() => setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))} 
                > 
                  <SkipPrevious style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <PlaybackControlButton onClick={() => {}}> 
                  <SkipNext style={{fontSize: 17, color: "#fff"}} />
                </PlaybackControlButton>
                <Holdable timeout={500} interval={250} onMouseDown={fastForward} onHold={fastForward}>
                  <PlaybackControlButton> 
                    <FastForward style={{fontSize: 17, color: "#fff"}} />
                  </PlaybackControlButton>
                </Holdable>
                <Holdable timeout={500} interval={250} onMouseDown={fastRewind} onHold={fastRewind}>
                  <PlaybackControlButton> 
                    <FastRewind style={{fontSize: 17, color: "#fff"}} />
                  </PlaybackControlButton>
                </Holdable>
              </div>
            </div>
          </div>
        </div>
        <div
          className="p-2" 
          style={{width: 275, height: "100%"}}
        >
          <SelectSpinBox
            classes={{container: "rb-spin-buttons"}}
            icon={<FontAwesomeIcon icon={faMagnet} style={{fontSize: 10}} />}
            leftClickOpen
            onChange={this.onChangeSnapSizeOption}
            options={this.options}
            style={{
              container: {
                height: 25,
                width: 130,
                borderRadius: 3,
                backgroundColor: "var(--color-primary-muted)",
                boxShadow: "0 1px 2px 1px #0002",
              },
              text: {marginLeft: 4}
            }}
            value={this.state.snapSizeOptionValue}
          />
        </div>
      </div>
    )
  }
}