import React, { useRef } from "react"
import { SnapGridSizeOption, TimeSignature } from "renderer/types/types";
import TimelinePosition, { TimelinePositionOptions, TimelineInterval } from "renderer/types/TimelinePosition";
import { AutomationNode } from "renderer/components/AutomationNodeComponent";
import { useClickAwayState, useStateWPrev, useTracks } from "renderer/hooks";
import { Clip } from "renderer/components/ClipComponent";
import { Track } from "renderer/components/TrackComponent";
import data from "renderer/tempData";
import { AutomationLane } from "renderer/components/AutomationLaneTrack";
import { ClipboardContext, ClipboardItemType } from "./ClipboardContext";
import { v4 } from "uuid";
import { clipAtPos, preserveClipMargins, preservePosMargin, getBaseMasterTrack } from "renderer/utils/utils";
import { Region } from "renderer/components/RegionComponent";
import { FXChain } from "renderer/components/FXComponent";
import { BASE_MAX_MEASURES } from "renderer/utils/utils";

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
  addNodeToLane : (track : Track, lane : AutomationLane, node : AutomationNode) => void
  createClipFromTrackRegion : () => void
  deleteClip : (clip : Clip) => void
  deleteNode : (node : AutomationNode) => void
  duplicateClip : (clip : Clip) => void
  fxChains : FXChain[]
  numMeasures : number
  onClipClickAway : (clip : Clip | null) => void
  onNodeClickAway : (node : AutomationNode | null) => void
  pasteClip : (pos : TimelinePosition, track? : Track) => void
  pasteNode : (pos : TimelinePosition, lane? : AutomationLane) => void,
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>
  setCancelClickAway : (cancel : boolean) => void
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>
  setFxChains : React.Dispatch<React.SetStateAction<FXChain[]>>
  setHorizontalScale : React.Dispatch<React.SetStateAction<number>>
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>
  setMixerHeight : React.Dispatch<React.SetStateAction<number>>
  setNumMeasures : React.Dispatch<React.SetStateAction<number>>
  setSelectedClip : (clip : Clip | null) => void
  setSelectedNode : (newState: AutomationNode | null) => void
  setShowMaster : React.Dispatch<React.SetStateAction<boolean>>
  setShowMixer : React.Dispatch<React.SetStateAction<boolean>>
  setSnapGridSize : React.Dispatch<React.SetStateAction<TimelineInterval>>
  setSnapGridSizeOption : React.Dispatch<React.SetStateAction<SnapGridSizeOption>>
  setSongRegion : React.Dispatch<React.SetStateAction<Region | null>>
  setTempo : React.Dispatch<React.SetStateAction<number>>
  setTimeSignature : React.Dispatch<React.SetStateAction<TimeSignature>>
  setTrack : (track : Track) => void;
  setTrackLanesWindowHeight : React.Dispatch<React.SetStateAction<number>>
  setTrackRegion : React.Dispatch<React.SetStateAction<{region: Region, track: Track} | null>>
  setTracks : React.Dispatch<React.SetStateAction<Track[]>>
  setVerticalScale : React.Dispatch<React.SetStateAction<number>>
  splitClip : (clip : Clip, pos : TimelinePosition) => void
  toggleMuteClip : (clip : Clip) => void
  trackLanesWindowHeight : number
};

export const WorkstationContext = React.createContext<WorkstationContextType | undefined>(undefined);

