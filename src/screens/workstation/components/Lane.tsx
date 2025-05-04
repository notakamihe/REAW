import React, { CSSProperties, memo, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ClipboardContext, ClipboardItemType, WorkstationContext } from "@/contexts";
import { AutomationLane, Clip, ContextMenuType, TimelinePosition, Track, TrackType, WorkstationAudioInputFile } from "@/services/types/types";
import { BASE_HEIGHT, getLaneColor, removeAllClipOverlap, timelineEditorWindowScrollThresholds } from "@/services/utils/utils";
import { AudioClipComponent, AutomationLaneComponent, ClipComponent, RegionComponent } from "@/screens/workstation/components";
import { electronAPI, openContextMenu } from "@/services/electron/utils";
import { TRACK_FILE_UPLOAD } from "@/services/electron/channels";
import { getCSSVarValue, normalizeHex } from "@/services/utils/general";

interface IProps {
  className?: string;
  dragDataTarget: { track: Track | null, incompatible?: boolean } | null;
  style?: CSSProperties;
  track: Track;
}

function Lane({ className, dragDataTarget, style, track }: IProps) {
  const { clipboardItem } = useContext(ClipboardContext)!;
  const { 
    adjustNumMeasures,
    createAudioClip,
    createClipFromTrackRegion,
    insertClips,
    masterTrack,
    pasteClip, 
    playheadPos,
    selectedTrackId,
    setSelectedTrackId,
    setTrack, 
    setTracks,
    setTrackRegion, 
    showMaster, 
    snapGridSize,
    trackRegion, 
    tracks, 
    verticalScale 
  } = useContext(WorkstationContext)!

  const [dragIndicatorMargin, setDragIndicatorMargin] = useState(-5);
  
  const prevMargin = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const isDragTarget = useMemo(() => {
    if (track.id === "placeholder")
      return !!dragDataTarget && !dragDataTarget.track;
    return dragDataTarget?.track?.id === track.id;
  }, [dragDataTarget])

  useEffect(() => {
    if (selectedTrackId === track.id)
      if (trackRegion && trackRegion.trackId !== track.id)
        setTrackRegion(null);
  }, [selectedTrackId, trackRegion])

  useEffect(() => {
    const timelineEditorWindow = document.getElementById("timeline-editor-window")!;

    function handleDragOver(e: DragEvent) {
      e.preventDefault();

      if (ref.current) {
        let margin = e.clientX - ref.current.getBoundingClientRect().left;

        if (margin < timelineEditorWindow.scrollLeft)
          margin = timelineEditorWindow.scrollLeft;

        if (margin !== prevMargin.current) {
          prevMargin.current = margin;

          const snapWidth = TimelinePosition.fromSpan(snapGridSize).toMargin();
          margin = snapWidth ? snapWidth * Math.round(margin / snapWidth) : margin;      
          const newDragIndicatorMargin = Math.max(margin, timelineEditorWindow.scrollLeft);

          setDragIndicatorMargin(newDragIndicatorMargin);
          adjustNumMeasures(TimelinePosition.fromMargin(newDragIndicatorMargin));
        }
      }
    }

    if (isDragTarget) {
      document.addEventListener("dragover", handleDragOver);
    } else {
      prevMargin.current = null;
      setDragIndicatorMargin(-5);
    }

    return () => document.removeEventListener("dragover", handleDragOver);
  }, [isDragTarget])

  function changeLane(clip: Clip, newTrack: Track) {
    const newTracks = tracks.slice();
    const trackIdx = newTracks.findIndex(track => track.clips.find(c => c.id === clip.id));
    const newTrackIdx = newTracks.findIndex(track => track.id === newTrack.id);

    if (trackIdx > -1 && newTrackIdx > -1) {
      newTracks[trackIdx] = { 
        ...newTracks[trackIdx], 
        clips: newTracks[trackIdx].clips.filter(c => c.id !== clip.id) 
      };

      newTracks[newTrackIdx] = {
        ...newTrack,
        clips: removeAllClipOverlap([...newTrack.clips, clip])
      };
      
      setTracks(newTracks);
      setSelectedTrackId(newTrack.id);
    }
  }

  function onLaneContextMenu(e: React.MouseEvent<HTMLElement>) {
    const targetEl = e.currentTarget;
    const disablePaste = clipboardItem?.type !== ClipboardItemType.Clip || clipboardItem.item.type !== track.type;

    openContextMenu(ContextMenuType.Lane, { track, disablePaste }, params => {
      switch (params.action) {
        case 0:
          electronAPI.ipcRenderer.invoke(TRACK_FILE_UPLOAD, track.type)
            .then(async (files: WorkstationAudioInputFile[]) => {
              let pos = playheadPos, newClips: Clip[] = [];

              switch (track.type) {
                case TrackType.Audio:
                  for (const file of files) {
                    const clip = await createAudioClip(file, pos);
                    
                    if (clip) {
                      newClips.push(clip);
                      pos = clip.end.copy().snap(snapGridSize);
                    }
                  }

                  insertClips(newClips, track); 
                  break;
                case TrackType.Midi: break; // TODO
              }
            });
          break;
        case 1:
          pasteClip(playheadPos, track);
          break;
        case 2:
          const rect = targetEl.getBoundingClientRect();
          const margin = e.clientX + targetEl.scrollLeft - rect.left;
          const pos = TimelinePosition.fromMargin(margin);
          pasteClip(pos.snap(snapGridSize), track);
          break;
      }
    });
  }

  function onTrackRegionContextMenu(e: MouseEvent) {
    e.stopPropagation();
  
    openContextMenu(ContextMenuType.Region, { trackRegion: true }, params => {
      switch (params.action) {
        case 0:
          createClipFromTrackRegion();
          break;
        case 1:
          setTrackRegion(null);
          break;
      }
    });
  }

  function setClip(clip: Clip) {
    let clips = track.clips.slice();
    const index = clips.findIndex(c => c.id === clip.id)
 
    if (index > -1) {
      clips[index] = clip;
      setTrack({ ...track, clips: removeAllClipOverlap(clips, clip) });
    }
  }

  const height = BASE_HEIGHT * verticalScale;
  const isMaster = track.id === masterTrack.id;
  
  const visibleLanes = track.automationLanes.filter(lane => lane.show);
  const automationColor = isMaster ? normalizeHex(getCSSVarValue("--border6")) : track.color;
  const addExtraHeight = !isMaster && height < 80 && track.automation;
  const laneHeight = Math.max(height, addExtraHeight ? 76 : 0);
  const showRegion = trackRegion && trackRegion.trackId === track.id;

  const styles = {
    innerContainer: {
      width: "100%",
      height: laneHeight,
      cursor: (isMaster || track.type === TrackType.Audio) ? "default" : "text",
      backgroundColor: "var(--bg3)", 
      borderBottom: "1px solid var(--border1)",
      pointerEvents: isMaster ? "none" : "auto"
    },
    regionStyle: {
      backgroundColor: "var(--bg7)", 
      zIndex: 14, 
      border: "1px solid #0002",
      borderWidth: "0 1px",
      cursor: "text"
    },
    automationLaneStyle: (lane: AutomationLane) => {
      const lastVisibleLane = lane.id === visibleLanes[visibleLanes.length - 1].id;

      return {
        backgroundColor: "var(--bg4)", 
        borderBottom: `1px solid ${lastVisibleLane ? "var(--border1)" : "var(--border2)"}`
      };
    },
    dragIndicator: {
      position: "absolute",
      backgroundColor: "var(--color1)", 
      width: 3, 
      height: "100%", 
      top: 0,
      left: dragIndicatorMargin - 1.5,
      zIndex: 16
    }
  } as const;

  if (showMaster || !isMaster) {
    return (
      <div
        className={"lane position-relative " + className}
        data-track={track.id}
        onMouseDown={() => setSelectedTrackId(track.id)}
        ref={ref}
        style={style}
      >
        <div className="position-relative" onContextMenu={onLaneContextMenu} style={styles.innerContainer}>
          {track.type !== TrackType.Audio && (
            <RegionComponent 
              autoScroll={{ thresholds: timelineEditorWindowScrollThresholds }}
              onContextMenu={onTrackRegionContextMenu}
              onSetRegion={region => setTrackRegion(region ? { region, trackId: track.id } : null)}
              region={showRegion ? trackRegion!.region : null}
              style={styles.regionStyle}
            />
          )}
          {track.clips.map(clip => {
            const props = { clip, height: laneHeight, onChangeLane: changeLane, onSetClip: setClip, track };
            return clip.type === TrackType.Audio && clip.audio 
              ? <AudioClipComponent {...props} key={clip.id} /> 
              : <ClipComponent {...props} key={clip.id} />;
          })}
        </div>
        <div>
          {track.automation && track.automationLanes.map((lane, idx) => {
            if (lane.show)
              return (
                <AutomationLaneComponent
                  color={getLaneColor(track.automationLanes, idx, automationColor)}
                  key={lane.id}
                  lane={lane}
                  style={styles.automationLaneStyle(lane)}
                  track={track}
                />
              )
          })}
        </div>
        {isDragTarget && !dragDataTarget?.incompatible && <div style={styles.dragIndicator} />}
      </div>
    )
  }

  return null;
}

export default memo(Lane);