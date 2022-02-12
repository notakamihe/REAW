import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Clip } from "./ClipComponent"
import { EditableDisplay, SelectSpinBox, Knob, HueInput } from "./ui"
import { SelectSpinBoxOption } from "./ui/SelectSpinBox"
import fx from "../../../assets/svg/fx.svg"
import { Button, ButtonGroup, IconButton, ListItemText, MenuItem, Menu, MenuList, Divider } from "@mui/material"
import { Add, AddCircle, Delete, FiberManualRecord } from "@mui/icons-material"
import {v4 as uuidv4} from "uuid"
import styled from "styled-components"
import { AnywhereClickAnchorEl, AutomationLaneTrack } from "."
import { AutomationLane } from "./AutomationLaneTrack"
import { getLaneColor, getRandomTrackColor, hslToHex, hueFromHex, shadeColor } from "renderer/utils/helpers"
import { MenuIcon } from "./icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClone, faPalette } from "@fortawesome/free-solid-svg-icons"

interface IProps {
  index : number
  track : Track
}

type IState = {
  anchorEl : HTMLElement | null
  currentEffectIdx : number
  trackNameInputFocused : boolean
  value : number
}

export interface Track {
  id : ID
  name : string
  color : string
  clips : Clip[]
  effects : Effect[]
  mute : boolean
  solo : boolean
  armed : boolean
  automationEnabled : boolean
  volume : number
  pan : number
  automationLanes : AutomationLane[]
}

export interface Effect {
  id : ID
  name : string
}

interface TrackButtonProps {
  bgcolor : string
  $enabled : boolean
}

const TrackButton = styled(Button)`
  background-color: ${(props : TrackButtonProps) => props.$enabled ? props.bgcolor : "#fff9"};
  font-size: 12px; 
  display: inline-block!important; 
  border: none; 
  min-height: 0!important; 
  min-width: 0!important;
  padding: 0;
  width: 16px;
  color: ${(props : TrackButtonProps) => props.$enabled ? "#fff" : "#000"};
  margin-left: 4px;
  margin-right: 4px;
  box-shadow: 0 1px 2px 1px #0008;

  &:hover {
    border: none!important;
    background-color: ${(props : TrackButtonProps) => props.$enabled ? props.bgcolor : "#fff9"};
  }
`

class TrackComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)

    this.state = {
      anchorEl: null,
      currentEffectIdx: 0,
      trackNameInputFocused: false,
      value: 0,
    }

    this.addAutomationLane = this.addAutomationLane.bind(this)
    this.addEffect = this.addEffect.bind(this)
    this.changeHue = this.changeHue.bind(this)
    this.onChangeEffect = this.onChangeEffect.bind(this)
    this.onPanKnobChange = this.onPanKnobChange.bind(this)
    this.onVolumeKnobChange = this.onVolumeKnobChange.bind(this)
  }

  addAutomationLane() {
    const newAutomationLanes = this.props.track.automationLanes.slice()
    const lane = newAutomationLanes.find(l => !l.show)

    if (lane) {
      lane.show = true
      this.context!.setTrack({...this.props.track, automationLanes: newAutomationLanes})
    }
  }

  addEffect() {
    const newEffect : Effect = {
      id : uuidv4(),
      name : `Effect ${this.props.track.effects.length + 1}`
    }

    this.context!.setTrack({
      ...this.props.track,
      effects : [...this.props.track.effects, newEffect]
    }, () => {
      this.setState({currentEffectIdx : this.props.track.effects.length - 1})
    })
  }

  changeHue(value : number) {
    const tracks = this.context!.tracks.slice()
    const trackIndex = tracks.findIndex(t => t.id === this.props.track.id)

    tracks[trackIndex].color = hslToHex(value, 80, 70)
    this.context!.setTracks(tracks)
  }

  duplicateTrack = () => {
    const track = {...this.props.track, id : uuidv4(), name : `${this.props.track.name} (Copy)`}
    
    track.color = getRandomTrackColor()
    track.clips = track.clips.map(clip => {return {...clip, id: uuidv4()}})
    track.effects = track.effects.map(effect => {return {...effect, id: uuidv4()}})
    track.automationLanes = track.automationLanes.map(lane => {return {
      ...lane, 
      id: uuidv4(),
      nodes: lane.nodes.map(node => {return {...node, id: uuidv4()}})
    }})
    
    const newTracks = this.context!.tracks.slice()
    const trackIndex = newTracks.findIndex(t => t.id === this.props.track.id)

    newTracks.splice(trackIndex + 1, 0, track)

    this.context!.setTracks(newTracks)
  }

  deleteTrack = () => {
    const newTracks = this.context!.tracks.slice()
    const trackIndex = newTracks.findIndex(t => t.id === this.props.track.id)

    newTracks.splice(trackIndex, 1)

    this.context!.setTracks(newTracks)
  }

  getPanTitle() {
    const panLane = this.props.track.automationLanes.find(l => l.isPan)

    if (panLane) {
      if (panLane.nodes.length > 1) {
        return "Pan: Automated"
      }
    }

    return `Pan: ${Math.abs(this.props.track.pan).toFixed(2)}% ${this.props.track.pan > 0 ? "R" : this.props.track.pan === 0 ? "Center" : "L"}`
  }

  getVolumeTitle() {
    const volumeLane = this.props.track.automationLanes.find(l => l.isVolume)

    if (volumeLane) {
      if (volumeLane.nodes.length > 1) {
        return "Volume: Automated"
      }
    }

    return `Volume: ${this.props.track.volume <= -80 ? '-Infinity dB' : this.props.track.volume.toFixed(2) + ' dB'}`
  }

  onChangeEffect(e : SelectSpinBoxOption) {
    const idx = this.props.track.effects.findIndex(effect => effect.id === e.value)
    this.setState({ currentEffectIdx : idx })
  }

  onPanKnobChange(value : number) {
    const automationLanes = this.props.track.automationLanes.slice()
    const panLane = automationLanes.find(l => l.isPan)

    if (panLane) {
      if (panLane.nodes.length === 1) {
        panLane.nodes[0].value = value
      }
    }

    this.context!.setTrack({...this.props.track, automationLanes, pan: value})
  }

  onVolumeKnobChange(value : number) {
    const automationLanes = this.props.track.automationLanes.slice()
    const volumeLane = automationLanes.find(l => l.isVolume)

    if (volumeLane) {
      if (volumeLane.nodes.length === 1) {
        volumeLane.nodes[0].value = value
      }
    }

    this.context!.setTrack({...this.props.track, automationLanes, volume: value})
  }
  
  render() {
    const {verticalScale, setTrack} = this.context!
    const verticalFlex = verticalScale > 0.77 
    const volumeTitle = this.getVolumeTitle()
    const panTitle = this.getPanTitle()

    return (
      <React.Fragment>
        <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
          <div
            style={{
              width: 200, 
              height: 100 * verticalScale, 
              backgroundColor: this.props.track.color, 
              overflow: "hidden",
              position: "relative",
              flexDirection: verticalFlex ? "column" : "row"
            }} 
            className="p-0 disable-highlighting d-flex"
          >
            {
              verticalFlex ?  
              <div className="p-0 m-0" style={{backgroundColor: "#fff9"}}>
                <EditableDisplay
                  className="text-center m-0 p-0 col-12" 
                  onChange={(e : React.ChangeEvent<HTMLInputElement>) => setTrack({...this.props.track, name: e.target.value})}
                  onFocus={() => this.setState({trackNameInputFocused: true})}
                  onBlur={() => this.setState({trackNameInputFocused: false})}
                  style={{backgroundColor: "#0000", fontSize: 14, fontWeight: "bold", outline: "none", border: "none", height: "100%"}}
                  value={this.props.track.name}
                />
                {
                  !this.state.trackNameInputFocused &&
                  <p 
                    className="position-absolute py-0 px-1 rounded"
                    style={{top: 4, left: 4, backgroundColor: "#0002", color: "#0008", fontSize: 12, fontWeight: "bold"}}
                  >
                    {this.props.index + 1}
                  </p>
                }
              </div> :
              <div style={{width: 18, height: "100%", backgroundColor: "#fff9", position: "relative"}}>
                <EditableDisplay
                  className="m-0 p-0 text-center position-absolute" 
                  onChange={(e : React.ChangeEvent<HTMLInputElement>) => setTrack({...this.props.track, name: e.target.value})}
                  style={{
                    backgroundColor: "#0000", 
                    fontSize: 14, 
                    fontWeight: "bold", 
                    outline: "none", 
                    border: "none", 
                    transform: "translateY(17px) rotate(-90deg)", 
                    transformOrigin: "left top",
                    bottom: 0,
                    left: 0,
                    width: 100 * verticalScale,
                    height: 18
                  }}
                  value={this.props.track.name}
                />
              </div>
            }
            <div className="mx-1 position-relative" style={{alignItems: "center", marginTop: verticalFlex ? 3 : 4, flex: 1}}>
              <SelectSpinBox
                actionIcon={
                  <IconButton className="p-0 rounded-circle" style={{backgroundColor: "#333"}} onClick={this.addEffect}>
                    <Add style={{fontSize: 15, color: "#fff"}} />
                  </IconButton>
                }
                classes={{container: "rb-spin-buttons"}}
                defaultText="No Effects"
                icon={<img src={fx} style={{height: 15}} />}
                onChange={this.onChangeEffect}
                options={this.props.track.effects.map(effect => ({ label: effect.name, value: effect.id }))}
                onClick={() => console.log("clicked")}
                style={{
                  container: {
                    margin: "0 auto", 
                    width: "100%", 
                    height: 20, 
                    backgroundColor: "#fff9", 
                    borderRadius: 3, 
                    boxShadow: "0 2px 2px 0px #0004"
                  },
                }}
                value={this.props.track.effects[this.state.currentEffectIdx]?.id}
              />
              <div className="d-flex align-items-center mt-1">
                <div style={{flex: 1, marginRight: 4}}>
                  <ButtonGroup>
                    <TrackButton 
                      bgcolor="#f00" 
                      $enabled={this.props.track.mute}
                      onClick={() => setTrack({...this.props.track, mute: !this.props.track.mute})}
                    >
                      M
                    </TrackButton>
                    <TrackButton 
                      bgcolor="#cc0" 
                      $enabled={this.props.track.solo}
                      onClick={() => setTrack({...this.props.track, solo: !this.props.track.solo})}
                    >
                      S
                    </TrackButton>
                    <TrackButton 
                      bgcolor="#f004" 
                      $enabled={this.props.track.armed}
                      onClick={() => setTrack({...this.props.track, armed: !this.props.track.armed})}
                    >
                      <FiberManualRecord style={{fontSize: 14, color: this.props.track.armed ? "#f00" : "#000", transform: "translateY(-1px)"}} />
                    </TrackButton>
                    <TrackButton 
                      bgcolor="var(--color-primary)" 
                      $enabled={this.props.track.automationEnabled}
                      onClick={() => setTrack({...this.props.track, automationEnabled: !this.props.track.automationEnabled})}
                    >
                      A
                    </TrackButton>
                  </ButtonGroup>
                </div>
                <div style={{display: "flex", marginTop: 4, marginRight: 4}}>
                  <Knob 
                    degrees={270} 
                    disabled={(this.props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) > 1}
                    lineStyle={{height: 4, top: 6}}
                    max={6} 
                    meter={(this.props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) <= 1}
                    meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                    min={-80} 
                    offset={-135} 
                    onChange={this.onVolumeKnobChange}
                    origin={0}
                    size={20} 
                    style={{knob: {backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008"}, container: {marginRight: 8}}}
                    title={volumeTitle}
                    value={this.props.track.volume}
                  />
                  <Knob 
                    bidirectional
                    disabled={(this.props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) > 1}
                    degrees={270} 
                    lineStyle={{height: 4, top: 6}}
                    max={100} 
                    meter={(this.props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) <= 1}
                    meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                    min={-100} 
                    offset={-135} 
                    onChange={this.onPanKnobChange}
                    origin={0}
                    size={20} 
                    style={{knob: {backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008"}}}
                    title={panTitle}
                    value={this.props.track.pan}
                  />
                </div>
              </div>
              {
                this.props.track.automationEnabled &&
                <div 
                  className="text-center m-0 p-0 position-absolute pe-none"
                  style={{bottom: 4, left: 0, right: 0, cursor: "pointer", transform: verticalFlex ? "none" : "translateX(12px)"}}
                >
                  <IconButton
                    onClick={this.addAutomationLane}
                    className="m-0 p-0 pe-auto" 
                    style={{backgroundColor: shadeColor(this.props.track.color, -50)}}
                  >
                    <Add style={{fontSize: 16}} />
                  </IconButton>
                </div>
              }
            </div>
          </div>
        </AnywhereClickAnchorEl>
        <Menu 
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
          onClose={() => this.setState({anchorEl: null})}
          onClick={() => this.setState({anchorEl: null})}
        >
          <MenuList className="p-0" dense style={{outline: "none"}}>
            <MenuItem onClick={this.duplicateTrack}>
              <MenuIcon icon={<FontAwesomeIcon icon={faClone} />} />
              <ListItemText>Duplicate</ListItemText>
            </MenuItem>
            <MenuItem onClick={this.deleteTrack}>
              <MenuIcon icon={<Delete />} />
              <ListItemText>Delete</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem disableRipple style={{flexDirection: "column"}}>
              <div className="d-flex align-items-center">
                <MenuIcon icon={<FontAwesomeIcon icon={faPalette} />} />
                <ListItemText>Change Hue</ListItemText>
              </div>
              <div className="mt-1">
                <HueInput value={hueFromHex(this.props.track.color)} onChange={this.changeHue} />
              </div>
            </MenuItem>
          </MenuList>
        </Menu>
        {
          this.props.track.automationEnabled &&
          <div>
            {
              this.props.track.automationLanes.map((lane, idx) => (
                <AutomationLaneTrack 
                  key={lane.id} 
                  automationLane={lane}
                  track={this.props.track} 
                  color={getLaneColor(this.props.track.automationLanes, idx, this.props.track.color)}
                />
              ))
            }
          </div>
        }
      </React.Fragment>
    )
  }
}

export default React.memo(TrackComponent)