export const WorkstationProvider: React.FC = ({ children }) => {
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
  const [trackLanesWindowHeight, setTrackLanesWindowHeight] = React.useState(0);
  const [trackRegion, setTrackRegion] = React.useState<{region: Region, track: Track} | null>(null)
  const [tracks, setTracks, setTrack] = useTracks([getBaseMasterTrack(), ...data]);
  const [timelinePosOptions, setTimelinePosOptions, prevTimelineOptions] = useStateWPrev({
    snapSize: snapGridSize, 
    beatWidth: 50, 
    horizontalScale,
    timeSignature,
    tempo
  });
  const [verticalScale, setVerticalScale] = React.useState(1);

  const shouldPreserveMargins = useRef(false);

  React.useEffect(() => {
    setTimelinePosOptions({
      snapSize: snapGridSize, 
      beatWidth: 50, 
      horizontalScale,
      timeSignature,
      tempo
    });
  }, [horizontalScale, snapGridSize, timeSignature, tempo])

  React.useEffect(() => {
    shouldPreserveMargins.current = true;
  }, [timeSignature])

  React.useEffect(() => {
    if (shouldPreserveMargins.current) {
      preserveMargins()
      shouldPreserveMargins.current = false;
    }
  }, [timelinePosOptions])

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

  const createClipFromTrackRegion = () => {
    if (trackRegion) {
      if (trackRegion.region) {
        const clip = {
          id: v4(), 
          start: trackRegion.region.start, 
          end: trackRegion.region.end, 
          startLimit: null, 
          endLimit: null, 
          loopEnd: null, 
          muted: false
        }

        setTrack({...trackRegion.track, clips: [...trackRegion.track.clips, clip]})
        setTrackRegion(null)
      }
    }
  }

  const deleteClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track) {
      const newClips = track.clips.filter(c => c.id !== clip.id);
      setTrack({...track, clips: newClips});
    }

    if (clip.id === selectedClip?.id) {
      setSelectedClip(null);
    }
  }

  const deleteNode = (node : AutomationNode) => {
    const track = tracks.find(t => t.automationLanes.find(l => l.nodes.find(n => n.id === node.id)));

    if (track) {
      const newLanes = track.automationLanes.map(l => {
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
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track) {
      const newClip = clipAtPos(clip.loopEnd || clip.end, {...clip, id: v4()}, timelinePosOptions)
      setTrack({...track, clips: [...track.clips, newClip]});
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
          const itemClip = clipboardItem?.item as Clip;
      
          if (track === undefined) {
            track = tracks.find(t => t.id === clipboardItem?.container);
          }
      
          if (track) {
            const newClip = {...clipAtPos(pos, itemClip, timelinePosOptions), id: v4()};
            setTrack({...track, clips: [...track.clips, newClip]});
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
            track = tracks.find(t => t.automationLanes.find(l => l.id === clipboardItem?.container));
            lane = track?.automationLanes.find(l => l.id === clipboardItem?.container);
          } else {
            track = tracks.find(t => t.automationLanes.find(l => l.id === lane!.id));
          }
      
          if (lane) {
            newNode.pos.setPos(pos);
            newNode.pos.snap(timelinePosOptions);
            addNodeToLane(track!, lane, newNode);
          }
        }
      }
    })
  }

  const preserveMargins = () => {
    if (prevTimelineOptions) {
      const newTracks = tracks.slice()

      for (var i = 0; i < newTracks.length; i++) {
        for (var j = 0; j < newTracks[i].clips.length; j++) {
          newTracks[i].clips[j] = preserveClipMargins(newTracks[i].clips[j], prevTimelineOptions, timelinePosOptions);

          if (newTracks[i].clips[j].id === selectedClip?.id)
            setSelectedClip(newTracks[i].clips[j]);
        }

        for (var j = 0; j < newTracks[i].automationLanes.length; j++) {
          const lane = newTracks[i].automationLanes[j];

          for (var k = 0; k < newTracks[i].automationLanes[j].nodes.length; k++) {
            newTracks[i].automationLanes[j].nodes[k].pos = preservePosMargin(lane.nodes[k].pos, prevTimelineOptions, timelinePosOptions);

            if (lane.nodes[k].id === selectedNode?.id)
              setSelectedNode(lane.nodes[k]);
          }
        }
      }

      const newSongRegion : Region | null = songRegion ? {
        start: preservePosMargin(songRegion.start, prevTimelineOptions, timelinePosOptions),
        end: preservePosMargin(songRegion.end, prevTimelineOptions, timelinePosOptions)
      } : null

      const newTrackRegion = trackRegion ? {
        ...trackRegion,
        region: {
          start: preservePosMargin(trackRegion.region.start, prevTimelineOptions, timelinePosOptions),
          end: preservePosMargin(trackRegion.region.end, prevTimelineOptions, timelinePosOptions)
        }
      } : null
  
      setTracks(newTracks);
      setCursorPos(preservePosMargin(cursorPos, prevTimelineOptions, timelinePosOptions));
      setSongRegion(newSongRegion);
      setTrackRegion(newTrackRegion);
    }
  }

  const splitClip = (clip : Clip, pos : TimelinePosition) => {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));
    const width = TimelinePosition.toWidth(clip.start, clip.end, timelinePosOptions)

    if (track && pos.compare(clip.start) > 0) {
      const clips = track.clips.slice()
      let start : TimelinePosition, end : TimelinePosition, startLimit = null, endLimit = null, loopEnd = null
      let loopWidth = TimelinePosition.toWidth(clip.end, clip.loopEnd, timelinePosOptions)
      let newClip : Clip | null = null
      let addExtraClip = false

      if (pos.compare(clip.end) < 0) {
        start = TimelinePosition.fromPos(pos)
        end = TimelinePosition.fromPos(clip.end)
        startLimit = clip.startLimit ? TimelinePosition.fromPos(clip.startLimit) : null,
        endLimit = clip.endLimit ? TimelinePosition.fromPos(clip.endLimit) : null, 
        loopEnd = null

        newClip = {...clip, end: TimelinePosition.fromPos(pos), loopEnd: null}
        const index = clips.findIndex(c => c.id === newClip!.id)

        clips[index] = newClip
        clips.push({id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted})

        addExtraClip = Boolean(clip.loopEnd)
      } else if (clip.loopEnd && pos.compare(clip.loopEnd) < 0) {
        start = TimelinePosition.fromPos(pos)
        loopEnd = null

        const width = TimelinePosition.toWidth(clip.start, clip.end, timelinePosOptions)
        const endToPosWidth = TimelinePosition.toWidth(clip.end, start, timelinePosOptions)
        const repetition = Math.ceil(endToPosWidth / width)

        const repStartMargin = (repetition - 1) * width
        const repEndMargin = (repetition === Math.ceil(loopWidth / width) && loopWidth % width !== 0) ?
          loopWidth : repetition * width

        const repEndSpan = TimelinePosition.fromWidth(repEndMargin, timelinePosOptions)
        end = clip.end.add(repEndSpan.measures, repEndSpan.beats, repEndSpan.fraction, false, timelinePosOptions)

        const repStartSpan = TimelinePosition.fromWidth(repStartMargin, timelinePosOptions)
        const repStart = clip.end.add(repStartSpan.measures, repStartSpan.beats, repStartSpan.fraction, false, timelinePosOptions)

        if (clip.startLimit) {
          const startSpan = TimelinePosition.toInterval(clip.startLimit, clip.start, timelinePosOptions)
          startLimit = repStart.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, timelinePosOptions)
        }

        if (clip.endLimit) {
          const interval = TimelinePosition.toInterval(clip.start, repStart, timelinePosOptions)
          endLimit = clip.endLimit.add(interval.measures, interval.beats, interval.fraction, false, timelinePosOptions)
        }

        newClip = {...clip, loopEnd: start}
        const index = clips.findIndex(c => c.id === newClip!.id)

        clips[index] = newClip

        if (endToPosWidth % width !== 0) {
          clips.push({id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted})
        }

        addExtraClip = repetition < Math.ceil(loopWidth / width)
        loopWidth = TimelinePosition.toWidth(end, clip.loopEnd, timelinePosOptions)
      }

      if (addExtraClip) {
        const {measures, beats, fraction} = TimelinePosition.fromWidth(Math.min(width, loopWidth), timelinePosOptions)
        
        start = TimelinePosition.fromPos(end!)
        end = start.add(measures, beats, fraction, false, timelinePosOptions)
        loopEnd = loopWidth > width ? clip.loopEnd : null

        if (clip.startLimit) {
          const startSpan = TimelinePosition.toInterval(clip.startLimit, clip.start, timelinePosOptions)
          startLimit = start.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, timelinePosOptions)
        }
        
        if (clip.endLimit) {
          const interval = TimelinePosition.toInterval(clip.start, start, timelinePosOptions)
          endLimit = clip.endLimit.add(interval.measures, interval.beats, interval.fraction, false, timelinePosOptions)
        }

        clips.push({id: v4(), start, end, startLimit, endLimit, loopEnd, muted: clip.muted})
      }

      setTrack({...track, clips})

      if (newClip?.id === selectedClip?.id) {
        setSelectedClip(newClip)
      }
    }
  }

  const toggleMuteClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track) {
      const newClip = {...clip, muted: !clip.muted};

      setTrack({...track, clips: track.clips.map(c => c.id === clip.id ? newClip : c)});

      if (clip.id === selectedClip?.id)
        setSelectedClip(newClip);
    }
  }
  
  return (
    <WorkstationContext.Provider 
      value={{ 
        addNodeToLane,
        autoSnap,
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
        setTrackLanesWindowHeight,
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
        trackLanesWindowHeight,
        tracks,
        verticalScale
      }}
    >
      {children}
    </WorkstationContext.Provider>
  );
};