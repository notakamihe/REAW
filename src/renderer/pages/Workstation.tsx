import React from "react"
import {Cursor, Header, Holdable, KeyListener, Lane, RegionComponent, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import {faArrowsAltH, faArrowsAltV} from "@fortawesome/free-solid-svg-icons"
import IconButton from "@mui/material/IconButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Add, Remove } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { getBaseTrack } from "renderer/utils/utils"

function ZoomButton(props : {vertical: boolean, decrease: boolean, onZoom: () => void}) {
  return (
    <div className="d-flex align-items-center" style={{marginRight: 8}}>
      <FontAwesomeIcon icon={props.vertical ? faArrowsAltV : faArrowsAltH} style={{margin:0, fontSize: 14}} />
      <Holdable
        onMouseDown={props.onZoom}
        interval={100}
        timeout={500}
        onHold={props.onZoom}
      >
        <IconButton className="p-0">
          {
            props.decrease ?
              <Remove style={{fontSize: 18, marginLeft: 0}} /> : <Add style={{fontSize: 18, marginLeft: 0}} />  
          }
        </IconButton>
      </Holdable>
    </div>
  )
}


interface IProps {
}

interface IState {
  editorWidth : number
  editorWindowWidth: number
  horizontalScale : number
  centerZoomOnCursor: boolean
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private cursorRef : React.RefObject<HTMLDivElement>
  private editorRef : React.RefObject<HTMLDivElement>
  private editorWindowRef : React.RefObject<HTMLDivElement>
  
  constructor(props : any) {
    super(props)

    this.cursorRef = React.createRef()
    this.editorRef = React.createRef()
    this.editorWindowRef = React.createRef()
    
    this.state = {
      editorWidth: 10000,
      editorWindowWidth: 900,
      horizontalScale: 1,
      centerZoomOnCursor: false
    }

    this.addTrack = this.addTrack.bind(this)
    this.onWheel = this.onWheel.bind(this)
  }

  componentDidUpdate() {
    if (this.editorRef.current && this.context!.trackLanesWindowHeight !== this.editorRef.current.clientHeight) {
      this.context!.setTrackLanesWindowHeight(this.editorRef.current.clientHeight)
    }

    if (this.state.horizontalScale != this.context!.horizontalScale) {
      this.setState({horizontalScale: this.context!.horizontalScale}, () => {
        if (this.state.centerZoomOnCursor) {
          const cursorEl = this.cursorRef.current
          const editorWindowEl = this.editorWindowRef.current
  
          if (editorWindowEl && cursorEl) {
            editorWindowEl.scroll({left: cursorEl.offsetLeft - editorWindowEl.clientWidth * 0.5})
          }
        }
      })
    }
  }

  addTrack() {
    const newTrack : Track = getBaseTrack(this.context!.tracks)
  
    this.context!.setTracks([...this.context!.tracks, newTrack], () => {
      this.editorWindowRef.current!.scrollTop = this.editorWindowRef.current!.scrollHeight
    })
  }

  onWheel(e : React.WheelEvent) {
    const hScale = this.state.horizontalScale

    if (e.ctrlKey) {
      if (e.shiftKey) {
        this.zoom(false, e.deltaY < 0 ? 0.1203 * hScale : -0.1203 * hScale)
      } else {
        this.zoom(true, e.deltaY < 0 ? -0.1 : 0.1)
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

        this.setState({centerZoomOnCursor: cursorRect.left >= editorWindowRect.left && cursorRect.right <= editorWindowRect.right})
      }

      newScale = Math.min(Math.max(this.context!.horizontalScale + amt, 0.0058), 500)
      this.context!.setHorizontalScale(newScale)
    }
  }

  render() {
    const {tracks, horizontalScale, trackLanesWindowHeight, cursorPos} = this.context!
    const editorWindowHeight = this.editorWindowRef.current ? this.editorWindowRef.current.clientHeight - 45 : 0

    return (
      <KeyListener>
        <div className="m-0 p-0" style={{width: "100vw", height: "100vh", position: "relative", outline: "none"}}>
          <Header />
          <div style={{flex: 1, height: "calc(100vh - 70px)", display: "flex"}}>
            <ScrollSync>
              <div onWheel={this.onWheel} style={{flex:1,backgroundColor:"#333",display:"flex",overflow:"hidden"}}>
                <ScrollSyncPane>
                  <div
                    className="hide-vertical-scrollbar scrollbar" 
                    style={{width: 200, height: "100%", overflow: "scroll"}}
                  >
                    <div 
                      className="col-12 d-flex align-items-center"
                      style={{position: "sticky", top: 0, height: 45, backgroundColor: "#eee", zIndex: 15}}
                    >
                      <div 
                        className="text-center d-flex align-items-center" 
                        style={{flexDirection: "column", margin: 6, marginLeft: 12}}
                      >
                        <div className="d-flex">
                          <ZoomButton vertical={false} decrease={false} onZoom={() => this.zoom(false, 0.1203 * horizontalScale)} />
                          <ZoomButton vertical={false} decrease onZoom={() => this.zoom(false, -0.1203 * horizontalScale)} />
                        </div>
                        <div className="d-flex">
                          <ZoomButton vertical decrease={false} onZoom={() => this.zoom(true, 0.2)} />
                          <ZoomButton vertical decrease onZoom={() => this.zoom(true, -0.2)} />
                        </div>
                      </div>
                      <div style={{marginLeft: "auto", marginRight: 8}}>
                        <IconButton onClick={this.addTrack} className="p-1" style={{backgroundColor: "#ff6db8"}}>
                          <Add style={{fontSize: 18, color: "#fff"}} />
                        </IconButton>
                      </div>
                    </div>
                    <div style={{width: "100%"}}>
                      {tracks.map((track, index) => <TrackComponent key={index} track={track} />)}
                    </div>
                </div>
                </ScrollSyncPane>
                <ScrollSyncPane>
                  <div 
                    ref={this.editorWindowRef}
                    className="scrollbar thin-thumb" 
                    style={{flex: 1, overflow: "scroll overlay", position: "relative", height: "100%"}}
                  >
                    <div 
                      id="timeline-editor" 
                      ref={this.editorRef} 
                      style={{width: this.state.editorWidth * horizontalScale, minWidth: "100%"}}
                    >
                      <div style={{position: "sticky", top: 0, width: "100%", height: 45, zIndex: 15, backgroundColor: "#eee"}}>
                        <div style={{width: "100%", height: 10, backgroundColor: "#ccc"}}>
                          <RegionComponent />
                        </div>
                        <Cursor ref={this.cursorRef} pos={cursorPos} height={trackLanesWindowHeight - 35} /> 
                        <TimelineComponent numMeasures={50} style={{height: 35}} />
                      </div>
                      <div style={{width: "100%", minHeight: editorWindowHeight}}>
                        {
                          tracks.map((track, idx) => (
                            <Lane
                              key={idx}
                              track={track}
                              style={{backgroundColor: "#ccc", borderBottom: "1px solid #0002"}}
                            />
                          ))
                        }
                      </div>
                    </div>
                </div>
                </ScrollSyncPane>
              </div>
            </ScrollSync>
            <div style={{width: 45, backgroundColor: "#fff", zIndex: -1}}></div>
          </div>
        </div>
      </KeyListener>
    )
  }
}