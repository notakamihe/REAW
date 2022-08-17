import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { AutomationLane, Clip, Track } from "renderer/types/types";
import { shadeColor } from "renderer/utils/general";
import { copyClip, marginToPos, clipAtPos, ipcRenderer } from "renderer/utils/utils";
import DNR, { DragAxis, DNRData, ResizeDirection } from "./DNR";
import { GuideLine, MouseDownAwayListener, StickyTitle } from ".";
import channels from "renderer/utils/channels";
import AutoWidthInput from "./ui/AutoWidthInput";
import { LanesContextType } from "renderer/context/LanesContext";

interface IProps {
  automationSprite?: (lane: AutomationLane) => React.ReactNode;
  clip : Clip;
  isSelected : boolean;
  lanesCtx: LanesContextType;
  listeners?: {channel: string, handler: () => void}[];
  loopSprite?: React.ReactNode;
  onChangeLane : (clip : Clip, newTrack: Track) => void;
  onClickAway : (clip : Clip) => void;
  onConsolidate?: () => void;
  onDrag?: (e: MouseEvent, data: DNRData) => void;
  onDragStart?: (e: React.MouseEvent, data: DNRData) => void;
  onDragStop?: (e: MouseEvent, data: DNRData) => void;
  onLoop?: (e: MouseEvent, dir: ResizeDirection, ref: HTMLElement, data: DNRData) => void;
  onLoopStart?: (e: React.MouseEvent, dir: ResizeDirection, ref: HTMLElement) => void;
  onLoopStop?: (e: MouseEvent, dir: ResizeDirection, ref: HTMLElement, data: DNRData) => void;
  onResize?: (e: MouseEvent, dir: ResizeDirection, ref: HTMLElement, data: DNRData) => void;
  onResizeStart?: (e: React.MouseEvent, dir: ResizeDirection, ref: HTMLElement) => void;
  onResizeStop?: (e: MouseEvent, dir: ResizeDirection, ref: HTMLElement, data: DNRData) => void;
  onSelect : (clip : Clip) => void;
  setClip : (clip : Clip) => void;
  sprite?: React.ReactNode;
  track : Track;
}

interface IState {
  guideLineMargins : number[];
  isDragging : boolean;
  isLooping : boolean;
  isResizing : boolean;
  name: string;
  renaming: boolean;
  tempLoopWidth : number;
  tempWidth : number;
}

class ClipComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext;
  context!: React.ContextType<typeof WorkstationContext>;

  nameInputRef: React.RefObject<HTMLInputElement>;
  private ref : React.RefObject<DNR>

  constructor(props: IProps) {
    super(props);

    this.nameInputRef = React.createRef();
    this.ref = React.createRef();

    this.state = {
      guideLineMargins : [],
      isDragging: false,
      isLooping: false,
      isResizing: false,
      name: "",
      renaming: false,
      tempLoopWidth: 0,
      tempWidth: 0
    }

    this.confirmName = this.confirmName.bind(this);
    this.enableRenaming = this.enableRenaming.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDragStop = this.onDragStop.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onLoop = this.onLoop.bind(this);
    this.onLoopStart = this.onLoopStart.bind(this);
    this.onLoopStop = this.onLoopStop.bind(this);
    this.onResize = this.onResize.bind(this);
    this.onResizeStart = this.onResizeStart.bind(this);
    this.onResizeStop = this.onResizeStop.bind(this);
  }

  componentDidMount() {
    window.addEventListener("keydown", this.onKeyDown);
    this.setState({name: this.props.clip.name});
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKeyDown);
  }

  confirmName() {
    this.setState({renaming: false});
    this.props.setClip({...this.props.clip, name: this.state.name});
  }

  consolidate() {
    if (this.props.onConsolidate)
      this.props.onConsolidate?.();
    else
      this.context!.consolidateClip(this.props.clip);
  }

  enableRenaming() {
    this.setState({renaming: true}, () => {
      this.nameInputRef.current?.focus();
    });
  }

  getBounds() {
    const options = this.context!.timelinePosOptions

    if (this.state.isDragging)
      return {}

    return {left: this.props.clip.startLimit?.toMargin(options), right: this.props.clip.endLimit?.toMargin(options)}
  }

  getLoopOffset() {
    const offsetPos = TimelinePosition.fromPos(this.props.clip.start);
    offsetPos.snap(this.context!.timelinePosOptions, true);
    
    return TimelinePosition.toWidth(offsetPos, this.props.clip.start, this.context!.timelinePosOptions);
  }

  getLoopWidth() {
    return TimelinePosition.toWidth(this.props.clip.end, this.props.clip.loopEnd, this.context!.timelinePosOptions)
  }

  moveClipByMargin(margin : number) {
    const newStartPos = marginToPos(margin, this.context!.timelinePosOptions)
    const newClip = clipAtPos(newStartPos, this.props.clip, this.context!.timelinePosOptions);
    this.props.setClip(newClip);
  }

  onContextMenu(e : React.MouseEvent) {
    e.stopPropagation();
    this.props.onSelect(this.props.clip);

    const listeners = this.props.listeners || [];

    ipcRenderer.send(channels.OPEN_CLIP_CONTEXT_MENU, this.props.clip)

    ipcRenderer.on(channels.DELETE_CLIP, () => {
      this.context!.deleteClip(this.props.clip);
    });

    ipcRenderer.on(channels.DUPLICATE_CLIP, () => {
      this.context!.duplicateClip(this.props.clip)
    });

    ipcRenderer.on(channels.RENAME_CLIP, () => {
      this.enableRenaming();
    });

    ipcRenderer.on(channels.SPLIT_CLIP, () => {
      this.context!.splitClip(this.props.clip, this.context!.cursorPos)
    });

    ipcRenderer.on(channels.SET_SONG_REGION_TO_CLIP, () => {
      this.context!.setSongRegion({start: this.props.clip.start, end: this.props.clip.end})
    });

    ipcRenderer.on(channels.CONSOLIDATE_CLIP, () => {
      this.consolidate();
    });

    ipcRenderer.on(channels.MUTE_CLIP, () => {
      this.context!.toggleMuteClip(this.props.clip)
    });
    
    for (let i = 0; i < listeners.length; i++) {
      ipcRenderer.on(listeners[i].channel, listeners[i].handler);
    }

    ipcRenderer.on(channels.CLOSE_CLIP_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.CLOSE_CLIP_CONTEXT_MENU);
      ipcRenderer.removeAllListeners(channels.DELETE_CLIP);
      ipcRenderer.removeAllListeners(channels.DUPLICATE_CLIP);
      ipcRenderer.removeAllListeners(channels.RENAME_CLIP);
      ipcRenderer.removeAllListeners(channels.SPLIT_CLIP);
      ipcRenderer.removeAllListeners(channels.SET_SONG_REGION_TO_CLIP);
      ipcRenderer.removeAllListeners(channels.CONSOLIDATE_CLIP);
      ipcRenderer.removeAllListeners(channels.MUTE_CLIP);

      for (let i = 0; i < listeners.length; i++) {
        ipcRenderer.removeAllListeners(listeners[i].channel);
      }
    })
  }

  onDrag(e : MouseEvent, data : DNRData) {
    this.setGuideLineMargins(data.coords.startX, data.coords.endX, null)
    this.props?.onDrag?.(e, data);

    const el = this.ref.current?.ref.current;

    if (el)
      el.style.top = `${this.props.lanesCtx.draggedClipOffset}px`;
  }

  onDragStart(e : React.MouseEvent, data : DNRData) {
    this.setState({isDragging: true}, () => this.setGuideLineMargins(data.coords.startX, data.coords.endX, null));
    this.context!.setTrackRegion(null);
    this.props.onSelect(this.props.clip);
    this.props.lanesCtx.setDraggedClipEl(this.ref.current?.ref.current);
    this.props?.onDragStart?.(e, data);
  }

  onDragStop(e : MouseEvent, data : DNRData) {
    if (data.deltaWidth != 0) {
      this.moveClipByMargin(data.coords.startX)
    }

    if (this.ref.current?.ref.current) this.ref.current.ref.current.style.transform = "";

    if (
      this.props.lanesCtx.newTrack?.id !== this.props.track.id &&
      this.props.lanesCtx.newTrack?.type === this.props.track.type
    ) {
      const newStartPos = marginToPos(data.coords.startX, this.context!.timelinePosOptions)
      const newClip = clipAtPos(newStartPos, this.props.clip, this.context!.timelinePosOptions);
      this.props.onChangeLane(newClip, this.props.lanesCtx.newTrack);
    }
    
    this.props.lanesCtx.onClipDragStop();    
    this.setState({isDragging: false})

    this.props.onDragStop?.(e, data);
  }

  onKeyDown(e: KeyboardEvent) {
    if (this.context!.selectedClip?.id === this.props.clip.id) {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyC") {
        this.consolidate();
      } else if (e.code === "F2") {
        this.enableRenaming();
      }
    }
  }
  
  onLoop (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    this.setGuideLineMargins(null, null, data.width)
    this.setState({tempLoopWidth: data.width})
    this.props.onLoop?.(e, dir, ref, data);
  }

  onLoopStart(e : React.MouseEvent, dir : ResizeDirection, ref : HTMLElement) {
    this.setState({isLooping: true, tempLoopWidth: ref.offsetWidth}, () => this.setGuideLineMargins(null, null, ref.offsetWidth))
    this.props.onSelect(this.props.clip)
    this.props.onLoopStart?.(e, dir, ref);
  }

  onLoopStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    const options = this.context!.timelinePosOptions
    const {measures, beats, fraction} = TimelinePosition.fromWidth(Math.abs(data.width), options)
    const newClip = copyClip(this.props.clip);
    const newLoopEnd = newClip.end.add(measures, beats, fraction, false, options)
    
    newClip.loopEnd = newLoopEnd.compare(newClip.end) > 0 ? newLoopEnd : null

    this.setState({isLooping: false})

    this.props.setClip(newClip);
    this.props.onLoopStop?.(e, dir, ref, data);
  }

  onResize (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    const options = this.context!.timelinePosOptions
    const totalWidth = TimelinePosition.toWidth(this.props.clip.start, this.props.clip.loopEnd, options)
    const loopWidth = this.getLoopWidth()
    const tempLoopWidth = dir === ResizeDirection.Right ? Math.max(0,totalWidth - ref.offsetWidth) : loopWidth 
    
    if (dir === ResizeDirection.Right) {
      this.setGuideLineMargins(null, data.coords.endX, null)

      if (ref.offsetWidth > totalWidth && this.props.clip.loopEnd) {
        const clip = copyClip(this.props.clip);
        
        clip.loopEnd = null
        this.props.setClip(clip)
      }
    } else {
      this.setGuideLineMargins(data.coords.startX, null, null)
    }

    this.setState({tempWidth: data.width, tempLoopWidth})
    this.props.onResize?.(e, dir, ref, data);
  }

  onResizeStart (e : React.MouseEvent, dir : ResizeDirection, ref : HTMLElement) {
    this.props.onSelect(this.props.clip)

    this.setState({isResizing: true, tempWidth: ref.offsetWidth, tempLoopWidth: this.getLoopWidth()}, () => {
      if (dir === ResizeDirection.Right)
        this.setGuideLineMargins(null, this.props.clip.end.toMargin(this.context!.timelinePosOptions), null)
      else
        this.setGuideLineMargins(this.props.clip.start.toMargin(this.context!.timelinePosOptions), null, null)
    })
    
    this.props.onResizeStart?.(e, dir, ref);
  }

  onResizeStop(e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data : DNRData) {
    this.setState({isResizing: false})

    if (data.deltaWidth != 0) {
      const newClip = copyClip(this.props.clip);
  
      if (dir === ResizeDirection.Left) {
        const newStartPos = marginToPos(data.coords.startX, this.context!.timelinePosOptions)
        newStartPos.snap(this.context!.timelinePosOptions)
        newClip.start = newStartPos
      } else if (dir === ResizeDirection.Right) {
        const newEndPos = marginToPos(data.coords.endX, this.context!.timelinePosOptions)
        newEndPos.snap(this.context!.timelinePosOptions)
        newClip.end = newEndPos 
      }
  
      if (newClip.loopEnd && newClip.end.compare(newClip.loopEnd) >= 0)
        newClip.loopEnd = null
  
      if (newClip.start.compare(newClip.end) >= 0) return
  
      if (newClip.startLimit && newClip.start.compare(newClip.startLimit) <= 0)
        newClip.start.set(newClip.startLimit)
      
      if (newClip.endLimit && newClip.end.compare(newClip.endLimit) >= 0)
        newClip.end.set(newClip.endLimit)
  
      this.props.setClip(newClip)
    }

    this.props.onResizeStop?.(e, dir, ref, data);
  }

  setGuideLineMargins(startX : number | null, endX : number | null, width : number | null) {
    let guideLineMargins : number[] = []

    if (this.state.isDragging) {
      if (startX && endX)
        guideLineMargins = [startX, endX].concat(this.props.clip.loopEnd ? [endX + this.getLoopWidth()] : [])
    } else if (this.state.isResizing) {
      if (!startX && endX)
        guideLineMargins = [endX]
      else if (startX && !endX)
        guideLineMargins = [startX]
    } else if (this.state.isLooping) {
      if (width)
        guideLineMargins = [this.props.clip.end.toMargin(this.context!.timelinePosOptions) + width]
    }

    this.setState({guideLineMargins})
  }

  render() {
    const {snapGridSize, timelinePosOptions, verticalScale} = this.context!
    const bounds = this.getBounds()
    const width = this.state.isResizing ? this.state.tempWidth : 
      TimelinePosition.toWidth(this.props.clip.start, this.props.clip.end, timelinePosOptions)
    const loopWidth = this.state.isResizing || this.state.isLooping ? this.state.tempLoopWidth : this.getLoopWidth()
    const snapWidth = TimelinePosition.fromInterval(snapGridSize).toMargin(timelinePosOptions)
    const threshold = Math.max(2, snapWidth / 4.282);
    const loopOffset = this.getLoopOffset();
    const numRepetitions = Math.max(width ? loopWidth / width : 0, 0)
    const trackForAutomation = this.state.isDragging && this.props.lanesCtx.newTrack ?
      this.props.lanesCtx.newTrack : this.props.track

    return (
      <React.Fragment>  
        <DNR
          bounds={bounds}
          className="clip"
          coords={{
            startX: this.props.clip.start.toMargin(timelinePosOptions), 
            startY: 0, 
            endX: this.props.clip.end.toMargin(timelinePosOptions), 
            endY: 100 * verticalScale
          }}
          disableDragging={this.state.renaming}
          dragAxis={DragAxis.X}
          enableResizing={{left: true, right: true}}
          onClickAway={() => this.props.onClickAway(this.props.clip)}
          onContextMenu={this.onContextMenu}
          onDrag={this.onDrag}
          onDragStart={this.onDragStart}
          onDragStop={this.onDragStop}
          onResize={this.onResize}
          onResizeStart={this.onResizeStart}
          onResizeStop={this.onResizeStop}
          ref={this.ref}
          resizeHandleStyles={{left: {zIndex: 11}, right: {zIndex: 11}}}
          snapGridSize={{horizontal: snapWidth || 0.00001}}
          style={{
            backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 15),
            zIndex: this.props.isSelected ? 10 : 9,
            opacity: this.props.clip.muted ? 0.5 : 1
          }}
        >
          <div
            style={{
              width: Math.max(width + loopWidth - 2, 1), 
              height: 16,  
              backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 15),
              zIndex: 13,
              position: "relative"
            }}
          >
            <div
              className="position-relative col-12" 
              style={{
                height: "100%", 
                backgroundColor: "#ffffff1c", 
                paddingRight: 3, 
                zIndex: 13, 
                borderBottom: "1px solid #0007"
              }}
            >
              {
                this.state.renaming ?
                <MouseDownAwayListener onAway={() => this.confirmName()}>
                  <form 
                    onSubmit={e => {e.preventDefault(); this.confirmName()}} 
                    style={{width: "calc(100% - 16px)", height: 20, display: "flex"}}
                  >
                    <AutoWidthInput 
                      onBlur={this.confirmName}
                      onChange={e => this.setState({name: e.target.value})}
                      ref={this.nameInputRef}
                      style={{
                        fontSize: 13,
                        color: "#000a",
                        fontWeight: "bold",
                        outline: "none",
                        backgroundColor: shadeColor(this.props.isSelected ? "#eee" : this.props.track.color, 10),
                        maxWidth: 400,
                        height: "100%",
                        border: "1px solid #000a",
                        borderRadius: 2,
                        transform: "translate(-2px, -2px)",
                        zIndex: 15,
                        padding: "0 3px"
                      }}
                      value={this.state.name}
                    />
                  </form> 
                </MouseDownAwayListener> :
                <div className="position-relative col-12" style={{height: "100%", overflow: "hidden"}}>
                  <StickyTitle style={{cursor: "text"}}> 
                    <p 
                      className="clip-title"
                      onDoubleClick={this.enableRenaming}
                      style={{
                        fontSize: 13, 
                        color: "#000a", 
                        fontWeight: "bold", 
                        lineHeight: 1.1, 
                        margin: 0,
                        padding: "0 3px",
                        whiteSpace: "nowrap"
                      }}
                      title={this.props.clip.name + (this.props.clip.muted ? " (muted)" : "")}
                    >
                      {this.props.clip.name}{this.props.clip.muted ? " (muted)" : ""}
                    </p>
                  </StickyTitle>
                </div>
              }
            </div>
          </div>
          <div style={{width: "100%", height: 100 * verticalScale - 16, position: "relative"}}>
            {this.props.sprite}
          </div>
          <div className="position-absolute" style={{top: 0, left: -1 - loopOffset}}>
            <DNR 
              constrainToParent={{vertical: false, horizontal: false}}
              coords={{
                startX: (width + loopOffset),
                startY: 0,
                endX: (width + loopOffset) + loopWidth,
                endY: loopWidth > 10 ? 100 * verticalScale : 10
              }}
              disableDragging
              enableResizing={{right: true}}
              minWidth={0}
              onResizeStart={this.onLoopStart}
              onResize={this.onLoop}
              onResizeStop={this.onLoopStop}
              resizeHandleStyles={{right: {zIndex: this.state.renaming ? 12 : 14, cursor: "e-resize"}}}
              snapGridSize={{horizontal: snapWidth || 0.00001}}
              snapThreshold={{horizontal: threshold}}
              style={{cursor: "move"}}
            >
              <div 
                className="position-absolute d-flex overflow-hidden"
                style={{
                  width: loopWidth, 
                  borderRight: loopWidth ? "1px solid var(--border3)" : "none", 
                  height: 100 * verticalScale, 
                  transform: "translateY(-1px)"
                }}
              >
                {
                  [...Array(Math.ceil(numRepetitions))].map((_, i) => (
                    <div 
                      key={i}
                      className="clip-loop"
                      style={{
                        width: width, 
                        height: "100%", 
                        backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 30), 
                        flexShrink: 0,
                        position: "relative",
                        zIndex: -1
                      }}
                    >
                      <div style={{height: 100 * verticalScale - 16, width: "100%", marginTop: 16, position: "relative"}}>
                        {this.props.loopSprite}
                      </div> 
                    </div>
                  ))
                }
              </div>
            </DNR>
          </div>
          <div 
            className="position-absolute pe-none" 
            style={{bottom: 0, left: -1, transform: "translate(0, 100%)"
          }}>
            {
              trackForAutomation.automationEnabled && 
              trackForAutomation.automationLanes.filter(l => l.show).map((l, idx) => {
                const automationSprite = this.props.automationSprite?.(l);

                return (
                  <div 
                    key={idx}
                    style={{
                      display: "flex", 
                      height: l.expanded ? 100 * verticalScale : 25,
                      opacity: 0.3,
                      borderBottom: "1px solid #000b",
                      boxSizing: idx === 0 ? "content-box" : "border-box"
                    }}
                  >
                    <div 
                      style={{
                        width: width, 
                        height: "100%", 
                        backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 45),
                        position: "relative",
                        borderLeft: "1px solid #000b",
                        borderRight: "1px solid #000b"
                      }}
                    >
                      {automationSprite}
                    </div>
                    <div
                      className="d-flex overflow-hidden"
                      style={{top: 0, width: loopWidth, height: "100%"}}
                    >
                      {
                        [...Array(Math.ceil(numRepetitions))].map((_, i) => (
                          <div 
                            key={i}
                            style={{
                              width: width, 
                              height: "100%", 
                              backgroundColor: this.props.isSelected ? "#fff" : shadeColor(this.props.track.color, 45), 
                              flexShrink: 0,
                              borderRight: "1px solid #000b",
                              position: "relative"
                            }}
                          >
                            {automationSprite}
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )
              })
            }
          </div>
        </DNR>
        {
          (this.state.isDragging || this.state.isResizing || this.state.isLooping) &&
          this.state.guideLineMargins.map((m, idx) => <GuideLine key={idx} margin={m} />)
        }
      </React.Fragment>
    )
  }
}

export default React.memo(ClipComponent);