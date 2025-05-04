import React, { memo, useContext, useEffect, useMemo, useState } from "react";
import { Check, FiberManualRecord } from "@mui/icons-material";
import { DialogContent, IconButton } from "@mui/material";
import { WorkstationContext } from "@/contexts";
import { AutomationLaneEnvelope, AutomationMode, ContextMenuType, Track } from "@/services/types/types";
import { hslToHex, hueFromHex } from "@/services/utils/general";
import { formatPanning, getVolumeGradient, volumeToNormalized } from "@/services/utils/utils";
import { FXComponent, TrackVolumeSlider } from "@/screens/workstation/components";
import { TrackIcon } from "@/components/icons";
import { SortData } from "@/components/widgets/SortableList";
import { Dialog, HueInput, Knob, Meter, SelectSpinBox, SortableList, SortableListItem } from "@/components/widgets";
import { openContextMenu } from "@/services/electron/utils";

const MixerTrack = memo(({ order, track }: { order?: number, track: Track }) => {
  const {
    deleteTrack,
    duplicateTrack,
    getTrackCurrentValue,
    masterTrack,
    playheadPos,
    selectedTrackId,
    setSelectedTrackId,
    setTrack,
    timelineSettings
  } = useContext(WorkstationContext)!;

  const [hue, setHue] = useState(hueFromHex(track.color));
  const [name, setName] = useState(track.name);
  const [showChangeHueDialog, setShowChangeHueDialog] = useState(false);

  const pan = useMemo(() => {
    const lane = track.automationLanes.find(lane => lane.envelope === AutomationLaneEnvelope.Pan);
    return getTrackCurrentValue(track, lane);
  }, [track.automationLanes, playheadPos, track.pan, timelineSettings.timeSignature])

  useEffect(() => setName(track.name), [track.name])

  function changeTrackColor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTrack({...track, color: hslToHex(hue, 80, 70)});
    setShowChangeHueDialog(false);
  }

  function handleContextMenu() {
    if (!isMaster && document.activeElement?.nodeName !== "INPUT") {
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
      })
    }
  }

  const isMaster = track.id === masterTrack.id;
  const selected = selectedTrackId === track.id;
  const mutedByMaster = masterTrack.mute && !isMaster;

  const muteButtonTitle = mutedByMaster 
    ? "Master is muted"
    : `${track.mute ? "Unmute" : "Mute"}${selected ? " [M]" : ""}`;

  const style = {
    fx: {
      add: { button: { marginTop: 1, marginRight: -1 } },
      bottom: { height: 17, borderBottom: "1px solid var(--border1)", paddingRight: 1 },
      container: { backgroundColor: "#0000", border: "none", marginBottom: 4, width: "calc(100% + 2px)" },
      effect: { actionsContainer: { border: "none", padding: 0, marginLeft: 2 }, container: { paddingTop: 1 } },
      preset: { optionsList: { maxHeight: 100, padding: 3, borderColor: "var(--border1)" } },
      icon: { color: "var(--border6)", fontSize: 12 },
      next: { icon: { fontSize: 20 } },
      prev: { icon: { fontSize: 20 } },
      spinButton: { width: 12 },
      text: { color: "var(--border6)", fontSize: 12, lineHeight: "unset" },
      top: { borderColor: "var(--border1)", height: 17, paddingRight: 2 }
    },
    automationModeSpinBox: {
      container: { height: 18, border: "1px solid var(--border1)", padding: "0 1px", margin: "auto" },
      select: { fontSize: 13, color: "var(--fg1)", paddingLeft: 4 },
      nextIcon: { fontSize: 20, color: "var(--fg1)" },
      option: { fontSize: 13 },
      optionsList: { 
        maxHeight: 64, 
        borderColor: "var(--border1)", 
        backgroundColor: "var(--bg1)", 
        padding: "3px 1px 3px 3px" 
      },
      prevIcon: { fontSize: 20, color: "var(--fg1)" }
    },
    volumeMeter: {
      width: 3,
      border: "1px solid var(--border12)",
      backgroundColor: "var(--bg9)",
      boxSizing: "content-box"
    },
    panKnob: {
      knob: { backgroundColor: "#0000", border: "1px solid var(--border6)", margin: "2px 1px 6px 0" },
      indicator: { backgroundColor: "var(--border6)" },
      meter: { color: "var(--border6)", sizeRatio: 1.1, width: 1.5 }
    },
    muteButton: { 
      color: track.mute || masterTrack.mute ? "#ff004c" : "var(--border6)", 
      borderBottomWidth: isMaster ? 1 : 0
    },
    armIcon: { fontSize: 14, color: track.armed ? "#ff004c" : "var(--border6)" },
    peakLevel: {
      lineHeight: 1,
      color: "var(--fg1)",
      margin: "auto 5.5px 4px 0",
      fontSize: 11,
      border: "1px solid var(--border1)",
      width: 34
    },
    masterText: {
      height: 37,
      fontSize: 14,
      letterSpacing: 1,
      color: selected ? "#000" : "var(--border6)",
      backgroundColor: selected ? "#fff" : "",
      border: "1px solid var(--border1)",
      borderWidth: "1px 1px 0 0",
    },
    trackTextContainer: { border: "1px solid #0007", borderWidth: "1px 1px 0 0", backgroundColor: track.color },
    nameText: { fontSize: 13, height: "100%", backgroundColor: "#0000", color: "#000" },
    orderTextContainer: { height: 18, borderTop: "1px solid #0007" },
    orderText: {
      fontSize: 12, 
      fontWeight: "bold", 
      lineHeight: 1,
      backgroundColor: selected ? "#fff" : "#0000",
      borderRadius: 3,
      border: selected ? "1px solid #0009" : "none"
    }
  } as const;

  return (
    <div
      onContextMenu={handleContextMenu}
      onMouseDown={() => setSelectedTrackId(track.id)}
      style={{ position: "relative", height: "100%", width: 85, flexShrink: 0 }}
    >
      <div className="d-flex flex-column" style={{ flex: 1, height: "100%" }}>
        <div
          className={"d-flex flex-column col-12 overflow-hidden" + (selected ? " overlay-1" : "")}
          style={{ flex: 1, borderRight: "1px solid var(--border1)", position: "relative" }}
        >
          <FXComponent 
            classes={{ 
              next: { button: "focus-1" },
              presetButtons: "removed", 
              presetNameFormButtons: "removed",
              preset: { container: "focus-1" },
              prev: { button: "focus-1" },
              top: "show-on-hover"
            }} 
            track={track} 
            style={style.fx} 
          />
          <SelectSpinBox
            classes={{ container: "hover-2 stop-reorder col-11" }}
            onChange={val => setTrack({...track, automationMode: val as AutomationMode})}
            options={[
              { label: "Read", value: AutomationMode.Read },
              { label: "Write", value: AutomationMode.Write },
              { label: "Touch", value: AutomationMode.Touch },
              { label: "Trim", value: AutomationMode.Trim },
              { label: "Latch", value: AutomationMode.Latch }
            ]}
            optionsPopover={{ marginThreshold: 0 }}
            style={style.automationModeSpinBox}
            title={`Automation Mode: ${track.automationMode}`}
            value={track.automationMode}
          />
          <div style={{flex: 1, width: "100%", display: "flex", position: "relative"}}>
            <div className="position-relative d-flex" style={{ marginLeft: 6, padding: "9px 0 10px" }}>
              <div className="d-flex" style={{ height: "100%" }}>
                <Meter
                  color={getVolumeGradient(true)}
                  marks={[{value: 75, style: {backgroundColor: "var(--border12)"}}]}
                  percent={volumeToNormalized(track.volume) * 100}
                  style={{ ...style.volumeMeter, marginRight: 2 }}
                  vertical
                />
                <Meter
                  color={getVolumeGradient(true)}
                  marks={[{value: 75, style: {backgroundColor: "var(--border12)"}}]}
                  percent={volumeToNormalized(track.volume) * 100}
                  style={style.volumeMeter}
                  vertical
                />
              </div>
              <TrackVolumeSlider className="stop-reorder ps-1" orientation="vertical" track={track} />
            </div>
            <div className="d-flex align-items-end" style={{flexDirection: "column", flex: 1}}>
              <div className="d-flex flex-column align-items-center mt-1" style={{ marginRight: 4 }}>
                <IconButton className="p-0 stop-reorder">
                  <TrackIcon color="var(--border6)" type={track.type} style={{marginBottom: 4}} />
                </IconButton>
                <Knob
                  bidirectionalMeter
                  disabled={pan.isAutomated}
                  max={100}
                  min={-100}
                  onChange={value => setTrack({ ...track, pan: value })}
                  origin={0}
                  size={20}
                  style={style.panKnob}
                  title={`Pan: ${formatPanning(pan.value!)}${pan.isAutomated ? " (automated)" : ""}`}
                  value={pan.value!}
                  valueLabelFormat={value => formatPanning(value, true)}
                />
                <div>
                  <div title={muteButtonTitle}>
                    <button
                      className={`track-btn stop-reorder ${mutedByMaster ? "pe-none" : "pe-auto hover-4"}`}
                      onClick={() => setTrack({ ...track, mute: !track.mute })}
                      style={style.muteButton}
                    >
                      <span style={{ opacity: mutedByMaster ? 0.5 : 1 }}>M</span>
                    </button>
                  </div>
                  {!isMaster && (
                    <>
                      <button
                        className="track-btn hover-4 stop-reorder"
                        onClick={() => setTrack({...track, solo: !track.solo})}
                        style={{ color: track.solo ? "var(--fg2)" : "var(--border6)", borderBottom: "none" }}
                        title={"Toggle Solo" + (selected ? " [S]" : "")}
                      >
                        S
                      </button>
                      <button
                        className="track-btn hover-4 stop-reorder"
                        onClick={() => setTrack({...track, armed: !track.armed})}
                        title={(track.armed ? "Disarm" : "Arm") + (selected ? " [Shift+A]" : "")}
                      >
                        <FiberManualRecord style={style.armIcon} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-center" style={style.peakLevel} title="Peak Level">-∞</p>
            </div>
          </div>
        </div>
        {isMaster ? (
          <p className="center-flex col-12 m-0 font-bold" style={style.masterText}>Master</p> 
        ) : ( 
          <div className="col-12 m-0 p-0" style={style.trackTextContainer}>
            <form
              className="col-12 m-0 center-flex"
              onSubmit={e => {e.preventDefault(); setTrack({...track, name})}}
              title={name}
              style={{backgroundColor: "#fff9", padding: "0 2px"}}
            >
              <input
                className={`m-0 p-0 col-12 no-borders text-center no-outline`}
                onChange={e => setName(e.target.value)}
                onBlur={() => setTrack({...track, name})}
                style={style.nameText}
                value={name}
              />
            </form>
            <div className="col-12 overflow-hidden m-0 center-flex" style={style.orderTextContainer}>
              <span className="m-0 py-0 px-2" style={style.orderText}>{order}</span>
            </div>
          </div>
        )}
      </div>
      <Dialog
        onClose={() => setShowChangeHueDialog(false)}
        open={showChangeHueDialog}
        style={{ width: 350 }}
        title={`Change Hue for ${track.name}`}
      >
        <DialogContent style={{ padding: 12 }}>
          <form className="d-flex align-items-center col-12" onSubmit={changeTrackColor}>
            <HueInput onChange={hue => setHue(hue)} value={hue} />
            <button className="btn-3" style={{ marginLeft: 6 }}>
              <Check style={{ fontSize: 16, color: "var(--bg6)", marginTop: -2 }} />
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
});

export default function Mixer() {
  const { masterTrack, setAllowMenuAndShortcuts, setTracks, tracks } = useContext(WorkstationContext)!;
  const [edgeIndex, setEdgeIndex] = useState(-1);

  useEffect(() => {
    return () => setAllowMenuAndShortcuts(true);
  }, [])

  function getListItemClass(idx: number) {
    if (idx === 0 && edgeIndex === 0)
      return "position-relative sort-indicator-v sort-indicator-v-left";
    else if (edgeIndex === idx + 1)
      return "position-relative sort-indicator-v";
    return "position-relative";
  }

  function handleSortEnd(_: MouseEvent, data: SortData) {
    if (data.edgeIndex > -1 && data.sourceIndex !== data.destIndex) {
      const destIndex = data.edgeIndex - (data.edgeIndex > data.sourceIndex ? 1 : 0);
      const newTracks = tracks.slice();
      const [removed] = newTracks.splice(data.sourceIndex, 1);
     
      newTracks.splice(destIndex, 0, removed);
      setTracks(newTracks);
    }

    setEdgeIndex(-1);
    setAllowMenuAndShortcuts(true);
  }

  return (
    <div
      className="scrollbar col-12 h-100 d-flex"
      style={{ overflowX: "auto", backgroundColor: "var(--bg1)", borderTop: "1px solid var(--border1)" }}
    >
      {masterTrack && <MixerTrack track={masterTrack} />}
      <SortableList
        cancel=".stop-reorder"
        direction="horizontal"
        onSortUpdate={data => setEdgeIndex(data.edgeIndex)}
        onStart={() => setAllowMenuAndShortcuts(false)}
        onEnd={handleSortEnd}
      >  
        {tracks.map((t, idx) => (
          <SortableListItem className={getListItemClass(idx)} key={t.id} index={idx}>
            <MixerTrack order={idx + 1} track={t} />
          </SortableListItem>
        ))}
      </SortableList>
    </div>
  )
}