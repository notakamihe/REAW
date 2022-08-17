import React from "react"
import {Cursor, Header, DirectionalScrollListener, KeyListener, Lane, Mixer, RegionComponent, ResizablePane, TimelineComponent, TrackComponent, ZoomControls} from "renderer/components"
import {SyncScroll, SyncScrollPane} from "../components/SyncScroll"
import IconButton from "@mui/material/IconButton"
import { GraphicEq, Piano } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { getBaseTrack, ipcRenderer, marginToPos } from "renderer/utils/utils"
import ResizeDetector from "react-resize-detector"
import { Clip, Track, TrackType } from "renderer/types/types"
import channels from "renderer/utils/channels"
import { CursorIcon, StepSequencerIcon } from "renderer/components/icons"
import { PreferencesContext } from "renderer/context/PreferencesContext"
import { SpeedDial } from "renderer/components/ui"
import { SpeedDialIcon } from "@mui/material"
import TimelinePosition from "renderer/types/TimelinePosition"
import { LanesContext, LanesProvider } from "renderer/context/LanesContext"
import { v4 } from "uuid"
import {Buffer} from "buffer"

const MenuListener = (props : {children : React.ReactNode}) => {
  const wc = React.useContext(WorkstationContext)
  const pc = React.useContext(PreferencesContext)

  React.useEffect(() => {
    ipcRenderer.removeAllListeners()

    ipcRenderer.on(channels.OPEN_PREFERENCES, () => pc!.setShowPreferences(true))

    ipcRenderer.on(channels.TOGGLE_MASTER_TRACK, () => wc!.setShowMaster(prev => !prev))
    ipcRenderer.on(channels.TOGGLE_MIXER, () => wc!.setShowMixer(prev => !prev))
  }, [])

  return <React.Fragment>{props.children}</React.Fragment>
}


interface IProps {
}

interface IState {
  draggingValidFiles: boolean;
  dropzoneActive: boolean;
  editorWindowWidth: number;
  horizontalScale: number;
  prevTracks: Track[];
  tracksHeight: number;
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private cursorRef : React.RefObject<HTMLDivElement>;
  private editorRef : React.RefObject<HTMLDivElement>;
  private editorWindowRef : React.RefObject<HTMLDivElement>;
  newClipStartMarkerRef: React.RefObject<HTMLDivElement>;
  private timelineRef : React.RefObject<TimelineComponent>;
  
  counter = 0;
  cursorInWindow = false;
  droppingFile = false;
  preventHide = false;
  
  constructor(props : any) {
    super(props)

    this.cursorRef = React.createRef();
    this.editorRef = React.createRef();
    this.editorWindowRef = React.createRef();
    this.newClipStartMarkerRef = React.createRef();
    this.timelineRef = React.createRef();
    
    this.state = {
      draggingValidFiles: false,
      dropzoneActive: false,
      editorWindowWidth: 0,
      horizontalScale: 1,
      prevTracks: [],
      tracksHeight: 0
    }

    this.addTrack = this.addTrack.bind(this);
    this.centerOnCursor = this.centerOnCursor.bind(this);
    this.handleDragEnter = this.handleDragEnter.bind(this);
    this.handleDragLeave = this.handleDragLeave.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.handleDropzoneDragEnter = this.handleDropzoneDragEnter.bind(this);
    this.handleDropzoneDragLeave = this.handleDropzoneDragLeave.bind(this);
    this.handleDropzoneDragOver = this.handleDropzoneDragOver.bind(this);
    this.handleDropzoneDrop = this.handleDropzoneDrop.bind(this);
    this.onEditorWindowHorizontalScroll = this.onEditorWindowHorizontalScroll.bind(this);
    this.onWheel = this.onWheel.bind(this);
    this.onZoom = this.onZoom.bind(this);
  }

