import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Clip } from "./ClipComponent"
import { EditableDisplay, SelectSpinBox, Knob } from "./ui"
import { SelectSpinBoxOption } from "./ui/SelectSpinBox"
import fx from "../../../assets/svg/fx.svg"
import { Button, ButtonGroup, IconButton } from "@mui/material"
import { Add } from "@mui/icons-material"
import {v4 as uuidv4} from "uuid"
import styled from "styled-components"

interface IProps {
  track: Track
  setTrack: (track : Track, callback? : () => void | null) => void
}

type IState = {
  currentEffectIdx : number
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
  automationEnabled : boolean
  volume : number
  pan : number
}

export interface Effect {
  id : ID
  name : string
}

interface TrackButtonProps {
  bgcolor : string
  enabled : boolean
}

const TrackButton = styled(Button)`
  background-color: ${(props : TrackButtonProps) => props.enabled ? props.bgcolor : "#fff9"};
  font-size: 12px; 
  display: inline-block!important; 
  border: none; 
  min-height: 0!important; 
  min-width: 0!important;
  padding-right: 4px!important;
  padding-left: 4px!important;
  padding-top: 0px!important;
  padding-bottom: 0px!important;
  color: ${(props : TrackButtonProps) => props.enabled ? "#fff" : "#000"};
  margin-left: 4px;
  margin-right: 4px;
  box-shadow: 0 1px 2px 1px #0008;

  &:hover {
    border: none!important;
    background-color: ${(props : TrackButtonProps) => props.enabled ? props.bgcolor : "#fff9"};
  }
`

class TrackComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)

    this.state = {
      currentEffectIdx: 0,
      value: 0
    }
  }

  addEffect = () => {
    const newEffect : Effect = {
      id : uuidv4(),
      name : `Effect ${this.props.track.effects.length + 1}`
    }

    this.props.setTrack({
      ...this.props.track,
      effects : [...this.props.track.effects, newEffect]
    }, () => {
      this.setState({currentEffectIdx : this.props.track.effects.length - 1})
    })
  }

  onChangeEffect = (e : SelectSpinBoxOption<ID>) => {
    const idx = this.props.track.effects.findIndex(effect => effect.id === e.value)
    this.setState({ currentEffectIdx : idx })
  }

  render() {
    const {verticalScale, setVerticalScale} = this.context!

    return (
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
            style={{backgroundColor: "#0000", fontSize: 12, fontWeight: "bold", outline: "none", border: "none", height: "100%"}}
            onChange={e => this.props.setTrack({...this.props.track, name: e.target.value})}
          />
        </div>
        <div 
          className="mx-2" 
          style={{
            display: verticalScale < 1 ? "flex" : "block", 
            alignItems: "center", 
            marginTop: verticalScale < 0.8 && this.props.track.automationEnabled ? 0 : 4
          }}
        >
          <SelectSpinBox
            icon={<img src={fx} style={{height: 15}} />}
            actionIcon={
              <IconButton className="p-0" style={{backgroundColor: "#333"}} onClick={this.addEffect}>
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
                  enabled={this.props.track.mute}
                  onClick={() => this.props.setTrack({...this.props.track, mute: !this.props.track.mute})}
                >
                  M
                </TrackButton>
                <TrackButton 
                  bgcolor="#cc0" 
                  enabled={this.props.track.solo}
                  onClick={() => this.props.setTrack({...this.props.track, solo: !this.props.track.solo})}
                >
                  S
                </TrackButton>
                <TrackButton 
                  bgcolor="#0aa" 
                  enabled={this.props.track.automationEnabled}
                  onClick={() => this.props.setTrack({...this.props.track, automationEnabled: !this.props.track.automationEnabled})}
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
                min={0} 
                max={100} 
                value={this.props.track.volume}
                style={{backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008", marginRight: 6}}
                meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                lineStyle={{height: 4, top: 6}}
                onChange={(val : number) => this.props.setTrack({...this.props.track, volume: val})}
              />
              <Knob 
                size={20} 
                degrees={270} 
                offset={-135} 
                min={-100} 
                max={100} 
                value={this.props.track.pan}
                style={{backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008"}}
                meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
                lineStyle={{height: 4, top: 6}}
                bidirectional
                onChange={(val : number) => this.props.setTrack({...this.props.track, pan: val})}
                title={`Pan: ${Math.abs(this.props.track.pan)}% ${this.props.track.pan > 0 ? "R" : this.props.track.pan === 0 ? "Center" : "L"}`}
              />
            </div>
          </div>
        </div>
        {
          this.props.track.automationEnabled &&
          <div 
            className="text-center m-0 p-0 position-absolute"
            style={{bottom: 0, left: 0, right: 0,backgroundColor: "#333"}}
          >
            <p className="p-0 m-0" style={{color: "#fff", fontSize: 12}}>Add automation</p>
          </div>
        }
      </div>
    )
  }
}

export default React.memo(TrackComponent)