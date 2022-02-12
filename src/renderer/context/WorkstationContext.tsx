import React, { useRef } from "react"
import { SnapGridSize, TimeSignature } from "renderer/types/types";
import TimelinePosition, { TimelinePositionOptions } from "renderer/types/TimelinePosition";
import { BEAT_WIDTH } from "renderer/utils/vars";
import { AutomationNode } from "renderer/components/AutomationNodeComponent";
import { useClickAwayState, useStateWPrev, useTracks } from "renderer/hooks";
import { Clip } from "renderer/components/ClipComponent";
import { Track } from "renderer/components/TrackComponent";
import data from "renderer/tempData";
import { AutomationLane } from "renderer/components/AutomationLaneTrack";
import { ClipboardContext, ClipboardItemType } from "./ClipboardContext";
import { v4 } from "uuid";
import { copyClip, clipAtPos, preserveClipMargins, preservePosMargin } from "renderer/utils/utils";
import { Region } from "renderer/components/RegionComponent";

export interface WorkflowContextType {
  addNodeToLane : (track : Track, lane : AutomationLane, node : AutomationNode) => void
  autoSnap : boolean
  createClipFromTrackRegion : () => void
  cursorPos : TimelinePosition
  deleteClip : (clip : Clip) => void
  deleteNode : (node : AutomationNode) => void
  duplicateClip : (clip : Clip) => void
  horizontalScale : number
  isLooping : boolean
  isPlaying : boolean
  isRecording : boolean
  metronome : boolean
  onClipClickAway : (clip : Clip | null) => void
  onNodeClickAway : (node : AutomationNode | null) => void
  pasteClip : (atCursor : boolean, track? : Track, pos? : TimelinePosition) => void
  pasteNode : (atCursor : boolean, lane? : AutomationLane, pos? : TimelinePosition) => void,
  selectedClip : Clip | null
  selectedNode : AutomationNode | null
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>
  setCancelClickAway : (cancel : boolean) => void
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>
  setHorizontalScale : React.Dispatch<React.SetStateAction<number>>
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>
  setSelectedClip : (clip : Clip | null) => void
  setSelectedNode : (newState: AutomationNode | null) => void
  setSnapGridSize : React.Dispatch<React.SetStateAction<SnapGridSize>>
  setSongRegion : React.Dispatch<React.SetStateAction<Region | null>>
  setTempo : React.Dispatch<React.SetStateAction<number>>
  setTimeSignature : React.Dispatch<React.SetStateAction<TimeSignature>>
  setTrack : (track : Track, callback? : () => void) => void;
  setTrackLanesWindowHeight : React.Dispatch<React.SetStateAction<number>>
  setTrackRegion : React.Dispatch<React.SetStateAction<{region: Region, track: Track} | null>>
  setTracks : (tracks : Track[], callback? : () => void) => void;
  setVerticalScale : React.Dispatch<React.SetStateAction<number>>
  snapGridSize : SnapGridSize
  songRegion : Region | null
  trackRegion : {region: Region, track: Track} | null
  tempo : number
  timelinePosOptions : TimelinePositionOptions
  timeSignature : TimeSignature
  toggleMuteClip : (clip : Clip) => void
  tracks : Track[];
  trackLanesWindowHeight : number
  verticalScale : number
};

export const WorkstationContext = React.createContext<WorkflowContextType | undefined>(undefined);

