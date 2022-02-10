import React, { useRef } from "react"
import { GridSize, SnapSize, TimeSignature } from "renderer/types/types";
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
  cursorPos : TimelinePosition
  deleteClip : (clip : Clip) => void
  deleteNode : (node : AutomationNode) => void
  duplicateClip : (clip : Clip) => void
  gridSize : GridSize
  horizontalScale : number
  isLooping : boolean
  isPlaying : boolean
  isRecording : boolean
  metronome : boolean
  onClipClickAway : (clip : Clip | null) => void
  onNodeClickAway : (node : AutomationNode | null) => void
  pasteClip : (atCursor : boolean, track? : Track, pos? : TimelinePosition) => void
  pasteNode : (atCursor : boolean, lane? : AutomationLane, pos? : TimelinePosition) => void,
  region : Region | null
  selectedClip : Clip | null
  selectedNode : AutomationNode | null
  setAutoSnap : React.Dispatch<React.SetStateAction<boolean>>
  setCancelClickAway : (cancel : boolean) => void
  setCursorPos : React.Dispatch<React.SetStateAction<TimelinePosition>>
  setGridSize: React.Dispatch<React.SetStateAction<GridSize>>
  setHorizontalScale : React.Dispatch<React.SetStateAction<number>>
  setIsLooping : React.Dispatch<React.SetStateAction<boolean>>
  setIsPlaying : React.Dispatch<React.SetStateAction<boolean>>
  setIsRecording : React.Dispatch<React.SetStateAction<boolean>>
  setMetronome : React.Dispatch<React.SetStateAction<boolean>>
  setRegion : React.Dispatch<React.SetStateAction<Region | null>>
  setSelectedClip : (clip : Clip | null) => void
  setSelectedNode : (newState: AutomationNode | null) => void
  setSnapSize : React.Dispatch<React.SetStateAction<SnapSize>>
  setTempo : React.Dispatch<React.SetStateAction<number>>
  setTimeSignature : React.Dispatch<React.SetStateAction<TimeSignature>>
  setTrack : (track : Track, callback? : () => void) => void;
  setTrackLanesWindowHeight : React.Dispatch<React.SetStateAction<number>>
  setTracks : (tracks : Track[], callback? : () => void) => void;
  setVerticalScale : React.Dispatch<React.SetStateAction<number>>
  snapSize : SnapSize
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
  const [gridSize, setGridSize] = React.useState(GridSize.ThirtySecondBeat);
  const [horizontalScale, setHorizontalScale] = React.useState(1);
  const [isLooping, setIsLooping] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isRecording, setIsRecording] = React.useState(false);
  const [metronome, setMetronome] = React.useState(false);
  const [region, setRegion] = React.useState<Region | null>(null)
  const [selectedClip, setSelectedClip, onClipClickAway] = useClickAwayState<Clip>(null)
  const [selectedNode, setSelectedNode, onNodeClickAway, setCancelClickAway] = useClickAwayState<AutomationNode>(null)
  const [snapSize, setSnapSize] = React.useState(SnapSize.OneTwentyEighth);
  const [tempo, setTempo] = React.useState(120);
  const [timeSignature, setTimeSignature] = React.useState({beats: 4, noteValue: 4});
  const [trackLanesWindowHeight, setTrackLanesWindowHeight] = React.useState(0);
  const [tracks, setTracks, setTrack] = useTracks(data);
  const [timelinePosOptions, setTimelinePosOptions, prevTimelineOptions] = useStateWPrev({
    snapSize, 
    beatWidth: BEAT_WIDTH, 
    horizontalScale,
    timeSignature,
    tempo
  });
  const [verticalScale, setVerticalScale] = React.useState(1);

  const shouldPreserveMargins = useRef(false);

  React.useEffect(() => {
    setTimelinePosOptions({
      snapSize, 
      beatWidth: BEAT_WIDTH, 
      horizontalScale,
      timeSignature,
      tempo
    });
  }, [horizontalScale, snapSize, timeSignature, tempo])

  React.useEffect(() => {
    if (autoSnap) {
      if (horizontalScale < 0.075) {
        setSnapSize(SnapSize.Whole)
      } else if (horizontalScale < 0.1153) {
        setSnapSize(SnapSize.Half)
      } else if (horizontalScale < 0.1738) {
        setSnapSize(SnapSize.Quarter)
      } else if (horizontalScale < 0.3848) {
        setSnapSize(SnapSize.Eighth)
      } else if (horizontalScale < 0.6791) {
        setSnapSize(SnapSize.Sixteenth)
      } else if (horizontalScale < 1.8069) {
        setSnapSize(SnapSize.ThirtySecond)
      } else if (horizontalScale < 3.6147) {
        setSnapSize(SnapSize.SixtyFourth)
      } else if (horizontalScale < 7.2323) {
        setSnapSize(SnapSize.OneTwentyEighth)
      } else if (horizontalScale < 14.4647) {
        setSnapSize(SnapSize.TwoFiftySixth)
      } else {
        setSnapSize(SnapSize.FiveHundredTwelfth)
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

      const newRegion : Region | null = region ? {
        start: preservePosMargin(region.start, prevTimelineOptions, timelinePosOptions),
        end: preservePosMargin(region.end, prevTimelineOptions, timelinePosOptions)
      } : null
  
      setTracks(newTracks);
      setCursorPos(preservePosMargin(cursorPos, prevTimelineOptions, timelinePosOptions));
      setRegion(newRegion);
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
        cursorPos,
        deleteClip,
        deleteNode,
        duplicateClip,
        gridSize,
        horizontalScale, 
        isLooping,
        isPlaying,
        isRecording,
        metronome,
        onClipClickAway,
        onNodeClickAway,
        pasteClip,
        pasteNode,
        region,
        selectedClip,
        selectedNode,
        setAutoSnap,
        setCancelClickAway,
        setCursorPos,
        setGridSize,
        setHorizontalScale,
        setIsLooping,
        setIsPlaying,
        setIsRecording,
        setMetronome,
        setRegion,
        setSelectedClip,
        setSelectedNode,
        setSnapSize,
        setTempo,
        setTimeSignature,
        setTrack,
        setTrackLanesWindowHeight,
        setTracks,
        setVerticalScale, 
        snapSize,
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