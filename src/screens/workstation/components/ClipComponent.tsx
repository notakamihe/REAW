import React, { memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import DNR, { DNRData, ResizeDirection } from "src/components/DNR";
import { WorkstationContext } from "src/contexts";
import { openContextMenu } from "src/services/electron/utils";
import { AutomationLane, BaseClipComponentProps, ContextMenuType, TimelinePosition, Track } from "src/services/types/types";
import { shadeColor } from "src/services/utils/general";
import { BASE_HEIGHT, clipAtPos, scrollToAndAlign, timelineEditorWindowScrollThresholds, waitForScrollWheelStop } from "src/services/utils/utils";

interface IProps extends BaseClipComponentProps {
  automationSprite?: (height: number) => React.ReactNode;
  listeners?: { action: number, handler: () => void }[];
  loopSprite?: (height: number) => React.ReactNode;
  onDrag?: (data: DNRData) => void;
  onDragStart?: (e: React.MouseEvent, data: DNRData) => void;
  onDragStop?: (e: MouseEvent, data: DNRData) => void;
  onLoop?: (dir: ResizeDirection, data: DNRData) => void;
  onLoopStart?: (e: React.MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  onLoopStop?: (e: MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  onResize?: (dir: ResizeDirection, data: DNRData) => void;
  onResizeStart?: (e: React.MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  onResizeStop?: (e: MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  sprite?: (height: number) => React.ReactNode;
}

function ClipComponent({ clip, listeners, onChangeLane, onSetClip, track, ...rest }: IProps) {
  const {
    adjustNumMeasures,
    allowMenuAndShortcuts,
    consolidateClip,
    deleteClip,
    duplicateClip,
    maxPos,
    playheadPos,
    scrollToItem,
    selectedClipId,
    setAllowMenuAndShortcuts,
    setScrollToItem,
    setSelectedClipId,
    setSongRegion,
    setTrackRegion,
    snapGridSize,
    splitClip,
    timelineSettings,
    toggleMuteClip,
    tracks,
    verticalScale
  } = useContext(WorkstationContext)!;

  const [coords, setCoords] = useState({ startX: 0, endX: 0 });
  const [dragging, setDragging] = useState(false);
  const [enteredLane, setEnteredLane] = useState<HTMLElement | null>(null);
  const [height, setHeight] = useState(rest.height);
  const [laneTarget, setLaneTarget] = useState<{ track: Track, element: HTMLElement } | null>(null);
  const [looping, setLooping] = useState(false);
  const [loopWidth, setLoopWidth] = useState(0);
  const [name, setName] = useState(clip.name);
  const [offset, setOffset] = useState(0);
  const [renaming, setRenaming] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState([false, false, false]);

  const laneRef = useRef<HTMLElement | null>(null);
  const loopRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const prevHorizontalScale = useRef<number>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current)
      laneRef.current = ref.current.closest<HTMLElement>(".lane");

    return () => {
      document.body.classList.remove("cursor-loop");
      document.body.classList.remove("cursor-move");
      document.body.classList.remove("cursor-resize-h");
      setAllowMenuAndShortcuts(true);
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (selectedClipId === clip.id && allowMenuAndShortcuts) {
        switch (e.code) {
          case "F2":
            setRenaming(true);
            break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedClipId, clip, allowMenuAndShortcuts])

  useEffect(() => {
    const endX = clip.end.toMargin();
    setCoords({ startX: clip.start.toMargin(), endX });
    setLoopWidth(clip.loopEnd ? clip.loopEnd.toMargin() - endX : 0);
  }, [clip, timelineSettings.timeSignature])

  useEffect(() => {
    if (prevHorizontalScale.current !== undefined) {
      const percentChange = timelineSettings.horizontalScale / prevHorizontalScale.current;
      setCoords({ startX: coords.startX * percentChange, endX: coords.endX * percentChange });
      setLoopWidth(loopWidth * percentChange);
    }

    prevHorizontalScale.current = timelineSettings.horizontalScale;
  }, [timelineSettings.horizontalScale])

  useEffect(() => {
    function handleMouseOver(e: MouseEvent) {
      const target = e.target as HTMLElement;
  
      if (!ref.current?.contains(target) && !loopRef.current?.contains(target)) {
        const newEnteredLane = target.closest<HTMLElement>(".lane");
  
        if (newEnteredLane && newEnteredLane.dataset.track !== laneTarget?.track.id) {
          const targetTrack = tracks.find(track => track.id === newEnteredLane.dataset.track);
  
          if (targetTrack) {
            if (targetTrack.type === track.type)
              setLaneTarget({ track: targetTrack, element: newEnteredLane });
            else
              newEnteredLane.classList.add("invalid-track-type");
  
            setEnteredLane(newEnteredLane);
          }
        }
      }
    }

    function handleMouseLeave(e: MouseEvent) {
      (e.currentTarget as HTMLElement).classList.remove("invalid-track-type");
    }

    if (dragging) {
      document.addEventListener("mouseover", handleMouseOver);
      enteredLane?.addEventListener("mouseleave", handleMouseLeave);
    }

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      enteredLane?.removeEventListener("mouseleave", handleMouseLeave);
    }
  }, [dragging, laneTarget, enteredLane])

  useLayoutEffect(() => {
    if (renaming) {
      nameInputRef.current?.focus();
      nameInputRef.current?.setSelectionRange(0, nameInputRef.current?.value.length);
    }
  }, [renaming])

  useLayoutEffect(() => {
    setHeight(laneTarget ? laneTarget.element.children[0].clientHeight + 1 : rest.height);
  }, [rest.height, laneTarget, verticalScale])

  useLayoutEffect(() => {
    if (laneTarget?.element && laneRef.current) {
      const targetRect = laneTarget.element.getBoundingClientRect();
      setOffset(targetRect.top - laneRef.current.getBoundingClientRect().top);
    } else {
      setOffset(0);
    }
  }, [laneTarget, verticalScale])

  useLayoutEffect(() => {
    if (scrollToItem?.type === "clip" && scrollToItem.params?.clipId === clip.id) {
      const timelineEditorWindow = document.getElementById("timeline-editor-window")!;

      waitForScrollWheelStop(timelineEditorWindow, () => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const timelineEditorWindowRect = timelineEditorWindow.getBoundingClientRect();

          const startPos = rect.left - timelineEditorWindowRect.left + timelineEditorWindow.scrollLeft;
          const endPos = startPos + width + loopWidth;

          if (startPos > timelineEditorWindow.scrollLeft + timelineEditorWindow.clientWidth * 0.95 - 12)
            scrollToAndAlign(timelineEditorWindow, { left: startPos }, { left: 0.5 });
          else if (endPos < timelineEditorWindow.scrollLeft + timelineEditorWindow.clientWidth * 0.05)
            scrollToAndAlign(timelineEditorWindow, { left: startPos }, { left: 0.1 });

          if (rect.bottom < (timelineEditorWindowRect.top + 33) + (timelineEditorWindow.clientHeight * 0.05)) {
            const pos = rect.top - timelineEditorWindowRect.top + timelineEditorWindow.scrollTop - 33;
            scrollToAndAlign(timelineEditorWindow, { top: pos }, { top: 0.05 });
          } else if (rect.top > timelineEditorWindowRect.bottom - (timelineEditorWindow.clientHeight * 0.05)) {
            const pos = rect.bottom - timelineEditorWindowRect.top + timelineEditorWindow.scrollTop;
            scrollToAndAlign(timelineEditorWindow, { top: pos }, { top: 0.95 });
          }
        }

        setScrollToItem(null);
      });
    }
  }, [scrollToItem])

  function confirmName() {
    setRenaming(false);
    onSetClip({ ...clip, name });
  }

  function handleClickAway() {
    if (selectedClipId === clip.id && !looping)
      setSelectedClipId(null);
  }

  function handleContextMenu(e: React.MouseEvent) {
    e.stopPropagation();

    if (document.activeElement?.nodeName !== "INPUT") {
      openContextMenu(ContextMenuType.Clip, { clip }, params => {
        switch (params.action) {
          case 0:
            deleteClip(clip);
            break;
          case 1:
            setRenaming(true);
            break;
          case 2:
            setSongRegion({ start: clip.start, end: clip.loopEnd || clip.end });
            break;
          case 3:
            duplicateClip(clip);
            break;
          case 4:
            splitClip(clip, playheadPos);
            break;
          case 5:
            consolidateClip(clip);
            break;
          case 6:
            toggleMuteClip(clip);
            break;
          default:
            for (const listener of (listeners || []))
              if (params.action === listener.action)
                listener.handler();
        }
      });
    }
  }

  function handleDrag(data: DNRData) {
    const loopX = data.coords.endX + loopWidth;

    setCoords({ ...data.coords });
    adjustNumMeasures(TimelinePosition.fromMargin(Math.max(loopX, data.coords.endX)));
    rest.onDrag?.(data);
  }

  function handleDragStart(e: React.MouseEvent, data: DNRData) {
    document.body.classList.add("cursor-move");

    setDragging(true);
    setShowGuidelines([true, true, loopWidth > 0]);

    setAllowMenuAndShortcuts(false);
    rest.onDragStart?.(e, data);
  }

  function handleDragStop(e: MouseEvent, data: DNRData) {
    document.body.classList.remove("cursor-move");
    enteredLane?.classList.remove("invalid-track-type");

    setDragging(false);
    setShowGuidelines([false, false, false]);
    setEnteredLane(null);
    setLaneTarget(null);

    const startPos = TimelinePosition.fromMargin(coords.startX);

    if (laneTarget && laneTarget.track.id !== track.id && laneTarget.track.type === track.type)
      onChangeLane(clipAtPos(startPos, clip), laneTarget.track);
    else if (data.delta.x !== 0)
      onSetClip(clipAtPos(startPos, clip));

    setAllowMenuAndShortcuts(true);
    rest.onDragStop?.(e, data);
  }

  function handleLoop(dir: ResizeDirection, data: DNRData) {
    setLoopWidth(data.width);
    adjustNumMeasures(TimelinePosition.fromMargin(coords.endX + data.width));
    rest.onLoop?.(dir, data);
  }

  function handleLoopStart(e: React.MouseEvent, dir: ResizeDirection, data: DNRData) {
    document.body.classList.add("cursor-loop");

    setLooping(true);
    setShowGuidelines([false, false, true]);

    setTrackRegion(null);
    setSelectedClipId(clip.id);
    setAllowMenuAndShortcuts(false);
    rest.onLoopStart?.(e, dir, data);
  }

  function handleLoopStop(e: MouseEvent, dir: ResizeDirection, data: DNRData) {
    document.body.classList.remove("cursor-loop");

    setLooping(false);
    setShowGuidelines([false, false, false]);

    onSetClip({
      ...clip,
      loopEnd: loopWidth > 0 ? TimelinePosition.fromMargin(coords.endX + loopWidth) : null
    });
    setAllowMenuAndShortcuts(true);
    rest.onLoopStop?.(e, dir, data);
  }

  function handleResize(dir: ResizeDirection, data: DNRData) {
    if (dir === ResizeDirection.Right)
      if (loopWidth > 0)
        setLoopWidth(Math.max(0, loopWidth - (data.coords.endX - coords.endX)));

    setCoords({ ...data.coords });
    adjustNumMeasures(TimelinePosition.fromMargin(data.coords.endX));
    rest.onResize?.(dir, data);
  }

  function handleResizeStart(e: React.MouseEvent, dir: ResizeDirection, data: DNRData) {
    document.body.classList.add("cursor-resize-h");

    setShowGuidelines([dir === ResizeDirection.Left, dir === ResizeDirection.Right, false]);
    setAllowMenuAndShortcuts(false);
    rest.onResizeStart?.(e, dir, data);
  }

  function handleResizeStop(e: MouseEvent, dir: ResizeDirection, data: DNRData) {
    document.body.classList.remove("cursor-resize-h");

    setShowGuidelines([false, false, false]);

    if (data.delta.width != 0)
      onSetClip({
        ...clip,
        start: TimelinePosition.fromMargin(coords.startX),
        end: TimelinePosition.fromMargin(coords.endX),
        loopEnd: loopWidth > 0 ? TimelinePosition.fromMargin(coords.endX + loopWidth) : null
      });

    setAllowMenuAndShortcuts(true);
    rest.onResizeStop?.(e, dir, data);
  }

  const bounds = useMemo(() => {
    let bounds: any = { left: undefined, right: maxPos.toMargin() };

    if (dragging) {
      bounds.right -= loopWidth
    } else {
      bounds.left = clip.startLimit?.toMargin();
      if (clip.endLimit)
        bounds.right = Math.min(bounds.right, clip.endLimit.toMargin());
    }

    return bounds;
  }, [clip, dragging, loopWidth, maxPos, timelineSettings]);

  const selected = selectedClipId === clip.id;
  const width = coords.endX - coords.startX;
  const snapWidth = TimelinePosition.fromSpan(snapGridSize).toMargin();

  const repetitions = Math.max(Math.round((loopWidth / width) * 1e9) / 1e9, 0);

  const automationTrack = laneTarget?.track || track;
  const automationLanes = automationTrack.automationLanes.filter(lane => lane.show);

  const style = {
    clip: {
      position: "relative",
      height: height - 15,
      border: "1px solid var(--border3)",
      borderTop: "none",
      borderRadius: "0 0 9px 9px",
      opacity: clip.muted ? 0.55 : 1
    },
    resizeRight: { 
      zIndex: selected ? 15 : 14 + (width === 0 ? 1 : 0), 
      top: loopWidth > 10 || width <= 0 ? 0 : 10
    },
    clipNameContainer: {
      width: Math.max(width + loopWidth, 1),
      height: 16,
      zIndex: selected ? 13 : 12,
      border: "1px solid var(--border3)",
      minWidth: renaming ? 100 : "auto"
    },
    clipNameContainerInner: {
      backgroundColor: selected ? "#fff" : shadeColor(track.color, 0.25),
      opacity: clip.muted ? 0.55 : 1,
      paddingRight: renaming ? 0 : 3
    },
    nameForm: { display: "flex", width: "100%", height: "100%", overflow: "hidden", padding: "0 2px" },
    nameText: { fontSize: 13, color: "#000a", fontWeight: "bold", padding: "0 3px", lineHeight: 1 },
    spriteContainer: { height: height - 16, zIndex: (selected ? 10 : 9) + (width === 0 ? 1 : 0) },
    sprite: { backgroundColor: selected ? "#fff" : shadeColor(track.color, 0.2) },
    loopOverlay: { top: 0, left: "100%", width: loopWidth - 5, zIndex: 11 },
    loopContainer: {
      width: Math.max(0, loopWidth + 1),
      height: height + 1,
      transform: "translate(-1px, -2px)",
      zIndex: selected ? 10 : 9,
      borderRight: repetitions % 1 === 0 ? "none" : "1px solid var(--border3)",
      backgroundColor: width === 0 ? selected ? "#fff" : shadeColor(track.color, 0.2) : ""
    },
    loopRepetition: {
      width: width + 1,
      flexShrink: 0,
      backgroundColor: selected ? "#fff" : shadeColor(track.color, 0.2),
      marginTop: 17,
      marginRight: -1
    },
    automationContainer: { top: "calc(100% - 1px)", zIndex: 9, borderTop: "1px solid var(--border13)" },
    automationLaneContainer: (lane: AutomationLane, idx: number) => ({
      width: Math.max(0, width + loopWidth),
      height: (lane.expanded ? BASE_HEIGHT * verticalScale : 22) + 1,
      overflow: "hidden",
      borderBottom: `1px solid ${idx === automationLanes.length - 1 ? "#0000" : "var(--border13)"}`,
      borderRight: repetitions % 1 === 0 ? "none" : "1px solid var(--border3)",
      marginTop: -1,
      filter: clip.muted ? "grayscale(0.5)" : ""
    }),
    automationLoopContainer: (idx: number) => ({
      width: width + (idx > 0 ? 1 : 0),
      minHeight: "calc(100% + 1px)",
      flexShrink: 0,
      border: "1px solid var(--border3)",
      marginRight: -1,
      borderRadius: 9,
      overflow: "hidden"
    })
  } as const;

  return (
    <>
      <DNR
        autoScroll={{ thresholds: timelineEditorWindowScrollThresholds }}
        bounds={bounds}
        coords={{ ...coords, startY: offset - 1, endY: offset + height }}
        disableDragging={renaming}
        dragAxis="x"
        enableResizing={{ left: true, right: true }}
        onClickAway={handleClickAway}
        onContextMenu={handleContextMenu}
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onDragStop={handleDragStop}
        onMouseDown={() => { setTrackRegion(null); setSelectedClipId(clip.id); }}
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        ref={ref}
        resizeHandles={{ left: { style: { zIndex: selected ? 15 : 14 } }, right: { style: style.resizeRight } }}
        restrict={{ horizontal: true, vertical: false }}
        snapGridSize={{ horizontal: snapWidth }}
        style={{ borderRadius: "0 0 10px 10px" }}
      >
        <div className="position-relative m-0" style={style.clipNameContainer}>
          <div className="position-relative col-12 h-100" style={style.clipNameContainerInner}>
            {renaming ? (
              <form onSubmit={e => { e.preventDefault(); confirmName(); }} style={style.nameForm}>
                <input
                  className="no-borders p-0 no-outline bg-transparent"
                  onBlur={confirmName}
                  onChange={e => setName(e.target.value)}
                  ref={nameInputRef}
                  style={{ fontSize: 13, fontWeight: "bold", width: "100%", color: "#000a" }}
                  value={name}
                />
              </form>
            ) : (
              <div className="position-relative col-12 h-100" style={{ contain: "paint" }}>
                <span
                  className="d-flex position-sticky clip-title text-nowrap"
                  onDoubleClick={() => setRenaming(true)}
                  style={{ left: 0, width: "fit-content", cursor: "text", ...style.nameText }}
                  title={clip.name + (clip.muted ? " (muted)" : "")}
                >
                  {clip.name}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-hidden position-relative" style={style.spriteContainer}>
          <div style={{ ...style.clip, ...style.sprite }}>{rest.sprite?.(height - 16)}</div>
        </div>
        {loopWidth > 5 && <div className="position-absolute h-100" style={style.loopOverlay} />}
        <div className="position-absolute pe-none" style={style.automationContainer}>
          {automationTrack.automation && automationLanes.map((lane, idx) => {
            const color = selected ? "#fff" : lane.enabled === false ? "var(--bg12)" : track.color;
            const sprite = rest.automationSprite?.(lane.expanded ? BASE_HEIGHT * verticalScale : 22);

            return (
              <div className="d-flex" key={idx} style={style.automationLaneContainer(lane, idx)}>
                {width > 0 ? Array.from({ length: Math.ceil(repetitions) + 1 }, (_, i) => (
                  <div className="position-relative" key={i} style={style.automationLoopContainer(i)}>
                    <div style={{ height: "100%", backgroundColor: color, opacity: "var(--opacity1)" }}>
                      <div style={{ opacity: i > 0 ? 0.75 : 1 }}>{sprite}</div>
                    </div>
                  </div>
                )) : (
                  <div 
                    className="col-12 h-100"
                    style={{ backgroundColor: color, opacity: "var(--opacity1)" }} 
                  />
                )}
              </div>
            )
          })}
        </div>
      </DNR>
      <DNR
        autoScroll={{ thresholds: timelineEditorWindowScrollThresholds }}
        bounds={{ right: maxPos.toMargin() }}
        coords={{
          startX: coords.endX,
          startY: offset,
          endX: coords.endX + loopWidth,
          endY: offset + (loopWidth > 10 ? height : 10)
        }}
        disableDragging
        enableResizing={{ right: true }}
        minWidth={0}
        onResizeStart={handleLoopStart}
        onResize={handleLoop}
        onResizeStop={handleLoopStop}
        ref={loopRef}
        resizeHandles={{ right: { style: { zIndex: renaming ? 11 : selected ? 15 : 14, cursor: "e-resize" } } }}
        restrict={{ horizontal: false, vertical: false }}
        snapGridSize={{ horizontal: snapWidth }}
        style={{ cursor: undefined }}
      >
        <div className="position-absolute d-flex overflow-hidden" style={style.loopContainer}>
          {width > 0 && Array.from({ length: Math.ceil(repetitions) }, (_, i) => (
            <div key={i} style={{ ...style.clip, ...style.loopRepetition }}>
              <div style={{ opacity: 0.6 }}>{rest.loopSprite?.(height - 16)}</div>
            </div>
          ))}
        </div>
      </DNR>
      {[coords.startX, coords.endX, coords.endX + loopWidth].map((m, idx) => {
        return showGuidelines[idx] && createPortal(
          <div key={idx} className="guideline" style={{ left: m - 1 }} />,
          document.getElementById("timeline-editor-window")!.firstElementChild as HTMLElement
        )
      })}
    </>
  )
}

export default memo(ClipComponent);