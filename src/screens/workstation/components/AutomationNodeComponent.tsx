import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { Popover } from "@mui/material";
import { WorkstationContext } from "@/contexts";
import { AutomationLane, AutomationLaneEnvelope, AutomationNode, ContextMenuType, TimelinePosition } from "@/services/types/types";
import { clamp } from "@/services/utils/general";
import { formatPanning, formatVolume, scrollToAndAlign, timelineEditorWindowScrollThresholds, waitForScrollWheelStop } from "@/services/utils/utils";
import { Tooltip } from "@/components/widgets";
import DNR, { DNRData } from "@/components/DNR";
import { openContextMenu } from "@/services/electron/utils";
import useClickAway from "@/services/hooks/useClickAway";

interface IProps {
  color: string;
  lane: AutomationLane;
  node: AutomationNode;
  onNodeMove?: (node: AutomationNode) => void;
  onSetNode: (node: AutomationNode) => void;
  valueToY: (value: number) => number;
  yToValue: (y: number) => number;
}

export default function AutomationNodeComponent(props: IProps) {
  const { color, lane, node, onNodeMove, onSetNode, valueToY, yToValue } = props;
  const { 
    adjustNumMeasures, 
    deleteNode, 
    scrollToItem,
    selectedNodeId, 
    setAllowMenuAndShortcuts,
    setScrollToItem,
    setSelectedNodeId,
    snapGridSize,
    timelineSettings,
    verticalScale
  } = useContext(WorkstationContext)!;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [coords, setCoords] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [valueText, setValueText] = useState(node.value.toString());

  const coordsUnset = useRef(true);
  const prevHorizontalScale = useRef<number>(undefined);
  const prevLaneHeight = useRef<number>(undefined);

  const handleClickAway = useCallback(() => {
    if (selectedNodeId === node.id)
      setSelectedNodeId(null);
  }, [selectedNodeId, node])

  const ref = useClickAway<HTMLDivElement>(handleClickAway);

  useEffect(() => {
    return () => setAllowMenuAndShortcuts(true);
  }, [])

  useEffect(() => {
    const posMargin = node.pos.toMargin();
    const startY = valueToY(node.value);
    setCoords({ ...coords, startX: posMargin, endX: posMargin + 8, startY, endY: startY + 8 });

    coordsUnset.current = false;
  }, [node, timelineSettings.timeSignature])

  useEffect(() => {
    if (prevHorizontalScale.current !== undefined) {
      const percentChange = timelineSettings.horizontalScale / prevHorizontalScale.current;
      const posMargin = coords.startX * percentChange;
      setCoords({ ...coords, startX: posMargin, endX: posMargin + 8 });
    }

    prevHorizontalScale.current = timelineSettings.horizontalScale;
  }, [timelineSettings.horizontalScale])

  useLayoutEffect(() => {
    if (ref.current?.parentElement) {
      if (prevLaneHeight.current !== undefined) {
        const percentChange = (ref.current.parentElement.clientHeight - 8) / (prevLaneHeight.current - 8);
        const startY = coords.startY * percentChange;
        setCoords({ ...coords, startY, endY: startY + 8 });
      }
  
      prevLaneHeight.current = ref.current.parentElement.clientHeight;
    }
  }, [verticalScale])

  useLayoutEffect(() => {
    if (!coordsUnset.current) {
      if (scrollToItem?.type === "node" && scrollToItem.params?.nodeId === node.id) {
        const timelineEditorWindow = document.getElementById("timeline-editor-window")!;

        waitForScrollWheelStop(timelineEditorWindow, () => {
          if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const timelineEditorWindowRect = timelineEditorWindow.getBoundingClientRect();
    
            if (rect.left > timelineEditorWindowRect.right - 12) {
              const pos = rect.left - timelineEditorWindowRect.left + timelineEditorWindow.scrollLeft;
              scrollToAndAlign(timelineEditorWindow, { left: pos }, { left: 0.8 });
            } else if (rect.right < timelineEditorWindowRect.left) {
              const pos = rect.right - timelineEditorWindowRect.left + timelineEditorWindow.scrollLeft;
              scrollToAndAlign(timelineEditorWindow, { left: pos }, { left: 0.2 });
            }
    
            if (rect.top > timelineEditorWindowRect.bottom) {
              const pos = rect.top - timelineEditorWindowRect.top + timelineEditorWindow.scrollTop;
              scrollToAndAlign(timelineEditorWindow, { top: pos }, { top: 0.8 });
            } else if (rect.bottom < timelineEditorWindowRect.top + 33) {
              const pos = rect.bottom - timelineEditorWindowRect.top + timelineEditorWindow.scrollTop - 33;
              scrollToAndAlign(timelineEditorWindow, { top: pos }, { top: 0.2 });
            }
          }
    
          setScrollToItem(null);
        });
      }
    }
  }, [scrollToItem, coords])

  function confirm() {
    const inputValue = parseFloat(valueText);
    setAnchorEl(null);

    if (!Number.isNaN(inputValue)) {
      const value = Number(clamp(inputValue, lane.minValue, lane.maxValue).toFixed(2));
      onSetNode({ ...node, value });
    }
  }

  function onContextMenu(e: React.MouseEvent) {
    e.stopPropagation();
    const target = e.currentTarget as HTMLElement;
    
    openContextMenu(ContextMenuType.Node, {}, params => {
      switch (params.action) {
        case 0:
          deleteNode(node);
          break;
        case 1:
          setAnchorEl(target);
          setValueText(node.value.toFixed(2));
          break;  
      }
    });
  }

  function onDrag(data: DNRData) {
    const pos = TimelinePosition.fromMargin(data.coords.startX);
    const value = yToValue(data.coords.startY);

    flushSync(() => setCoords(data.coords));
    onNodeMove?.({ id: node.id, pos, value });
    adjustNumMeasures(pos);
  }

  function onDragStart() {
    setIsDragging(true);
    setAllowMenuAndShortcuts(false);
  }

  function onDragStop(_: MouseEvent, data: DNRData) {
    setIsDragging(false);
    
    if (data.delta.x !== 0 || data.delta.y !== 0)
      onSetNode({ ...node, pos: TimelinePosition.fromMargin(coords.startX), value: yToValue(coords.startY) });

    setAllowMenuAndShortcuts(true);
  }

  const title = useMemo(() => {
    const value = yToValue(coords.startY);

    switch (lane.envelope) {
      case AutomationLaneEnvelope.Volume:
        return formatVolume(value);
      case AutomationLaneEnvelope.Pan:
        return formatPanning(value, true);
      case AutomationLaneEnvelope.Tempo:
        return Math.round(value).toString();
      default:
        return value.toFixed(2);
    }
  }, [coords, lane]);

  const snapWidth = TimelinePosition.fromSpan(snapGridSize).toMargin();
  const selected = selectedNodeId === node.id;

  return (
    <>
      <DNR
        autoScroll={{ thresholds: timelineEditorWindowScrollThresholds }}
        bounds={{ right: -8 }}
        coords={coords}
        onContextMenu={onContextMenu}
        onDrag={onDrag}
        onDragStart={onDragStart}
        onDragStop={onDragStop}
        onMouseDown={() => setSelectedNodeId(node.id)}
        ref={ref}
        resize={false}
        snapGridSize={{ x: snapWidth }}
        style={{
          backgroundColor: selected ? "#fff" : color, 
          border: "1px solid var(--border8)", 
          borderRadius: "50%",
          zIndex: selected ? 12 : 11,
          transform: "translate(-2px, 0)"
        }}
      >
        <Tooltip
          bounds={{ right: 12 }}
          container="#timeline-editor-window"
          open={isDragging} 
          showOnHover
          title={title}
        >
          <div style={{ width: coords.endX - coords.startX, height: coords.endY - coords.startY }} />
        </Tooltip>
      </DNR>
      <Popover 
        anchorEl={anchorEl} 
        anchorOrigin={{ horizontal: "right", vertical: "center" }}
        onContextMenu={e => e.stopPropagation()}
        onClose={confirm}
        open={!!anchorEl}
        slotProps={{ paper: { style: { borderRadius: 0 } } }}
        transformOrigin={{ horizontal: "left", vertical: "center" }}
        transitionDuration={0}
      >
        <form onSubmit={e => { e.preventDefault(); confirm(); }} style={{ lineHeight: 1 }}>
          <input
            autoFocus
            className="input-2 no-outline px-1"
            onBlur={confirm}
            onChange={e => setValueText(e.target.value)} 
            onFocus={e => { const el = e.currentTarget; requestAnimationFrame(() => el.select()) }}
            value={valueText}
          />
        </form>
      </Popover>
      {isDragging && createPortal(
        <div className="guideline" style={{ left: coords.startX - 1 }} />,
        document.getElementById("timeline-editor-window")!.firstElementChild as HTMLElement
      )}
    </>
  )
}