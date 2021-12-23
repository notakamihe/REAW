import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { ID } from "renderer/types/types";
import { colorInterpolate, getLaneColor, normalizeHex } from "renderer/utils";
import { ClipComponent } from ".";
import AutomationLaneComponent from "./AutomationLaneComponent";
import { Clip } from "./ClipComponent";
import { Track } from "./TrackComponent";

interface IProps {
  width : number
  minWidth : number
  track : Track
  selectedClip : Clip | null
  handleSelectClip : (clip : Clip) => void
  onClickAway : (clip : Clip) => void
  onTrackChange : (e : React.MouseEvent<HTMLDivElement,MouseEvent>,rect : DOMRect,track : Track,clip : Clip) => void
  setClip : (oldClip : Clip, newClip : Clip) => void
  setTrack : (track : Track, callback? : () => void) => void
  style? : React.CSSProperties
}

interface IState {

}

class Lane extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)
  }

  render() {
    return (
      <React.Fragment>  
        <div 
          style={{
            width: this.props.width, 
            minWidth: this.props.minWidth,
            height: 100 * (this.context?.verticalScale || 1),
            position: "relative",
            ...this.props.style
          }}
        >
          {
            this.props.track.clips.map(clip => (
              <ClipComponent 
                key={clip.id} 
                clip={clip} 
                track={this.props.track}
                isSelected={this.props.selectedClip?.id === clip.id}
                onSelect={this.props.handleSelectClip}
                onClickAway={this.props.onClickAway}
                onTrackChange={this.props.onTrackChange}
                setClip={this.props.setClip}
                color={this.props.track.color}
              />
            ))
          }
        </div>
        {
          this.props.track.automationEnabled &&
          this.props.track.automationLanes.map((lane, idx) => (
            <AutomationLaneComponent
              key={lane.id}
              lane={lane}
              width={this.props.width} 
              minWidth={this.props.minWidth}
              style={{backgroundColor: "#aaa"}} 
              track={this.props.track}
              setTrack={this.props.setTrack}
              color={getLaneColor(this.props.track.automationLanes, idx, this.props.track.color)}
            />
          ))
        }
      </React.Fragment>
    )
  }
}

export default Lane