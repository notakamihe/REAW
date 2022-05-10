import React from "react"
import {Cursor, Header, Holdable, KeyListener, Lane, Mixer, RegionComponent, ResizablePane, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import IconButton from "@mui/material/IconButton"
import { Add } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { getBaseTrack, ipcRenderer } from "renderer/utils/utils"
import ResizeDetector from "react-resize-detector"
import { TimeSignature } from "renderer/types/types"
import channels from "renderer/utils/channels"
import { CursorIcon, HExpand, HShrink, VExpand, VShrink } from "renderer/components/icons"
import { PreferencesContext } from "renderer/context/PreferencesContext"

function ZoomButton(props : {vertical: boolean, decrease: boolean, onZoom: () => void}) {
  const getTitle = () => {
    if (props.vertical) {
      return props.decrease ? "Zoom Out Vertically" : "Zoom In Vertically"
    } else {
      return props.decrease ? "Zoom Out Horizontally" : "Zoom In Horizontally"
    }
  }

  const style = {size: 14, color: "var(--border7)"}

  return (
    <div className="d-flex align-items-center" style={{marginRight: 8}}>
      <Holdable onMouseDown={props.onZoom} interval={100} timeout={500} onHold={props.onZoom}>
        <IconButton title={getTitle()} className="btn1 h-btn1">
          {
            props.vertical ? 
              props.decrease ? <VShrink iconStyle={style} /> : <VExpand iconStyle={style} /> :
              props.decrease ? <HShrink iconStyle={style} /> : <HExpand iconStyle={style} />
          }
        </IconButton>
      </Holdable>
    </div>
  )
}

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
  private editorRef : React.RefObject<HTMLDivElement>
  private editorWindowRef : React.RefObject<HTMLDivElement>
  private timelineRef : React.RefObject<TimelineComponent>
  private timeSignatureChangedRef : React.MutableRefObject<boolean>
  
  constructor(props : any) {
    super(props)

    this.centerOnCursorRef = React.createRef() as React.MutableRefObject<boolean>
    this.cursorRef = React.createRef()
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
    this.onWheel = this.onWheel.bind(this)
  }

  componentDidMount() {
    let ticking = false
    let lastScrollLeft = 0

    this.editorWindowRef.current?.addEventListener("scroll", () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (this.editorWindowRef.current) {
            let scrollLeft = this.editorWindowRef.current.scrollLeft

            if (this.timeSignatureChangedRef.current) {
              scrollLeft = lastScrollLeft
              this.editorWindowRef.current.scrollLeft = scrollLeft
              this.timelineRef.current?.drawTimeline()
              this.timeSignatureChangedRef.current = false
            }

            if (lastScrollLeft !== scrollLeft) {
              lastScrollLeft = scrollLeft
              this.timelineRef.current?.drawTimeline()
            }
  
            ticking = false
          }
        })

        ticking = true
      }
    })

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

  componentWillUnmount() {
    this.editorWindowRef.current?.removeEventListener("scroll", () => {})
  }

  addTrack() {
    const newTrack : Track = getBaseTrack()
    newTrack.name = `Track ${this.context!.tracks.filter(t => !t.isMaster).length + 1}`

    this.context!.setTracks([...this.context!.tracks, newTrack])
  }

  centerOnCursor() {
    const cursorEl = this.cursorRef.current
    const editorWindowEl = this.editorWindowRef.current

    if (editorWindowEl && cursorEl) {
      editorWindowEl.scroll({left: cursorEl.offsetLeft - editorWindowEl.clientWidth * 0.5})
    }
  }

  onWheel(e : React.WheelEvent) {
    const hScale = this.state.horizontalScale

    if (e.ctrlKey || e.metaKey) {
      if (e.shiftKey) {
        this.zoom(false, e.deltaY < 0 ? 0.1 * hScale : -0.1 * hScale)
      } else {
        this.zoom(true, e.deltaY > 0 ? -0.1 : 0.1)
      }
    }
  }

  zoom(vertical : boolean, amt : number) {
    let newScale

    if (vertical) {
      newScale = Math.min(Math.max(this.context!.verticalScale + amt, 0.6), 5)
      this.context!.setVerticalScale(newScale)
    } else {
      const cursorEl = this.cursorRef.current
      const editorWindowEl = this.editorWindowRef.current

      if (editorWindowEl && cursorEl) {
        const cursorRect = cursorEl.getBoundingClientRect()
        const editorWindowRect = editorWindowEl.getBoundingClientRect()

        this.centerOnCursorRef.current = cursorRect.left >= editorWindowRect.left && cursorRect.right <= editorWindowRect.right
      }

      newScale = Math.min(Math.max(this.context!.horizontalScale + amt, 0.013), 25)
      this.context!.setHorizontalScale(newScale)
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
              <ScrollSync>
                <div onWheel={this.onWheel} style={{flex:1,backgroundColor:"var(--bg1)",display:"flex",overflow:"hidden"}}>
                  <ScrollSyncPane>
                    <div
                      className="hide-vertical-scrollbar scrollbar" 
                      style={{width: 200, height: "100%", overflow: "scroll", flexShrink: 0, borderRight: "1px solid var(--border1)", boxSizing: "content-box"}}
                    >
                      <div 
                        className="col-12 d-flex align-items-center"
                        style={{position: "sticky", top: 0, height: 33, backgroundColor: "var(--bg2)", zIndex: 15, borderBottom: "1px solid var(--border1)"}}
                      >
                        <div 
                          className="text-center d-flex align-items-center" 
                          style={{flexDirection: "column", margin: 6, marginLeft: 8}}
                        >
                          <div className="d-flex">
                            <ZoomButton vertical={false} decrease={false} onZoom={() => this.zoom(false, 0.1 * horizontalScale)} />
                            <ZoomButton vertical={false} decrease onZoom={() => this.zoom(false, -0.1 * horizontalScale)} />
                            <ZoomButton vertical decrease={false} onZoom={() => this.zoom(true, 0.2)} />
                            <ZoomButton vertical decrease onZoom={() => this.zoom(true, -0.2)} />
                            <IconButton className="btn1 h-btn1" onClick={this.centerOnCursor} title="Center on Cursor">
                              <CursorIcon iconStyle={{size: 14, color: "var(--border7)"}} />
                            </IconButton>
                            <IconButton onClick={this.addTrack} style={{backgroundColor: "var(--color1)", height: 22, width: 22, marginLeft: 20}}>
                              <Add style={{fontSize: 18, color: "#fff"}} />
                            </IconButton>
                          </div>
                        </div>
                      </div>
                      <div style={{width: "100%"}}>
                        {masterTrack && <TrackComponent track={masterTrack} />}
                        {tracks.filter(t => !t.isMaster).map((t, i) => <TrackComponent key={t.id} order={i + 1} track={t} />)}
                      </div>
                  </div>
                  </ScrollSyncPane>
                  <ScrollSyncPane>
                    <ResizeDetector handleWidth onResize={(w, h) => this.setState({editorWindowWidth: w || 0})}>
                      <div 
                        className="scrollbar thin-thumb2" 
                        ref={this.editorWindowRef}
                        style={{flex: 1, overflow: "scroll overlay", position: "relative", height: "100%"}}
                      >
                        <div 
                          id="timeline-editor" 
                          ref={this.editorRef} 
                          style={{width: editorWidth, minWidth: "100%"}}
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
                              width={this.state.editorWindowWidth} 
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
                    </ResizeDetector>
                  </ScrollSyncPane>
                </div>
              </ScrollSync>
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