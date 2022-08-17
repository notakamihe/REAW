import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { AudioClip, Clip, Track, TrackType } from "renderer/types/types";
import channels from "renderer/utils/channels";
import { getLaneColor } from "renderer/utils/general";
import { ipcRenderer, marginToPos, sliceAnyOverlappingClips } from "renderer/utils/utils";
import { v4 } from "uuid";
import { ClipComponent, RegionComponent } from ".";
import AudioClipComponent from "./AudioClipComponent";
import AutomationLaneComponent from "./AutomationLaneComponent";
import {Buffer} from "buffer";
import { LanesContextType } from "renderer/context/LanesContext";
 
interface IProps {
  ctx: LanesContextType;
  style? : React.CSSProperties;
  track : Track;
}

interface IState {
  dropzoneActive: boolean;
}

class Lane extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  newClipStartMarginMarkerRef: React.RefObject<HTMLDivElement>;
  ref: React.RefObject<HTMLDivElement>;

  counter = 0;

  constructor(props : IProps) {
    super(props)

    this.newClipStartMarginMarkerRef = React.createRef();
    this.ref = React.createRef();
    
    this.state = {
      dropzoneActive: false
    }

    this.changeLane = this.changeLane.bind(this);
    this.onDragEnter = this.onDragEnter.bind(this);
    this.onDragOver = this.onDragOver.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.onDragLeave = this.onDragLeave.bind(this);
    this.onLaneContextMenu = this.onLaneContextMenu.bind(this);
    this.onTrackRegionContextMenu = this.onTrackRegionContextMenu.bind(this);
    this.setClip = this.setClip.bind(this);
  }

  componentDidMount() {
    this.props.ctx.registerLane(this.ref.current);
  }
  
  componentDidUpdate(prevProps: IProps) {
    if (prevProps.track !== this.props.track) {
      this.props.ctx.unregisterLane(this.ref.current);
      this.props.ctx.registerLane(this.ref.current);
    }
  }

  componentWillUnmount() {
    this.props.ctx.unregisterLane(this.ref.current);
  }
 
  addClip(clip : Clip) {
    let clips = this.props.track.clips.slice();

    clips.push(clip);
    clips = sliceAnyOverlappingClips(clip, clips, this.context!.timelinePosOptions);
    
    this.context!.setTrack({...this.props.track, clips})
  }
 
  changeLane(clip: Clip, newTrack: Track) {
    const tracks = this.context!.tracks.slice().map(t => ({...t}))

    const trackIndex = tracks.findIndex(t => t.clips.find(c => c.id === clip.id));
    const newTrackIndex = tracks.findIndex(t => t.id === newTrack.id);
   
    if (trackIndex > -1 && newTrackIndex > -1) {
      tracks[trackIndex].clips = tracks[trackIndex].clips.filter(c => c.id !== clip.id);
      tracks[newTrackIndex].clips = sliceAnyOverlappingClips(
        clip, 
        [...tracks[newTrackIndex].clips, clip], 
        this.context!.timelinePosOptions
      );
    }

    this.context!.setTracks(tracks)
  }

  onDragEnter(e: React.DragEvent) {
    if (this.counter++ === 0) {
      if (this.props.track.type === TrackType.Audio && Array.from(e.dataTransfer.items).find(i => i.type.split("/")[0] === "audio")) {
        this.setState({dropzoneActive: true});
      }
    }
  }

  onDragLeave(e: React.DragEvent) {
    if (--this.counter === 0) {
      this.setState({dropzoneActive: false});
    }
  }

  onDragOver(e: React.DragEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (this.state.dropzoneActive) {
      e.dataTransfer.dropEffect = "copy";
  
      const snapWidth = TimelinePosition.fromInterval(this.context!.snapGridSize).toMargin(this.context!.timelinePosOptions) || 0.00001;
      const newMargin = snapWidth * Math.round((e.clientX - e.currentTarget.getBoundingClientRect().left) / snapWidth);
     
      this.newClipStartMarginMarkerRef.current!.style.left = `${newMargin}px`;
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }

  async onDrop(e: React.DragEvent) {
    this.counter = 0;

    if (this.state.dropzoneActive) {
      if (this.props.track.type === TrackType.Audio) {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.split("/")[0] === "audio");
        let pos = marginToPos(this.newClipStartMarginMarkerRef.current!.offsetLeft, 
          this.context!.timelinePosOptions);

        for (let i = 0; i < files.length; i++) {
          const extension = files[i].type.split("/")[1];
          const name = files[i].name.split(".")[0];
          const ab = await files[i].arrayBuffer();
          const buffer = Buffer.from(ab);
          const data = buffer.toString("base64");

          const audio = new Audio();
          audio.src = `data:audio/${extension};base64,${data}`;
      
          audio.addEventListener("loadedmetadata", () => {
            const {measures, beats, fraction} = TimelinePosition.fromDuration(audio.duration, this.context!.timelinePosOptions);
      
            const clip : AudioClip = {
              end: pos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
              endLimit: null,
              id: v4(),
              loopEnd: null,
              muted: false,
              name,
              start: pos,
              startLimit: pos,
              audio: {
                buffer: buffer,
                duration: audio.duration,
                end: pos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
                src: {extension, data},
                start: pos
              }
            };
            
            this.addClip(clip);
            
            pos = TimelinePosition.fromPos(clip.end);
            pos.snap(this.context!.timelinePosOptions);
             
            audio.remove();
          })
        }
      }
    }

    this.setState({dropzoneActive: false});
  }

  onLaneContextMenu(e : React.MouseEvent) {
    e.stopPropagation()

    ipcRenderer.send(channels.OPEN_LANE_CONTEXT_MENU, this.props.track)
    
    ipcRenderer.on(channels.INSERT_AUDIO_FILE, () => {
      ipcRenderer.invoke(channels.HANDLE_INSERT_AUDIO_FILE)
        .then((files: {buffer: Buffer, data: string, extension: string, name: string}[] | null) => {
          if (files) {
            const file = files[0];
            
            const audio = new Audio();
            audio.src = `data:audio/${file.extension};base64,${file.data}`;
    
            audio.addEventListener("loadedmetadata", () => {
              const {measures, beats, fraction} = TimelinePosition.fromDuration(audio.duration, this.context!.timelinePosOptions);
    
              const clip : AudioClip = {
                end: this.context!.cursorPos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
                endLimit: null,
                id: v4(),
                loopEnd: null,
                muted: false,
                name: file.name,
                start: this.context!.cursorPos,
                startLimit: this.context!.cursorPos,
                audio: {
                  buffer: file.buffer,
                  duration: audio.duration,
                  end: this.context!.cursorPos.add(measures, beats, fraction, false, this.context!.timelinePosOptions),
                  src: {extension: file.extension, data: file.data},
                  start: this.context!.cursorPos
                }
              };
              
              audio.remove();
              this.addClip(clip);
            });
          }
        })
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
      ipcRenderer.removeAllListeners(channels.PASTE_AT_CURSOR_ON_LANE);
      ipcRenderer.removeAllListeners(channels.PASTE_ON_LANE);
      ipcRenderer.removeAllListeners(channels.INSERT_AUDIO_FILE);
      ipcRenderer.removeAllListeners(channels.CLOSE_LANE_CONTEXT_MENU);
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
    let clips = this.props.track.clips.slice();
    const index = clips.findIndex(c => c.id === clip.id)
 
    if (index !== -1) {
      clips[index] = clip;
      clips = sliceAnyOverlappingClips(clip, clips, this.context!.timelinePosOptions);
      this.context!.setTrack({...this.props.track, clips})
    }
 
    if (clip.id === this.context!.selectedClip?.id) {
      this.context!.setSelectedClip(clip)
    }
  }
 
  render() {
    const {
      onClipClickAway, 
      selectedClip, 
      setSelectedClip, 
      setTrackRegion, 
      showMaster, 
      trackRegion, 
      verticalScale
    } = this.context!

    if (showMaster || !this.props.track.isMaster) {
      return (
        <div
          onDragEnter={this.onDragEnter}
          onDragOver={this.onDragOver} 
          onDragLeave={this.onDragLeave}
          onDrop={this.onDrop}
        >
          <div
            data-track={this.props.track.id}
            onContextMenu={this.onLaneContextMenu}
            ref={this.ref}
            style={{
              width: "100%",
              height: 100 * verticalScale,
              position: "relative",
              cursor: (this.props.track.isMaster || this.props.track.type === TrackType.Audio) ? "default" : "text",
              pointerEvents: this.props.track.isMaster ? "none" : "auto",
              backgroundColor: "var(--bg5)", 
              borderBottom: "1px solid var(--border2)",
              ...this.props.style
            }}
          >
            <div 
              className="position-absolute pe-none"
              style={{
                left: 0, 
                top: 0, 
                width: "100%", 
                height: "100%", 
                backgroundColor: "#fff2", 
                zIndex: 12, 
                display: this.state.dropzoneActive ? "block" : "none"
              }}
            >
              <div
                className="position-absolute"
                ref={this.newClipStartMarginMarkerRef}
                style={{backgroundColor: "var(--color1)", height: "100%", width: 1}}
              ></div>
            </div>
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
                  lanesCtx={this.props.ctx}
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
                  lanesCtx={this.props.ctx}
                />
              ))
            }
          </div>
          <div>
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
          </div>
        </div>
      )
    }

    return null
  }
}
 
export default Lane
