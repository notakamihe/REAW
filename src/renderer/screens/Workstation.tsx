import React from "react"
import {Cursor, Header, HorizontalScrollListener, KeyListener, Lane, Mixer, RegionComponent, ResizablePane, TimelineComponent, TrackComponent, ZoomControls} from "renderer/components"
import {SyncScroll, SyncScrollPane} from "../components/SyncScroll"
import IconButton from "@mui/material/IconButton"
import { GraphicEq, Piano } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { getBaseTrack, ipcRenderer } from "renderer/utils/utils"
import ResizeDetector from "react-resize-detector"
import { TimeSignature, Track, TrackType } from "renderer/types/types"
import channels from "renderer/utils/channels"
import { CursorIcon, StepSequencerIcon } from "renderer/components/icons"
import { PreferencesContext } from "renderer/context/PreferencesContext"
import { SpeedDial } from "renderer/components/ui"
import { SpeedDialIcon } from "@mui/material"

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
  editorWindowWidth: number
  horizontalScale : number
  timeSignature : TimeSignature | null,
  tracksLength : number
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private centerOnCursorRef : React.MutableRefObject<boolean>
  private cursorRef : React.RefObject<HTMLDivElement>
  private event: Event;
  private editorRef : React.RefObject<HTMLDivElement>
  private editorWindowRef : React.RefObject<HTMLDivElement>
  private timelineRef : React.RefObject<TimelineComponent>
  private timeSignatureChangedRef : React.MutableRefObject<boolean>
  
  constructor(props : any) {
    super(props)

    this.centerOnCursorRef = React.createRef() as React.MutableRefObject<boolean>
    this.cursorRef = React.createRef()
    this.event = new Event("on-editor-window-scroll");
    this.editorRef = React.createRef()
    this.editorWindowRef = React.createRef()
    this.timelineRef = React.createRef()
    this.timeSignatureChangedRef = React.createRef() as React.MutableRefObject<boolean>
    
    this.state = {
      editorWindowWidth: 0,
      horizontalScale: 1,
      timeSignature: null,
      tracksLength: 0
    }

    this.addTrack = this.addTrack.bind(this)
    this.centerOnCursor = this.centerOnCursor.bind(this)
    this.onEditorWindowHorizontalScroll = this.onEditorWindowHorizontalScroll.bind(this)
    this.onWheel = this.onWheel.bind(this)
    this.onZoom = this.onZoom.bind(this)
  }

  componentDidMount() {
    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          this.timelineRef.current?.drawTimeline();
        }
      });
    });
    
    observer.observe(document.body, {attributes: true});

    this.setState({tracksLength: this.context!.tracks.length})
  }

  componentDidUpdate(prevProps : IProps) {
    if (this.editorRef.current && this.context!.trackLanesWindowHeight !== this.editorRef.current.clientHeight) {
      this.context!.setTrackLanesWindowHeight(this.editorRef.current.clientHeight)
    }

    if (this.state.horizontalScale != this.context!.horizontalScale) {
      this.setState({horizontalScale: this.context!.horizontalScale}, () => {
        if (this.centerOnCursorRef.current) {
          this.centerOnCursor()
          this.centerOnCursorRef.current = false
        }
      })
    }

    if (this.state.timeSignature !== this.context!.timeSignature) {
      this.setState({timeSignature: this.context!.timeSignature})
      this.timeSignatureChangedRef.current = true
    }

    if (this.context!.tracks.length !== this.state.tracksLength) {
      this.setState({tracksLength: this.context!.tracks.length})

      if (this.context!.tracks.length > this.state.tracksLength) {
        this.editorWindowRef.current!.scrollTop = this.editorWindowRef.current!.scrollHeight
      }
    }
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
      editorWindowEl.scroll({left: cursorEl.offsetLeft - editorWindowEl.clientWidth * 0.5})
    }
  }

  onEditorWindowHorizontalScroll(e: React.UIEvent, prevScrollLeft: number) {
    this.timelineRef.current?.drawTimeline();
    document.dispatchEvent(this.event);

    if (this.timeSignatureChangedRef.current) {
      if (this.editorWindowRef.current)
        this.editorWindowRef.current.scrollLeft = prevScrollLeft;

      this.timeSignatureChangedRef.current = false;
    }
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
  
        this.centerOnCursorRef.current = cursorRect.left >= editorWindowRect.left && cursorRect.right <= editorWindowRect.right
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
      trackLanesWindowHeight, 
      tracks, 
    } = this.context!

    const editorWindowHeight = this.editorWindowRef.current?.clientHeight || 0
    const beatWidth = timelinePosOptions.beatWidth * horizontalScale * (4 / timeSignature.noteValue)
    const measureWidth = beatWidth * timeSignature.beats
    const editorWidth = measureWidth * numMeasures

    const masterTrack = tracks.find(t => t.isMaster)

    return (
      <MenuListener>
        <KeyListener>
          <div className="m-0 p-0" style={{width: "100vw", height: "100vh", position: "relative", outline: "none"}}>
            <Header />
            <div style={{flex: 1, height: "calc(100vh - 45px)", display: "flex", flexDirection: "column"}}>
              <SyncScroll>
                <div onWheel={this.onWheel} style={{flex:1,backgroundColor:"var(--bg1)",display:"flex",overflow:"hidden"}}>
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
                      <div style={{width: "100%"}}>
                        {masterTrack && <TrackComponent track={masterTrack} />}
                        {tracks.filter(t => !t.isMaster).map((t, i) => <TrackComponent key={t.id} order={i + 1} track={t} />)}
                      </div>
                    </div>
                  </SyncScrollPane>
                  <ResizeDetector handleWidth onResize={(w, h) => this.setState({editorWindowWidth: w || 0})}>
                    <div style={{flex: 1, position: "relative", overflow: "hidden", height: "100%"}}>
                      <SyncScrollPane>
                        <HorizontalScrollListener onScroll={this.onEditorWindowHorizontalScroll}>
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
                                    highlightStyle={{height: trackLanesWindowHeight - 12, backgroundColor: "#fff", opacity: 0.15}}
                                    onDelete={() => setSongRegion(null)} 
                                    onSetRegion={(region) => setSongRegion(region)} 
                                    region={songRegion} 
                                    regionStyle={{backgroundColor: isLooping ? "var(--color1)" : "var(--bg8)"}}
                                  />
                                </div>
                                <Cursor ref={this.cursorRef} pos={cursorPos} height={Math.max(editorWindowHeight - 12, trackLanesWindowHeight - 12)} /> 
                                <TimelineComponent 
                                  gridHeight={editorWindowHeight - 33}
                                  ref={this.timelineRef} 
                                  style={{height: 21}} 
                                  width={this.state.editorWindowWidth - 9} 
                                  window={this.editorWindowRef.current}
                                />
                              </div>
                              <div style={{width: "100%", minHeight: editorWindowHeight - 45}}>
                                {
                                  tracks.map((track, idx) => (
                                    <Lane key={idx} style={{backgroundColor: "var(--bg5)", borderBottom: "1px solid var(--border2)"}} track={track} />
                                  ))
                                }
                              </div>
                            </div>
                          </div>
                        </HorizontalScrollListener>
                      </SyncScrollPane>
                      <ZoomControls onZoom={this.onZoom} />
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