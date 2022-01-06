import React from "react"
import {Cursor, Header, Holdable, KeyListener, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import {faArrowsAltH, faArrowsAltV} from "@fortawesome/free-solid-svg-icons"
import IconButton from "@mui/material/IconButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Add, Remove } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import ReactResizeDetector from 'react-resize-detector';
import { Clip } from "renderer/components/ClipComponent"
import Lane from "renderer/components/Lane"
import { getBaseTrack } from "renderer/utils/utils"

interface IProps {
}

interface IState {
  originalTimelineWidth: number
  editorWidth : number
  editorWindowWidth: number
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private editorWindowRef : React.RefObject<HTMLDivElement>
  private trackLanesContainerRef : React.RefObject<HTMLDivElement>
  
  constructor(props : any) {
    super(props)

    this.editorWindowRef = React.createRef()
    this.trackLanesContainerRef = React.createRef()
    
    this.state = {
      originalTimelineWidth: 10000,
      editorWidth: 10000,
      editorWindowWidth: 900
    }
  }

  componentDidUpdate() {
    if (this.trackLanesContainerRef.current && this.context!.trackLanesWindowHeight !== this.trackLanesContainerRef.current.clientHeight) {
      this.context!.setTrackLanesWindowHeight(this.trackLanesContainerRef.current.clientHeight)
    }
  }

  render() {
    const {tracks, setTracks, setVerticalScale, setHorizontalScale, trackLanesWindowHeight, cursorPos, setCursorPos} = this.context!

    const addTrack = () => {
      const newTrack : Track = getBaseTrack(tracks)
  
      setTracks([...tracks, newTrack], () => {
        this.editorWindowRef.current!.scrollTop = this.editorWindowRef.current!.scrollHeight
      })
    }
  
    const onTrackChange = (e : React.MouseEvent<HTMLDivElement,MouseEvent>, rect : DOMRect, track : Track, clip : Clip) => {
      if (e.currentTarget) {
        const {top, bottom} = rect
        const mouseY = e.clientY
    
        const topEdgeDist = Math.abs(mouseY - top)
        const bottomEdgeDist = Math.abs(mouseY - bottom)
    
        const min = Math.min(topEdgeDist, bottomEdgeDist)
    
        const newTracks = tracks.slice()
        const trackIndex = newTracks.findIndex(t => t.id === track.id)
    
        if (min === topEdgeDist && mouseY - top < -25) {
          newTracks[trackIndex].clips = newTracks[trackIndex].clips.filter(c => c.id !== clip.id)
          newTracks[Math.max(0, trackIndex - 1)].clips.push(clip)
          setTracks(newTracks)
        } else if (min === bottomEdgeDist && mouseY - bottom >= 25) {
          newTracks[trackIndex].clips = newTracks[trackIndex].clips.filter(c => c.id !== clip.id)
          newTracks[Math.min(newTracks.length - 1, trackIndex + 1)].clips.push(clip)
          setTracks(newTracks)
        }
      }
    }

    const onWheel = (e : React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey) {
        if (e.shiftKey) {
          zoomHorizontally(e.deltaY < 0)
        } else 
          zoomVertically(e.deltaY < 0)
      }
    }

    const zoomHorizontally = (increase : boolean) => {  
      if (this.state.editorWindowWidth > this.state.editorWidth) {
        this.setState({editorWidth: this.state.editorWindowWidth})
      }

      setHorizontalScale(prevState => {
        let newHorizonalScale = increase ? 
          Math.min(Math.max(0.0058, prevState + 0.1203 * prevState), 680) : 
          Math.min(Math.max(0.0058, prevState - 0.1203 * prevState), 680)

        this.setState({editorWidth: this.state.originalTimelineWidth * newHorizonalScale})

        return newHorizonalScale
      })
    }

    const zoomVertically = (increase : boolean) => {
      setVerticalScale(prevState => {
        const newVerticalScale = increase ? prevState + 0.2 : prevState - 0.2
        return Math.max(Math.min(5, newVerticalScale), 0.7)
      })
    }

    return (
      <KeyListener>
        <div className="m-0 p-0" style={{width: "100vw", height: "100vh", position: "relative", outline: "none"}}>
          <Header />
          <div style={{flex: 1, height: "calc(100vh - 70px)", display: "flex"}}>
            <ScrollSync>
              <div 
                onWheel={onWheel}
                className="hide-scrollbar"
                style={{flex: 1, backgroundColor: "#333", display: "flex", overflow: "hidden"}} 
              >
                <div style={{width: 200, height: "100%"}}>
                  <div style={{height: 45, backgroundColor: "#eee", display: "flex", alignItems: "center"}}>
                    <div 
                      className="text-center d-flex align-items-center" 
                      style={{flexDirection: "column", margin: 6, marginLeft: 12}}
                    >
                      <div className="d-flex justify-content-center" style={{width: "fit-content"}}>
                        <div className="d-flex align-items-center" style={{marginRight: 8}}>
                          <FontAwesomeIcon icon={faArrowsAltH} style={{margin:0, fontSize: 14}} />
                          <Holdable
                            onMouseDown={() => zoomHorizontally(true)}
                            interval={100}
                            timeout={500}
                            onHold={() => zoomHorizontally(true)}
                            style={{marginLeft: 2, display: "inline-flex"}}
                          >
                            <IconButton className="p-0" >
                              <Add style={{fontSize: 18, marginLeft: 0}} />
                            </IconButton>
                          </Holdable>
                        </div>
                        <div className="d-flex align-items-center" style={{marginRight: 8}}>
                          <FontAwesomeIcon icon={faArrowsAltH} style={{margin:0, fontSize: 14}} />
                          <Holdable
                            onMouseDown={() => zoomHorizontally(false)}
                            interval={100}
                            timeout={500}
                            onHold={() => zoomHorizontally(false)}
                            style={{marginLeft: 2, display: "inline-flex"}}
                          >
                            <IconButton className="p-0" >
                              <Remove style={{fontSize: 18, marginLeft: 0}} />
                            </IconButton>
                          </Holdable>
                        </div>
                      </div>
                      <div className="d-flex justify-content-center" style={{width: "fit-content"}}>
                        <div className="d-flex align-items-center" style={{marginRight: 8}}>
                          <FontAwesomeIcon icon={faArrowsAltV} style={{margin:0, fontSize: 14}} />
                          <Holdable
                            onMouseDown={() => zoomVertically(true)}
                            interval={100}
                            timeout={500}
                            onHold={() => zoomVertically(true)}
                            style={{marginLeft: 2, display: "inline-flex"}}
                          >
                            <IconButton className="p-0" >
                              <Add style={{fontSize: 18, marginLeft: 0}} />
                            </IconButton>
                          </Holdable>
                        </div>
                        <div className="d-flex align-items-center" style={{marginRight: 8}}>
                          <FontAwesomeIcon icon={faArrowsAltV} style={{margin:0, fontSize: 14}} />
                          <Holdable
                            onMouseDown={() => zoomVertically(false)}
                            interval={100}
                            timeout={500}
                            onHold={() => zoomVertically(false)}
                            style={{marginLeft: 2, display: "inline-flex"}}
                          >
                            <IconButton className="p-0" >
                              <Remove style={{fontSize: 18, marginLeft: 0}} />
                            </IconButton>
                          </Holdable>
                        </div>
                      </div>
                    </div>
                    <div style={{marginLeft: "auto", marginRight: 8}}>
                      <IconButton onClick={addTrack} className="p-1" style={{backgroundColor: "#ff6db8"}}>
                        <Add style={{fontSize: 18, color: "#fff"}} />
                      </IconButton>
                    </div>
                  </div>
                  <ScrollSyncPane>
                    <div 
                      className="hide-vertical-scrollbar scrollbar"
                      style={{width: 200, overflow: "scroll", height: "calc(100% - 45px)"}}
                    >
                      {
                        tracks.map((track, index) => (
                          <TrackComponent key={index} track={track} />
                        ))
                      }
                    </div>
                  </ScrollSyncPane>
                </div>
                <ReactResizeDetector handleWidth onResize={(w, h) => this.setState({editorWindowWidth: w!})}>
                  <div style={{flex: 1, height: "100%", overflow: "hidden", position: "relative"}}>
                    <ScrollSyncPane>
                      <div 
                        id="timeline"
                        className="hide-scrollbar" 
                        style={{
                          width: "100%", 
                          height: 45, 
                          overflow: "scroll", 
                          backgroundColor: "#eee", 
                          position: "relative"
                      }}
                      >
                        <Cursor pos={cursorPos} top />
                        <TimelineComponent 
                          width={this.state.editorWidth} 
                          numMeasures={50} 
                          setCursorPos={setCursorPos} 
                        />
                      </div>
                    </ScrollSyncPane>
                    <ScrollSyncPane>
                      <div 
                        id="track-lanes-window"
                        ref={this.editorWindowRef}
                        className="scrollbar" 
                        style={{flex: 1, height: "calc(100% - 45px)", overflow: "scroll", position: "relative"}}
                      >
                        <Cursor 
                          pos={cursorPos} 
                          top={false} 
                          height={trackLanesWindowHeight}
                        />
                        <div ref={this.trackLanesContainerRef} style={{height: "fit-content"}}>
                          {
                            tracks.map((track, idx) => (
                              <Lane
                                key={idx}
                                width={this.state.editorWidth}
                                minWidth={this.state.editorWindowWidth}
                                track={track}
                                onTrackChange={onTrackChange}
                                style={{backgroundColor: idx % 2 === 1 ? "#ccc" : "#bbb"}}
                              />
                            ))
                          }
                        </div>
                      </div>
                    </ScrollSyncPane>
                  </div>
                </ReactResizeDetector>
              </div>
            </ScrollSync>
            <div style={{width: 45, backgroundColor: "#fff", zIndex: -1}}>

            </div>
          </div>
        </div>
      </KeyListener>
    )
  }
}