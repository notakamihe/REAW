import React, { useRef } from "react"
import { SnapGridSize, TimeSignature } from "renderer/types/types";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { AutomationNode } from "renderer/components/AutomationNodeComponent";
import { useClickAwayState, useStateWPrev, useTracks } from "renderer/hooks";
import { Clip } from "renderer/components/ClipComponent";
import { Track } from "renderer/components/TrackComponent";
import data from "renderer/tempData";
import { AutomationLane } from "renderer/components/AutomationLaneTrack";
import { ClipboardContext, ClipboardItemType } from "./ClipboardContext";
import { v4 } from "uuid";
import { copyClip, clipAtPos, preserveClipMargins, preservePosMargin, getBaseMasterTrack } from "renderer/utils/utils";
import { Region } from "renderer/components/RegionComponent";
import { FXChain } from "renderer/components/FXComponent";
import { BASE_MAX_MEASURES } from "renderer/utils/utils";

interface WorkstationFile {
  autoSnap : boolean,
  cursorPos : TimelinePosition,
  horizontalScale : number,
  isLooping : boolean,
  isPlaying : boolean,
  isRecording : boolean,
  metronome : boolean,
  selectedClip : Clip | null,
  selectedNode : AutomationNode | null,
  showMaster : boolean,
  snapGridSize : SnapGridSize,
  songRegion : Region | null,
  trackRegion : {region: Region, track: Track} | null,
  tempo : number,
  timelinePosOptions : TimelinePositionOptions,
  timeSignature : TimeSignature,
  tracks : Track[],
  verticalScale : number
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
  pasteClip : (atCursor : boolean, track? : Track, pos? : TimelinePosition) => void
  pasteNode : (atCursor : boolean, lane? : AutomationLane, pos? : TimelinePosition) => void,
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>
  setCancelClickAway : (cancel : boolean) => void
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>
  setFxChains : React.Dispatch<React.SetStateAction<FXChain[]>>
  setHorizontalScale : React.Dispatch<React.SetStateAction<number>>
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>
  setNumMeasures : React.Dispatch<React.SetStateAction<number>>
  setSelectedClip : (clip : Clip | null) => void
  setSelectedNode : (newState: AutomationNode | null) => void
  setShowMaster : React.Dispatch<React.SetStateAction<boolean>>
  setSnapGridSize : React.Dispatch<React.SetStateAction<SnapGridSize>>
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
  const [numMeasures, setNumMeasures] = React.useState(100);
  const [showMaster, setShowMaster] = React.useState(false);
  const [songRegion, setSongRegion] = React.useState<Region | null>(null)
  const [selectedClip, setSelectedClip, onClipClickAway] = useClickAwayState<Clip>(null)
  const [selectedNode, setSelectedNode, onNodeClickAway, setCancelClickAway] = useClickAwayState<AutomationNode>(null)
  const [snapGridSize, setSnapGridSize] = React.useState(SnapGridSize.ThirtySecondBeat);
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
    if (autoSnap) {
      const beatWidth = timelinePosOptions.beatWidth * horizontalScale;

      if (beatWidth > 3500) {
        setSnapGridSize(SnapGridSize.None)
      } else if (beatWidth > 1265) {
        setSnapGridSize(SnapGridSize.HundredTwentyEighthBeat)
      } else if (beatWidth > 588) {
        setSnapGridSize(SnapGridSize.SixtyFourthBeat)
      } else if (beatWidth > 390) {
        setSnapGridSize(SnapGridSize.ThirtySecondBeat)
      } else if (beatWidth > 120) {
        setSnapGridSize(SnapGridSize.SixteenthBeat)
      } else if (beatWidth > 57) {
        setSnapGridSize(SnapGridSize.EighthBeat)
      } else if (beatWidth > 23) {
        setSnapGridSize(SnapGridSize.QuarterBeat)
      } else if (beatWidth > 14) {
        setSnapGridSize(SnapGridSize.HalfBeat)
      } else if (beatWidth > 6.6) {
        setSnapGridSize(SnapGridSize.Beat)
      } else if (beatWidth > 2.7) {
        setSnapGridSize(SnapGridSize.HalfMeasure)
      } else {
        setSnapGridSize(SnapGridSize.Measure)
      }
    }
  }, [horizontalScale, autoSnap])

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
    const baseNumMeasures = Math.floor(100 / (4 / timeSignature.noteValue) * (4 / timeSignature.beats));
    const furthestPos = getFurthestPos();
    const measures = baseNumMeasures * Math.ceil((furthestPos.measure - 1) / (baseNumMeasures * 0.94));
    const maxMeasures = Math.floor(BASE_MAX_MEASURES / (4 / timeSignature.noteValue) * (4 / timeSignature.beats));
    
    setNumMeasures(Math.min(measures, maxMeasures));
  }, [tracks, cursorPos, songRegion, trackRegion, timeSignature])

  const addNodeToLane = (track : Track, lane : AutomationLane, node : AutomationNode) => {
    const automationLanes = track.automationLanes.slice();
    const laneIndex = automationLanes.findIndex(l => l.id === lane.id);

    if (laneIndex !== -1) {
      automationLanes[laneIndex].nodes.push(node);
      automationLanes[laneIndex].nodes.sort((a, b) => a.pos.compare(b.pos))
      setTrack({...track, automationLanes});
    }
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
      for (const clip of track.clips)
        if (clip.end.compare(furthestPos) > 0)
          furthestPos = clip.end;
      
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

  const pasteClip = (atCursor : boolean, track? : Track, pos? : TimelinePosition) => {
    navigator.clipboard.readText().then(text => {
      if (!text) {
        if (clipboardItem?.item && clipboardItem?.type === ClipboardItemType.Clip) {
          const itemClip = clipboardItem?.item as Clip;
          let newClip = copyClip(itemClip);
          newClip.id = v4();
      
          if (track === undefined) {
            track = tracks.find(t => t.id === clipboardItem?.container);
          }
      
          if (track) {
            if (atCursor) {
              newClip = clipAtPos(cursorPos, newClip, timelinePosOptions);
            } else if (pos) {
              newClip = clipAtPos(pos, newClip, timelinePosOptions);
            }
      
            setTrack({...track, clips: [...track.clips, newClip]});
          }
        }
      }
    })
  }

  const pasteNode = (atCursor : boolean, lane? : AutomationLane, pos? : TimelinePosition) => {
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
            if (atCursor) {
              newNode.pos.setPos(cursorPos);
            } else if (pos) {
              newNode.pos.setPos(pos);
            }
      
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
        end = clip.end.add(repEndSpan.measures, repEndSpan.beats, repEndSpan.fraction, false, timelinePosOptions, false)

        const repStartSpan = TimelinePosition.fromWidth(repStartMargin, timelinePosOptions)
        const repStart = clip.end.add(repStartSpan.measures, repStartSpan.beats, repStartSpan.fraction, false, timelinePosOptions, false)

        if (clip.startLimit) {
          const startSpan = TimelinePosition.toSpan(clip.startLimit, clip.start, timelinePosOptions)
          startLimit = repStart.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, timelinePosOptions, false)
        }

        if (clip.endLimit) {
          const span = TimelinePosition.toSpan(clip.start, repStart, timelinePosOptions)
          endLimit = clip.endLimit.add(span.measures, span.beats, span.fraction, false, timelinePosOptions, false)
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
        end = start.add(measures, beats, fraction, false, timelinePosOptions, false)
        loopEnd = loopWidth > width ? clip.loopEnd : null

        if (clip.startLimit) {
          const startSpan = TimelinePosition.toSpan(clip.startLimit, clip.start, timelinePosOptions)
          startLimit = start.subtract(startSpan.measures, startSpan.beats, startSpan.fraction, false, timelinePosOptions, false)
        }
        
        if (clip.endLimit) {
          const span = TimelinePosition.toSpan(clip.start, start, timelinePosOptions)
          endLimit = clip.endLimit.add(span.measures, span.beats, span.fraction, false, timelinePosOptions, false)
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
        setNumMeasures,
        setSelectedClip,
        setSelectedNode,
        setShowMaster,
        setSnapGridSize,
        setSongRegion,
        setTempo,
        setTimeSignature,
        setTrack,
        setTrackLanesWindowHeight,
        setTrackRegion,
        setTracks,
        setVerticalScale,
        showMaster,
        snapGridSize,
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