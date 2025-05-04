import React, { useContext, useMemo, useState } from "react"
import { IconButton, Popover } from "@mui/material"
import { WorkstationContext } from "@/contexts"
import { AutomationLane, Track, AutomationLaneEnvelope, TimelinePosition, ContextMenuType } from "@/services/types/types"
import { Add, ExpandLess, ExpandMore, Remove } from "@mui/icons-material"
import { clamp, inverseLerp, lerp } from "@/services/utils/general"
import { v4 } from "uuid"
import { BASE_HEIGHT, automatedValueAtPos, volumeToNormalized } from "@/services/utils/utils"
import { Meter } from "@/components/widgets"
import { openContextMenu } from "@/services/electron/utils"

interface Props {
  color: string;
  lane: AutomationLane;
  track: Track;
}

export default function AutomationLaneTrack({ color, lane, track }: Props) {
  const { 
    addNode, 
    getTrackCurrentValue,
    maxPos, 
    playheadPos, 
    setLane, 
    setSelectedNodeId, 
    timelineSettings, 
    verticalScale
  } = useContext(WorkstationContext)!;

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [nodeText, setNodeText] = useState({ pos: "", value: "" });

  let value = null;

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

  const currentValue = useMemo(() => {
    return getTrackCurrentValue(track, lane);
  }, [lane, playheadPos, value, timelineSettings.timeSignature]);

  const normalizedCurrentValue = useMemo(() => {
    if (currentValue.value !== null) {
      if (lane.envelope === AutomationLaneEnvelope.Volume)
        return volumeToNormalized(currentValue.value);
      return inverseLerp(currentValue.value, lane.minValue, lane.maxValue);
    } else {
      return 0;
    }
  }, [currentValue.value])

  const posFromNewNodePosText = TimelinePosition.parseFromString(nodeText.pos);
  const newNodePosTextValid = 
    nodeText.pos === "" || 
    posFromNewNodePosText && posFromNewNodePosText.compareTo(TimelinePosition.start) >= 0;
  const newNodeValueTextValid = !isNaN(Number(nodeText.value));

  function handleContextMenu(_: React.MouseEvent<HTMLDivElement>) {
    if (document.activeElement?.nodeName !== "INPUT") {
      openContextMenu(ContextMenuType.Automation, {}, params => {
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
        }
      });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (newNodePosTextValid && newNodeValueTextValid) {
      let pos, value: number;

      if (nodeText.pos === "" || !posFromNewNodePosText)
        pos = playheadPos.copy();
      else
        pos = posFromNewNodePosText;

      if (pos.compareTo(maxPos) > 0)
        pos = maxPos.copy();
      
      if (nodeText.value === "") {
        const valFromPos = automatedValueAtPos(pos, lane);

        if (valFromPos) {
          value = valFromPos;
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
            default:
              value = lerp(0.5, lane.minValue, lane.maxValue);
          }
        }
      } else {
        value = clamp(Number(nodeText.value), lane.minValue, lane.maxValue);
      }

      setNodeText({ pos: "", value: "" });
      setAnchorEl(null);

      const node = { id: v4(), pos, value };
      addNode(track, lane, node);
      setSelectedNodeId(node.id);
    }
  }

  return (
    <div onContextMenu={handleContextMenu} style={{ width: "100%" }}>
      <div 
        className="stop-reorder d-flex align-items-center"
        style={{height: 22, borderBottom: "1px solid var(--border4)"}}
      >
        <div style={{display: "flex", alignItems: "center", flex: 1, padding: "0 6px"}}>
          <p 
            className="overflow-hidden m-0"
            style={{fontSize: 13, whiteSpace: "nowrap", color: "var(--fg1)", flex: 1}}
            title={lane.label}
          >
            {lane.label}
          </p>
          <div 
            className="rounded-circle d-inline-block"
            role="button"
            style={{
              height: 8, 
              width: 8, 
              border: `1px solid ${lane.enabled ? "var(--border5)" : "var(--border6)"}`, 
              backgroundColor: lane.enabled ? color : "#0000", 
              flexShrink: 0
            }}
            onClick={() => setLane(track, { ...lane, enabled: !lane.enabled })}
          ></div>
        </div>
        <div 
          className="d-flex align-items-center"
          style={{ borderLeft: "1px solid var(--border1)", height: 21, padding: "0 3px" }}
        >
          <IconButton
            className="p-0 rounded-circle"
            onClick={() => setLane(track, { ...lane, expanded: !lane.expanded })} 
            style={{ border: "1px solid var(--border4)", marginRight: 4, transform: "translate(0.5px, 0)" }}
          >
            {lane.expanded ? (
              <ExpandLess style={{fontSize: 14, color: "var(--border4)"}} />
            ) : (
              <ExpandMore style={{fontSize: 14, color: "var(--border4)"}} />
            )}
          </IconButton>
          <IconButton
            className="p-0 rounded-circle"
            onClick={() => setLane(track, { ...lane, show: false })} 
            style={{border: "1px solid var(--border4)"}}
          >
            <Remove style={{fontSize: 14, color: "var(--border4)"}} />
          </IconButton>
        </div>
      </div>
      {lane.expanded && (
        <div
          className="p-0 d-flex" 
          style={{height: BASE_HEIGHT * verticalScale - 22, borderBottom: "1px solid var(--border1)"}}
        >
          <div style={{flex: 1, padding: 6}}>
            <div 
              className="d-flex flex-column col-12"
              style={{border: "1px solid var(--border1)", maxHeight: 31, height: "100%"}}
            >
              <Meter 
                color={lane.enabled ? color : "var(--bg11)"}
                percent={normalizedCurrentValue * 100} 
                style={{padding: 2, height: 9, borderBottom: "1px solid var(--border1)"}} 
              />
              <p
                className="m-0 px-1 center-flex flex-shrink-0 overflow-hidden"
                style={{fontSize: 12, color: "var(--border6)", flex: 1, fontWeight: "bold"}}
              >
                {
                  currentValue.value && 
                  (currentValue.value === -Infinity ? "-∞" : +currentValue.value.toFixed(2))
                }
              </p>
            </div>
          </div>
          <div
            className="d-flex justify-content-center"
            style={{width: 43, height: "100%", borderLeft: "1px solid var(--border4)"}}
          >
            <IconButton 
              className="p-0 stop-reorder" 
              onClick={e => setAnchorEl(e.currentTarget)} 
              style={{height: "fit-content", border: "1px solid var(--border6)", marginTop: 9}}
            >
              <Add style={{fontSize: 16, color: "var(--border6)"}} />
            </IconButton>
            <Popover
              anchorEl={anchorEl}
              anchorOrigin={{horizontal: "right", vertical: "center"}}
              onClose={() => setAnchorEl(null)}
              onContextMenu={e => e.stopPropagation()}
              onMouseDown={e => e.stopPropagation()}
              open={!!anchorEl}
              slotProps={{ paper: { style: { borderRadius: 0 } } }}
              transformOrigin={{horizontal: "left", vertical: "center"}}
              transitionDuration={0}
            >
              <form
                className="p-1"
                onSubmit={handleSubmit} 
                style={{width: 75, backgroundColor: "var(--bg6)", zIndex: 1, border: "1px solid var(--border1)"}}
              >
                <input
                  autoFocus
                  className="text-center mb-1 d-block input1"
                  onChange={e => setNodeText({ ...nodeText, pos: e.target.value })}
                  placeholder="X.X.XXX"
                  style={!newNodePosTextValid ? { borderColor: "#f00", color: "#f00" } : {}}
                  value={nodeText.pos}
                />
                <input
                  className="text-center mb-1 d-block input1"
                  onChange={e => setNodeText({ ...nodeText, value: e.target.value })}
                  placeholder="Value"
                  style={!newNodeValueTextValid ? { borderColor: "#f00", color: "#f00" } : {}}
                  value={nodeText.value}
                />
                <input className="py-1 col-12 d-block btn-3" type="submit" value="Add"/>
              </form>
            </Popover>
          </div>
        </div>
      )}
    </div>
  )
}