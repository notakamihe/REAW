import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { AudioClip, Clip, Track, TrackType } from "renderer/types/types";
import channels from "renderer/utils/channels";
import { getLaneColor } from "renderer/utils/general";
import { ipcRenderer, marginToPos } from "renderer/utils/utils";
import { v4 } from "uuid";
import { ClipComponent, RegionComponent } from ".";
import AudioClipComponent from "./AudioClipComponent";
import AutomationLaneComponent from "./AutomationLaneComponent";
 
interface IProps {
  track : Track
  style? : React.CSSProperties
}
 
class Lane extends React.Component<IProps> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>
 
  constructor(props : IProps) {
    super(props)
 
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
        const clipIndex = tracks[i].clips.findIndex((c : Clip) => c.id === clip.id)
        
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

    ipcRenderer.send(channels.OPEN_LANE_CONTEXT_MENU, this.props.track)

    ipcRenderer.on(channels.INSERT_AUDIO_FILE, (files: {buffer: Buffer, src: string, extension: string}[] | undefined) => {
      if (files) {
        const file = files[0];

        const audio = new Audio();
        audio.src = `data:audio/${file.extension};base64,${file.src}`;

        audio.addEventListener("loadedmetadata", () => {
          const {measures, beats, fraction} = TimelinePosition.fromDuration(audio.duration, this.context!.timelinePosOptions);

          const clip : AudioClip = {
            end: this.context!.cursorPos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
            endLimit: null,
            id: v4(),
            loopEnd: null,
            muted: false,
            start: this.context!.cursorPos,
            startLimit: this.context!.cursorPos,
            audio: {
              buffer: file.buffer,
              duration: audio.duration,
              end: this.context!.cursorPos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
              src: {extension: file.extension, data: file.src},
              start: this.context!.cursorPos
            }
          };

          this.addClip(clip);
          audio.remove();

          ipcRenderer.removeAllListeners(channels.INSERT_AUDIO_FILE);
        }, false);
      }
    })

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
              cursor: (this.props.track.isMaster || this.props.track.type === TrackType.Audio) ? "default" : "text",
              pointerEvents: this.props.track.isMaster ? "none" : "auto",
              ...this.props.style
            }}
          >
            {
              this.props.track.type !== TrackType.Audio &&
              <RegionComponent 
                containerStyle={{position: "absolute", inset: 0}}
                onContainerMouseDown={() => {if (!trackRegion || trackRegion.track.id !== this.props.track.id) setTrackRegion(null)}}
                onContextMenu={this.onTrackRegionContextMenu}
                onDelete={() => setTrackRegion(null)}
                onSetRegion={region => setTrackRegion(region ? {region, track: this.props.track} : null)}
                region={!trackRegion || trackRegion.track.id !== this.props.track.id ? null : trackRegion.region}
                regionStyle={{backgroundColor: "#fff3", borderColor: "var(--bg4)", borderStyle: "solid", borderWidth: "0 1px"}}
              />
            }
            {
              this.props.track.clips.map(clip => (
                (clip as AudioClip).audio ?
                <AudioClipComponent
                  key={clip.id}
                  clip={clip as AudioClip}
                  track={this.props.track}
                  isSelected={selectedClip?.id === clip.id}
                  onSelect={setSelectedClip}
                  onClickAway={onClipClickAway}
                  onChangeLane={this.changeLane}
                  setClip={this.setClip}
                /> :
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
