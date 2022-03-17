import React from "react"
import {Cursor, Header, Holdable, KeyListener, Lane, Mixer, RegionComponent, ResizablePane, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import IconButton from "@mui/material/IconButton"
import { Add } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { getBaseTrack, ipcRenderer } from "renderer/utils/utils"
import ResizeDetector from "react-resize-detector"
import hExpand from "../../../assets/svg/h-expand.svg"
import hShrink from "../../../assets/svg/h-shrink.svg"
import vExpand from "../../../assets/svg/v-expand.svg"
import vShrink from "../../../assets/svg/v-shrink.svg"
import cursor from "../../../assets/svg/cursor.svg"
import { TimeSignature } from "renderer/types/types"
import channels from "renderer/utils/channels"

function ZoomButton(props : {vertical: boolean, decrease: boolean, onZoom: () => void}) {
  const getIcon = () => {
    if (props.vertical) {
      return props.decrease ? vShrink : vExpand
    } else {
      return props.decrease ? hShrink : hExpand
    }
  }

  const getTitle = () => {
    if (props.vertical) {
      return props.decrease ? "Zoom Out Vertically" : "Zoom In Vertically"
    } else {
      return props.decrease ? "Zoom Out Horizontally" : "Zoom In Horizontally"
    }
  }

  return (
    <div className="d-flex align-items-center" style={{marginRight: 8}}>
      <Holdable onMouseDown={props.onZoom} interval={100} timeout={500} onHold={props.onZoom}>
        <IconButton title={getTitle()} style={{backgroundColor: "#0003", padding: 4}}>
          <img src={getIcon()} style={{height: 14, opacity: 0.6}} />
        </IconButton>
      </Holdable>
    </div>
  )
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
    ipcRenderer.removeAllListeners()
    
    ipcRenderer.on(channels.TOGGLE_MASTER_TRACK, () => this.context!.setShowMaster(prev => !prev))
    ipcRenderer.on(channels.TOGGLE_MIXER, () => this.context!.setShowMixer(prev => !prev))

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

    if (e.ctrlKey) {
      if (e.shiftKey) {
        this.zoom(false, e.deltaY < 0 ? 0.2406 * hScale : -0.2406 * hScale)
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

      newScale = Math.min(Math.max(this.context!.horizontalScale + amt, 0.026), 25)
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

    const editorWindowHeight = this.editorWindowRef.current ? this.editorWindowRef.current.clientHeight - 45 : 0
    const beatWidth = timelinePosOptions.beatWidth * horizontalScale * (4 / timeSignature.noteValue)
    const measureWidth = beatWidth * timeSignature.beats
    const editorWidth = measureWidth * numMeasures

    const masterTrack = tracks.find(t => t.isMaster)

    return (
      <KeyListener>
        <div className="m-0 p-0" style={{width: "100vw", height: "100vh", position: "relative", outline: "none"}}>
          <Header />
          <div style={{flex: 1, height: "calc(100vh - 70px)", display: "flex", flexDirection: "column"}}>
            <ScrollSync>
              <div onWheel={this.onWheel} style={{flex:1,backgroundColor:"#333",display:"flex",overflow:"hidden"}}>
                <ScrollSyncPane>
                  <div
                    className="hide-vertical-scrollbar scrollbar" 
                    style={{width: 200, height: "100%", overflow: "scroll", flexShrink: 0}}
                  >
                    <div 
                      className="col-12 d-flex align-items-center"
                      style={{position: "sticky", top: 0, height: 45, backgroundColor: "#eee", zIndex: 15, borderBottom: "1px solid #777"}}
                    >
                      <div 
                        className="text-center d-flex align-items-center" 
                        style={{flexDirection: "column", margin: 6, marginLeft: 12}}
                      >
                        <div className="d-flex">
                          <ZoomButton vertical={false} decrease={false} onZoom={() => this.zoom(false, 0.2406 * horizontalScale)} />
                          <ZoomButton vertical={false} decrease onZoom={() => this.zoom(false, -0.2406 * horizontalScale)} />
                          <ZoomButton vertical decrease={false} onZoom={() => this.zoom(true, 0.2)} />
                          <ZoomButton vertical decrease onZoom={() => this.zoom(true, -0.2)} />
                          <IconButton 
                            onClick={this.centerOnCursor} 
                            title="Center on Cursor" 
                            style={{backgroundColor: "#0003", padding: 4}}
                          >
                            <img src={cursor} style={{height: 14, opacity: 0.6}} />
                          </IconButton>
                        </div>
                      </div>
                      <div style={{marginLeft: "auto", marginRight: 8}}>
                        <IconButton onClick={this.addTrack} className="p-1" style={{backgroundColor: "#ff6db8"}}>
                          <Add style={{fontSize: 18, color: "#fff"}} />
                        </IconButton>
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
                        <div style={{position: "sticky", top: 0, width: "100%", height: 45, zIndex: 15, backgroundColor: "#eee"}}>
                          <div style={{width: "100%", height: 12, backgroundColor: "#aaa"}}>
                            <RegionComponent 
                              highlight
                              highlightStyle={{height: trackLanesWindowHeight - 12, backgroundColor: "#fff", opacity: 0.15}}
                              onDelete={() => setSongRegion(null)} 
                              onSetRegion={(region) => setSongRegion(region)} 
                              region={songRegion} 
                              regionStyle={{backgroundColor: isLooping ? "var(--color-primary)" : "#fff7"}}
                            />
                          </div>
                          <Cursor ref={this.cursorRef} pos={cursorPos} height={trackLanesWindowHeight - 35} /> 
                          <TimelineComponent 
                            ref={this.timelineRef} 
                            style={{height: 33}} 
                            width={this.state.editorWindowWidth} 
                            window={this.editorWindowRef.current}
                          />
                        </div>
                        <div style={{width: "100%", minHeight: editorWindowHeight}}>
                          {
                            tracks.map((track, idx) => (
                              <Lane key={idx} style={{backgroundColor: "#ccc", borderBottom: "1px solid #0002"}} track={track} />
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
    )
  }
}