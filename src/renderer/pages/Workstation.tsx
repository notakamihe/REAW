import React from "react"
import {Cursor, Header, Holdable, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import {faArrowsAltH, faArrowsAltV} from "@fortawesome/free-solid-svg-icons"
import IconButton from "@mui/material/IconButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Add, Remove } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import ReactResizeDetector from 'react-resize-detector';
import ClipComponent, { Clip, TrackChangeMode } from "renderer/components/ClipComponent"
import TimelinePosition from "renderer/types/TimelinePosition"
import { v4 as uuidv4 } from 'uuid';
import { getRandomTrackColor } from "renderer/utils"

interface IProps {
}

interface IState {
  originalTimelineWidth: number
  editorWidth : number,
  editorWindowWidth: number,
  tracks: Track[],
  selectedClip : Clip | null
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private editorWindowRef : React.RefObject<HTMLDivElement>

  data : Track[] = [
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#aaf", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(1, 1, 0),
          end: new TimelinePosition(3, 2, 0),
          startLimit: new TimelinePosition(1, 1, 0),
          endLimit: new TimelinePosition(3, 2, 0),
          loopEnd: new TimelinePosition(3, 2, 0),
        },
        {
          id: uuidv4(),
          start: new TimelinePosition(4, 1, 0),
          end: new TimelinePosition(4, 3, 750),
          startLimit: new TimelinePosition(4, 1, 0),
          endLimit: new TimelinePosition(4, 3, 750),
          loopEnd: new TimelinePosition(4, 3, 750),
        }
      ],
      effects: [
        {
          id: uuidv4(),
          name: "Effect 1"
        },
        {
          id: uuidv4(),
          name: "Effect 2"
        }
      ],
      mute: false,
      solo: false,
      automationEnabled: true,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#faf", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(1, 1, 0),
          end: new TimelinePosition(1, 3, 0),
          startLimit: new TimelinePosition(1, 1, 0),
          endLimit: new TimelinePosition(1, 3, 0),
          loopEnd: new TimelinePosition(1, 3, 0),
        }
      ],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#aff", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(1, 2, 950),
          end: new TimelinePosition(5, 1, 0),
          startLimit: new TimelinePosition(1, 2, 950),
          endLimit: new TimelinePosition(5, 1, 0),
          loopEnd: new TimelinePosition(5, 1, 0),
        }
      ],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#faa", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(2, 4, 250),
          end: new TimelinePosition(3, 1, 0),
          startLimit: new TimelinePosition(2, 4, 250),
          endLimit: new TimelinePosition(3, 1, 0),
          loopEnd: new TimelinePosition(3, 1, 0)
        },
        {
          id: uuidv4(),
          start: new TimelinePosition(4, 3, 0),
          end: new TimelinePosition(5, 4, 90),
          startLimit: new TimelinePosition(4, 3, 0),
          endLimit: new TimelinePosition(5, 4, 90),
          loopEnd: new TimelinePosition(5, 4, 90)
        }
      ],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#ffa", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(1, 1, 1),
          end: new TimelinePosition(2, 2, 2),
          startLimit: new TimelinePosition(1, 1, 1),
          endLimit: new TimelinePosition(2, 2, 2),
          loopEnd: new TimelinePosition(2, 2, 2)
        },
        {
          id: uuidv4(),
          start: new TimelinePosition(3, 3, 3),
          end: new TimelinePosition(4, 4, 4),
          startLimit: new TimelinePosition(3, 3, 3),
          endLimit: new TimelinePosition(4, 4, 4),
          loopEnd: new TimelinePosition(4, 4, 4)
        }
      ],
      effects: [],
      mute: true,
      solo: true,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#afa", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(2, 1, 0),
          end: new TimelinePosition(3, 1, 0),
          startLimit: new TimelinePosition(2, 1, 0),
          endLimit: new TimelinePosition(3, 1, 0),
          loopEnd: new TimelinePosition(3, 1, 0)
        },
        {
          id: uuidv4(),
          start: new TimelinePosition(4, 1, 0),
          end: new TimelinePosition(5, 1, 500),
          startLimit: new TimelinePosition(4, 1, 0),
          endLimit: new TimelinePosition(5, 1, 500),
          loopEnd: new TimelinePosition(5, 1, 500)
        }
      ],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
    {
      id: uuidv4(), 
      name: "Track 1", 
      color: "#69f", 
      clips: [
        {
          id: uuidv4(),
          start: new TimelinePosition(3, 3, 250),
          end: new TimelinePosition(5, 2, 500),
          startLimit: new TimelinePosition(3, 3, 250),
          endLimit: new TimelinePosition(5, 2, 500),
          loopEnd: new TimelinePosition(5, 2, 500)
        },
        {
          id: uuidv4(),
          start: new TimelinePosition(5, 2, 500),
          end: new TimelinePosition(6, 1, 0),
          startLimit: new TimelinePosition(5, 2, 500),
          endLimit: new TimelinePosition(6, 1, 0),
          loopEnd: new TimelinePosition(6, 1, 0)
        }
      ],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    },
  ]
  
  constructor(props : any) {
    super(props)

    this.editorWindowRef = React.createRef()
    
    this.state = {
      originalTimelineWidth: 10000,
      editorWidth: 10000,
      editorWindowWidth: 900,
      selectedClip: null,
      tracks: this.data
    }
  }

  componentDidMount() {
    this.data.forEach(track => {
      track.clips.forEach(clip => {
        clip.start.normalize(this.context!.timelinePosOptions)
        clip.end.normalize(this.context!.timelinePosOptions)
        clip.startLimit.normalize(this.context!.timelinePosOptions)
        clip.loopEnd.normalize(this.context!.timelinePosOptions)
      })
    })
  }

  addTrack = () => {
    const newTrack = {
      id: uuidv4(), 
      name: `Track ${this.state.tracks.length + 1}`, 
      color: getRandomTrackColor(), 
      clips: [],
      effects: [],
      mute: false,
      solo: false,
      automationEnabled: false,
      volume: 100,
      pan: 0
    }

    this.setState({tracks: [...this.state.tracks, newTrack]}, () => {
      this.editorWindowRef.current!.scrollTop = this.editorWindowRef.current!.scrollHeight
    })
  }

  onTrackChange = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, track : Track, clip : Clip) => {
    const {top, bottom} = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY

    const topEdgeDist = Math.abs(mouseY - top)
    const bottomEdgeDist = Math.abs(mouseY - bottom)

    const min = Math.min(topEdgeDist, bottomEdgeDist)

    const tracks = this.state.tracks.slice()
    const trackIndex = tracks.findIndex(t => t.id === track.id)

    if (min === topEdgeDist && mouseY - top < 0) {
      tracks[trackIndex].clips = tracks[trackIndex].clips.filter(c => c.id !== clip.id)
      tracks[Math.max(0, trackIndex - 1)].clips.push(clip)
    } else if (min === bottomEdgeDist && mouseY - bottom >= 0) {
      tracks[trackIndex].clips = tracks[trackIndex].clips.filter(c => c.id !== clip.id)
      tracks[Math.min(tracks.length - 1, trackIndex + 1)].clips.push(clip)
    }
    
    this.setState({tracks})
  }

  setClip = (oldClip : Clip, newClip : Clip) => {
    this.setState(prevState => {
      const tracks = prevState.tracks.slice()
      const track = tracks.find(t => t.clips.find(c => c.id === oldClip.id))
  
      if (track) {
        const clipIndex = track.clips.findIndex(c => c.id === oldClip.id)
        track.clips[clipIndex] = newClip
      }

      return {tracks}
    })
  }

  setTrack = (track : Track, callback?: () => void | null) => {
    this.setState(prevState => {
      const tracks = prevState.tracks.slice()
      const trackIndex = tracks.findIndex(t => t.id === track.id)

      tracks[trackIndex] = track

      return {tracks}
    }, () => {
      if (callback) {
        callback()
      }
    })
  }

  render() {
    const {
      verticalScale, 
      setVerticalScale, 
      horizontalScale, 
      setHorizontalScale, 
      timelinePosOptions,
      cursorPos,
      setCursorPos
    } = this.context!

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
          Math.min(Math.max(0.004, prevState + 0.1203 * prevState), 680) : 
          Math.min(Math.max(0.004, prevState - 0.1203 * prevState), 680)

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
      <div style={{width: "100vw", height: "100vh", margin: 0, padding: 0}}>
        <Header />
        <div style={{flex: 1, height: "calc(100vh - 70px)", display: "flex"}}>
          <ScrollSync>
            <div style={{width: "95%", backgroundColor: "#333", display: "flex"}} onWheel={onWheel}>
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
                    <IconButton onClick={this.addTrack} className="p-1" style={{backgroundColor: "#ff6db8"}}>
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
                      this.state.tracks.map((track, index) => (
                        <TrackComponent key={index} track={track} setTrack={this.setTrack} />
                      ))
                    }
                  </div>
                </ScrollSyncPane>
              </div>
              <ReactResizeDetector handleWidth onResize={(w, h) => this.setState({editorWindowWidth: w!})}>
                <div style={{flex: 1, height: "100%", overflow: "hidden", position: "relative"}}>
                  <ScrollSyncPane>
                    <div 
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
                      ref={this.editorWindowRef}
                      className="scrollbar" 
                      style={{flex: 1, height: "calc(100% - 45px)", overflow: "scroll", position: "relative"}}
                    >
                      <Cursor 
                        pos={cursorPos} 
                        top={false} 
                        height={(100 * verticalScale) * this.state.tracks.length} 
                      />
                      {
                        this.state.tracks.map((track, idx) => (
                          <div 
                            key={track.id}
                            style={{
                              width: this.state.editorWidth, 
                              height: 100 * verticalScale, 
                              backgroundColor: idx % 2 === 1 ? "#ccc" : "#bbb",
                              position: "relative",
                              minWidth: this.state.editorWindowWidth
                            }}
                          >
                            {
                              track.clips.map((clip, index) => (
                                <ClipComponent 
                                  clip={clip} 
                                  track={track}
                                  key={clip.id} 
                                  isSelected={this.state.selectedClip?.id === clip.id}
                                  onSelect={() => this.setState({selectedClip: clip})}
                                  onTrackChange={this.onTrackChange}
                                  setClip={this.setClip}
                                />
                              ))
                            }
                          </div>
                        ))
                      }
                    </div>
                  </ScrollSyncPane>
                </div>
              </ReactResizeDetector>
            </div>
          </ScrollSync>
          <div style={{width: "5%", backgroundColor: "#fff", zIndex: -1}}>

          </div>
        </div>
      </div>
    )
  }
}