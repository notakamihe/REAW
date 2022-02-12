import { ContentPaste } from "@mui/icons-material";
import { ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import { getLaneColor } from "renderer/utils/helpers";
import { getPosFromAnchorEl } from "renderer/utils/utils";
import { AnywhereClickAnchorEl, ClipComponent, RegionComponent } from ".";
import AutomationLaneComponent from "./AutomationLaneComponent";
import { Clip } from "./ClipComponent";
import { MenuIcon } from "./icons";
import { Track } from "./TrackComponent";
import region from "../../../assets/svg/region.svg"
 
interface IProps {
  track : Track
  style? : React.CSSProperties
}
 
interface IState {
  anchorEl : HTMLElement | null
  regionAnchorEl : HTMLElement | null
}
 
class Lane extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>
 
  constructor(props : IProps) {
    super(props)
 
    this.state = {
      anchorEl: null,
      regionAnchorEl: null
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
    const {
      createClipFromTrackRegion,
      onClipClickAway, 
      pasteClip,
      selectedClip, 
      setSelectedClip, 
      setTrackRegion,
      timelinePosOptions, 
      trackRegion,
      verticalScale, 
    } = this.context!
 
    return (
      <React.Fragment>
        <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
          <div
            style={{
              width: "100%",
              height: 100 * verticalScale,
              position: "relative",
              cursor: "text",
              ...this.props.style
            }}
          >
            <RegionComponent 
              containerStyle={{position: "absolute", inset: 0}}
              onClickAway={() => setTrackRegion(null)}
              onContainerMouseDown={() => {if (!trackRegion || trackRegion.track.id !== this.props.track.id) setTrackRegion(null)}}
              onDelete={() => setTrackRegion(null)}
              onRightClickAnywhere={e => this.setState({regionAnchorEl: e})}
              onSetRegion={region => setTrackRegion(region ? {region, track: this.props.track} : null)}
              region={!trackRegion || trackRegion.track.id !== this.props.track.id ? null : trackRegion.region}
              regionStyle={{backgroundColor: "#fff6"}}
            />
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
        <Menu
          open={Boolean(this.state.regionAnchorEl)}
          anchorEl={this.state.regionAnchorEl}
          onClose={() => this.setState({regionAnchorEl: null})}
          onClick={e => this.setState({regionAnchorEl: null})}
        >
          <MenuList className="p-0" dense style={{outline: "none"}}>
            <MenuItem onClick={createClipFromTrackRegion}>
              <MenuIcon icon={<img src={region} style={{height: 14}} />} />
              <ListItemText>Create Clip From Region</ListItemText>
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
