import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FastForward, FastRewind, FiberManualRecord, Loop, PlayArrow, Redo, SkipNext, SkipPrevious, Stop, Undo } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { WorkstationContext } from "@/contexts";
import { Meter, NumberInput, SelectSpinBox } from "@/components/widgets";
import { AutomationLaneEnvelope, TimelinePosition, SnapGridSizeOption, TrackType } from "@/services/types/types";
import { FaMagnet } from "react-icons/fa"
import { getVolumeGradient, sliceClip, volumeToNormalized } from "@/services/utils/utils";
import { HoldActionButton } from "@/components";
import { Metronome, TrackVolumeSlider } from "@/screens/workstation/components";
import { StretchAudio } from "@/components/icons";
import { parseDuration } from "@/services/utils/general";

const noteValues: { label: string; value: number; }[] = [];

for (let i = 0; i < 5; i++)
  noteValues.push({ label: (2 ** i).toString(), value: 2 ** i });

export default function Header() {
  const { 
    getTrackCurrentValue,
    isLooping,
    isPlaying,
    isRecording,
    masterTrack,
    maxPos, 
    playheadPos, 
    setIsLooping,
    setIsPlaying,
    setIsRecording,
    setPlayheadPos, 
    setScrollToItem, 
    setShowTimeRuler,
    setSnapGridSizeOption,
    setStretchAudio,
    setTimeSignature, 
    setTracks,
    showTimeRuler,
    skipToStart,
    skipToEnd,
    snapGridSizeOption,
    stretchAudio,
    timelineSettings, 
    tracks,
    updateTimelineSettings
  } = useContext(WorkstationContext)!;

  const [timePosText, setTimePosText] = useState("");
  const [typeCursorPosMode, setTypeCursorPosMode] = useState(false);
  
  const posTimeTextInput = useRef<HTMLInputElement>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!typeCursorPosMode)
      setTimePosText(showTimeRuler ? playheadPos.toTimeString() : playheadPos.toString());
  }, [playheadPos, showTimeRuler, timelineSettings, typeCursorPosMode])

  useEffect(() => {
    if (typeCursorPosMode) {
      posTimeTextInput.current!.focus();
      posTimeTextInput.current!.select();
    }
  }, [typeCursorPosMode])

  function changeTempo(newTempo: number) {
    if (!stretchAudio) {
      const newTracks = tracks.slice();
  
      for (let i = 0; i < newTracks.length; i++) {
        if (newTracks[i].type === TrackType.Audio) {
          const clips = [];
  
          for (let j = 0; j < newTracks[i].clips.length; j++) {
            let clip = { ...newTracks[i].clips[j] };
            
            if (clip.type === TrackType.Audio && clip.audio) { 
              const originalTempo = TimelinePosition.timelineSettings.tempo;
              
              const durationSinceAudioStart = TimelinePosition.fromSpan(clip.start.diff(clip.audio.start)).toSeconds();
              const audioDuration = TimelinePosition.fromSpan(clip.audio.end.diff(clip.audio.start)).toSeconds();
              const clipRepetitionDuration = TimelinePosition.fromSpan(clip.end.diff(clip.start)).toSeconds();
              const durationSinceStartLimit = clip.startLimit 
                ? TimelinePosition.fromSpan(clip.start.diff(clip.startLimit)).toSeconds()
                : null;
              const durationFromStartToEndLimit = clip.endLimit
                ? TimelinePosition.fromSpan(clip.endLimit.diff(clip.start)).toSeconds()
                : null;
              const clipDuration = clip.loopEnd
                ? TimelinePosition.fromSpan(clip.loopEnd.diff(clip.start)).toSeconds()
                : null;

              TimelinePosition.timelineSettings.tempo = newTempo;

              let { measures, beats, fraction } = TimelinePosition.durationToSpan(durationSinceAudioStart);
              clip.audio = { ...clip.audio, start: clip.start.subtract(measures, beats, fraction, false) };
              ({ measures, beats, fraction } = TimelinePosition.durationToSpan(audioDuration));
              clip.audio = { ...clip.audio, end: clip.audio.start.add(measures, beats, fraction, false) };
              ({ measures, beats, fraction } = TimelinePosition.durationToSpan(clipRepetitionDuration));
              clip.end = clip.start.add(measures, beats, fraction, false);

              if (durationSinceStartLimit && clip.startLimit) {
                ({ measures, beats, fraction } = TimelinePosition.durationToSpan(durationSinceStartLimit));
                clip.startLimit = clip.start.subtract(measures, beats, fraction, false);
              }

              if (durationFromStartToEndLimit && clip.endLimit) {
                ({ measures, beats, fraction } = TimelinePosition.durationToSpan(durationFromStartToEndLimit));
                clip.loopEnd = clip.start.add(measures, beats, fraction, false);
              }

              if (clipDuration && clip.loopEnd) {
                ({ measures, beats, fraction } = TimelinePosition.durationToSpan(clipDuration));
                clip.loopEnd = clip.start.add(measures, beats, fraction, false);
              }

              TimelinePosition.timelineSettings.tempo = originalTempo;
            }
  
            clips.push(sliceClip(clip, maxPos)[0]);
          }

          newTracks[i] = { ...newTracks[i], clips };
        }
      }

      setTracks(newTracks);
    }

    updateTimelineSettings({ ...timelineSettings, tempo: newTempo });
  }

  function handleClick() {
    if (!typeCursorPosMode) {
      if (timeout.current === null) {
        timeout.current = setTimeout(() => {
          setShowTimeRuler(!showTimeRuler);
          timeout.current = null;
        }, 250);
      } else {
        clearTimeout(timeout.current);
        timeout.current = null;
        setTypeCursorPosMode(true);
      }
    }
  }

  function handleConfirmTimePosText() {
    setTypeCursorPosMode(false);

    let pos = TimelinePosition.parseFromString(timePosText);
    
    if (!pos) {
      const time = parseDuration(timePosText);
      
      if (timePosText && time) {
        const { hours, minutes, seconds, milliseconds } = time;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds + (milliseconds / 1000);
        pos = TimelinePosition.fromSpan(TimelinePosition.durationToSpan(totalSeconds));
      }
    }

    if (pos && pos.compareTo(TimelinePosition.start) >= 0 && !pos.equals(playheadPos)) {
      pos.normalize();

      if (pos.compareTo(maxPos) > 0) 
        pos = maxPos.copy();

      setPlayheadPos(pos);
      setScrollToItem({ type: "cursor", params: { alignment: "center" } });
    }
  }
  
  function fastForward() {
    const span = { measures: 1, beats: 0, fraction: 0 };
    const newPos = playheadPos.copy().snap(span, "ceil");

    if (playheadPos.equals(newPos))
      newPos.add(span.measures, span.beats, span.fraction);

    setPlayheadPos(TimelinePosition.min(maxPos.copy(), newPos));
    setScrollToItem({ type: "cursor", params: { alignment: "scrollIntoView" } });
  }

  function fastRewind() {
    const span = { measures: 1, beats: 0, fraction: 0 };
    const newPos = playheadPos.copy().snap(span, "floor");

    if (playheadPos.equals(newPos))
      newPos.subtract(span.measures, span.beats, span.fraction);
    
    setPlayheadPos(TimelinePosition.max(TimelinePosition.start.copy(), newPos));
    setScrollToItem({ type: "cursor", params: { alignment: "scrollIntoView" } });
  }

  function stop() {
    if (isPlaying) {
      setIsPlaying(false);
      skipToStart();
    }
  }

  const tempo = useMemo(() => {
    const lane = masterTrack.automationLanes.find(lane => lane.envelope === AutomationLaneEnvelope.Tempo);
    return getTrackCurrentValue(masterTrack, lane);
  }, [masterTrack.automationLanes, playheadPos, timelineSettings.tempo, timelineSettings.timeSignature])

  const style = {
    titleBar: { 
      backgroundColor: "var(--bg2)", 
      borderBottom: "1px solid var(--border1)", 
      lineHeight: 1.2,
      paddingBottom: 3.5 
    },
    projectTitle: {
      color: "var(--bg1)", 
      fontSize: 12, 
      fontWeight: "bold",
      backgroundColor: "var(--border1)", 
      padding: "0 8px 1px", 
      letterSpacing: 1, 
      borderRadius: 3
    },
    headerContainer: { height: 45, backgroundColor: "var(--bg2)", borderBottom: "1px solid var(--border1)" },
    timeSignatureBeats: {
      container: { width: 50, height: 13, lineHeight: 1, marginBottom: 4 },
      decr: { width: 14, height: "100%" },
      decrIcon: { color: "var(--fg1)" },
      incr: { width: 14, height: "100%" },
      incrIcon: { color: "var(--fg1)" },
      input: { color: "var(--fg1)", fontSize: 13, textAlign: "center", padding: "0 3px", height: "100%" }
    },
    timeSignatureNoteValue: {
      container: { width: 50, height: "fit-content", backgroundColor: "#0000", padding: 0, marginTop: 4 },
      next: { width: 14 },
      nextIcon: { color: "var(--fg1)", fontSize: 18 },
      prev: { width: 14 },
      prevIcon: { color: "var(--fg1)", fontSize: 18 },
      select: { 
        textAlign: "center", 
        color: "var(--fg1)", 
        fontSize: 13, 
        fontWeight: "bold", 
        padding: "0 3px"
      }
    },
    tempoControlContainer: { 
      padding: tempo.isAutomated ? 0 : "0 7px 0 2px", 
      borderRight: "1px solid var(--border1)", 
      width: 77 
    },
    automatedText: { fontSize: 11, color: "var(--fg1)", fontFamily: "Abel, Roboto, sans-serif" },
    tempo: {
      container: { 
        width: 40, 
        height: "fit-content", 
        backgroundColor: "#0000",
        margin: "auto",
        pointerEvents: tempo.isAutomated ? "none" : "auto",
        opacity: tempo.isAutomated ? 0.5 : 1
      },
      decrIcon: { color: "var(--fg1)", fontSize: 12 },
      incrIcon: { color: "var(--fg1)", fontSize: 12 },
      input: { textAlign: "center", color: "var(--fg1)", fontWeight: "bold", padding: 0, height: 16 }
    },
    currentPosTimeTextContainer: {
      alignItems: "center",
      cursor: "pointer", 
      borderRight: "1px solid var(--border1)", 
      backgroundColor: "var(--bg5)", 
      width: 128,
      flexShrink: 0
    },
    currentPosTimeText: { 
      fontSize: 18, 
      color: "var(--fg1)", 
      backgroundColor: "#0000",
      border: "none",
      pointerEvents: typeCursorPosMode ? "auto" : "none"
    },
    playbackControl: { flexDirection: "column", borderRight: "1px solid var(--border1)" },
    playbackControlRow: { margin: 0, height: "50%" },
    playbackControlButton: { backgroundColor: "#0000", padding: 2, display: "flex" },
    masterVolumeSliderSection: { 
      width: 221, 
      minWidth: 175, 
      borderRight: "1px solid var(--border1)", 
      padding: "4px 10px" 
    },
    masterVolumeMeter: {
      height: 5, 
      border: "1px solid var(--border12)", 
      backgroundColor: "var(--bg9)",
      flexShrink: 0,
      transform: "translate(-1px, 0)",
      width: "calc(100% + 1px)"
    },
    snapGridSizeDropdown: {
      container: { height: 28, width: 130, border: "1px solid var(--border6)", padding: "2px 4px" },
      nextIcon: { color: "var(--fg1)" },
      prevIcon: { color: "var(--fg1)" },
      select: { color: "var(--fg1)" }, 
    }
  } as const;

  return (
    <div className="col-12 position-relative" style={{ zIndex: 19 }}>
      <div className="text-center" style={style.titleBar}>
        <span className="m-0" style={style.projectTitle}>my_project1</span>
      </div>
      <div className="d-flex" style={style.headerContainer}>
        <div className="d-flex align-items-center p-2" style={{ height: "100%" }}>
          <IconButton className="btn-1 mx-1 hover-1">
            <Undo style={{fontSize: 14, color: "var(--border6)"}} />
          </IconButton>
          <IconButton className="btn-1 mx-1 hover-1">
            <Redo style={{fontSize: 14, color: "var(--border6)"}} />
          </IconButton>
          <Metronome />
        </div>
        <div 
          className="d-flex flex-column align-items-center justify-content-center" 
          style={{ height: "100%", padding: "0 3px", borderInline: "1px solid var(--border1)" }}
        >
          <NumberInput
            buttons={{ icon: "arrow" }}
            classes={{ 
              container: "show-on-hover", 
              incr: "hidden hover-2", 
              decr: "hidden hover-2", 
              input: "font-bold hover-2" 
            }}
            integersOnly
            layout="alt"
            min={1}
            max={24}
            onChange={value => setTimeSignature({ ...timelineSettings.timeSignature, beats: value })}
            style={style.timeSignatureBeats}
            value={timelineSettings.timeSignature.beats}
          />
          <div style={{ width: 20, borderBottom: "1px solid var(--fg1)" }}></div>
          <SelectSpinBox
            classes={{ container: "show-on-hover hover-2", next: "hidden hover-2", prev: "hidden hover-2" }}
            disableSelect
            layout="alt"
            onChange={value => {
              setTimeSignature({ ...timelineSettings.timeSignature, noteValue: Number(value) });
            }}
            options={noteValues}
            style={style.timeSignatureNoteValue}
            value={timelineSettings.timeSignature.noteValue}
          />
        </div>
        <div className="d-flex justify-content-center align-items-center" style={style.tempoControlContainer}>
          <div title={`Tempo: ${+tempo.value!.toFixed(2)} BPM`}>
            <NumberInput
              buttons={{ show: !tempo.isAutomated }}
              classes={{ container: "show-on-hover", incr: "hidden hover-2", decr: "hidden hover-2" }}
              disabled={tempo.isAutomated}
              holdIncrementSpeed={50}
              integersOnly
              min={20}
              max={320}
              layout="alt"
              onChange={value => changeTempo(value)}
              orientation="vertical"
              style={style.tempo}
              value={+tempo.value!.toFixed(1)}
            />
            {tempo.isAutomated && <p className="m-0 font-bold" style={style.automatedText}>AUTOMATED</p>}
          </div>
          {!tempo.isAutomated && (
            <IconButton
              className={`btn-1 p-0 ${stretchAudio ? "no-borders" : "hover-1"}`}
              onClick={() => setStretchAudio(!stretchAudio)}
              style={{ backgroundColor: stretchAudio ? "var(--color1)" : "#0000", marginLeft: 4 }}
              title="Toggle Stretch Audio To Preserve Clip Widths [P]"
            >
              <StretchAudio size={14} style={{ color: stretchAudio ? "var(--bg6)" : "var(--border6)"}} />
            </IconButton>
          )}
        </div>
        <div className="d-flex" onClick={handleClick} style={style.currentPosTimeTextContainer}>
          <form onSubmit={e => { e.preventDefault(); posTimeTextInput.current!.blur(); }}>
            <input
              className="col-12 p-0 m-0 text-center"
              disabled={!typeCursorPosMode}
              onBlur={handleConfirmTimePosText}
              onChange={e => setTimePosText(e.target.value)}
              ref={posTimeTextInput}
              style={style.currentPosTimeText}
              value={timePosText}
            />
          </form>
        </div>
        <div className="d-flex justify-content-center align-items-center" style={style.playbackControl}>
          <div 
            className="d-flex" 
            style={{ ...style.playbackControlRow, borderBottom: "1px solid var(--border1)" }}
          >
            <button 
              className="hover-2" 
              onClick={() => setIsPlaying(!isPlaying)} 
              style={style.playbackControlButton}
            >  
              <PlayArrow style={{ fontSize: 17, color: isPlaying ? "var(--color1)" : "var(--fg1)" }} />
            </button>
            <button className="hover-2" onClick={stop} style={style.playbackControlButton}>  
              <Stop style={{ fontSize: 17, color: "var(--fg1)" }} />
            </button>
            <button 
              className="hover-2"
              onClick={() => setIsRecording(!isRecording)}
              style={style.playbackControlButton}
            >  
              <FiberManualRecord 
                style={{ fontSize: 17, color: isRecording ? "var(--color1)" : "var(--fg1)" }} 
              />
            </button>
            <button 
              className="hover-2"
              onClick={() => setIsLooping(!isLooping)}
              style={style.playbackControlButton}
            > 
              <Loop style={{ fontSize: 17, color: isLooping ? "var(--color1)" : "var(--fg1)" }} />
            </button>
          </div>
          <div className="d-flex" style={style.playbackControlRow}>
            <button className="hover-2" onClick={skipToStart} style={style.playbackControlButton}> 
              <SkipPrevious style={{ fontSize: 17, color: "var(--fg1)" }} />
            </button>
            <HoldActionButton 
              className="hover-2"
              interval={100}
              onHoldAction={fastRewind}
              style={style.playbackControlButton}
            >
              <FastRewind style={{ fontSize: 17, color: "var(--fg1)" }} />
            </HoldActionButton>
            <HoldActionButton 
              className="hover-2"
              interval={100}
              onHoldAction={fastForward}
              style={style.playbackControlButton}
            >
              <FastForward style={{ fontSize: 17, color: "var(--fg1)" }} />
            </HoldActionButton>
            <button className="hover-2" onClick={skipToEnd} style={style.playbackControlButton}> 
              <SkipNext style={{ fontSize: 17, color: "var(--fg1)" }} />
            </button>
          </div>
        </div>
        <div className="h-100" style={style.masterVolumeSliderSection}>  
          <TrackVolumeSlider
            labelProps={{ placement: { horizontal: "center", vertical: "bottom" } }}
            style={{ padding: "8px 0", marginBottom: 5 }}
            track={masterTrack}
          />
          <Meter 
            color={getVolumeGradient(false)}
            marks={[{ value: 75, style: { backgroundColor: "var(--border12)" } }]}
            percent={volumeToNormalized(masterTrack.volume) * 100} 
            style={{ ...style.masterVolumeMeter, marginBottom: 2 }}
          />  
          <Meter 
            color={getVolumeGradient(false)}
            marks={[{ value: 75, style: { backgroundColor: "var(--border12)" } }]}
            percent={volumeToNormalized(masterTrack.volume) * 100} 
            style={{ ...style.masterVolumeMeter, margin: 0 }}
          />    
        </div>
        <div className="d-flex align-items-center" style={{ height: "100%", marginLeft: 12 }}>
          <SelectSpinBox
            classes={{ container: "hover-2", next: "hover-2", prev: "hover-2" }}
            icon={<FaMagnet style={{ fontSize: 10, marginTop: 1, color: "var(--fg1)" }} />}
            onChange={val => setSnapGridSizeOption(val as SnapGridSizeOption)}
            options={[
              { label: "None", value: SnapGridSizeOption.None },
              { label: "Auto", value: SnapGridSizeOption.Auto },
              { label: "1/128 Beat", value: SnapGridSizeOption.HundredTwentyEighthBeat },
              { label: "1/64 Beat", value: SnapGridSizeOption.SixtyFourthBeat },
              { label: "1/32 Beat", value: SnapGridSizeOption.ThirtySecondBeat },
              { label: "1/16 Beat", value: SnapGridSizeOption.SixteenthBeat },
              { label: "1/8 Beat", value: SnapGridSizeOption.EighthBeat },
              { label: "1/4 Beat", value: SnapGridSizeOption.QuarterBeat },
              { label: "1/2 Beat", value: SnapGridSizeOption.HalfBeat },
              { label: "Beat", value: SnapGridSizeOption.Beat },
              { label: "Measure", value: SnapGridSizeOption.Measure },
              { label: "2 Measures", value: SnapGridSizeOption.TwoMeasures },
              { label: "4 Measures", value: SnapGridSizeOption.FourMeasures },
              { label: "8 Measures", value: SnapGridSizeOption.EightMeasures },
            ]}
            style={style.snapGridSizeDropdown}
            value={snapGridSizeOption}
          />
        </div>
      </div>
    </div>
  )
}