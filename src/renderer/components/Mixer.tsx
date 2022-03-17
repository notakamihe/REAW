import { FiberManualRecord } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { ID } from "renderer/types/types";
import { getTrackPanTitle, getTrackVolumeTitle } from "renderer/utils/utils";
import FXComponent from "./FXComponent";
import { Track } from "./TrackComponent";
import { EditableDisplay, Knob, Slider, VolumeMeter } from "./ui";

const MixerSlider = (props : {setTrack : (track : Track) => void, track: Track}) => {
  const [value, setValue] = React.useState(props.track.volume);

  React.useEffect(() => {
    setValue(props.track.volume);
  }, [props.track.volume])

  return (
    <div style={{width: "100%", height: "100%"}} title={getTrackVolumeTitle(props.track)}>
      <Slider
        className="p-0 no-shadow"
        disabled={(props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) > 1}
        label={`${value <= -80 ? "-Infinity" : value} dB`}
        max={6}
        marks={[
          {value: 6, label: ""},
          {value: 0, label: ""},
          {value: -6, label: ""},
          {value: -12, label: ""},
          {value: -18, label: ""},
          {value: -24, label: ""},
          {value: -30, label: ""},
          {value: -36, label: ""},
          {value: -42, label: ""},
          {value: -48, label: ""},
          {value: -54, label: ""},
          {value: -60, label: ""},
          {value: -66, label: ""},
          {value: -72, label: ""},
          {value: -78, label: ""}
        ]}
        min={-80}
        orientation="vertical"
        onChange={(e, v) => setValue(v as number)}
        onChangeCommitted={(e, v) => props.setTrack({...props.track, volume: v as number})}
        showLabelOnHover
        style={{height: "100%", width: "100%", opacity: (props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) > 1 ? 0.4 : 1}}
        sx={{
          color: "#0000",
          "& .MuiSlider-thumb": {
            backgroundColor: "#ccc",
            borderRadius: "3px",
            width: "13px",
            height: "18px",
            boxShadow: "none",
            border: "1px solid #0004"
          },
          "& .MuiSlider-thumb::before": {
            borderBottom: "1px solid #0004",
            width: "80%",
            transform: "translateY(-7px)",
            borderRadius: "0px",
            boxShadow: "none"
          },
          "& .MuiSlider-rail": {
            backgroundColor: "#000",
          },
          "& .MuiSlider-track": {
            border: "1px solid #0002"
          },
          "& .MuiSlider-mark": {
            backgroundColor: "#0004",
            width: 12,
            height: 2
          }
        }}
        value={value}
      />
    </div>
  )
}


