import { CSSProperties } from "react";
import { GraphicEq, Piano } from "@mui/icons-material";
import { TrackType } from "@/services/types/types";
import { Sequencer } from ".";

export default function TrackIcon(props: { color?: string, size?: number, style?: CSSProperties, type: TrackType }) {
  switch (props.type) {
    case TrackType.Audio:
      return <GraphicEq style={{ fontSize: props.size || 16, color: props.color, ...props.style }} />
    case TrackType.Midi:
      return <Piano style={{ fontSize: props.size || 16, color: props.color, ...props.style }} />
    case TrackType.Sequencer:
      return <Sequencer size={props.size || 16} style={{ color: props.color, ...props.style }} />
    default:
      return null;
  }
}