  componentDidMount() {
    document.body.addEventListener("dragenter", this.handleDragEnter);
    document.body.addEventListener("dragleave", this.handleDragLeave);
    document.body.addEventListener("drop", this.handleDrop);

    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          this.timelineRef.current?.drawTimeline();
        }
      });
    });
    
    observer.observe(document.body, {attributes: true});
  }

  componentDidUpdate(prevProps : IProps, prevState: IState) {
    if (this.state.horizontalScale != this.context!.timelinePosOptions.horizontalScale) {
      if (this.cursorInWindow) {
        this.centerOnCursor();
        this.cursorInWindow = false;
      }

      this.setState({horizontalScale: this.context!.timelinePosOptions.horizontalScale});
    }

    if (this.context!.tracks !== this.state.prevTracks) {
      if (this.context!.tracks.length > this.state.prevTracks.length) {
        this.editorWindowRef.current!.scrollTop = this.editorWindowRef.current!.scrollHeight;
      }

      if (this.droppingFile) {
        this.droppingFile = false;
        this.counter = 0;
        this.setState({dropzoneActive: false, draggingValidFiles: false});
      }

      this.setState({prevTracks: this.context!.tracks});
    }
  }
  
  componentWillUnmount() {
    document.body.removeEventListener("dragenter", this.handleDragEnter);
    document.body.removeEventListener("dragleave", this.handleDragLeave);
    document.body.removeEventListener("drop", this.handleDrop);
  }

  addTrack(type: TrackType) {
    const newTrack : Track = getBaseTrack()

    newTrack.name = `Track ${this.context!.tracks.filter(t => !t.isMaster).length + 1}`
    newTrack.type = type;

    this.context!.setTracks([...this.context!.tracks, newTrack])
  }

  centerOnCursor() {
    const cursorEl = this.cursorRef.current
    const editorWindowEl = this.editorWindowRef.current

    if (editorWindowEl && cursorEl) {
      editorWindowEl.scrollLeft = cursorEl.offsetLeft - editorWindowEl.clientWidth * 0.5;
    }
  }

  handleDragEnter(e: DragEvent) {
    if (this.counter++ === 0) {
      if (e.dataTransfer) {
        const editorWindowEl = this.editorWindowRef.current!;
        const atBottom = editorWindowEl.scrollHeight - editorWindowEl.scrollTop === editorWindowEl.clientHeight;
        const items = Array.from(e.dataTransfer.items).filter(i => i.type.split("/")[0] === "audio");
        
        this.setState({draggingValidFiles: items.length > 0}, () => {
           if (atBottom)
            editorWindowEl.scrollTop = editorWindowEl.scrollHeight;
        });
      }
    }
  }

  handleDragLeave(e: DragEvent) {
    if (--this.counter === 0) {
      this.setState({draggingValidFiles: false});
    }
  }

  handleDrop(e: DragEvent) {
    if (!this.droppingFile) {
      this.droppingFile = true;
    }
  }

  handleDropzoneDragEnter(e: React.DragEvent) {
    if (this.state.dropzoneActive)
      this.preventHide = true;

    this.setState({dropzoneActive: this.state.draggingValidFiles});
  }

  handleDropzoneDragLeave(e: React.DragEvent) {
    if (!this.preventHide)
      this.setState({dropzoneActive: false});
    else
      this.preventHide = false;
  }

  handleDropzoneDragOver(e: React.DragEvent) {
    e.stopPropagation();
    e.preventDefault();

    if (this.state.dropzoneActive) {
      e.dataTransfer.dropEffect = "copy";
  
      const snapWidth = TimelinePosition.fromInterval(this.context!.snapGridSize).toMargin(this.context!.timelinePosOptions) || 0.00001;
      let newMargin;

      if (e.nativeEvent.x > this.editorWindowRef.current!.getBoundingClientRect().left) {
        newMargin = snapWidth * Math.round((e.clientX - e.currentTarget.getBoundingClientRect().left) / snapWidth);
      } else {
        newMargin = 0;
      }

      this.newClipStartMarkerRef.current!.style.left = `${newMargin}px`;
    } else {
      e.dataTransfer.dropEffect = "none";
    }
  }

  async handleDropzoneDrop(e: React.DragEvent) {
    const markerEl = this.newClipStartMarkerRef.current!;
    const pos = marginToPos(markerEl.offsetLeft, this.context!.timelinePosOptions);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.split("/")[0] === "audio");

    if (files) {
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

          const track: Track = getBaseTrack();

          track.name = name;
          track.clips = [
            {
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
            } as Clip
          ]
    
          this.context!.setTracks([...this.context!.tracks, track]);
          audio.remove();
        })
      }
    }
  }

  onEditorWindowHorizontalScroll(e: React.UIEvent, horizontal: boolean, prevScrollLeft: number) {
    this.timelineRef.current?.drawTimeline();
    document.dispatchEvent(new CustomEvent("on-editor-window-scroll", {detail: {horizontal}}));
  }

  onWheel(e : React.WheelEvent) {
    const hScale = this.state.horizontalScale

    if (e.ctrlKey || e.metaKey) {
      if (e.shiftKey) {
        const amt = e.deltaY < 0 ? 0.1 * hScale : -0.1 * hScale;

        this.context!.setHorizontalScale(Math.min(Math.max(this.context!.horizontalScale + amt, 0.013), 25));
        this.onZoom(false);
      } else {
        this.context!.setVerticalScale(Math.min(Math.max(this.context!.verticalScale + (e.deltaY > 0 ? -0.1 : 0.1), 0.6), 5));
      }
    }
  }

  onZoom(vertical : boolean) {
    if (!vertical) {
      const cursorEl = this.cursorRef.current
      const editorWindowEl = this.editorWindowRef.current

      if (editorWindowEl && cursorEl) {
        const cursorRect = cursorEl.getBoundingClientRect()
        const editorWindowRect = editorWindowEl.getBoundingClientRect()

        this.cursorInWindow = cursorRect.left >= editorWindowRect.left && cursorRect.right <= editorWindowRect.right;
      }
    }
  }

  render() {
    const {
      cursorPos, 
      horizontalScale, 
      mixerHeight,
      numMeasures,
      setMixerHeight,
      setSongRegion,
      showMixer, 
      songRegion, 
      isLooping,
      timelinePosOptions,
      timeSignature,
      tracks, 
      verticalScale
    } = this.context!

    const editorWindowHeight = this.editorWindowRef.current?.clientHeight || 0
    const beatWidth = timelinePosOptions.beatWidth * horizontalScale * (4 / timeSignature.noteValue)
    const measureWidth = beatWidth * timeSignature.beats
    const editorWidth = measureWidth * numMeasures

    const cursorHeight = Math.max(editorWindowHeight - 12, this.state.tracksHeight);
    const dropzoneHeight = Math.max(editorWindowHeight - this.state.tracksHeight - 33, 100 * verticalScale);

    const masterTrack = tracks.find(t => t.isMaster);
    const dropzoneTrack: Track = {...getBaseTrack(), name: "", color: "var(--bg11)"};

    return (
      <MenuListener>
        <KeyListener>
          <div className="m-0 p-0" style={{width: "100vw", height: "100vh", position: "relative", outline: "none"}}>
            <Header />
            <div style={{flex: 1, height: "calc(100vh - 45px)", display: "flex", flexDirection: "column"}}>
              <SyncScroll>
                <div 
                  onWheel={this.onWheel} 
                  style={{flex: 1, backgroundColor: "var(--bg1)",display: "flex",overflow: "hidden", position: "relative"}}
                >
                  <SyncScrollPane>
                    <div
                      className="hide-vertical-scrollbar scrollbar" 
                      style={{width: 200, height: "100%", overflow: "scroll", flexShrink: 0, borderRight: "1px solid var(--border1)", boxSizing: "content-box"}}
                    >
                      <div 
                        className="col-12 d-flex align-items-center"
                        style={{position: "sticky", top: 0, height: 33, backgroundColor: "var(--bg2)", zIndex: 15, borderBottom: "1px solid var(--border1)"}}
                      >
                        <div className="d-flex align-items-center" style={{margin: 6, marginLeft: 4, marginTop: 4, width: "100%"}}>
                          <div style={{flex: 1, textAlign: "left"}}>
                            <SpeedDial 
                              actionsContainerStyle={{
                                border: "1px solid var(--color1)", 
                                transform: "translate(calc(100% - 9px), calc(-50% + 1px))", 
                                borderRadius: "0 15px 15px 0", 
                                height: 24,
                                paddingLeft: 9
                              }}
                              direction="right" 
                              icon={<SpeedDialIcon style={{fontSize: 18, color: "var(--bg9)", transform: "translateY(-3px)"}} />}
                              style={{backgroundColor: "var(--color1)", width: 24, height: 24}}
                            >
                              <IconButton 
                                className="h-btn1"
                                onClick={() => this.addTrack(TrackType.Audio)}
                                style={{padding: 0, width: 22, height: 22, backgroundColor: "#0000", margin: "0 4px"}}
                                title="Create Audio Track"
                              >
                                <GraphicEq style={{fontSize: 18, color: "var(--color1)"}} />
                              </IconButton>
                              <IconButton 
                                className="h-btn1"
                                onClick={() => this.addTrack(TrackType.Midi)}
                                style={{padding: 0, width: 22, height: 22, backgroundColor: "#0000", margin: "0 4px"}}
                                title="Create MIDI Track"
                              >
                                <Piano style={{fontSize: 18, color: "var(--color1)"}} />
                              </IconButton>
                              <IconButton 
                                className="h-btn1"
                                onClick={() => this.addTrack(TrackType.StepSequencer)}
                                style={{padding: 0, width: 22, height: 22, backgroundColor: "#0000", margin: "0 10px 0 4px"}}
                                title="Create Step Sequencer Track"
                              >
                                <StepSequencerIcon iconStyle={{size: 14, color: "var(--color1)"}} />
                              </IconButton>
                            </SpeedDial>
                          </div>
                          <IconButton className="btn1 h-btn1" onClick={this.centerOnCursor} style={{transform: "translateY(1px)"}} title="Center on Cursor">
                            <CursorIcon iconStyle={{size: 14, color: "var(--border7)"}} />
                          </IconButton>
                        </div>
                      </div>
                      <div style={{width: "100%", minHeight: "calc(100% - 33px)"}}>
                        {masterTrack && <TrackComponent track={masterTrack} />}
                        {tracks.filter(t => !t.isMaster).map((t, i) => <TrackComponent key={t.id} order={i + 1} track={t} />)}
                        {
                          this.state.draggingValidFiles &&
                          <div 
                            onDragEnter={this.handleDropzoneDragEnter}
                            onDragOver={this.handleDropzoneDragOver}
                            onDragLeave={this.handleDropzoneDragLeave}
                            onDrop={this.handleDropzoneDrop}
                            style={{width: "100%", minHeight: dropzoneHeight}}
                          >
                            {
                              this.state.dropzoneActive &&
                              <div style={{pointerEvents: "none"}}>
                                <TrackComponent className="muted-track" track={dropzoneTrack} />
                              </div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </SyncScrollPane>
                  <ResizeDetector handleWidth onResize={(w, h) => this.setState({editorWindowWidth: w || 0})}>
                    <div style={{flex: 1, position: "relative", overflow: "hidden", height: "100%"}}>
                      <SyncScrollPane>
                        <DirectionalScrollListener onScroll={this.onEditorWindowHorizontalScroll}>
                          <div 
                            id="timeline-editor-window"
                            className="scrollbar thin-thumb2"
                            ref={this.editorWindowRef}
                            style={{width: "100%", height: "100%", overflow: "scroll"}}
                          >
                            <div 
                              id="timeline-editor"
                              ref={this.editorRef} 
                              style={{width: editorWidth, minWidth: "100%", position: "relative"}}
                            >
                              <div style={{position: "sticky", top: 0, width: "100%", height: 33, zIndex: 15, backgroundColor: "var(--bg2)"}}>
                                <div style={{width: "100%", height: 12, backgroundColor: "#0000", borderBottom: "1px solid var(--border1)"}}>
                                  <RegionComponent 
                                    highlight
                                    highlightStyle={{height: cursorHeight, backgroundColor: "var(--bg11)"}}
                                    onDelete={() => setSongRegion(null)} 
                                    onSetRegion={(region) => setSongRegion(region)} 
                                    region={songRegion} 
                                    regionStyle={{backgroundColor: isLooping ? "var(--color1)" : "var(--bg8)"}}
                                  />
                                </div>
                                <Cursor ref={this.cursorRef} pos={cursorPos} height={cursorHeight} /> 
                                <TimelineComponent 
                                  gridHeight={editorWindowHeight - 33}
                                  ref={this.timelineRef} 
                                  style={{height: 21}} 
                                  width={this.state.editorWindowWidth - 9} 
                                  window={this.editorWindowRef.current}
                                />
                              </div>
                              <ResizeDetector handleHeight onResize={(w, h) => this.setState({tracksHeight: h || 0})}>
                                <LanesProvider>
                                  <LanesContext.Consumer>
                                    {
                                      (value) => (
                                        <div style={{width: "100%"}}>
                                          {
                                            tracks.map((track, idx) => (
                                              <Lane ctx={value!} key={idx} track={track} />
                                            ))
                                          }
                                        </div>
                                      )
                                    }
                                  </LanesContext.Consumer>
                                </LanesProvider>
                              </ResizeDetector>
                              <div 
                                onDragEnter={this.handleDropzoneDragEnter}
                                onDragOver={this.handleDropzoneDragOver}
                                onDragLeave={this.handleDropzoneDragLeave}
                                onDrop={this.handleDropzoneDrop}
                                style={{
                                  width: "100%", 
                                  minHeight: dropzoneHeight,
                                  display: this.state.draggingValidFiles ? "block" : "none"
                                }}
                              >
                                <div
                                  className="pe-none position-relative col-12"
                                  style={{
                                    height: 100 * verticalScale,
                                    backgroundColor: "var(--bg5)", 
                                    borderBottom: "1px solid var(--border2)",
                                    display: this.state.dropzoneActive ? "block" : "none"
                                  }}
                                >
                                  <div
                                    className="position-absolute"
                                    ref={this.newClipStartMarkerRef}
                                    style={{backgroundColor: "var(--color1)", height: "100%", width: 1}}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DirectionalScrollListener>
                      </SyncScrollPane>
                      <ZoomControls disabled={this.state.draggingValidFiles} onZoom={this.onZoom} />
                    </div>
                  </ResizeDetector>
                </div>
              </SyncScroll>
              {
                showMixer &&
                <ResizablePane 
                  maxHeight={450} 
                  minHeight={220} 
                  onResizeStop={(e, data) => setMixerHeight(data.height!)}
                  resizeDirection="top"
                  size={{height: mixerHeight}}
                >
                  <Mixer />
                </ResizablePane>
              }
            </div>
          </div>
        </KeyListener>
      </MenuListener>
    )
  }
}