export const WorkstationProvider: React.FC = ({ children }) => {
  const {clipboardItem} = React.useContext(ClipboardContext)!

  const [autoSnap, setAutoSnap] = React.useState(true);
  const [cursorPos, setCursorPos] = React.useState(TimelinePosition.fromPos(TimelinePosition.start))
  const [horizontalScale, setHorizontalScale] = React.useState(1);
  const [isLooping, setIsLooping] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [metronome, setMetronome] = React.useState(false);
  const [songRegion, setSongRegion] = React.useState<Region | null>(null)
  const [selectedClip, setSelectedClip, onClipClickAway] = useClickAwayState<Clip>(null)
  const [selectedNode, setSelectedNode, onNodeClickAway, setCancelClickAway] = useClickAwayState<AutomationNode>(null)
  const [snapGridSize, setSnapGridSize] = React.useState(SnapGridSize.OneTwentyEighth);
  const [tempo, setTempo] = React.useState(120);
  const [timeSignature, setTimeSignature] = React.useState({beats: 4, noteValue: 4});
  const [trackLanesWindowHeight, setTrackLanesWindowHeight] = React.useState(0);
  const [trackRegion, setTrackRegion] = React.useState<{region: Region, track: Track} | null>(null)
  const [tracks, setTracks, setTrack] = useTracks(data);
  const [timelinePosOptions, setTimelinePosOptions, prevTimelineOptions] = useStateWPrev({
    snapSize: snapGridSize, 
    beatWidth: BEAT_WIDTH, 
    horizontalScale,
    timeSignature,
    tempo
  });
  const [verticalScale, setVerticalScale] = React.useState(1);

  const shouldPreserveMargins = useRef(false);

  React.useEffect(() => {
    setTimelinePosOptions({
      snapSize: snapGridSize, 
      beatWidth: BEAT_WIDTH, 
      horizontalScale,
      timeSignature,
      tempo
    });
  }, [horizontalScale, snapGridSize, timeSignature, tempo])

  React.useEffect(() => {
    if (autoSnap) {
      if (horizontalScale < 0.075) {
        setSnapGridSize(SnapGridSize.Whole)
      } else if (horizontalScale < 0.1153) {
        setSnapGridSize(SnapGridSize.Half)
      } else if (horizontalScale < 0.1738) {
        setSnapGridSize(SnapGridSize.Quarter)
      } else if (horizontalScale < 0.3848) {
        setSnapGridSize(SnapGridSize.Eighth)
      } else if (horizontalScale < 0.6791) {
        setSnapGridSize(SnapGridSize.Sixteenth)
      } else if (horizontalScale < 1.8069) {
        setSnapGridSize(SnapGridSize.ThirtySecond)
      } else if (horizontalScale < 3.6147) {
        setSnapGridSize(SnapGridSize.SixtyFourth)
      } else if (horizontalScale < 7.2323) {
        setSnapGridSize(SnapGridSize.OneTwentyEighth)
      } else if (horizontalScale < 14.4647) {
        setSnapGridSize(SnapGridSize.TwoFiftySixth)
      } else {
        setSnapGridSize(SnapGridSize.FiveHundredTwelfth)
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
  
      setTracks(newTracks);
      setCursorPos(preservePosMargin(cursorPos, prevTimelineOptions, timelinePosOptions));
      setSongRegion(newSongRegion);
    }
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
      
          if (lane === undefined) {
            const track = tracks.find(t => t.automationLanes.find(l => l.id === clipboardItem?.container));
            lane = track?.automationLanes.find(l => l.id === clipboardItem?.container);
          }
      
          if (lane) {
            if (atCursor) {
              newNode.pos.setPos(cursorPos);
            } else if (pos) {
              newNode.pos.setPos(pos);
            }
      
            newNode.pos.snap(timelinePosOptions);
      
            const track = tracks.find(t => t.automationLanes.find(l => l.id === lane!.id));
            addNodeToLane(track!, lane, newNode);
          }
        }
      }
    })
  }

  const toggleMuteClip = (clip : Clip) => {
    const track = tracks.find(t => t.clips.find(c => c.id === clip.id));

    if (track) {
      const newClip = {...clip, muted: !clip.muted};
      setTrack({...track, clips: track.clips.map(c => c.id === clip.id ? newClip : c)});
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
        horizontalScale, 
        isLooping,
        isPlaying,
        isRecording,
        metronome,
        onClipClickAway,
        onNodeClickAway,
        pasteClip,
        pasteNode,
        selectedClip,
        selectedNode,
        setAutoSnap,
        setCancelClickAway,
        setCursorPos,
        setHorizontalScale,
        setIsLooping,
        setIsPlaying,
        setIsRecording,
        setMetronome,
        setSelectedClip,
        setSelectedNode,
        setSnapGridSize,
        setSongRegion,
        setTempo,
        setTimeSignature,
        setTrack,
        setTrackLanesWindowHeight,
        setTrackRegion,
        setTracks,
        setVerticalScale, 
        snapGridSize,
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