import { FiberManualRecord } from "@mui/icons-material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { ID, Track } from "renderer/types/types";
import { getTrackPanTitle, getTrackVolumeTitle } from "renderer/utils/utils";
import FXComponent from "./FXComponent";
import { EditableDisplay, Knob, Slider, VolumeMeter } from "./ui";
import ButtonGroup from "./ui/ButtonGroup";

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
        style={{height: "100%", width: 2, opacity: (props.track.automationLanes.find(l => l.isVolume)?.nodes.length || 0) > 1 ? 0.4 : 1}}
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
            backgroundColor: "var(--border7)",
          },
          "& .MuiSlider-track": {
            backgroundColor: "var(--border7)"
          },
          "& .MuiSlider-mark": {
            backgroundColor: "var(--border7)",
            width: 12,
            height: "1px"
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
      style={{height: "100%", width: 85, backgroundColor: "var(--bg3)", flexShrink: 0}}
    >
      <div style={{flex: 1, height: "100%", display: "flex", flexDirection: "column"}}>
        <div className="pb-1 d-flex align-items-center" style={{flex: 1, width: "100%", flexDirection: "column", borderRight: "1px solid var(--border1)"}}>
          <FXComponent
            chainControlsOnHover
            effectId={effectId}
            fx={props.track.fx}
            onChangeEffect={effect => setEffectId(effect?.id || null)}
            onChangeFXChain={chain => props.setTrack({...props.track, fx: {...props.track.fx, chainId: chain?.id || null}})}
            onSetEffects={effects => props.setTrack({...props.track, fx: {...props.track.fx, effects}})}
            style={{
              add: {marginLeft: 1, backgroundColor: "#0000"},
              addIcon: {fontSize: 12, color: "var(--fg1)", marginTop: 0},
              bottom: {height: 16, backgroundColor: "#0000", borderBottom: "1px solid var(--border1)", borderRadius: 0},
              container: {width: "100%", marginBottom: 2},
              enableIcon: {fontSize: 12, color: "var(--fg1)"},
              effectContainer: {paddingLeft: 2},
              effectActionsContainer: {padding: 0, backgroundColor: "var(--bg4)"},
              fxChainContainer: {marginLeft: 2},
              fxChainText: {fontSize: 12, color: "var(--fg1)"},
              moreIcon: {fontSize: 12, color: "var(--fg1)"},
              nextIcon: {fontSize: 16, color: "var(--fg1)"},
              nextPrevButtons: {width: 8},
              prevIcon: {fontSize: 16, color: "var(--fg1)"},
              saveIcon: {fontSize: 12, color: "var(--fg1)"},
              top: {height: 16, backgroundColor: "#0000", marginBottom: 0, borderBottom: "1px solid var(--border1)", borderRadius: 0},
              removeIcon: {fontSize: 12, color: "var(--fg1)"},
              text: {fontSize: 12, color: "var(--fg1)"}
            }}
          />
          <div style={{flex: 1, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", position: "relative"}}>
            <Knob
              bidirectional
              degrees={270}
              disabled={(props.track.automationLanes.find(l => l.isPan)?.nodes.length || 0) > 1}
              lineStyle={{height: 4, top: 6, borderColor: "var(--border7)"}}
              max={100}
              meter={false}
              min={-100}
              onChange={p => props.setTrack({...props.track, pan: p})}
              size={20}
              style={{knob: {backgroundColor: "#0000", border: "1px solid var(--border7)"}, container: {margin: "2px 0 6px"}}}
              title={getTrackPanTitle(props.track)}
              value={props.track.pan}
            />
            <div style={{width: 2, height: "100%", position: "relative"}}>
              <MixerSlider setTrack={props.setTrack} track={props.track} />
              <div 
                className="position-absolute d-flex"
                style={{top: 0, left: -16, height: "100%", transform: "translate(-100%, 0)"}}
              >
                <VolumeMeter volume={props.track.volume} style={{width: 6, marginRight: 5}} meterBackgroundColor="var(--bg3)" />
                <VolumeMeter volume={props.track.volume} style={{width: 6}} meterBackgroundColor="var(--bg3)" />
              </div>
              <ButtonGroup 
                buttonStyle={{fontWeight: "bold", width: 20, height: 20, borderColor: "var(--border7)"}}
                orientation="vertical"
                style={{position: "absolute", top: 0, right: -18, transform: "translate(100%, 0)", height: "fit-content"}}
              >
                <button
                  onClick={() => props.setTrack({...props.track, mute: !props.track.mute})}
                  style={{
                    color: props.master?.mute || props.track.mute ? "#f00" : "var(--border7)", 
                    backgroundColor: props.master?.mute || props.track.mute ? "#fff" : "#0000",
                    opacity: (props.master?.mute && !props.track.isMaster) ? 0.5 : 1,
                    pointerEvents: (props.master?.mute && !props.track.isMaster) ? "none" : "auto"
                  }}
                  title={props.master?.mute || props.track.mute ? "Unmute" : "Mute"}
                >
                  M
                </button>
                {
                  !props.track.isMaster ?
                  <button
                    onClick={() => props.setTrack({...props.track, solo: !props.track.solo})}
                    style={{
                      color: props.track.solo ? "#a80" : "var(--border7)", 
                      backgroundColor: props.track.solo ? "#fff" : "#0000"
                    }}
                    title="Toggle Solo"
                  >
                    S
                  </button> : null
                }
                {
                  !props.track.isMaster ? 
                  <button
                    onClick={() => props.setTrack({...props.track, armed: !props.track.armed})}
                    style={{backgroundColor: props.track.armed ? "#fff" : "#0000"}}
                    title={props.track.armed ? "Disarm" : "Arm"}
                  >
                    <FiberManualRecord style={{fontSize: 14, color: props.track.armed ? "#f00" : "var(--border7)"}} />
                  </button> : null
                }
              </ButtonGroup>
            </div>
          </div>
        </div>
        <div className="col-12 m-0 p-0" style={{backgroundColor: props.track.color, borderColor: "#0006", borderStyle: "solid", borderWidth: "0 1px 0 0"}}>
          <form 
            className="col-12 m-0 p-0 center-by-flex" 
            onSubmit={e => {e.preventDefault(); props.setTrack({...props.track, name})}}
            style={{backgroundColor: "#fff9", textOverflow: "ellipsis", borderTop: "1px solid var(--border1)"}}
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
          <div 
            className="col-12 overflow-hidden m-0 d-flex justify-content-center align-items-center" 
            style={{height: 14, borderTop: "1px solid #0006"}}
          >
            <p className="m-0" style={{fontSize: 12, lineHeight: 1.3}}>{props.order || "M"}</p>
          </div>
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
        className="scrollbar3 col-12 d-flex" 
        style={{height: "100%", overflowX: "auto", backgroundColor: "var(--bg1)", borderTop: "1px solid var(--border1)"}}
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