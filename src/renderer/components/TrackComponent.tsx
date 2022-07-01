import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { AudioClip, AutomationLane, Clip, Effect, FXChain, ID, Track } from "renderer/types/types"
import { EditableDisplay, Knob, HueInput, Dialog } from "./ui"
import { IconButton, DialogContent } from "@mui/material"
import { Add, Check, FiberManualRecord } from "@mui/icons-material"
import {v4 as uuidv4} from "uuid"
import { AutomationLaneTrack, FXComponent } from "."
import { getLaneColor, getRandomTrackColor, hslToHex, hueFromHex, shadeColor } from "renderer/utils/general"
import { getTrackPanTitle, getTrackVolumeTitle, ipcRenderer } from "renderer/utils/utils"
import channels from "renderer/utils/channels"
import ButtonGroup from "./ui/ButtonGroup"
import TimelinePosition from "renderer/types/TimelinePosition"

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
    this.changeFXChain = this.changeFXChain.bind(this)
    this.onChangeHueDialogSubmit = this.onChangeHueDialogSubmit.bind(this)
    this.onContextMenu = this.onContextMenu.bind(this)
    this.onPanKnobChange = this.onPanKnobChange.bind(this)
    this.onVolumeKnobChange = this.onVolumeKnobChange.bind(this)
    this.setEffects = this.setEffects.bind(this)
  }

  componentDidMount() {
    this.setState({name: this.props.track.name})
  }

  componentDidUpdate(prevProps : IProps) {
    if (prevProps.track.name !== this.props.track.name) {
      this.setState({name: this.props.track.name})
    }
    
    if (prevProps.track.volume !== this.props.track.volume) {
      const automationLanes = this.props.track.automationLanes.slice()
      const volumeLane = automationLanes.find(l => l.isVolume)
      
      if (volumeLane) {
        if (volumeLane.nodes.length === 1) {
          volumeLane.nodes[0].value = this.props.track.volume
        }
      }
      
      this.context!.setTrack({...this.props.track, automationLanes})
    }

    if (prevProps.track.pan !== this.props.track.pan) {
      const automationLanes = this.props.track.automationLanes.slice()
      const panLane = automationLanes.find(l => l.isPan)

      if (panLane) {
        if (panLane.nodes.length === 1) {
          panLane.nodes[0].value = this.props.track.pan
        }
      }

      this.context!.setTrack({...this.props.track, automationLanes})
    }
  }

  addAutomationLane() {
    const automationLanes = this.props.track.automationLanes.slice()

    if (automationLanes.find(l => !l.show)) {
      ipcRenderer.send(channels.OPEN_ADD_AUTOMATION_CONTEXT_MENU, this.props.track.automationLanes)
  
      ipcRenderer.on(channels.ADD_AUTOMATION, (lane : AutomationLane) => {
        const laneIdx = automationLanes.findIndex(l => l.id === lane.id)
        
        if (laneIdx > -1) {
          automationLanes[laneIdx].show = true
          this.context!.setTrack({...this.props.track, automationLanes})
        }
      })
  
      ipcRenderer.on(channels.CLOSE_ADD_AUTOMATION_CONTEXT_MENU, () => {
        ipcRenderer.removeAllListeners(channels.ADD_AUTOMATION)
        ipcRenderer.removeAllListeners(channels.CLOSE_ADD_AUTOMATION_CONTEXT_MENU)
      })
    }
  }

  changeFXChain(fxChain : FXChain | null) {
    this.context!.setTrack({...this.props.track, fx: {...this.props.track.fx, chainId: fxChain?.id || null}})
  }

  duplicateTrack = () => {
    const track = {...this.props.track, id: uuidv4(), name: `${this.props.track.name} (Copy)`}
    
    track.color = getRandomTrackColor();

    track.clips = track.clips.map(clip => {
      const newClip: Clip = {
        ...clip,
        id: uuidv4(),
        start: TimelinePosition.fromPos(clip.start),
        end: TimelinePosition.fromPos(clip.end),
        startLimit: clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
        endLimit: clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null,
        loopEnd: clip.loopEnd ? TimelinePosition.fromPos(clip.loopEnd) : null
      }

      if ((newClip as AudioClip).audio) {
        const audioClip = newClip as AudioClip

        audioClip.audio = {
          ...audioClip.audio,
          start: TimelinePosition.fromPos(audioClip.audio.start),
          end: TimelinePosition.fromPos(audioClip.audio.end)
        }
      }

      return newClip;
    });

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
    this.context!.setTrack({...this.props.track, pan: value})
  }
  
  onVolumeKnobChange(value : number) {
    this.context!.setTrack({...this.props.track, volume: value})
  }
  
  setEffects(effects : Effect[]) {
    this.context!.setTrack({...this.props.track, fx: {...this.props.track.fx, effects: effects.slice()}})
  }
  
  setTrackName() {
    this.context!.setTrack({...this.props.track, name: this.state.name})
  }
  
  render() {
    const {showMaster, setTrack, tracks, verticalScale} = this.context!
    const masterTrack = tracks.find(t => t.isMaster)
    const verticalFlex = verticalScale > 0.77

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
              flexDirection: verticalFlex ? "column" : "row",
              borderBottom: "1px solid #0004"
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
                onChangeEffect={effect => this.setState({effectId: effect?.id || null})}
                onChangeFXChain={this.changeFXChain}
                onSetEffects={this.setEffects}
                style={{
                  bottom: {border: "1px solid #0009", height: 22}, 
                  toggle: {border: "1px solid #0009", height: 22}, 
                  top: {border: "1px solid #0009", height: 22}
                }}
              />
              <div className="d-flex align-items-center mt-1">
                <div style={{flex: 1, marginRight: 4}}>
                  <ButtonGroup 
                    buttonStyle={{fontWeight: "bold", backgroundColor: "#fff9", width: 20, height: 20}}
                    style={{width: "fit-content"}}
                  >
                    <button
                      onClick={() => setTrack({...this.props.track, mute: !this.props.track.mute})}
                      style={{
                        color: masterTrack?.mute || this.props.track.mute ? "#f00" : "#0009", 
                        backgroundColor: masterTrack?.mute || this.props.track.mute ? "#fff" : "#fff9",
                        opacity: (masterTrack?.mute && !this.props.track.isMaster) ? 0.5 : 1,
                        pointerEvents: (masterTrack?.mute && !this.props.track.isMaster) ? "none" : "auto"
                      }}
                      title={masterTrack?.mute || this.props.track.mute ? "Unmute" : "Mute"}
                    >
                      M
                    </button>
                    {
                      !this.props.track.isMaster ?
                      <button
                        onClick={() => setTrack({...this.props.track, solo: !this.props.track.solo})}
                        style={{
                          color: this.props.track.solo ? "#a80" : "#0009", 
                          backgroundColor: this.props.track.solo ? "#fff" : "#fff9"
                        }}
                        title="Toggle Solo"
                      >
                        S
                      </button> : null
                    }
                    {
                      !this.props.track.isMaster ?
                      <button
                        onClick={() => setTrack({...this.props.track, armed: !this.props.track.armed})}
                        style={{backgroundColor: this.props.track.armed ? "#fff" : "#fff9",}}
                        title={this.props.track.armed ? "Disarm" : "Arm"}
                      >
                        <FiberManualRecord style={{fontSize: 14, color: this.props.track.armed ? "#f00" : "#0009"}} />
                      </button> : null
                    }
                    <button
                       onClick={() => setTrack({...this.props.track, automationEnabled: !this.props.track.automationEnabled})}
                       style={{
                        color: this.props.track.automationEnabled ? "#000" : "#0009", 
                        backgroundColor: this.props.track.automationEnabled ? "#fff" : "#fff9"
                      }}
                       title={this.props.track.automationEnabled ? "Hide Automation" : "Show Automation"}
                    >
                      A
                    </button>
                  </ButtonGroup>
                </div>
                <div style={{display: "flex"}}>
                  <Knob 
                    degrees={270} 
                    disabled={(this.props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) > 1}
                    lineStyle={{height: 4, top: 6}}
                    max={6} 
                    meter={false}
                    min={-80} 
                    offset={-135} 
                    onChange={this.onVolumeKnobChange}
                    origin={0}
                    size={22} 
                    style={{knob: {backgroundColor: "#fff9", border: "1px solid #0009"}, container: {marginRight: 6}}}
                    title={getTrackVolumeTitle(this.props.track)}
                    value={this.props.track.volume}
                  />
                  <Knob 
                    bidirectional
                    disabled={(this.props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) > 1}
                    degrees={270} 
                    lineStyle={{height: 4, top: 6}}
                    max={100} 
                    meter={false}
                    min={-100} 
                    offset={-135} 
                    onChange={this.onPanKnobChange}
                    origin={0}
                    size={22} 
                    style={{knob: {backgroundColor: "#fff9", border: "1px solid #0009"}}}
                    title={getTrackPanTitle(this.props.track)}
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
                    disabled={!this.props.track.automationLanes.find(l => !l.show)}
                    onClick={this.addAutomationLane}
                    className="m-0 p-0 pe-auto rounded-circle" 
                    style={{
                      border: `1px solid #0009`,
                      transform: verticalFlex || this.props.track.isMaster ? "none" : "translateX(12px)",
                      opacity: !this.props.track.automationLanes.find(l => !l.show) ? 0.5 : 1
                    }}
                  >
                    <Add style={{fontSize: 16, color: "#0009"}} />
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
            <Dialog
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
                    className="center-by-flex rounded-circle" 
                    style={{marginLeft: 8, backgroundColor: "var(--color1)", padding: 4}}
                  >
                    <Check style={{fontSize: 16, color: "var(--bg1)"}} />
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          }
        </React.Fragment>
      )
    }

    return null
  }
}

export default React.memo(TrackComponent)