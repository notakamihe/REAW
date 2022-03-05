import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Clip } from "./ClipComponent"
import { EditableDisplay, Knob, HueInput, OSDialog } from "./ui"
import { Button, ButtonGroup, IconButton, Divider, Dialog, DialogTitle, DialogContent } from "@mui/material"
import { Add, Check, Close, Delete, FiberManualRecord } from "@mui/icons-material"
import {v4 as uuidv4} from "uuid"
import styled from "styled-components"
import { AutomationLaneTrack, FXComponent } from "."
import { AutomationLane } from "./AutomationLaneTrack"
import { getLaneColor, getRandomTrackColor, hslToHex, hueFromHex, shadeColor } from "renderer/utils/helpers"
import { FXChain } from "./FXComponent"
import { ipcRenderer } from "renderer/utils/utils"
import channels from "renderer/utils/channels"

export interface Effect {
  id : ID
  name : string
  enabled : boolean
}

export interface FX {
  chainId? : ID | null
  effects : Effect[]
}

export interface Track {
  armed : boolean
  automationEnabled : boolean
  automationLanes : AutomationLane[]
  clips : Clip[]
  color : string
  fx : FX
  id : ID
  isMaster? : boolean
  mute : boolean
  name : string
  pan : number
  solo : boolean
  volume : number
}


interface TrackButtonProps {
  bgcolor : string
  $enabled : boolean
  opacity? : string
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
  opacity: ${(props : TrackButtonProps) => props.opacity || "1"};

