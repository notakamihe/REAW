import React from "react"
import { AudioClip, AutomationLane, AutomationNode, Clip, FXChain, Region, SnapGridSizeOption, TimeSignature, Track } from "renderer/types/types";
import TimelinePosition, { TimelinePositionOptions, TimelineInterval } from "renderer/types/TimelinePosition";
import { useClickAwayState, useTracks } from "renderer/hooks";
import data from "renderer/tempData";
import { ClipboardContext, ClipboardItemType } from "./ClipboardContext";
import { v4 } from "uuid";
import { clipAtPos, preserveClipMargins, preservePosMargin, getBaseMasterTrack, BASE_BEAT_WIDTH, sliceClip, sliceAnyOverlappingClips } from "renderer/utils/utils";
import { BASE_MAX_MEASURES } from "renderer/utils/utils";
import { audioBufferToBuffer, concatAudioBuffer } from "renderer/utils/audio";

interface WorkstationFile {
  autoSnap : boolean;
  cursorPos : TimelinePosition;
  horizontalScale : number;
  isLooping : boolean;
  isPlaying : boolean;
  isRecording : boolean;
  metronome : boolean;
  mixerHeight : number;
  selectedClip : Clip | null;
  selectedNode : AutomationNode | null;
  showMaster : boolean;
  showMixer : boolean;
  snapGridSize : TimelineInterval;
  snapGridSizeOption : SnapGridSizeOption;
  songRegion : Region | null;
  trackRegion : {region: Region, track: Track} | null;
  tempo : number;
  timelinePosOptions : TimelinePositionOptions;
  timeSignature : TimeSignature;
  tracks : Track[];
  verticalScale : number;
}

export interface WorkstationContextType extends WorkstationFile {
  addNodeToLane : (track : Track, lane : AutomationLane, node : AutomationNode) => void;
  consolidateAudioClip: (clip: AudioClip, ctx: AudioContext, audioBuffer: AudioBuffer) => AudioBuffer | null;
  consolidateClip: (clip: Clip) => void;
  createClipFromTrackRegion : () => void;
  deleteClip : (clip : Clip) => void;
  deleteNode : (node : AutomationNode) => void;
  duplicateClip : (clip : Clip) => void;
  fxChains : FXChain[];
  numMeasures : number;
  onClipClickAway : (clip : Clip | null) => void;
  onNodeClickAway : (node : AutomationNode | null) => void;
  pasteClip : (pos : TimelinePosition, track? : Track) => void;
  pasteNode : (pos : TimelinePosition, lane? : AutomationLane) => void;
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>;
  setCancelClickAway : (cancel : boolean) => void;
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>;
  setFxChains : React.Dispatch<React.SetStateAction<FXChain[]>>;
  setHorizontalScale : React.Dispatch<React.SetStateAction<number>>;
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>;
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>;
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>;
  setMixerHeight : React.Dispatch<React.SetStateAction<number>>;
  setNumMeasures : React.Dispatch<React.SetStateAction<number>>
  setSelectedClip : (clip : Clip | null) => void;
  setSelectedNode : (newState: AutomationNode | null) => void;
  setShowMaster : React.Dispatch<React.SetStateAction<boolean>>;
  setShowMixer : React.Dispatch<React.SetStateAction<boolean>>;
  setSnapGridSize : React.Dispatch<React.SetStateAction<TimelineInterval>>;
  setSnapGridSizeOption : React.Dispatch<React.SetStateAction<SnapGridSizeOption>>;
  setSongRegion : React.Dispatch<React.SetStateAction<Region | null>>;
  setTempo : React.Dispatch<React.SetStateAction<number>>;
  setTimeSignature : React.Dispatch<React.SetStateAction<TimeSignature>>;
  setTrack : (track : Track) => void;
  setTrackRegion : React.Dispatch<React.SetStateAction<{region: Region, track: Track} | null>>;
  setTracks : React.Dispatch<React.SetStateAction<Track[]>>;
  setVerticalScale : React.Dispatch<React.SetStateAction<number>>;
  splitClip : (clip : Clip, pos : TimelinePosition) => void;
  toggleMuteClip : (clip : Clip) => void;
};

