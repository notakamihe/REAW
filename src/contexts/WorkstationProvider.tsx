import { PropsWithChildren, useContext, useEffect, useMemo, useState } from "react"
import {
  AutomationLane,
  AutomationLaneEnvelope,
  AutomationNode,
  Clip,
  ClipAudio,
  ContextMenuType,
  FXChainPreset,
  Region,
  SnapGridSizeOption,
  TimelinePosition,
  TimelineSettings,
  TimeSignature,
  Track,
  TrackType,
  WorkstationAudioInputFile
} from "@/services/types/types";
import data from "@/tempData";
import { ClipboardContext, ClipboardItemType, PreferencesContext, ScrollToItem, WorkstationContext } from "@/contexts";
import { v4 } from "uuid";
import {
  clipAtPos,
  preservePosMargin,
  getBaseMasterTrack,
  BASE_BEAT_WIDTH,
  sliceClip,
  getRandomTrackColor,
  volumeToNormalized,
  normalizedToVolume,
  preserveTrackMargins, 
  getMaxMeasures,
  removeAllClipOverlap,
  getBaseTrack,
  preserveClipMargins,
  copyClip,
  automatedValueAtPos,
  GRID_MIN_INTERVAL_WIDTH
} from "@/services/utils/utils";
import { audioBufferToBuffer, audioContext, concatAudioBuffer } from "@/services/utils/audio";
import { electronAPI, openContextMenu } from "@/services/electron/utils";
import { clamp, cmdOrCtrl, inverseLerp, isMacOS, lerp } from "@/services/utils/general";
import { TOGGLE_MASTER_TRACK, TOGGLE_MIXER, ADD_TRACK, OPEN_PREFERENCES } from "@/services/electron/channels";