const MixerTrack = (props : {order? : number, master : Track | undefined, track : Track, setTrack : (track : Track) => void}) => {
  const [name, setName] = React.useState(props.track.name);
  const [effectId, setEffectId] = React.useState<ID | null>(props.track.fx.effects.length ? props.track.fx.effects[0].id : null);

  React.useEffect(() => {
    setName(props.track.name);
  }, [props.track.name])

  return (
    <div 
      className="disable-highlighting"
      style={{height: "100%", width: 85, backgroundColor: "#ddd", flexShrink: 0, borderRight: "1px solid #0004"}}
    >
      <div style={{flex: 1, height: "100%", display: "flex", flexDirection: "column"}}>
        <div className="py-1 d-flex align-items-center" style={{flex: 1, width: "100%", flexDirection: "column"}}>
          <FXComponent
            chainControlsOnHover
            effectId={effectId}
            fx={props.track.fx}
            onChangeEffect={effect => setEffectId(effect?.id || null)}
            onChangeFXChain={chain => props.setTrack({...props.track, fx: {...props.track.fx, chainId: chain?.id || null}})}
            onSetEffects={effects => props.setTrack({...props.track, fx: {...props.track.fx, effects}})}
            style={{
              add: {marginLeft: 2, backgroundColor: "#0000"},
              addIcon: {fontSize: 11, color: "#333"},
              bottom: {height: 14, backgroundColor: "#fff9"},
              container: {width: "95%", marginBottom: 4, boxShadow: "0 0px 2px 1px #0002"},
              enableIcon: {fontSize: 11},
              effectContainer: {paddingLeft: 2},
              effectActionsContainer: {padding: 0},
              fxChainContainer: {marginLeft: 2},
              fxChainText: {fontSize: 11},
              moreIcon: {fontSize: 12},
              nextIcon: {fontSize: 16},
              nextPrevButtons: {width: 8},
              prevIcon: {fontSize: 16},
              saveIcon: {fontSize: 12},
              top: {height: 14, backgroundColor: "#fff9", marginBottom: 1},
              removeIcon: {fontSize: 12},
              text: {fontSize: 11, transform: "translate(-2px, 1px)"}
            }}
          />
          <div style={{flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative"}}>
            <Knob
              bidirectional
              degrees={270}
              disabled={(props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) > 1}
              max={100}
              meter={(props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) <= 1}
              meterStyle={{bgColor: "#0001", guageColor: "#fff"}}
              min={-100}
              onChange={p => props.setTrack({...props.track, pan: p})}
              size={20}
              style={{knob: {backgroundColor: "#fff9", boxShadow: "0 1px 2px 1px #0008"}, container: {margin: "2px 0 6px"}}}
              title={getTrackPanTitle(props.track)}
              value={props.track.pan}
            />
            <div style={{width: 2, height: "100%", position: "relative"}}>
              <MixerSlider setTrack={props.setTrack} track={props.track} />
              <div 
                className="position-absolute d-flex"
                style={{top: 0, left: -16, height: "100%", transform: "translate(-100%, 0)"}}
              >
                <VolumeMeter volume={props.track.volume} style={{width: 4, marginRight: 5, boxShadow: "0 0px 1px 1px #0002"}} />
                <VolumeMeter volume={props.track.volume} style={{width: 4, boxShadow: "0 0px 1px 1px #0002"}} />
              </div>
            </div>
            <div 
              className="position-absolute d-flex rounded" 
              style={{
                top: "50%", 
                right: 7, 
                transform: "translateY(-50%)", 
                flexDirection: "column", 
                backgroundColor: "#fff7", 
                padding: 2,
                boxShadow: "0 1px 2px 1px #0004"
              }}
            >
              <button 
                className={!props.track.isMaster ? "mb-1" : ""} 
                onClick={() => props.setTrack({...props.track, mute: !props.track.mute})}
                style={{
                  padding: 0, 
                  fontSize: 12, 
                  fontWeight: "bold", 
                  color: (props.master?.mute || props.track.mute) ? "#f00" : "#000a", 
                  backgroundColor: "#0000",
                  opacity: (props.master?.mute && !props.track.isMaster) ? 0.4 : 1,
                  pointerEvents: (props.master?.mute && !props.track.isMaster) ? "none" : "auto",
                  margin: "0 2px"
                }}
                title={props.master?.mute && !props.track.isMaster ? "Unmute" : "Mute"}
              >
                M
              </button>
              {
                !props.track.isMaster &&
                <button 
                  className="mb-1"
                  onClick={() => props.setTrack({...props.track, solo: !props.track.solo})}
                  style={{
                    padding: 0, 
                    fontSize: 12, 
                    fontWeight: "bold", 
                    color: props.track.solo ? "#a80" : "#000a", 
                    backgroundColor: "#0000",
                  }}
                  title="Toggle Solo"
                >
                  S
                </button>
              }
              {
                !props.track.isMaster &&
                <IconButton 
                  className="p-0" 
                  onClick={() => props.setTrack({...props.track, armed: !props.track.armed})} 
                  title={props.track.armed ? "Disarm" : "Arm"}
                >
                  <FiberManualRecord
                    style={{fontSize: 12, fontWeight: "bold", backgroundColor: "#0000", color: props.track.armed ? "#f00" : "#000a"}}
                  />
                </IconButton>
              }
            </div>
          </div>
        </div>
        <div className="col-12 m-0 p-0" style={{backgroundColor: props.track.color}}>
          <form 
            className="col-12 m-0 p-0 center-by-flex" 
            onSubmit={e => {e.preventDefault(); props.setTrack({...props.track, name})}}
            style={{backgroundColor: "#fff9", textOverflow: "ellipsis", borderTop: "1px solid #0004"}}
          >
            <EditableDisplay
              className={`text-center col-12 no-borders no-outline ${props.track.isMaster ? "pe-none" : ""}`} 
              onChange={e => setName((e.target as HTMLInputElement).value)}
              onBlur={e => props.setTrack({...props.track, name})}
              readOnly={props.track.isMaster}
              style={{fontSize: 13, fontWeight: "bold", backgroundColor: "#0000", height: "100%"}}
              title={name}
              value={name}
            />
          </form>
          <p 
            className="col-12 text-center overflow-hidden m-0" 
            style={{fontSize: 12, height: 14, lineHeight: 1.3, borderTop: "1px solid #0004"}}
          >
            {props.order || <span style={{color: "#fffb"}}>M</span>}
          </p>
        </div>
      </div>
    </div>
  )
}


export default class Mixer extends React.Component {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {setTrack, tracks} = this.context!
    const masterTrack = tracks.find(t => t.isMaster)

    return(
      <div 
        className="scrollbar thin-thumb col-12 d-flex" 
        style={{height: "100%", overflowX: "auto", backgroundColor: "#555", borderTop: "2px solid #fff5"}}
      >
        {masterTrack && <MixerTrack master={masterTrack} track={masterTrack} setTrack={setTrack} />}
        {
          tracks.filter(t => !t.isMaster).map((t, idx) => (
            <MixerTrack key={t.id} master={masterTrack} order={idx + 1} track={t} setTrack={setTrack} />
          ))
        }
      </div>
    )
  }
}