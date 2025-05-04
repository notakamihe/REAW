import React, { CSSProperties, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { WorkstationContext } from "@/contexts"
import { AutomationLaneEnvelope, ContextMenuType, Track } from "@/services/types/types"
import { Knob, HueInput, Dialog, Meter } from "@/components/widgets"
import { IconButton, DialogContent } from "@mui/material"
import { Add, Check, FiberManualRecord } from "@mui/icons-material"
import { AutomationLaneTrack, FXComponent } from "@/screens/workstation/components"
import { getCSSVarValue, hslToHex, hueFromHex, normalizeHex } from "@/services/utils/general"
import { 
  BASE_HEIGHT, 
  formatPanning, 
  formatVolume, 
  getLaneColor, 
  getVolumeGradient, 
  volumeToNormalized, 
  scrollToAndAlign,
  waitForScrollWheelStop
} from "@/services/utils/utils"
import { Automation, TrackIcon } from "@/components/icons"
import { openContextMenu } from "@/services/electron/utils"

interface IProps {
  className?: string;
  colorless?: boolean;
  order?: number;
  style?: CSSProperties;
  track: Track;
}

function TrackComponent({ className, colorless, order, track, style }: IProps) {
  const { 
    deleteTrack, 
    duplicateTrack, 
    getTrackCurrentValue,
    masterTrack, 
    playheadPos,
    scrollToItem,
    selectedTrackId,
    setScrollToItem,
    setSelectedTrackId, 
    setTrack,
    showMaster,
    timelineSettings,
    verticalScale
  } = useContext(WorkstationContext)!;

  const [hue, setHue] = useState(hueFromHex(track.color));
  const [name, setName] = useState(track.name);
  const [showChangeHueDialog, setShowChangeHueDialog] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const volume = useMemo(() => {
    const lane = track.automationLanes.find(lane => lane.envelope === AutomationLaneEnvelope.Volume);
    return getTrackCurrentValue(track, lane);
  }, [track.automationLanes, playheadPos, track.volume, timelineSettings.timeSignature])

  const pan = useMemo(() => {
    const lane = track.automationLanes.find(lane => lane.envelope === AutomationLaneEnvelope.Pan);
    return getTrackCurrentValue(track, lane);
  }, [track.automationLanes, playheadPos, track.pan, timelineSettings.timeSignature])

  useEffect(() => setName(track.name), [track.name]);

  useLayoutEffect(() => {
    if (scrollToItem?.type === "track" && scrollToItem.params?.trackId === track.id) {
      const trackSection = document.getElementById("track-section")!;

      waitForScrollWheelStop(trackSection, () => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const trackSectionRect = trackSection.getBoundingClientRect();
  
          if (rect.bottom < trackSectionRect.top + 43) {
            const pos = rect.top - trackSectionRect.top + trackSection.scrollTop - 33;
            scrollToAndAlign(trackSection, { top: pos }, { top: 0 });
          } else if (rect.top > trackSectionRect.bottom - 75) {
            if (rect.height > trackSection.clientHeight) {
              const pos = rect.top - trackSectionRect.top + trackSection.scrollTop - 33;
              scrollToAndAlign(trackSection, { top: pos }, { top: 0 });
            } else {
              const pos = rect.bottom - trackSectionRect.top + trackSection.scrollTop;
              scrollToAndAlign(trackSection, { top: pos }, { top: 1 });
            }
          }
        }
  
        setScrollToItem(null);
      })
    }
  }, [scrollToItem])

  function handleAddAutomationLaneContextMenu() {
    if (track.automationLanes.find(lane => !lane.show)) { 
      openContextMenu(ContextMenuType.AddAutomationLane, { lanes: track.automationLanes }, params => {
        if (params.lane) {
          const automationLanes = track.automationLanes.slice();
          const laneIdx = automationLanes.findIndex(lane => lane.id === params.lane.id);
          
          if (laneIdx > -1) {
            automationLanes[laneIdx] = { ...automationLanes[laneIdx], show: true };
            setTrack({...track, automationLanes});
          }
        }
      })
    }
  }

  function handleChangeHueSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTrack({...track, color: hslToHex(hue, 80, 70)});
    setShowChangeHueDialog(false);
  }

  function handleContextMenu() {
    if (track.id !== masterTrack.id && document.activeElement?.nodeName !== "INPUT") {
      openContextMenu(ContextMenuType.Track, {}, params => {
        switch (params.action) {
          case 0:
            duplicateTrack(track);
            break;
          case 1:
            deleteTrack(track);
            break;
          case 2:
            setShowChangeHueDialog(true);
            setHue(hueFromHex(track.color));
            break;
        }
      });
    }
  }

  function handleSelectAutomationMode() {
    openContextMenu(ContextMenuType.AutomationMode, { mode: track.automationMode }, params => {
      if (params.mode) 
        setTrack({ ...track, automationMode: params.mode });
    });
  }
 
  const selected = selectedTrackId === track.id;
  const isMaster = track.id === masterTrack.id;
  const noHiddenLanes = !track.automationLanes.find(lane => !lane.show);
  const mutedByMaster = masterTrack?.mute && !isMaster;
  
  const automationColor = colorless ? normalizeHex(getCSSVarValue("--border6")) : track.color;
  const borderColor = colorless ? "var(--border6)" : "#444";

  const height = BASE_HEIGHT * verticalScale;
  const addExtraHeight = !isMaster && height < 80 && track.automation;
  const trackHeight = Math.max(height, addExtraHeight ? 76 : 0);
  const muteButtonTitle = mutedByMaster 
    ? "Master is muted"
    : `${track.mute ? "Unmute" : "Mute"}${selected ? " [M]" : ""}`;

  const styles = {
    orderTextContainer: {  
      width: 14,
      border: "1px solid var(--border1)",
      borderWidth: "0 1px 1px 0",
      backgroundColor: selected ? "#fff" : ""
    },
    orderText: {
      fontFamily: "Abel, Roboto, sans-serif",
      letterSpacing: -0.5,
      fontSize: (order?.toString() || "").length > 2 ? 9 : 11,
      color: selected ? "#000" : "var(--border6)",
      margin: `0 0 0 -1px`,
    },
    trackLeftSection: { overflow: "hidden", backgroundColor: colorless ? "#0000" : track.color },
    nameFxVolumePanContainer: {
      padding: `${!addExtraHeight ? 4 : 3}px 3px 0 4px`,
      flex: 1,
      maxHeight: trackHeight > 80 ? 71 : "none"
    },
    nameContainer: {
      border: `1px solid ${borderColor}`,
      marginBottom: !addExtraHeight ? 3 : 1,
      backgroundColor: colorless ? "#0000" : "#fff6"
    },
    nameInput: {
      backgroundColor: "#0000",
      fontSize: 13,  
      outline: "none",
      height: "100%",
      color: colorless ? "var(--fg1)" : "#000",
      pointerEvents: isMaster ? "none" : "auto"
    },
    fx: {
      container: { backgroundColor: colorless ? "#0000" : "#fff6", borderColor },
      effect: { actionsContainer: { borderColor } },
      preset: { optionsList: { borderColor } },
      icon: { color: colorless ? "var(--border6)" : "#000" },
      toggle: { button: { borderColor }, icon: { color: colorless ? "var(--fg3)" : "#000" } },
      text: { color: colorless ? "var(--fg1)" : "#000" },
      top: { borderBottomColor: borderColor }
    },
    knob: { 
      knob: { border: `1px solid ${borderColor}`, backgroundColor: colorless ? "#0000" : "#fff6" },
      indicator: { backgroundColor: `${borderColor}` } 
    },
    meterContainer: { 
      border: "1px solid var(--border1)", 
      margin: trackHeight > 80 ? "0 3px" : 0,
      borderWidth: trackHeight > 80 ? "1px" : "1px 0 0"
    },
    meter: { height: 3, backgroundColor: "var(--bg1)", boxSizing: "content-box" },
    controlButtonsContainer: { padding: "3px 3px 4px", borderLeft: "1px solid var(--border1)", flexShrink: 0 },
    muteButton: {
      color: track.mute || masterTrack?.mute ? "#ff004c" : "var(--border6)",
      borderWidth: "1px 0 0 1px"
    },
    soloButton: { color: track.solo ? "var(--fg2)" : "var(--border6)", borderWidth: "1px 0 0 1px" },
    armIcon: { fontSize: 14, color: track.armed ? "#ff004c" : "var(--border6)" },
    automationButton: { color: track.automation ? "var(--fg3)" : "var(--border6)", borderBottom: "none" },
    automationMode: {
      border: "1px solid var(--border6)", 
      color: "var(--fg1)",
      fontSize: 12,
      lineHeight: 1,
      fontFamily: "Abel, Roboto, sans-serif",
      padding: "2px 2px 1px",
      letterSpacing: -0.4,
      textTransform: "uppercase",
      backgroundColor: "#0000"
    },
    addAutomationButtonIcon: { color: "var(--border6)", transform: "translate(-0.5px, 0.5px)" }
  } as const;

  if (showMaster || !isMaster) {
    return (
      <div 
        onMouseDown={() => setSelectedTrackId(track.id)} 
        ref={ref}
        style={{ display: "flex", width: "100%", height: "fit-content", ...style }}
      >
        <div className="center-flex" style={styles.orderTextContainer}>
          <p style={styles.orderText}>{isMaster ? "M" : order}</p>
        </div>
        <div className="overflow-hidden" style={{ flex: 1 }}>
          <div
            className={`p-0 d-flex overflow-hidden position-relative col-12 ${className}`}
            onContextMenu={handleContextMenu}
            style={{ height: trackHeight, borderBottom: "1px solid var(--border1)" }}
          >
            <div className="d-flex flex-column" style={styles.trackLeftSection}>
              <div className="d-flex" style={styles.nameFxVolumePanContainer}>
                <div className="overflow-hidden" style={{height: "fit-content"}}>
                  <div className="d-flex align-items-center stop-reorder" style={styles.nameContainer}>
                    <IconButton style={{padding: "2px 2px 2px 3px", borderRadius: 0}}>
                      <TrackIcon color={borderColor} size={14} type={track.type} />
                    </IconButton>
                    <form
                      onSubmit={e => {e.preventDefault(); setTrack({ ...track, name })}}
                      title={name}
                      style={{ lineHeight: 1, paddingLeft: 1 }}
                    >
                      <input
                        className="m-0 p-0 pe-1 col-12 no-borders"
                        onChange={e => setName(e.target.value)}
                        onBlur={() => setTrack({ ...track, name })}
                        style={styles.nameInput}
                        value={name}
                      />
                    </form>
                  </div>
                  <FXComponent compact={trackHeight < 75} track={track} style={styles.fx} />
                </div>
                <div style={{marginLeft: 3, width: 22}}>
                  <Knob
                    disabled={volume.isAutomated}
                    max={6}
                    min={-Infinity}  
                    onChange={val => setTrack({ ...track, volume: val })}
                    origin={0}
                    scale={{
                      toNormalized: value => Math.pow(10, value / 75.1456) * 0.8321,
                      toScale: value => value === 0 ? -Infinity : 75.1456 * Math.log10(value / 0.8321)
                    }}
                    showMeter={false}
                    size={20}
                    style={{ ...styles.knob, knob: { ...styles.knob.knob, marginBottom: 3 } }}
                    title={`Volume: ${formatVolume(volume.value!)}${volume.isAutomated ? " (automated)" : ""}`}
                    tooltipProps={{ container: { vertical: "#track-section" } }}
                    value={volume.value!}
                    valueLabelFormat={value => formatVolume(value)}
                  />
                  <Knob
                    disabled={pan.isAutomated}
                    max={100}
                    min={-100}
                    onChange={val => setTrack({ ...track, pan: val })}
                    origin={0}
                    showMeter={false}
                    size={20}
                    style={styles.knob}
                    title={`Pan: ${formatPanning(pan.value!)}${pan.isAutomated ? " (automated)" : ""}`}
                    tooltipProps={{ container: { vertical: "#track-section" } }}
                    value={pan.value!}
                    valueLabelFormat={value => formatPanning(value, true)}
                  />
                </div>
              </div>
              <div className="d-flex flex-column" style={styles.meterContainer}>
                <Meter
                  color={getVolumeGradient(false)}
                  marks={[{value: 75, style: {backgroundColor: "var(--border1)"}}]}
                  percent={volumeToNormalized(track.volume) * 100}
                  style={{ ...styles.meter, borderBottom: "1px solid var(--border1)" }}
                />  
                <Meter
                  color={getVolumeGradient(false)}
                  marks={[{value: 75, style: {backgroundColor: "var(--border1)"}}]}
                  percent={volumeToNormalized(track.volume) * 100}
                  style={styles.meter}
                />
              </div>
            </div>
            <div className="d-flex flex-column align-items-center" style={styles.controlButtonsContainer}>
              <div style={{ display: "flex", flexDirection: !isMaster ? "column" : "row" }}>
                <div style={{display: "flex"}}>
                  <div title={muteButtonTitle}>
                    <button
                      className={`track-btn stop-reorder ${mutedByMaster ? "pe-none" : "pe-auto hover-4"}`}
                      onClick={() => setTrack({...track, mute: !track.mute})}
                      style={styles.muteButton}
                    >
                      <span style={{ opacity: mutedByMaster ? 0.5 : 1 }}>M</span>
                    </button>
                  </div>
                  {!isMaster && (
                    <button
                      className="track-btn hover-4 stop-reorder"
                      onClick={() => setTrack({...track, armed: !track.armed})}
                      style={{ borderBottom: "none" }}
                      title={(track.armed ? "Disarm" : "Arm") + (selected ? " [Shift+A]" : "")}
                    >
                      <FiberManualRecord style={styles.armIcon} />
                    </button>
                  )}
                </div>
                <div style={{display: "flex"}}>
                  {!isMaster && (
                    <button
                      className="track-btn hover-4 stop-reorder"
                      onClick={() => setTrack({...track, solo: !track.solo})}
                      style={styles.soloButton}
                      title={"Toggle Solo" + (selected ? " [S]" : "")}
                    >
                      S
                    </button>
                  )}
                  <button
                    className="track-btn hover-4 stop-reorder"
                    onClick={() => setTrack({...track, automation: !track.automation})}
                    style={styles.automationButton}
                    title={`${track.automation ? "Hide" : "Show"} Automation${selected ? " [A]": ""}`}
                  >
                    A
                  </button>
                </div>
              </div>
              <button
                className="stop-reorder m-0 col-12 text-center"
                onMouseDown={handleSelectAutomationMode}
                style={styles.automationMode}
                title={`Automation Mode: ${track.automationMode}`}
              >
                {track.automationMode}
              </button>
              <div className="d-flex align-items-end col-12 overflow-hidden" style={{flex: 1, maxHeight: 20}}>
                {track.automation && (
                  <IconButton
                    className={`p-0 stop-reorder align-items-center ${noHiddenLanes ? "disabled" : ""}`}
                    onMouseDown={handleAddAutomationLaneContextMenu}
                    style={{borderRadius: 0, border: "1px solid var(--border6)", width: "100%"}}
                  >
                    <Add style={{ fontSize: 15, ...styles.addAutomationButtonIcon }} />
                    <Automation size={13} style={styles.addAutomationButtonIcon} />
                  </IconButton>
                )}
              </div>
            </div>
          </div>
          {track.automation && (
            <div style={{width: "100%"}}>
              {track.automationLanes.map((lane, idx) => {
                if (lane.show)
                  return (
                    <AutomationLaneTrack
                      color={getLaneColor(track.automationLanes, idx, automationColor)}
                      key={lane.id}
                      lane={lane}
                      track={track}
                    />
                  );
              })}
            </div>
          )}
          <Dialog
            onClose={() => setShowChangeHueDialog(false)}
            open={showChangeHueDialog}
            style={{width: 350}}
            title={`Change Hue for ${track.name}`}
          >
            <DialogContent style={{padding: 12}}>
              <form className="d-flex align-items-center col-12" onSubmit={handleChangeHueSubmit}>
                <HueInput onChange={hue => setHue(hue)} value={hue} />
                <button className="btn-3" style={{marginLeft: 6}}>
                  <Check style={{fontSize: 16, color: "var(--bg6)", marginTop: -2}} />
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  return null;
}

export default memo(TrackComponent);