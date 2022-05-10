import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import channels from "renderer/utils/channels";
import { getLaneColor } from "renderer/utils/helpers";
import { ipcRenderer, marginToPos } from "renderer/utils/utils";
import { ClipComponent, RegionComponent } from ".";
import AutomationLaneComponent from "./AutomationLaneComponent";
import { Clip } from "./ClipComponent";
import { Track } from "./TrackComponent";
 
interface IProps {
  track : Track
  style? : React.CSSProperties
}
 
interface IState {
  regionAnchorEl : HTMLElement | null
}
 
class Lane extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>
 
  constructor(props : IProps) {
    super(props)
 
    this.state = {
      regionAnchorEl: null
    }
 
    this.changeLane = this.changeLane.bind(this)
    this.onLaneContextMenu = this.onLaneContextMenu.bind(this)
    this.onTrackRegionContextMenu = this.onTrackRegionContextMenu.bind(this)
    this.setClip = this.setClip.bind(this)
  }
 
  addClip(clip : Clip) {
    const clips = this.props.track.clips.slice()
   
    clips.push(clip)
    this.context!.setTrack({...this.props.track, clips})
  }
 
  changeLane(track : Track, clip : Clip, changeAbove : boolean) {
    const tracks = this.context!.tracks.slice()
    const trackIndex = tracks.findIndex(t => t.id === track.id)
   
    for (let i = 0; i < tracks.length; i++) {
      if (i === trackIndex) {
        const clipIndex = tracks[i].clips.findIndex(c => c.id === clip.id)
        
        if (clipIndex > -1) {
          if (changeAbove) {
            if (trackIndex > 0 && !tracks[i - 1].isMaster) {
              tracks[i].clips.splice(clipIndex, 1)
              tracks[i - 1].clips.push(clip)
            }
          } else {
            if (i < tracks.length - 1 && !tracks[i + 1].isMaster) {
              tracks[i].clips.splice(clipIndex, 1)
              tracks[i + 1].clips.push(clip)
            }
          }
        }
      }
    }

    this.context!.setTracks(tracks)
  }

  onLaneContextMenu(e : React.MouseEvent) {
    e.stopPropagation()

    ipcRenderer.send(channels.OPEN_LANE_CONTEXT_MENU)

    ipcRenderer.on(channels.PASTE_AT_CURSOR_ON_LANE, () => {
      this.context!.pasteClip(this.context!.cursorPos, this.props.track)
    })

    ipcRenderer.on(channels.PASTE_ON_LANE, () => {
      const targetEl = e.target as HTMLElement
      const rect = targetEl.getBoundingClientRect()
      const margin = e.clientX + targetEl.scrollLeft - rect.left

      this.context!.pasteClip(marginToPos(margin, this.context!.timelinePosOptions), this.props.track)
    })

    ipcRenderer.on(channels.CLOSE_LANE_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.PASTE_AT_CURSOR_ON_LANE)
      ipcRenderer.removeAllListeners(channels.PASTE_ON_LANE)
      ipcRenderer.removeAllListeners(channels.CLOSE_LANE_CONTEXT_MENU)
    })
  }

  onTrackRegionContextMenu(e : React.MouseEvent) {
    e.stopPropagation()

    ipcRenderer.send(channels.OPEN_TRACK_REGION_CONTEXT_MENU)

    ipcRenderer.on(channels.CREATE_CLIP_FROM_TRACK_REGION, () => {
      this.context!.createClipFromTrackRegion();
    })

    ipcRenderer.on(channels.DELETE_TRACK_REGION, () => {
      this.context!.setTrackRegion(null)
    })

    ipcRenderer.on(channels.CLOSE_TRACK_REGION_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.CREATE_CLIP_FROM_TRACK_REGION)
      ipcRenderer.removeAllListeners(channels.DELETE_TRACK_REGION)
      ipcRenderer.removeAllListeners(channels.CLOSE_TRACK_REGION_CONTEXT_MENU)
    })
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
    const {onClipClickAway, selectedClip, setSelectedClip, setTrackRegion, showMaster, trackRegion, verticalScale} = this.context!
 
    if (showMaster || !this.props.track.isMaster) {
      return (
        <React.Fragment>
          <div
            onContextMenu={this.onLaneContextMenu}
            style={{
              width: "100%",
              height: 100 * verticalScale,
              position: "relative",
              cursor: "text",
              pointerEvents: this.props.track.isMaster ? "none" : "auto",
              ...this.props.style
            }}
          >
            <RegionComponent 
              containerStyle={{position: "absolute", inset: 0}}
              onContainerMouseDown={() => {if (!trackRegion || trackRegion.track.id !== this.props.track.id) setTrackRegion(null)}}
              onContextMenu={this.onTrackRegionContextMenu}
              onDelete={() => setTrackRegion(null)}
              onSetRegion={region => setTrackRegion(region ? {region, track: this.props.track} : null)}
              region={!trackRegion || trackRegion.track.id !== this.props.track.id ? null : trackRegion.region}
              regionStyle={{backgroundColor: "#fff3", borderColor: "var(--bg4)", borderStyle: "solid", borderWidth: "0 1px"}}
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
          {
            this.props.track.automationEnabled &&
            this.props.track.automationLanes.map((lane, idx) => (
              <AutomationLaneComponent
                color={getLaneColor(this.props.track.automationLanes, idx, this.props.track.color)}
                key={lane.id}
                lane={lane}
                style={{backgroundColor: "var(--bg6)", borderBottom: "1px solid var(--border4)", filter: "contrast(0.95)"}}
                track={this.props.track}
              />
            ))
          }
        </React.Fragment>
      )
    }

    return null
  }
}
 
export default Lane
