import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Clip } from "./ClipComponent"
import { EditableDisplay, SelectSpinBox, Knob, HueInput } from "./ui"
import { SelectSpinBoxOption } from "./ui/SelectSpinBox"
import fx from "../../../assets/svg/fx.svg"
import { Button, ButtonGroup, IconButton, ListItemText, MenuItem, Menu, MenuList, Divider } from "@mui/material"
import { Add, AddCircle, Delete } from "@mui/icons-material"
import {v4 as uuidv4} from "uuid"
import styled from "styled-components"
import TimelinePosition from "renderer/types/TimelinePosition"
import { AnywhereClickAnchorEl, AutomationLaneTrack } from "."
import { AutomationLane } from "./AutomationLaneTrack"
import { getLaneColor, getRandomTrackColor, hslToHex, hueFromHex, shadeColor } from "renderer/utils/helpers"
import { MenuIcon } from "./icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faClone, faPalette } from "@fortawesome/free-solid-svg-icons"

interface IProps {
  track: Track
}

type IState = {
  currentEffectIdx : number
  value : number
  anchorEl : HTMLElement | null
}

export interface Track {
  id : ID
  name : string
  color : string
  clips : Clip[]
  effects : Effect[]
  mute : boolean
  solo : boolean
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
  padding-right: 4px!important;
  padding-left: 4px!important;
  padding-top: 0px!important;
  padding-bottom: 0px!important;
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
      currentEffectIdx: 0,
      value: 0,
      anchorEl: null
    }

    this.changeHue = this.changeHue.bind(this)
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

  onChangeEffect = (e : SelectSpinBoxOption<ID>) => {
    const idx = this.props.track.effects.findIndex(effect => effect.id === e.value)
    this.setState({ currentEffectIdx : idx })
  }
  
  render() {
    const {verticalScale, setTrack} = this.context!

    const addAutomationLane = () => {
      const newAutomationLanes = this.props.track.automationLanes.slice()
      const lane = newAutomationLanes.find(l => !l.show)
  
      if (lane) {
        lane.show = true
        setTrack({...this.props.track, automationLanes: newAutomationLanes})
      }
    }
  
    const addEffect = () => {
      const newEffect : Effect = {
        id : uuidv4(),
        name : `Effect ${this.props.track.effects.length + 1}`
      }
  
      setTrack({
        ...this.props.track,
        effects : [...this.props.track.effects, newEffect]
      }, () => {
        this.setState({currentEffectIdx : this.props.track.effects.length - 1})
      })
    }

    return (
      <React.Fragment>
        <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
          <div
            style={{
              width: 200, 
              height: 100 * verticalScale, 
              backgroundColor: this.props.track.color, 
              overflow: "hidden",
              position: "relative"
            }} 
            className="p-0 disable-highlighting"
          >
            <div className="p-0 m-0" style={{backgroundColor: "#fff9"}}>
              <EditableDisplay
                value={this.props.track.name}
                className="text-center m-0 p-0 col-12" 
                style={{backgroundColor: "#0000", fontSize: 14, fontWeight: "bold", outline: "none", border: "none", height: "100%"}}
                onChange={e => setTrack({...this.props.track, name: e.target.value})}
              />
            </div>
            <div 
              className="mx-1" 
              style={{
                display: verticalScale < 1 ? "flex" : "block", 
                alignItems: "center", 
                marginTop: verticalScale < 0.8 && this.props.track.automationEnabled ? 0 : 4
              }}
            >
              <SelectSpinBox
                icon={<img src={fx} style={{height: 15}} />}
                actionIcon={
                  <IconButton className="p-0" style={{backgroundColor: "#333"}} onClick={addEffect}>
                    <Add style={{fontSize: 15, color: "#fff"}} />
                  </IconButton>
                }
                value={this.props.track.effects[this.state.currentEffectIdx]?.id}
                options={this.props.track.effects.map(effect => ({ label: effect.name, value: effect.id }))}
                onChange={this.onChangeEffect}
                onPrev={() => this.setState({currentEffectIdx: Math.max(0, this.state.currentEffectIdx - 1)})}
                onNext={() => this.setState({currentEffectIdx: Math.min(this.props.track.effects.length - 1, this.state.currentEffectIdx + 1)})}
                style={{margin: "0 auto", width: "100%", height: 20, backgroundColor: "#fff9", borderRadius: 5, boxShadow: "0 2px 2px 0px #0004"}}
                defaultText="No Effects"
                onClick={() => console.log("clicked")}
              />
              <div className={`d-flex align-items-center ${verticalScale < 1 ? "" : "mt-1"}`}>
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
                      bgcolor="#0aa" 
                      $enabled={this.props.track.automationEnabled}
                      onClick={() => setTrack({...this.props.track, automationEnabled: !this.props.track.automationEnabled})}
                    >
                      A
                    </TrackButton>
                  </ButtonGroup>
                </div>
                <div style={{display: "flex", marginTop: 4, marginRight: 4}}>
                  <Knob 
                    size={20} 
                    degrees={270} 
                    offset={-135} 
                    min={-80} 
                    max={6} 
                    value={this.props.track.volume}
                    style={{backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008", marginRight: 6}}
                    meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                    lineStyle={{height: 4, top: 6}}
                    onChange={(val : number) => setTrack({...this.props.track, volume: val})}
                    title={`Volume: ${this.props.track.volume <= -80 ? '-Infinity dB' :
                      this.props.track.volume.toFixed(2) + ' dB'}`}
                    origin={0}
                  />
                  <Knob 
                    bidirectional
                    size={20} 
                    degrees={270} 
                    offset={-135} 
                    min={-100} 
                    max={100} 
                    value={this.props.track.pan}
                    style={{backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008"}}
                    meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                    lineStyle={{height: 4, top: 6}}
                    onChange={(val : number) => setTrack({...this.props.track, pan: val})}
                    title={`Pan: ${Math.abs(this.props.track.pan)}% ${this.props.track.pan > 0 ? "R" : this.props.track.pan === 0 ? "Center" : "L"}`}
                    origin={0}
                  />
                </div>
              </div>
            </div>
            {
              this.props.track.automationEnabled &&
              <div 
                className="text-center m-0 p-0 position-absolute"
                style={{bottom: verticalScale < 0.8 ? 0 : 4, left: 0, right: 0, cursor: "pointer"}}
              >
                <IconButton
                  onClick={addAutomationLane}
                  className="m-0 p-0" 
                  style={{backgroundColor: shadeColor(this.props.track.color, -50)}}
                >
                  <Add style={{fontSize: 16}} />
                </IconButton>
              </div>
            }
          </div>
        </AnywhereClickAnchorEl>
        <Menu 
          anchorEl={this.state.anchorEl}
          open={Boolean(this.state.anchorEl)}
          onClose={() => this.setState({anchorEl: null})}
          transformOrigin={{horizontal: "left", vertical: "top"}}
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