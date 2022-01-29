import { ContentPaste } from "@mui/icons-material";
import { ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { getLaneColor } from "renderer/utils/helpers";
import { getPosFromAnchorEl } from "renderer/utils/utils";
import { AnywhereClickAnchorEl, ClipComponent } from ".";
import AutomationLaneComponent from "./AutomationLaneComponent";
import { Clip } from "./ClipComponent";
import { MenuIcon } from "./icons";
import { Track } from "./TrackComponent";
 
interface IProps {
  track : Track
  style? : React.CSSProperties
}
 
interface IState {
  anchorEl : HTMLElement | null
}
 
class Lane extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>
 
  constructor(props : IProps) {
    super(props)
 
    this.state = {
      anchorEl: null
    }
 
    this.changeLane = this.changeLane.bind(this)
    this.setClip = this.setClip.bind(this)
  }
 
  addClip(clip : Clip) {
    const clips = this.props.track.clips.slice()
   
    clips.push(clip)
    this.context!.setTrack({...this.props.track, clips})
  }
 
  changeLane(track : Track, clip : Clip, changeToAbove : boolean) {
    const tracks = this.context!.tracks.slice()
    const trackIndex = tracks.findIndex(t => t.id === track.id)
   
    if (trackIndex !== -1) {
      const clipIndex = tracks[trackIndex].clips.findIndex(c => c.id === clip.id)
 
      if (clipIndex !== -1) {
        tracks[trackIndex].clips.splice(clipIndex, 1)
 
        if (changeToAbove) {
          tracks[Math.max(0, trackIndex - 1)].clips.push(clip)
        } else {
          tracks[Math.min(tracks.length - 1, trackIndex + 1)].clips.push(clip)
        }
 
        this.context!.setTracks(tracks)
      }
    }
  }
 
  setClip(clip : Clip) {
    const clips = this.props.track.clips.slice()
    const index = clips.findIndex(c => c.id === clip.id)
 
    if (index !== -1) {
      clips[index] = clip
      this.context!.setTrack({...this.props.track, clips})
    }
 
    if (clip.id === this.context!.selectedClip?.id) {
      this.context!.setSelectedClip(clip)
    }
  }
 
  render() {
    const {verticalScale, selectedClip, setSelectedClip, onClipClickAway, timelinePosOptions, pasteClip} = this.context!
 
    return (
      <React.Fragment>
        <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
          <div
            style={{
              width: "100%",
              height: 100 * verticalScale,
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
                  isSelected={selectedClip?.id === clip.id}
                  onSelect={setSelectedClip}
                  onClickAway={onClipClickAway}
                  onChangeLane={this.changeLane}
                  setClip={this.setClip}
                />
              ))
            }
          </div>
        </AnywhereClickAnchorEl>  
        <Menu
          open={Boolean(this.state.anchorEl)}
          anchorEl={this.state.anchorEl}
          onClose={() => this.setState({anchorEl: null})}
          onClick={e => this.setState({anchorEl: null})}
        >
          <MenuList className="p-0" dense style={{outline: "none"}}>
            <MenuItem onClick={() => pasteClip(true, this.props.track)}>
              <MenuIcon icon={<ContentPaste />} />
              <ListItemText>Paste at Cursor</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => pasteClip(false, this.props.track, getPosFromAnchorEl(this.state.anchorEl!, timelinePosOptions))}>
              <MenuIcon icon={<ContentPaste />} />
              <ListItemText>Paste</ListItemText>
            </MenuItem>
          </MenuList>
        </Menu>
        {
          this.props.track.automationEnabled &&
          this.props.track.automationLanes.map((lane, idx) => (
            <AutomationLaneComponent
              key={lane.id}
              lane={lane}
              style={{backgroundColor: "#aaa"}}
              track={this.props.track}
              color={getLaneColor(this.props.track.automationLanes, idx, this.props.track.color)}
            />
          ))
        }
      </React.Fragment>
    )
  }
}
 
export default Lane