export const WorkstationContext = React.createContext<WorkstationContextType | undefined>(undefined);

export const WorkstationProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {clipboardItem} = React.useContext(ClipboardContext)!

  const [autoSnap, setAutoSnap] = React.useState(true);
  const [cursorPos, setCursorPos] = React.useState(TimelinePosition.fromPos(TimelinePosition.start))
  const [fxChains, setFxChains] = React.useState<FXChain[]>(JSON.parse(localStorage.getItem("fx-chains") || "[]"))
  const [horizontalScale, setHorizontalScale] = React.useState(1);
  const [isLooping, setIsLooping] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [metronome, setMetronome] = React.useState(false);
  const [mixerHeight, setMixerHeight] = React.useState(220);
  const [numMeasures, setNumMeasures] = React.useState(100);
  const [showMaster, setShowMaster] = React.useState(false);
  const [showMixer, setShowMixer] = React.useState(false);
  const [songRegion, setSongRegion] = React.useState<Region | null>(null)
  const [selectedClip, setSelectedClip, onClipClickAway] = useClickAwayState<Clip>(null)
  const [selectedNode, setSelectedNode, onNodeClickAway, setCancelClickAway] = useClickAwayState<AutomationNode>(null)
  const [snapGridSize, setSnapGridSize] = React.useState<TimelineInterval>({measures: 0, beats: 0, fraction: 500});
  const [snapGridSizeOption, setSnapGridSizeOption] = React.useState<SnapGridSizeOption>(SnapGridSizeOption.Auto)
  const [tempo, setTempo] = React.useState(120);
  const [timeSignature, setTimeSignature] = React.useState({beats: 4, noteValue: 4});
  const [trackRegion, setTrackRegion] = React.useState<{region: Region, track: Track} | null>(null)
  const [tracks, setTracks, setTrack] = useTracks([getBaseMasterTrack(), ...data]);
  const [timelinePosOptions, setTimelinePosOptions] = React.useState({
    snapSize: snapGridSize, 
    beatWidth: 50, 
    horizontalScale,
    timeSignature,
    tempo
  });
  const [verticalScale, setVerticalScale] = React.useState(1);

  React.useEffect(() => {
    setTimelinePosOptions({
      ...timelinePosOptions,
      snapSize: snapGridSize, 
      beatWidth: BASE_BEAT_WIDTH, 
      horizontalScale,
      tempo
    });
  }, [horizontalScale, snapGridSize, tempo])

  React.useEffect(() => {
    const newTimelinePosOptions = {...timelinePosOptions, timeSignature};
    preserveMargins(timelinePosOptions, newTimelinePosOptions);
    setTimelinePosOptions(newTimelinePosOptions);
  }, [timeSignature])

  React.useEffect(() => {
    const baseNumMeasures = Math.ceil(100 / (4 / timeSignature.noteValue) * (4 / timeSignature.beats));
    const furthestPos = getFurthestPos();
    const measures = baseNumMeasures * Math.max(1, Math.ceil((furthestPos.measure - 1) / (baseNumMeasures * 0.94)));
    const maxMeasures = Math.ceil(BASE_MAX_MEASURES / (4 / timeSignature.noteValue) * (4 / timeSignature.beats));
    
    setNumMeasures(Math.min(measures, maxMeasures));
  }, [tracks, cursorPos, songRegion, trackRegion, timeSignature])

  React.useEffect(() => {
    switch (snapGridSizeOption) {
      case SnapGridSizeOption.None:
        setSnapGridSize({measures: 0, beats: 0, fraction: 0})
        break;
      case SnapGridSizeOption.Auto:
        adjustSnapGridSize();
        break;
      case SnapGridSizeOption.EightMeasures:
        setSnapGridSize({measures: 8, beats: 0, fraction: 0});
        break;
      case SnapGridSizeOption.FourMeasures:
        setSnapGridSize({measures: 4, beats: 0, fraction: 0});
        break;
      case SnapGridSizeOption.TwoMeasures:
        setSnapGridSize({measures: 2, beats: 0, fraction: 0});
        break;
      case SnapGridSizeOption.Measure:
        setSnapGridSize({measures: 1, beats: 0, fraction: 0});
        break;
      case SnapGridSizeOption.Beat:
        setSnapGridSize({measures: 0, beats: 1, fraction: 0});
        break;
      case SnapGridSizeOption.HalfBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 500});
        break;
      case SnapGridSizeOption.QuarterBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 250});
        break;
      case SnapGridSizeOption.EighthBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 125});
        break;
      case SnapGridSizeOption.SixteenthBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 62.5});
        break;
      case SnapGridSizeOption.ThirtySecondBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 31.25});
        break;
      case SnapGridSizeOption.SixtyFourthBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 15.625});
        break;
      case SnapGridSizeOption.HundredTwentyEighthBeat:
        setSnapGridSize({measures: 0, beats: 0, fraction: 7.8125});
        break;
    }
  }, [snapGridSizeOption])

  React.useEffect(() => {
    if (snapGridSizeOption === SnapGridSizeOption.Auto)
      adjustSnapGridSize();
  }, [horizontalScale, timeSignature]);

  const addNodeToLane = (track : Track, lane : AutomationLane, node : AutomationNode) => {
    const automationLanes = track.automationLanes.slice();
    const laneIndex = automationLanes.findIndex(l => l.id === lane.id);

    if (laneIndex !== -1) {
      automationLanes[laneIndex].nodes.push(node);
      automationLanes[laneIndex].nodes.sort((a, b) => a.pos.compare(b.pos))
      setTrack({...track, automationLanes});
    }
  }

  const adjustSnapGridSize = () => {
    const beatWidth = timelinePosOptions.beatWidth * horizontalScale * (4 / timelinePosOptions.timeSignature.noteValue);
    const measureWidth = beatWidth * timeSignature.beats;

    const power = -Math.floor(Math.log2(beatWidth / 17));
    let frac = 1000 * 2 ** power;
      
    if (Math.log2(timeSignature.beats) % 1 !== 0) {
      if (measureWidth < 17) {
        frac = Math.max(timeSignature.beats * 1000 * 2 ** -Math.floor(Math.log2(measureWidth / 17)));
      } else {
        const factors = [];

        for (let i = 1; i <= timeSignature.beats; i++) {
          if (timeSignature.beats % i === 0) {
            factors.push(i);
          }
        }

        for (let f of factors) {
          if (f * beatWidth >= 17) {
            frac = f * 1000;
            break;
          }
        }

        if (frac === timeSignature.beats * 1000 && measureWidth >= 34) {
          frac = factors[factors.length - 2] * 1000;
        }
      }
    }

    const interval = TimelinePosition.fromFraction(frac, timelinePosOptions);
    setSnapGridSize(interval);
  }

  const consolidateAudioClip = (clip: AudioClip, ctx: AudioContext, audioBuffer: AudioBuffer) => {
    const track = tracks.slice().find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const clips = track.clips.slice();
      const clipIndex = clips.findIndex(c => c.id === clip.id);

      if (clipIndex > -1) {
        let concatenatedAudioBuffer = null;

        const fullWidth = TimelinePosition.toWidth(clip.start, clip.loopEnd || clip.end, timelinePosOptions);
        const width = TimelinePosition.toWidth(clip.start, clip.end, timelinePosOptions);
        const audioWidth = TimelinePosition.toWidth(clip.audio.start, clip.audio.end, timelinePosOptions);
        const audioStartOffset = TimelinePosition.toWidth(clip.audio.start, clip.start, timelinePosOptions);
        const audioEndOffset = audioStartOffset + width;
        const repetitions = Math.ceil(fullWidth / width);

        const audioStartOffsetPercentange = Math.max(0, audioStartOffset / audioWidth);
        const audioEndOffsetPercentange = audioEndOffset / audioWidth;
        const start = Math.floor(audioStartOffsetPercentange * audioBuffer.length);
        const end = Math.floor(audioEndOffsetPercentange * audioBuffer.length);
        const offset = audioStartOffset < 0 ? Math.ceil((Math.abs(audioStartOffset) / audioWidth) * audioBuffer.length) : 0;

        for (let i = 0; i < repetitions; i++) {
          const repetitionWidth = Math.min(width, fullWidth - width * i);
          const repetitionScale = repetitionWidth / audioWidth;
          const length = Math.ceil(repetitionScale * audioBuffer.length);
          const newBuffer = ctx.createBuffer(audioBuffer.numberOfChannels, length, audioBuffer.sampleRate);
          
          for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            var channel = newBuffer.getChannelData(i);
            
            if (length > offset) {
              channel.set(audioBuffer.getChannelData(i).slice(start, end).slice(0, length - offset), offset);
            }
          }

          concatenatedAudioBuffer = concatenatedAudioBuffer ? 
            concatAudioBuffer(ctx, concatenatedAudioBuffer, newBuffer) : newBuffer;
        }

        if (concatenatedAudioBuffer) {
          const buffer = audioBufferToBuffer(concatenatedAudioBuffer);
          const newClip: AudioClip = {
            ...clips[clipIndex],
            startLimit: clip.startLimit ? clip.start : null,
            start: clip.start,
            endLimit: clip.endLimit ? (clip.loopEnd || clip.end) : null,
            end: clip.loopEnd || clip.end,
            loopEnd: null,
            audio: {
              buffer,
              src: {extension: "wav", data: buffer.toString("base64")},
              duration: concatenatedAudioBuffer.duration,
              end: TimelinePosition.fromPos(clip.loopEnd || clip.end),
              start: TimelinePosition.fromPos(clip.start)
            }
          }
  
          clips[clipIndex] = newClip;
          setTrack({...track, clips});
  
          if (selectedClip?.id !== clip.id)
            setSelectedClip(newClip);
  
          return concatenatedAudioBuffer;
        }
      }
    }

    return null;
  }

  const consolidateClip = (clip: Clip) => {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const clips = track.clips.slice();
      const clipIndex = clips.findIndex(c => c.id === clip.id);

      if (clipIndex > -1) {
        const newClip = {
          ...clips[clipIndex],
          startLimit: clip.startLimit ? clip.start : null,
          start: clip.start,
          endLimit: clip.endLimit ? (clip.loopEnd || clip.end) : null,
          end: clip.loopEnd || clip.end,
          loopEnd: null
        }
        
        clips[clipIndex] = newClip;
        setTrack({...track, clips});

        if (selectedClip?.id !== clip.id)
          setSelectedClip(newClip);
      }
    }
  }

  const createClipFromTrackRegion = () => {
    if (trackRegion) {
      if (trackRegion.region) {
        let clips = trackRegion.track.clips.slice();
        const clip: Clip = {
          id: v4(), 
          start: trackRegion.region.start, 
          end: trackRegion.region.end, 
          startLimit: null, 
          endLimit: null, 
          loopEnd: null, 
          muted: false,
          name: "Untitled"
        };

        clips.push(clip);
        clips = sliceAnyOverlappingClips(clip, clips, timelinePosOptions);

        setTrack({...trackRegion.track, clips});
        setTrackRegion(null);
      }
    }
  }

  const deleteClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const newClips = track.clips.filter((c: Clip) => c.id !== clip.id);
      setTrack({...track, clips: newClips});
    }

    if (clip.id === selectedClip?.id) {
      setSelectedClip(null);
    }
  }

  const deleteNode = (node : AutomationNode) => {
    const track = tracks.find(t => t.automationLanes.find((l: AutomationLane) => l.nodes.find(n => n.id === node.id)));

    if (track) {
      const newLanes = track.automationLanes.map((l: AutomationLane) => {
        const newNodes = l.nodes.filter(n => n.id !== node.id);
        newNodes.sort((a, b) => a.pos.compare(b.pos));
        return {...l, nodes: newNodes};
      });

      setTrack({...track, automationLanes: newLanes});
    }

    if (node.id === selectedNode?.id) {
      setSelectedNode(null);
    }
  }

  const duplicateClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const newClip = clipAtPos(clip.loopEnd || clip.end, {...clip, id: v4()}, timelinePosOptions)
      setTrack({...track, clips: [...track.clips, newClip]});
      setSelectedClip(newClip);
    }
  }

  const getFurthestPos = () : TimelinePosition => {
    let furthestPos = TimelinePosition.start;

    for (const track of tracks) {
      for (const clip of track.clips) {
        if (clip.end.compare(furthestPos) > 0)
          furthestPos = clip.end;
      
        if (clip.loopEnd && clip.loopEnd?.compare(furthestPos) > 0)
          furthestPos = clip.loopEnd;
      }
      for (const lane of track.automationLanes)
        for (const node of lane.nodes)
          if (node.pos.compare(furthestPos) > 0)
            furthestPos = node.pos;
    }

    if (cursorPos.compare(furthestPos) > 0) 
      furthestPos = cursorPos;

    if (songRegion && songRegion.end.compare(furthestPos) > 0)
      furthestPos = songRegion.end;

    if (trackRegion && trackRegion.region.end.compare(furthestPos) > 0)
      furthestPos = trackRegion.region.end;
  
    return furthestPos;
  }

  const pasteClip = (pos : TimelinePosition, track? : Track) => {
    navigator.clipboard.readText().then(text => {
      if (!text) {
        if (clipboardItem?.item && clipboardItem?.type === ClipboardItemType.Clip) {
          const itemClip = {...clipboardItem?.item} as Clip;
      
          if (track === undefined) {
            track = tracks.find(t => t.id === clipboardItem?.container);
          }

          if (track) {
            let clips = track.clips.slice();
            const newClip = {...clipAtPos(pos, itemClip, timelinePosOptions), id: v4()};

            clips.push(newClip);
            clips = sliceAnyOverlappingClips(newClip, clips, timelinePosOptions);

            setTrack({...track, clips});
          }
        }
      }
    })
  }

  const pasteNode = (pos : TimelinePosition, lane? : AutomationLane) => {
    navigator.clipboard.readText().then(text => {
      if (!text) {
        if (clipboardItem?.item && clipboardItem?.type === ClipboardItemType.Node) {
          const itemAsNode = clipboardItem?.item as AutomationNode;
          let newNode = {...itemAsNode, id: v4(), pos: TimelinePosition.fromPos(itemAsNode.pos)};
          let track;
      
          if (lane === undefined) {
            track = tracks.find(t => t.automationLanes.find((l: AutomationLane) => l.id === clipboardItem?.container));
            lane = track?.automationLanes.find((l: AutomationLane) => l.id === clipboardItem?.container);
          } else {
            track = tracks.find(t => t.automationLanes.find((l: AutomationLane) => l.id === lane!.id));
          }
      
          if (lane) {
            newNode.pos.set(pos);
            newNode.pos.snap(timelinePosOptions);
            addNodeToLane(track!, lane, newNode);
          }
        }
      }
    })
  }

  const preserveMargins = (oldOptions: TimelinePositionOptions, newOptions: TimelinePositionOptions) => {
    const newTracks = tracks.slice()

    for (var i = 0; i < newTracks.length; i++) {
      for (var j = 0; j < newTracks[i].clips.length; j++) {
        newTracks[i].clips[j] = preserveClipMargins(newTracks[i].clips[j], oldOptions, newOptions);

        if ((newTracks[i].clips[j] as AudioClip).audio) {
          (newTracks[i].clips[j] as AudioClip).audio.start = preservePosMargin(
            (newTracks[i].clips[j] as AudioClip).audio.start, oldOptions, newOptions);
          (newTracks[i].clips[j] as AudioClip).audio.end = preservePosMargin(
            (newTracks[i].clips[j] as AudioClip).audio.end, oldOptions, newOptions);
        }

        if (newTracks[i].clips[j].id === selectedClip?.id)
          setSelectedClip(newTracks[i].clips[j]);
      }

      for (var j = 0; j < newTracks[i].automationLanes.length; j++) {
        const lane = newTracks[i].automationLanes[j];

        for (var k = 0; k < newTracks[i].automationLanes[j].nodes.length; k++) {
          newTracks[i].automationLanes[j].nodes[k].pos = preservePosMargin(lane.nodes[k].pos, oldOptions, newOptions);

          if (lane.nodes[k].id === selectedNode?.id)
            setSelectedNode(lane.nodes[k]);
        }
      }
    }

    const newSongRegion : Region | null = songRegion ? {
      start: preservePosMargin(songRegion.start, oldOptions, newOptions),
      end: preservePosMargin(songRegion.end, oldOptions, newOptions)
    } : null

    const newTrackRegion = trackRegion ? {
      ...trackRegion,
      region: {
        start: preservePosMargin(trackRegion.region.start, oldOptions, newOptions),
        end: preservePosMargin(trackRegion.region.end, oldOptions, newOptions)
      }
    } : null

    setTracks(newTracks);
    setCursorPos(preservePosMargin(cursorPos, oldOptions, newOptions));
    setSongRegion(newSongRegion);
    setTrackRegion(newTrackRegion);
  }

  const splitClip = (clip : Clip, pos : TimelinePosition) => {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track && pos.compare(clip.start) > 0) {
      const clipSlices = sliceClip(clip, pos, timelinePosOptions);

      setTrack({...track, clips: track.clips.filter(c => c.id !== clip.id).concat(clipSlices)});

      if (clip.id === selectedClip?.id) {
        setSelectedClip(clipSlices[0]);
      }
    }
  }

  const toggleMuteClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find((c: Clip) => c.id === clip.id));

    if (track) {
      const newClip = {...clip, muted: !clip.muted};

      setTrack({...track, clips: track.clips.map((c: Clip) => c.id === clip.id ? newClip : c)});

      if (clip.id === selectedClip?.id)
        setSelectedClip(newClip);
    }
  }
  
  return (
    <WorkstationContext.Provider 
      value={{ 
        addNodeToLane,
        autoSnap,
        consolidateAudioClip,
        consolidateClip,
        createClipFromTrackRegion,
        cursorPos,
        deleteClip,
        deleteNode,
        duplicateClip,
        fxChains,
        horizontalScale, 
        isLooping,
        isPlaying,
        isRecording,
        metronome,
        mixerHeight,
        numMeasures,
        onClipClickAway,
        onNodeClickAway,
        pasteClip,
        pasteNode,
        selectedClip,
        selectedNode,
        setAutoSnap,
        setCancelClickAway,
        setCursorPos,
        setFxChains,
        setHorizontalScale,
        setIsLooping,
        setIsPlaying,
        setIsRecording,
        setMetronome,
        setMixerHeight,
        setNumMeasures,
        setSelectedClip,
        setSelectedNode,
        setShowMaster,
        setShowMixer,
        setSnapGridSize,
        setSnapGridSizeOption,
        setSongRegion,
        setTempo,
        setTimeSignature,
        setTrack,
        setTrackRegion,
        setTracks,
        setVerticalScale,
        showMaster,
        showMixer,
        snapGridSize,
        snapGridSizeOption,
        splitClip, 
        songRegion,
        trackRegion,
        tempo,
        timelinePosOptions,
        timeSignature,
        toggleMuteClip,
        tracks,
        verticalScale
      }}
    >
      {children}
    </WorkstationContext.Provider>
  );
};