export function WorkstationProvider({ children }: PropsWithChildren) {
  const { clipboardItem, copy } = useContext(ClipboardContext)!;
  const { setShowPreferences } = useContext(PreferencesContext)!;

  const [allowMenuAndShortcuts, setAllowMenuAndShortcuts] = useState(true);
  const [fxChainPresets, setFXChainPresets] = useState<FXChainPreset[]>(
    JSON.parse(localStorage.getItem("fx-chain-presets") || "[]")
  );
  const [isLooping, setIsLooping] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [masterTrack, setMasterTrack] = useState(getBaseMasterTrack());
  const [metronome, setMetronome] = useState(true);
  const [mixerHeight, setMixerHeight] = useState(225);
  const [numMeasures, setNumMeasures] = useState(100);
  const [playheadPos, setPlayheadPos] = useState(TimelinePosition.start.copy());
  const [scrollToItem, setScrollToItem] = useState<ScrollToItem | null>(null);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [showMaster, setShowMaster] = useState(false);
  const [showMixer, setShowMixer] = useState(false);
  const [showTimeRuler, setShowTimeRuler] = useState(false);
  const [songRegion, setSongRegion] = useState<Region | null>(null);
  const [snapGridSize, setSnapGridSize] = useState({ measures: 0, beats: 0, fraction: 0 });
  const [snapGridSizeOption, setSnapGridSizeOption] = useState<SnapGridSizeOption>(SnapGridSizeOption.Auto);
  const [stretchAudio, setStretchAudio] = useState(false);
  const [trackRegion, setTrackRegion] = useState<{ region: Region, trackId: string } | null>(null);
  const [tracks, setTracks] = useState(data);
  const [verticalScale, setVerticalScale] = useState(1);
  const [timelineSettings, setTimelineSettings] = useState<TimelineSettings>({
    horizontalScale: 1, 
    timeSignature: { beats: 4, noteValue: 4 },
    tempo: 120
  });

  const allTracks = useMemo(() => [masterTrack, ...tracks], [masterTrack, tracks])

  const autoGridSize = useMemo(() => {
    const { horizontalScale, timeSignature } = timelineSettings;
    const beatWidth = BASE_BEAT_WIDTH * horizontalScale * (4 / timeSignature.noteValue);
    const measureWidth = beatWidth * timeSignature.beats;
    
    if (measureWidth < GRID_MIN_INTERVAL_WIDTH * 2) {
      const measures = 2 ** Math.ceil(Math.log2(GRID_MIN_INTERVAL_WIDTH / measureWidth));
      return { measures, beats: 0, fraction: 0 };
    } else {
      let fraction = 1000;

      if (beatWidth < GRID_MIN_INTERVAL_WIDTH && Math.log2(timeSignature.beats) % 1 !== 0) {
        for (let i = 2; i < timeSignature.beats; i++) {
          if (timeSignature.beats % i === 0) {
            fraction = i * 1000;
            if (beatWidth * i >= GRID_MIN_INTERVAL_WIDTH)
              break;
          }
        }
      } else {
        fraction = 2 ** Math.ceil(Math.log2(GRID_MIN_INTERVAL_WIDTH / beatWidth)) * 1000;
      }
 
      return TimelinePosition.fractionToSpan(fraction < 2 ** -5 * 1000 ? 0 : fraction);
    }
  }, [timelineSettings.horizontalScale, timelineSettings.timeSignature])

  const maxPos = useMemo(() => {
    const maxMeasures = getMaxMeasures(timelineSettings.timeSignature);
    return new TimelinePosition(maxMeasures + 1, 1, 0);
  }, [timelineSettings.timeSignature])

  const farthestPositions = useMemo(() => {
    let editorFarthestPos = TimelinePosition.start;

    for (const track of allTracks) {
      for (const clip of track.clips) {
        if (clip.end.compareTo(editorFarthestPos) > 0)
          editorFarthestPos = clip.end;
      
        if (clip.loopEnd && clip.loopEnd?.compareTo(editorFarthestPos) > 0)
          editorFarthestPos = clip.loopEnd;
      }
  
      for (const lane of track.automationLanes)
        for (const node of lane.nodes)
          if (node.pos.compareTo(editorFarthestPos) > 0)
            editorFarthestPos = node.pos;
    }
    
    editorFarthestPos = TimelinePosition.min(editorFarthestPos, maxPos);
    
    let farthestPos = TimelinePosition.max(editorFarthestPos, playheadPos);
    
    if (songRegion && songRegion.end.compareTo(editorFarthestPos) > 0)
      farthestPos = songRegion.end;

    if (trackRegion && trackRegion.region.end.compareTo(farthestPos) > 0)
      farthestPos = trackRegion.region.end;
    
    return { editorFarthestPos, farthestPos: TimelinePosition.min(farthestPos, maxPos) };
  }, [allTracks, songRegion, trackRegion, playheadPos])

  const selectedClip = useMemo(() => {
    return tracks.map(track => track.clips).flat().find(clip => clip.id === selectedClipId);
  }, [selectedClipId, tracks])

  const selectedNode = useMemo(() => {
    return allTracks.map(track => track.automationLanes.map(lane => lane.nodes).flat()).flat()
                    .find(node => node.id === selectedNodeId);
  }, [selectedNodeId, allTracks])

  const selectedTrack = useMemo(() => {
    return allTracks.find(track => track.id === selectedTrackId);
  }, [selectedTrackId, allTracks])

  useEffect(() => {
    function onCopy() {
      if (document.activeElement?.nodeName !== "INPUT" && allowMenuAndShortcuts) {
        if (selectedClip) {
          copy({item: selectedClip, type: ClipboardItemType.Clip});
        } else if (selectedNode) {
          const lane = allTracks.map(track => track.automationLanes).flat()
                                .find(lane => lane.nodes.map(node => node.id).includes(selectedNode.id));
          if (lane) 
            copy({item: {node: selectedNode, lane}, type: ClipboardItemType.Node});
        }
      }
    }
  
    function onCut() {
      if (document.activeElement?.nodeName !== "INPUT" && allowMenuAndShortcuts) {
        onCopy();
  
        if (selectedClip)
          deleteClip(selectedClip);
        else if (selectedNode)
          deleteNode(selectedNode);
      }
    }
  
    function onKeyDown(e: KeyboardEvent) {
      if (allowMenuAndShortcuts) {
        const activeTagName = document.activeElement?.nodeName;
        const editableElementActive = activeTagName && ["INPUT", "TEXTAREA"].includes(activeTagName);
  
        switch (e.code) {
          case "KeyA":
            if (!editableElementActive) {
              if (e.shiftKey) {
                if (selectedTrack) 
                  setTrack({...selectedTrack, armed: !selectedTrack.armed});
              } else {
                if (selectedTrack) 
                  setTrack({...selectedTrack, automation: !selectedTrack.automation});
              }
            }
            break;
          case "KeyC":
            if (cmdOrCtrl(e)) {
              if (e.altKey) {
                if (trackRegion) 
                  createClipFromTrackRegion();
              } else if (e.shiftKey) {
                if (selectedClip) 
                  consolidateClip(selectedClip);
              }
            }
            break;
          case "KeyD":
            if (cmdOrCtrl(e)) {
              if (selectedClip) 
                duplicateClip(selectedClip);
              else if (selectedTrack)
                duplicateTrack(selectedTrack);
            }
            break;
          case "KeyM":
            if (!editableElementActive) {
              if (cmdOrCtrl(e)) {
                if (e.shiftKey) {
                  if (selectedClip)
                    toggleMuteClip(selectedClip);
                }
              } else {
                if (selectedTrack) 
                  setTrack({...selectedTrack, mute: !selectedTrack.mute});
              }
            }
            break;
          case "KeyP":
            if (!editableElementActive)
              setStretchAudio(!stretchAudio);
            break;
          case "KeyR":
            if (!editableElementActive)
              setIsRecording(true);
            break;
          case "KeyS":
            if (cmdOrCtrl(e)) {
              if (e.altKey) {
                if (selectedClip)
                  splitClip(selectedClip, playheadPos);
              }
            } else {
              if (!editableElementActive) {
                if (selectedTrack)
                  setTrack({...selectedTrack, solo: !selectedTrack.solo});
              }
            }
            break;
          case "KeyT":
            if (!editableElementActive)
              setMetronome(!metronome);
            break;
          case "ArrowLeft":
            if (isMacOS() && e.metaKey && !editableElementActive)
              skipToStart();
            break;
          case "ArrowRight":
            if (isMacOS() && e.metaKey && !editableElementActive)
              skipToEnd();
            break;
          case "Backspace":
            if (!editableElementActive)
              handleDelete();
            break;
          case "Delete":
            if (!editableElementActive)
              handleDelete();
            break;
          case "End":
            if (!editableElementActive)
              skipToEnd();
            break;
          case "Home":
            if (!editableElementActive)
              skipToStart();
            break;
          case "Space":
            if (!editableElementActive) {
              e.preventDefault();
    
              if (isRecording) {
                setIsRecording(false)
                skipToStart();
              } else {
                setIsPlaying(!isPlaying)
              }
            }
        }
      }
    }

    function onPaste() {
      if (document.activeElement?.nodeName !== "INPUT" && clipboardItem && allowMenuAndShortcuts) {
        switch (clipboardItem.type) {
          case ClipboardItemType.Clip:
            pasteClip(playheadPos)
            break
          case ClipboardItemType.Node:
            pasteNode(playheadPos)
            break
        }
      }
    }

    window.addEventListener("copy", onCopy);
    window.addEventListener("cut", onCut);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('paste', onPaste);

    return () => {
      window.removeEventListener("copy", onCopy);
      window.removeEventListener("cut", onCut);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('paste', onPaste);
    }
  })

  useEffect(() => {
    TimelinePosition.timelineSettings = timelineSettings;
  }, [])

  useEffect(() => {
    function handleContextMenuCapture(e: MouseEvent) {
      if (allowMenuAndShortcuts) {
        const activeNameTag = document.activeElement?.nodeName;
        
        if (activeNameTag && ["INPUT", "TEXTAREA"].includes(activeNameTag)) {
          const selectedText = window.getSelection()?.toString();
          openContextMenu(ContextMenuType.Text, { selectedText }, () => {});
        }
      } else {
        e.stopPropagation();
      }
    }

    function handleMouseEventCapture(e: MouseEvent) {
      if (!allowMenuAndShortcuts)
        e.stopPropagation();
    }

    document.addEventListener("contextmenu", handleContextMenuCapture, { capture: true });
    document.addEventListener("mousedown", handleMouseEventCapture, { capture: true });
    document.addEventListener("click", handleMouseEventCapture, { capture: true });
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenuCapture, { capture: true });
      document.removeEventListener("mousedown", handleMouseEventCapture, { capture: true });
      document.removeEventListener("click", handleMouseEventCapture, { capture: true });
    }
  }, [allowMenuAndShortcuts])

  useEffect(() => {
    if (allowMenuAndShortcuts) {
      electronAPI.ipcRenderer.on(OPEN_PREFERENCES, () => setShowPreferences(true));
      electronAPI.ipcRenderer.on(TOGGLE_MASTER_TRACK, () => setShowMaster(prev => !prev));
      electronAPI.ipcRenderer.on(TOGGLE_MIXER, () => setShowMixer(prev => !prev));
      electronAPI.ipcRenderer.on(ADD_TRACK, (track: TrackType) => addTrack(track));
    }

    return () => {
      electronAPI.ipcRenderer.removeAllListeners(OPEN_PREFERENCES);
      electronAPI.ipcRenderer.removeAllListeners(TOGGLE_MASTER_TRACK);
      electronAPI.ipcRenderer.removeAllListeners(TOGGLE_MIXER);
      electronAPI.ipcRenderer.removeAllListeners(ADD_TRACK);
    }
  }, [tracks, allowMenuAndShortcuts])

  useEffect(() => adjustNumMeasures(), [farthestPositions.farthestPos])

  useEffect(() => localStorage.setItem("fx-chain-presets", JSON.stringify(fxChainPresets)), [fxChainPresets])

  useEffect(() => {
    if (snapGridSizeOption === SnapGridSizeOption.Auto) {
      setSnapGridSize(autoGridSize);
    } else {
      let snapGridSize = { measures: 0, beats: 0, fraction: 0 };
      
      switch (snapGridSizeOption) {
        case SnapGridSizeOption.EightMeasures:
          snapGridSize = { measures: 8, beats: 0, fraction: 0 };
          break;
        case SnapGridSizeOption.FourMeasures:
          snapGridSize = { measures: 4, beats: 0, fraction: 0 };
          break;
        case SnapGridSizeOption.TwoMeasures:
          snapGridSize = { measures: 2, beats: 0, fraction: 0 };
          break;
        case SnapGridSizeOption.Measure:
          snapGridSize = { measures: 1, beats: 0, fraction: 0 };
          break;
        case SnapGridSizeOption.Beat:
          snapGridSize = { measures: 0, beats: 1, fraction: 0 };
          break;
        case SnapGridSizeOption.HalfBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 500 };
          break;
        case SnapGridSizeOption.QuarterBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 250 };
          break;
        case SnapGridSizeOption.EighthBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 125 };
          break;
        case SnapGridSizeOption.SixteenthBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 62.5 };
          break;
        case SnapGridSizeOption.ThirtySecondBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 31.25 };
          break;
        case SnapGridSizeOption.SixtyFourthBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 15.625 };
          break;
        case SnapGridSizeOption.HundredTwentyEighthBeat:
          snapGridSize = { measures: 0, beats: 0, fraction: 7.8125 };
          break;
      }

      setSnapGridSize(snapGridSize);
    }
  }, [snapGridSizeOption, autoGridSize])

  function addNode(track: Track, lane: AutomationLane, node: AutomationNode) {
    const nodes = [...lane.nodes, node].sort((a, b) => a.pos.compareTo(b.pos));
    setLane(track, { ...lane, nodes });
    setScrollToItem({ type: "node", params: { nodeId: node.id } });
  }

  function addTrack(type: TrackType) {
    const track = { ...getBaseTrack(), name: `Track ${tracks.length + 1}`, type };
    setTracks([...tracks, track]);
    setScrollToItem({ type: "track", params: { trackId: track.id } });
  }

  function adjustNumMeasures(pos?: TimelinePosition) {
    if (pos) {
      const timelineEditorWindow = document.querySelector("#timeline-editor-window");

      if (timelineEditorWindow) {
        const newNumMeasures = calculateNumMeasures(TimelinePosition.max(pos, farthestPositions.farthestPos));
        const end = timelineEditorWindow.scrollLeft + timelineEditorWindow.clientWidth;
        const timelineEditorWindowEndPos = TimelinePosition.fromMargin(end);
        const timelineEditorWindowNumMeasures = calculateNumMeasures(timelineEditorWindowEndPos);

        if (newNumMeasures >= timelineEditorWindowNumMeasures)
          setNumMeasures(newNumMeasures);
        else if (newNumMeasures < numMeasures)
          setNumMeasures(timelineEditorWindowNumMeasures);
      }
    } else {
      setNumMeasures(calculateNumMeasures(farthestPositions.farthestPos));
    }
  }

  function calculateNumMeasures(pos: TimelinePosition) {
    const BASE_CHUNK_MEASURES = 100;
    
    const { noteValue, beats } = timelineSettings.timeSignature;
    const measureUnitSize = Math.ceil(BASE_CHUNK_MEASURES / (4 / noteValue) * (4 / beats));
    const measures = measureUnitSize * Math.max(1, Math.ceil((pos.measure) / (measureUnitSize * 0.94)));
    const maxMeasures = getMaxMeasures(timelineSettings.timeSignature);

    return Math.min(measures, maxMeasures);
  }

  function consolidateClip(clip: Clip) {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const clips = track.clips.slice();

      const newClip = {
        ...clip,
        startLimit: clip.startLimit ? clip.start : null,
        start: clip.start,
        endLimit: clip.endLimit ? (clip.loopEnd || clip.end) : null,
        end: clip.loopEnd || clip.end,
        loopEnd: null
      }

      if (clip.type === TrackType.Audio && clip.audio) {
        const audio = consolidateClipAudio(clip);
        if (audio)
          newClip.audio = audio;
      }

      const clipIndex = clips.findIndex(c => c.id === clip.id);

      if (clipIndex > -1) {
        clips[clipIndex] = newClip;
        setTrack({...track, clips});

        if (selectedClipId !== clip.id)
          setSelectedClipId(newClip.id);
      }
    }
  }

  function consolidateClipAudio(clip: Clip): ClipAudio | null {
    if (clip.audio && clip.audio.audioBuffer) {
      const { numberOfChannels, sampleRate, length } = clip.audio.audioBuffer;
      let audioBuffer: AudioBuffer | null = null;

      const fullWidth = (clip.loopEnd || clip.end).diffInMargin(clip.start);
      const width = clip.end.diffInMargin(clip.start);
      const audioWidth = clip.audio.end.diffInMargin(clip.audio.start);
      const audioStartOffset = clip.start.diffInMargin(clip.audio.start);
      const audioEndOffset = audioStartOffset + width;
      const repetitions = Math.ceil(fullWidth / width);

      const audioStartOffsetPercentange = Math.max(0, audioStartOffset / audioWidth);
      const audioEndOffsetPercentange = audioEndOffset / audioWidth;
      const start = Math.floor(audioStartOffsetPercentange * length);
      const end = Math.floor(audioEndOffsetPercentange * length);
      const offset = audioStartOffset < 0 ? Math.ceil((Math.abs(audioStartOffset) / audioWidth) * length) : 0;

      for (let i = 0; i < repetitions; i++) {
        const repetitionWidth = Math.min(width, fullWidth - width * i);
        const repetitionScale = repetitionWidth / audioWidth;
        const newBufferLength = Math.ceil(repetitionScale * length);
        const newBuffer = audioContext.createBuffer(numberOfChannels, newBufferLength, sampleRate);
        
        for (let i = 0; i < numberOfChannels; i++) {
          let channel = newBuffer.getChannelData(i);
          
          if (newBufferLength > offset) {
            channel.set(
              clip.audio.audioBuffer.getChannelData(i).slice(start, end).slice(0, newBufferLength - offset), 
              offset
            );
          }
        }

        audioBuffer = audioBuffer ? concatAudioBuffer(audioBuffer, newBuffer) : newBuffer;
      }

      if (audioBuffer) {
        const durationMultiplier = (audioBuffer.length / clip.audio.audioBuffer.length);

        return {
          ...clip.audio,
          audioBuffer,
          buffer: audioBufferToBuffer(audioBuffer),
          end: (clip.loopEnd || clip.end).copy(),
          sourceDuration: clip.audio.sourceDuration * durationMultiplier,
          start: clip.start.copy()
        };
      }
    }

    return null;
  }

  function createAudioClip(file: WorkstationAudioInputFile, pos: TimelinePosition): Promise<Clip | null> {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(new Blob([file.buffer], {type: file.type}));
      const audio = new Audio();
      
      audio.src = url;

      audio.onloadedmetadata = async () => {
        const {measures, beats, fraction} = TimelinePosition.durationToSpan(audio.duration);
      
        const clip: Clip = {
          end: pos.add(measures, beats, fraction, false),
          endLimit: null,
          id: v4(),
          loopEnd: null,
          muted: false,
          name: file.name,
          start: pos,
          startLimit: pos,
          audio: {
            audioBuffer: null,
            buffer: file.buffer,
            end: pos.add(measures, beats, fraction, false),
            start: pos,
            sourceDuration: audio.duration,
            type: file.type
          },
          type: TrackType.Audio
        };

        audio.remove();
        resolve(clip);
      }

      audio.onerror = () => {
        audio.remove();
        resolve(null);
      }
    });
  }

  function createClipFromTrackRegion() {
    if (trackRegion) {
      const track = tracks.find(track => track.id === trackRegion.trackId);

      if (track) {
        const newClip = {
          id: v4(), 
          name: "Untitled",
          start: trackRegion.region.start, 
          end: trackRegion.region.end, 
          startLimit: null, 
          endLimit: null, 
          loopEnd: null, 
          muted: false,
          type: track.type
        };

        insertClips([newClip], track);
        setTrackRegion(null);
        setSelectedClipId(newClip.id);
      }
    }
  }

  function deleteClip(clip : Clip) {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const newClips = track.clips.filter((c: Clip) => c.id !== clip.id);
      setTrack({...track, clips: newClips});
    }

    if (clip.id === selectedClipId)
      setSelectedClipId(null);
  }

  function deleteNode(node : AutomationNode) {
    const track = allTracks.find(t => t.automationLanes.find((l: AutomationLane) => 
      l.nodes.find(n => n.id === node.id)));

    if (track) {
      const automationLanes = track.automationLanes.slice();
      const laneIndex = automationLanes.findIndex(lane => lane.nodes.find(n => n.id === node.id));

      if (laneIndex > -1) {
        const nodes = automationLanes[laneIndex].nodes.filter(n => n.id !== node.id);
        automationLanes[laneIndex] = {...automationLanes[laneIndex], nodes};
        setTrack({...track, automationLanes});
      }
    }

    if (node.id === selectedNodeId)
      setSelectedNodeId(null);
  }

  function deleteTrack(track: Track) {
    if (track.id !== masterTrack.id) {
      setTracks(tracks.filter(t => t.id !== track.id));
      if (selectedTrackId === track.id) setSelectedTrackId(null);
    }
  }

  function duplicateClip(clip: Clip) {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const newClip = clipAtPos(clip.loopEnd || clip.end, copyClip(clip));
      insertClips([newClip], track);
      setSelectedClipId(newClip.id);
    }
  }

  function duplicateTrack(track: Track) {
    if (track.id !== masterTrack.id) {
      const duplicate = {...track, id: v4(), name: `${track.name} (Copy)`};
      
      duplicate.color = getRandomTrackColor();
      duplicate.clips = duplicate.clips.map(clip => copyClip(clip));
      duplicate.fx.effects = duplicate.fx.effects.map(effect => {return { ...effect, id: v4() }});
      duplicate.automationLanes = duplicate.automationLanes.map(lane => ({
        ...lane, 
        id: v4(),
        nodes: lane.nodes.map(node => ({ ...node, id: v4(), pos: node.pos.copy() }))
      }));
  
      const newTracks : Track[] = tracks.slice()
      const trackIndex = newTracks.findIndex(t => t.id === track.id)
      newTracks.splice(trackIndex + 1, 0, duplicate);

      setTracks(newTracks);
      setSelectedTrackId(duplicate.id);
      setScrollToItem({ type: "track", params: { trackId: duplicate.id } });
    }
  }

  function getTrackCurrentValue(track: Track, lane: AutomationLane | undefined) {
    let value = null, isAutomated = false;
    
    if (lane) {
      if (lane.nodes.length > 1) {
        value = automatedValueAtPos(playheadPos, lane);
        isAutomated = true;
      } else {
        switch (lane.envelope) {
          case AutomationLaneEnvelope.Volume:
            value = track.volume;
            break;
          case AutomationLaneEnvelope.Pan:
            value = track.pan;
            break;
          case AutomationLaneEnvelope.Tempo:
            value = timelineSettings.tempo;
            break;
        }
      }
    }

    return { isAutomated, value };
  }

  function handleDelete() {
    if (selectedClip)
      deleteClip(selectedClip);
    else if (selectedNode)
      deleteNode(selectedNode);
    else if (selectedTrack)
      deleteTrack(selectedTrack);
  }

  function insertClips(newClips: Clip[], track: Track) {
    if (newClips.length > 0) {
      let clips = track.clips.slice();
  
      for (const clip of newClips) {
        if (clip.start.compareTo(maxPos) < 0)
          clips.push(sliceClip(clip, maxPos)[0]);
      }
  
      setTrack({ ...track, clips: removeAllClipOverlap(clips) });
      setScrollToItem({ type: "clip", params: { clipId: newClips[0].id } });
    }
  }

  function pasteClip(pos: TimelinePosition, targetTrack? : Track) {
    navigator.clipboard.readText().then(text => {
      if (!text && clipboardItem && clipboardItem.type === ClipboardItemType.Clip) {
        const clip = clipboardItem.item;
        const track = targetTrack || selectedTrack;

        if (track && track.type === clip.type) {
          const newClip = {...clipAtPos(pos, clip), id: v4()}
          insertClips([newClip], track);
          setSelectedClipId(newClip.id);
        }
      }
    })
  }

  function pasteNode(pos: TimelinePosition, targetLane? : AutomationLane) {
    navigator.clipboard.readText().then(text => {
      if (!text && clipboardItem && clipboardItem.type === ClipboardItemType.Node) {
        const item = clipboardItem.item;
        const node = item.node;
        const lane = targetLane || selectedTrack?.automationLanes.find(lane => lane.envelope === item.lane.envelope);
        const track = allTracks.find(track => track.automationLanes.find(l => l.id === lane?.id));

        if (track && lane) {
          const normalized = item.lane.envelope === AutomationLaneEnvelope.Volume 
            ? volumeToNormalized(node.value)
            : inverseLerp(node.value, item.lane.minValue, item.lane.maxValue);
          const value = lane.envelope === AutomationLaneEnvelope.Volume 
            ? normalizedToVolume(normalized)
            : lerp(normalized, lane.minValue, lane.maxValue);
          const newNode = { id: v4(), pos, value: clamp(value, lane.minValue, lane.maxValue) };

          addNode(track, lane, newNode);
          setSelectedNodeId(newNode.id);
        }
      }
    })
  }
  
  function setLane(track: Track, lane: AutomationLane) {
    const automationLanes = track.automationLanes.slice();
    const index = automationLanes.findIndex(l => l.id === lane.id);

    if (index > -1) {
      automationLanes[index] = lane;
      setTrack({ ...track, automationLanes });
    }
  }

  function setTimeSignature(timeSignature: TimeSignature) {
    const newTimelineSettings = { ...timelineSettings, timeSignature };

    setMasterTrack(preserveTrackMargins(masterTrack, newTimelineSettings));
    setTracks(tracks.map(track => preserveTrackMargins(track, newTimelineSettings)));
    setPlayheadPos(preservePosMargin(playheadPos, newTimelineSettings));
    
    if (songRegion) {
      const newSongRegion = {
        start: preservePosMargin(songRegion.start, newTimelineSettings),
        end: preservePosMargin(songRegion.end, newTimelineSettings)
      };

      setSongRegion(newSongRegion.end.compareTo(newSongRegion.start) > 0 ? newSongRegion : null);
    }

    if (trackRegion) {
      const newTrackRegion = {
        start: preservePosMargin(trackRegion.region.start, newTimelineSettings),
        end: preservePosMargin(trackRegion.region.end, newTimelineSettings)
      };

      setTrackRegion(
        newTrackRegion.end.compareTo(newTrackRegion.start) > 0 
          ? { ...trackRegion, region: newTrackRegion }
          : null
      );
    }
    
    if (clipboardItem) {
      const { item, type } = clipboardItem;

      switch (type) {
        case ClipboardItemType.Clip:
          copy({ ...clipboardItem, item: preserveClipMargins(item, newTimelineSettings) });
          break;
        case ClipboardItemType.Node:
          const node = { ...item.node, pos: preservePosMargin(item.node.pos, newTimelineSettings) }; 
          copy({ ...clipboardItem, item: { ...item, node } })
          break;
      }
    }

    updateTimelineSettings(newTimelineSettings);
  }

  function setTrack(track: Track) {
    if (track.id === masterTrack.id)
      setMasterTrack(track);
    else
      setTracks(tracks.map(t => t.id === track.id ? track : t));
  }

  function skipToEnd() {
    const notAtSongRegionEnd = songRegion && !playheadPos.equals(songRegion.end);
    setPlayheadPos(notAtSongRegionEnd ? songRegion.end : farthestPositions.editorFarthestPos);    
    setScrollToItem({ type: "cursor", params: { alignment: "center" } });
  }

  function skipToStart() {
    const notAtSongRegionStart = songRegion && !playheadPos.equals(songRegion.start);
    setPlayheadPos(notAtSongRegionStart ? songRegion.start : TimelinePosition.start);
    setScrollToItem({ type: "cursor", params: { alignment: "center" } });
  }

  function splitClip(clip : Clip, pos : TimelinePosition) {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track && pos.compareTo(clip.start) > 0) {
      const clipSlices = sliceClip(clip, pos);
      setTrack({...track, clips: track.clips.filter(c => c.id !== clip.id).concat(clipSlices)});
    }
  }

  function toggleMuteClip(clip : Clip) {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track) {
      const newClip = {...clip, muted: !clip.muted};
      setTrack({...track, clips: track.clips.map(c => c.id === clip.id ? newClip : c)});
    }
  }

  function updateTimelineSettings(settings: TimelineSettings | ((prev: TimelineSettings) => TimelineSettings)) {
    setTimelineSettings(prev => {
      TimelinePosition.timelineSettings = typeof settings === "function" ? settings(prev) : settings;
      return TimelinePosition.timelineSettings;
    });
  }

  return (
    <WorkstationContext.Provider 
      value={{
        addNode,
        addTrack,
        adjustNumMeasures,
        allowMenuAndShortcuts,
        autoGridSize,
        consolidateClip,
        createAudioClip,
        createClipFromTrackRegion,
        deleteClip,
        deleteNode,
        deleteTrack,
        duplicateClip,
        duplicateTrack,
        fxChainPresets,
        getTrackCurrentValue,
        insertClips,
        isLooping,
        isPlaying,
        isRecording,
        masterTrack,
        maxPos,
        metronome,
        mixerHeight,
        numMeasures,
        pasteClip,
        pasteNode,
        playheadPos,
        scrollToItem,
        selectedClipId,
        selectedNodeId,
        selectedTrackId,
        setAllowMenuAndShortcuts,
        setFXChainPresets,
        setIsLooping,
        setIsPlaying,
        setIsRecording,
        setLane,
        setMetronome,
        setMixerHeight,
        setNumMeasures,
        setPlayheadPos,
        setScrollToItem,
        setSelectedClipId,
        setSelectedNodeId,
        setSelectedTrackId,
        setShowMaster,
        setShowMixer,
        setShowTimeRuler,
        setSnapGridSize,
        setSnapGridSizeOption,
        setSongRegion,
        setStretchAudio,
        setTimeSignature,
        setTrack,
        setTrackRegion,
        setTracks,
        setVerticalScale,
        showMaster,
        showMixer,
        showTimeRuler,
        skipToEnd,
        skipToStart,
        snapGridSize,
        snapGridSizeOption,
        songRegion,
        splitClip, 
        stretchAudio,
        trackRegion,
        timelineSettings,
        toggleMuteClip,
        tracks,
        updateTimelineSettings,
        verticalScale
      }}
    >
      {children}
    </WorkstationContext.Provider>
  );
};