  &:hover {
    border: none!important;
    background-color: ${(props : TrackButtonProps) => props.$enabled ? props.bgcolor : "#fff9"};
  }
`


interface IProps {
  order? : number
  track : Track
}

type IState = {
  effectId : ID | null
  hue : number
  name : string
  showChangeHueDialog : boolean
  trackNameInputFocused : boolean
}

class TrackComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)

    this.state = {
      effectId: this.props.track.fx.effects[0]?.id || null,
      hue: hueFromHex(this.props.track.color),
      name: "",
      showChangeHueDialog: false,
      trackNameInputFocused: false
    }

    this.addAutomationLane = this.addAutomationLane.bind(this)
    this.addEffect = this.addEffect.bind(this)
    this.changeFXChain = this.changeFXChain.bind(this)
    this.onChangeHueDialogSubmit = this.onChangeHueDialogSubmit.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onPanKnobChange = this.onPanKnobChange.bind(this)
    this.onVolumeKnobChange = this.onVolumeKnobChange.bind(this)
    this.removeEffect = this.removeEffect.bind(this)
    this.setEffects = this.setEffects.bind(this)
    this.toggleEffectEnabled = this.toggleEffectEnabled.bind(this)
  }

  componentDidMount() {
    this.setState({name: this.props.track.name})
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
    const fx = {...this.props.track.fx}
    const newEffect : Effect = {id: uuidv4(), name: `Effect ${fx.effects.length + 1}`, enabled: true}

    fx.effects.push(newEffect)

    this.context!.setTrack({...this.props.track, fx})
    this.setState({effectId: newEffect.id})
  }

  changeFXChain(fxChain : FXChain | null) {
    this.context!.setTrack({...this.props.track, fx: {...this.props.track.fx, chainId: fxChain?.id || null}})
  }

  duplicateTrack = () => {
    const track = {...this.props.track, id : uuidv4(), name : `${this.props.track.name} (Copy)`}
    
    track.color = getRandomTrackColor()
    track.clips = track.clips.map(clip => {return {...clip, id: uuidv4()}})
    track.fx.effects = track.fx.effects.map(effect => {return {...effect, id: uuidv4()}})
    track.automationLanes = track.automationLanes.map(lane => {return {
      ...lane, 
      id: uuidv4(),
      nodes: lane.nodes.map(node => {return {...node, id: uuidv4()}})
    }})

    const newTracks : Track[] = this.context!.tracks.slice()
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

  onChangeHueDialogSubmit = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    this.context!.setTrack({...this.props.track, color: hslToHex(this.state.hue, 80, 70)});
    this.setState({showChangeHueDialog: false})
  }

  onContextMenu(e : React.MouseEvent) {
    e.stopPropagation();

    if (!this.props.track.isMaster) {
      ipcRenderer.send(channels.OPEN_TRACK_CONTEXT_MENU)
  
      ipcRenderer.on(channels.DUPLICATE_TRACK, () => {
        this.duplicateTrack()
      })
  
      ipcRenderer.on(channels.DELETE_TRACK, () => {
        this.deleteTrack()
      })
  
      ipcRenderer.on(channels.CHANGE_TRACK_HUE, () => {
        this.setState({showChangeHueDialog: true})
      })
  
      ipcRenderer.on(channels.CLOSE_TRACK_CONTEXT_MENU, () => {
        ipcRenderer.removeAllListeners(channels.DUPLICATE_TRACK)
        ipcRenderer.removeAllListeners(channels.DELETE_TRACK)
        ipcRenderer.removeAllListeners(channels.CHANGE_TRACK_HUE)
        ipcRenderer.removeAllListeners(channels.CLOSE_TRACK_CONTEXT_MENU)
      })
    }
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

  removeEffect(effect : Effect) {
    const fx = {...this.props.track.fx}
    const idx = fx.effects.findIndex(e => e.id === effect.id)
    const effects = fx.effects.filter(e => e.id !== effect.id)
    
    fx.effects = effects
    
    if (idx > -1) {
      this.context!.setTrack({...this.props.track, fx})
      
      if (effects.length === 0) {
        this.setState({effectId: null})
      } else {
        this.setState({effectId: idx === 0 ? effects[idx].id : effects[idx - 1].id})
      }
    }
  }
  
  setEffects(effects : Effect[]) {
    this.context!.setTrack({...this.props.track, fx: {...this.props.track.fx, effects: effects.slice()}})
    
    if (effects.length > 0) [
      this.setState({effectId: effects[0].id})
    ]
  }
  
  setTrackName() {
    this.context!.setTrack({...this.props.track, name: this.state.name})
  }

  toggleEffectEnabled(effect : Effect) {
    const effects = this.props.track.fx.effects.slice().map(e => e.id === effect.id ? {...e, enabled: !e.enabled} : e)
    this.context!.setTrack({...this.props.track, fx: {...this.props.track.fx, effects}})
  }
  
  render() {
    const {showMaster, setTrack, tracks, verticalScale} = this.context!
    const masterTrack = tracks.find(t => t.isMaster)
    const verticalFlex = verticalScale > 0.77 
    const volumeTitle = this.getVolumeTitle()
    const panTitle = this.getPanTitle()

    if (showMaster || !this.props.track.isMaster) {
      return (
        <React.Fragment>
          <div
            className="p-0 disable-highlighting d-flex"
            onContextMenu={this.onContextMenu}
            style={{
              width: 200, 
              height: 100 * verticalScale, 
              backgroundColor: this.props.track.color, 
              overflow: "hidden",
              position: "relative",
              flexDirection: verticalFlex ? "column" : "row"
            }} 
          >
            {
              verticalFlex ?  
              <div className="p-0 m-0" style={{backgroundColor: "#fff9", height: 22}}>
                <form onSubmit={e => {e.preventDefault(); this.setTrackName()}}>
                  <EditableDisplay
                    className={`text-center m-0 p-0 col-12 ${this.props.track.isMaster ? "pe-none" : ""}`} 
                    onChange={e => this.setState({name: (e.target as HTMLInputElement).value})}
                    onFocus={() => this.setState({trackNameInputFocused: true})}
                    onBlur={() => {this.setState({trackNameInputFocused: false}); this.setTrackName()}}
                    readOnly={this.props.track.isMaster}
                    style={{backgroundColor: "#0000", fontSize: 14, fontWeight: "bold", outline: "none", border: "none", height: "100%"}}
                    value={this.state.name}
                  />
                </form>
                {
                  !this.state.trackNameInputFocused && this.props.order !== undefined &&
                  <p 
                    className="position-absolute py-0 px-1 m-0 rounded"
                    style={{top: 3, left: 4, backgroundColor: "#0002", color: "#0008", fontSize: 12, lineHeight: 1.4, fontWeight: "bold"}}
                  >
                    {this.props.order}
                  </p>
                }
              </div> :
              <div style={{width: 18, height: "100%", backgroundColor: "#fff9", position: "relative"}}>
                <form onSubmit={e => {e.preventDefault(); this.setTrackName()}}>
                  <EditableDisplay
                    className={`m-0 p-0 text-center position-absolute ${this.props.track.isMaster ? "pe-none" : ""}`} 
                    onBlur={() => this.setTrackName()}
                    onChange={e => this.setState({name: (e.target as HTMLInputElement).value})}
                    readOnly={this.props.track.isMaster}
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
                    value={this.state.name}
                  />
                </form>
              </div>
            }
            <div className="mx-1 position-relative" style={{alignItems: "center", marginTop: verticalFlex ? 3 : 4, flex: 1}}>
              <FXComponent 
                compact={verticalScale < 1.1} 
                effectId={this.state.effectId}
                fx={this.props.track.fx}
                onAddEffect={this.addEffect}
                onChangeEffect={effect => this.setState({effectId: effect.id})}
                onChangeFXChain={this.changeFXChain}
                onRemoveEffect={this.removeEffect}
                onToggleEffectEnabled={this.toggleEffectEnabled}
                onSetEffects={this.setEffects}
              />
              <div className="d-flex align-items-center mt-1">
                <div style={{flex: 1, marginRight: 4}}>
                  <ButtonGroup>
                    <TrackButton 
                      bgcolor="#f00" 
                      className={(masterTrack?.mute && !this.props.track.isMaster) ? "pe-none" : ""}
                      $enabled={masterTrack?.mute || this.props.track.mute}
                      onClick={() => setTrack({...this.props.track, mute: !this.props.track.mute})}
                      opacity={(masterTrack?.mute && !this.props.track.isMaster) ? "0.5" : "1"}
                      title={masterTrack?.mute || this.props.track.mute ? "Unmute" : "Mute"}
                    >
                      M
                    </TrackButton>
                    {
                      !this.props.track.isMaster &&
                      <TrackButton 
                        bgcolor="#cc0" 
                        $enabled={this.props.track.solo}
                        onClick={() => setTrack({...this.props.track, solo: !this.props.track.solo})}
                        title="Toggle Solo"
                      >
                        S
                      </TrackButton>
                    }
                    {
                      !this.props.track.isMaster &&
                      <TrackButton 
                        bgcolor="#e6bebe" 
                        $enabled={this.props.track.armed}
                        onClick={() => setTrack({...this.props.track, armed: !this.props.track.armed})}
                        title={this.props.track.armed ? "Disarm" : "Arm"}
                      >
                        <FiberManualRecord 
                          style={{fontSize: 14, color: this.props.track.armed ? "#f00" : "#000", transform: "translateY(-1px)"}} 
                        />
                      </TrackButton>
                    }
                    <TrackButton 
                      bgcolor="var(--color-primary)" 
                      $enabled={this.props.track.automationEnabled}
                      onClick={() => setTrack({...this.props.track, automationEnabled: !this.props.track.automationEnabled})}
                      title={this.props.track.automationEnabled ? "Hide Automation" : "Show Automation"}
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
                  style={{bottom: 4, left: 0, right: 0, cursor: "pointer"}}
                >
                  <IconButton
                    onClick={this.addAutomationLane}
                    className="m-0 p-0 pe-auto" 
                    style={{
                      backgroundColor: shadeColor(this.props.track.color, -50),
                      transform: verticalFlex || this.props.track.isMaster ? "none" : "translateX(12px)"
                    }}
                  >
                    <Add style={{fontSize: 16, color: this.props.track.isMaster ? "#fffa" : "#000a"}} />
                  </IconButton>
                </div>
              }
            </div>
          </div>
          {
            this.props.track.automationEnabled &&
            <div>
              {
                this.props.track.automationLanes.map((lane, idx) => (
                  <AutomationLaneTrack 
                    automationLane={lane}
                    color={getLaneColor(this.props.track.automationLanes, idx, this.props.track.color)}
                    key={lane.id} 
                    track={this.props.track} 
                  />
                ))
              }
            </div>
          }
          {
            <OSDialog
              onClickAway={() => this.setState({showChangeHueDialog: false})}
              onClose={() => this.setState({showChangeHueDialog: false})}
              open={this.state.showChangeHueDialog}
              style={{width: 350}}
              title={`Change Hue for ${this.props.track.name}`}
            >
              <DialogContent className="p-3">
                <form className="d-flex align-items-center" onSubmit={this.onChangeHueDialogSubmit} style={{width: "100%"}}>
                  <HueInput onChange={hue => this.setState({hue})} value={this.state.hue} />
                  <button 
                    className="rounded no-borders center-by-flex" 
                    style={{backgroundColor: "var(--color-primary)", height: 18, marginLeft: 8}}
                  >
                    <Check style={{color: "#fff", fontSize: 16}} />
                  </button>
                </form>
              </DialogContent>
            </OSDialog>
          }
        </React.Fragment>
      )
    }

    return null
  }
}

export default React.memo(TrackComponent)