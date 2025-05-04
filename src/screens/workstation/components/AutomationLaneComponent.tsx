import React, { useContext, useEffect, useRef } from "react";
import { ClipboardContext, ClipboardItemType, WorkstationContext } from "@/contexts";
import { clamp, inverseLerp, lerp } from "@/services/utils/general";
import { AutomationNodeComponent } from "@/screens/workstation/components";
import { v4 } from "uuid";
import { BASE_HEIGHT, normalizedToVolume, volumeToNormalized } from "@/services/utils/utils";
import { AutomationLane, AutomationLaneEnvelope, AutomationNode, Track, ContextMenuType, TimelinePosition } from "@/services/types/types";
import { openContextMenu } from "@/services/electron/utils";

interface IProps {
  color: string;
  lane: AutomationLane;
  style?: React.CSSProperties;
  track: Track;
}

export default function AutomationLaneComponent({ color, lane, style, track }: IProps) {
  const { clipboardItem } = useContext(ClipboardContext)!;
  const { 
    addNode, 
    numMeasures, 
    pasteNode, 
    playheadPos, 
    setLane, 
    setTrack, 
    snapGridSize,
    timelineSettings, 
    updateTimelineSettings,
    verticalScale
  } = useContext(WorkstationContext)!;

  const movingNode = useRef<AutomationNode | null>(null);
  const movingNodeIndex = useRef(-1);
  const polylineRef = useRef<SVGPolygonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lane.nodes.length === 1) {
      switch (lane.envelope) {
        case AutomationLaneEnvelope.Volume:
          setTrack({ ...track, volume: lane.nodes[0].value });
          break;
        case AutomationLaneEnvelope.Pan:
          setTrack({ ...track, pan: lane.nodes[0].value });
          break;
        case AutomationLaneEnvelope.Tempo:
          updateTimelineSettings({ ...timelineSettings, tempo: Math.round(lane.nodes[0].value) });
          break;
      }
    }
  }, [lane.nodes])

  useEffect(() => {
    if (lane.nodes.length === 1) {
      if (lane.envelope === AutomationLaneEnvelope.Volume)
        setNode({ ...lane.nodes[0], value: track.volume });
    }
  }, [track.volume])

  useEffect(() => {
    if (lane.nodes.length === 1) {
      if (lane.envelope === AutomationLaneEnvelope.Pan)
        setNode({ ...lane.nodes[0], value: track.pan });
    }
  }, [track.pan])

  useEffect(() => {
    if (lane.nodes.length === 1) {
      if (lane.envelope === AutomationLaneEnvelope.Tempo)
        setNode({ ...lane.nodes[0], value: timelineSettings.tempo });
    }
  }, [timelineSettings.tempo])

  useEffect(() => {
    drawPolylineFromNodes();
  }, [track, numMeasures, timelineSettings, verticalScale])

  function drawPolylineFromNodes() {
    if (ref.current && polylineRef.current) {
      let nodes = lane.nodes;
      let points = "";

      if (movingNodeIndex.current > -1 && movingNode.current) {
        const idx = lane.nodes.findIndex(node => node.id === movingNode.current!.id); 
        
        if (idx > -1) {
          nodes = nodes.slice();

          if (movingNodeIndex.current >= nodes.length)
            movingNodeIndex.current = nodes.length;

          nodes.splice(idx, 1);
          nodes.splice(movingNodeIndex.current, 0, movingNode.current);
  
          while (
            movingNodeIndex.current < nodes.length - 1 && 
            movingNode.current.pos.compareTo(nodes[movingNodeIndex.current + 1].pos) > 0
          ) {
            const temp = nodes[movingNodeIndex.current + 1];
            nodes[movingNodeIndex.current + 1] = movingNode.current;
            nodes[movingNodeIndex.current] = temp;
            movingNodeIndex.current++;
          }
      
          while (
            movingNodeIndex.current > 0 && 
            movingNode.current.pos.compareTo(nodes[movingNodeIndex.current - 1].pos) < 0
          ) {
            const temp = nodes[movingNodeIndex.current - 1];
            nodes[movingNodeIndex.current - 1] = movingNode.current;
            nodes[movingNodeIndex.current] = temp;
            movingNodeIndex.current--;
          }
        }
      }
      
      if (nodes.length > 0) {
        for (let i = 0; i < nodes.length; i++) {
          const x = nodes[i].pos.toMargin();
          const y = valueToY(nodes[i].value);

          if (i === 0)
            points += `0,${y + 4}`;
          
          points += ` ${x + 2},${y + 4}`;
          
          if (i === nodes.length - 1)
            points += ` ${ref.current.clientWidth},${y + 4}`;
        }
      } else {
        let y = 0;

        switch (lane.envelope) {
          case AutomationLaneEnvelope.Volume:
            y = valueToY(track.volume);
            break;
          case AutomationLaneEnvelope.Pan:
            y = valueToY(track.pan);
            break;
          case AutomationLaneEnvelope.Tempo:
            y = valueToY(timelineSettings.tempo);
            break;
        }

        points = `0,${y + 4} ${ref.current.clientWidth},${y + 4}`;
      }

      polylineRef.current.setAttribute("points", points);
    }
  }

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.shiftKey) {
      const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
      const y = e.clientY - e.currentTarget.getBoundingClientRect().top;

      const pos = TimelinePosition.fromMargin(x);
      pos.snap(snapGridSize);

      addNode(track, lane, { id: v4(), pos, value: yToValue(y) });
    }
  }

  function handleContextMenu(e: React.MouseEvent<HTMLElement>) {    
    e.preventDefault();

    const target = e.currentTarget;
    const disablePaste = clipboardItem?.type !== ClipboardItemType.Node;

    openContextMenu(ContextMenuType.Automation, { showPasteOptions: true, disablePaste }, params => {
      switch (params.action) {
        case 0:
          setLane(track, { ...lane, show: false });
          break;
        case 1:
          setLane(track, { ...lane, nodes: [] });
          break;
        case 2:
          setLane(track, { ...lane, show: false, nodes: [] });
          break;
        case 3:
          pasteNode(playheadPos, lane);
          break;
        case 4:
          const margin = e.clientX + target.scrollLeft - target.getBoundingClientRect().left;
          const pos = TimelinePosition.fromMargin(margin);
          pasteNode(pos.snap(snapGridSize), lane);
          break;
      }
    });
  }

  function handleNodeMove(node: AutomationNode) {
    if (movingNodeIndex.current === -1 || node.id !== movingNode.current?.id)
      movingNodeIndex.current = lane.nodes.findIndex(n => n.id === node.id);

    movingNode.current = node;

    const points = polylineRef.current!.points;
    const point = points[movingNodeIndex.current + 1];
    const x = node.pos.toMargin() + 2;
    const y = valueToY(node.value) + 4;

    point.x = x;
    point.y = y;

    while (movingNodeIndex.current < lane.nodes.length - 1 && point.x > points[movingNodeIndex.current + 2].x) {
      points.replaceItem(points[movingNodeIndex.current + 2], movingNodeIndex.current + 1);
      points.replaceItem(point, movingNodeIndex.current + 2);
      movingNodeIndex.current++;
    }

    while (movingNodeIndex.current > 0 && point.x < points[movingNodeIndex.current].x) {
      points.replaceItem(points[movingNodeIndex.current], movingNodeIndex.current + 1);
      points.replaceItem(point, movingNodeIndex.current);
      movingNodeIndex.current--;
    }
    
    points[0].y = points[1].y;
    points[points.length - 1].y = points[points.length - 2].y;
  }

  function setNode(node: AutomationNode) {
    const automationLanes = track.automationLanes.slice();
    const laneIndex = automationLanes.findIndex(l => l.id === lane.id)

    if (laneIndex !== -1) {
      const nodes = lane.nodes.slice();
      const nodeIndex = nodes.findIndex(n => n.id === node.id);

      if (nodeIndex !== -1) {
        if (movingNodeIndex.current > -1 && movingNode.current) {
          nodes.splice(nodeIndex, 1);
          nodes.splice(movingNodeIndex.current, 0, node);
        } else {
          nodes[nodeIndex] = node;
        }

        nodes.sort((a, b) => a.pos.compareTo(b.pos));
        automationLanes[laneIndex] = { ...automationLanes[laneIndex], nodes };
        
        movingNodeIndex.current = -1;
        movingNode.current = null;
        setTrack({ ...track, automationLanes });
      }
    }
  }

  function valueToY(value: number) {
    const height = ref.current ? ref.current.clientHeight - 8 : 0;
    const percentage = lane.envelope === AutomationLaneEnvelope.Volume 
      ? volumeToNormalized(value)
      : inverseLerp(value, lane.minValue, lane.maxValue);

    return height - percentage * height;
  }

  function yToValue(y: number) {
    const height = ref.current ? ref.current.clientHeight - 8 : 0;
    const percentage = clamp((height - y) / height, 0, 1);
    
    return lane.envelope === AutomationLaneEnvelope.Volume
      ? normalizedToVolume(percentage)
      : lerp(percentage, lane.minValue, lane.maxValue);
  }

  const automationColor = lane.enabled ? color : "var(--bg11)";

  return (
    <div
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      ref={ref}
      style={{
        width: "100%",
        borderBottom: `1px solid #0002`,
        position: "relative",
        height: lane.expanded ? BASE_HEIGHT * verticalScale : 22,
        marginLeft: -2,
        ...style
      }}
    >
      <svg 
        width="100%" 
        height="100%"
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 11 }} 
      >
        <polyline 
          ref={polylineRef} 
          style={{ fill: "none", stroke: automationColor, strokeWidth: lane.nodes.length > 0 ? 2 : 1 }} 
        />
      </svg>
      {lane.expanded && lane.nodes.map(node => (
        <AutomationNodeComponent 
          color={automationColor}
          key={node.id}
          lane={lane}
          node={node} 
          onNodeMove={handleNodeMove}
          onSetNode={setNode}
          valueToY={valueToY}
          yToValue={yToValue}
        />
      ))}
    </div>
  )
}