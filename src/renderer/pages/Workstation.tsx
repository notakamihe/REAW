import React from "react"
import {Cursor, TimelineComponent, TrackComponent} from "renderer/components"
import { Track } from "renderer/components/TrackComponent"
import {ScrollSync, ScrollSyncPane} from "react-scroll-sync"
import {faArrowsAltH, faArrowsAltV} from "@fortawesome/free-solid-svg-icons"
import IconButton from "@mui/material/IconButton"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { Add, Remove } from "@mui/icons-material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import ReactResizeDetector from 'react-resize-detector';
import ClipComponent, { Clip } from "renderer/components/ClipComponent"
import TimelinePosition from "renderer/types/TimelinePosition"

interface IProps {
}

interface IState {
  originalTimelineWidth: number
  editorWidth : number,
  editorWindowWidth: number,
  tracks: Track[],
  selectedClip : Clip | null,
  cursorPos : TimelinePosition,
}

export default class Workstation extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private editorWindowRef : React.RefObject<HTMLDivElement>

  private timeoutID : any

  data : Track[] = [
    new Track(
      1, 
      "Track 1", 
      "#aaf", 
      [
        new Clip(
          1,
          new TimelinePosition(1, 1, 0),
          new TimelinePosition(3, 2, 0),
          new TimelinePosition(1, 1, 0),
          new TimelinePosition(3, 2, 0),
        ),
        new Clip(
          2,
          new TimelinePosition(4, 1, 0),
          new TimelinePosition(4, 3, 750),
          new TimelinePosition(4, 1, 0),
          new TimelinePosition(4, 3, 750),
        )
      ]
    ),
    new Track(
      2, 
      "Track 1", 
      "#faf", 
      [
        new Clip(
          1,
          new TimelinePosition(1, 1, 0),
          new TimelinePosition(1, 3, 0),
          new TimelinePosition(1, 1, 0),
          new TimelinePosition(1, 3, 0),
          null
        )
      ]
    ),
    new Track(
      3, 
      "Track 1", 
      "#aff", 
      [
        new Clip(
          2,
          new TimelinePosition(1, 2, 950),
          new TimelinePosition(5, 1, 0),
          new TimelinePosition(1, 2, 950),
          new TimelinePosition(5, 1, 0),
        )
      ]
    ),
    new Track(
      4, 
      "Track 1", 
      "#faa", 
      [
        new Clip(
          1,
          new TimelinePosition(2, 4, 250),
          new TimelinePosition(3, 1, 0),
          new TimelinePosition(2, 4, 250),
          new TimelinePosition(3, 1, 0),
        ),
        new Clip(
          2,
          new TimelinePosition(4, 3, 0),
          new TimelinePosition(5, 4, 90),
          new TimelinePosition(4, 3, 0),
          new TimelinePosition(5, 4, 90),
        )
      ]
    ),
    new Track(
      5, 
      "Track 1", 
      "#ffa", 
      [
        new Clip(
          1,
          new TimelinePosition(1, 1, 1),
          new TimelinePosition(2, 2, 2),
          new TimelinePosition(1, 1, 1),
          new TimelinePosition(2, 2, 2),
        ),
        new Clip(
          2,
          new TimelinePosition(3, 3, 3),
          new TimelinePosition(4, 4, 4),
          new TimelinePosition(3, 3, 3),
          new TimelinePosition(4, 4, 4),
        )
      ]
    ),
    new Track(
      6, 
      "Track 1", 
      "#afa", 
      [
        new Clip(
          1,
          new TimelinePosition(2, 1, 0),
          new TimelinePosition(3, 1, 0),
          new TimelinePosition(2, 1, 0),
          new TimelinePosition(3, 1, 0),
        ),
        new Clip(
          2,
          new TimelinePosition(4, 1, 0),
          new TimelinePosition(5, 1, 500),
          new TimelinePosition(4, 1, 0),
          new TimelinePosition(5, 1, 500),
        )
      ]
    ),
    new Track(
      7, 
      "Track 1", 
      "#69f", 
      [
        new Clip(
          1,
          new TimelinePosition(3, 3, 250),
          new TimelinePosition(5, 2, 500),
          new TimelinePosition(3, 3, 250),
          new TimelinePosition(5, 2, 500),
        ),
        new Clip(
          2,
          new TimelinePosition(5, 2, 500),
          new TimelinePosition(6, 1, 0),
          new TimelinePosition(5, 2, 500),
          new TimelinePosition(6, 1, 0),
        )
      ]
    ),
  ]
  
  constructor(props : any) {
    super(props)

    this.editorWindowRef = React.createRef()
    
    this.state = {
      originalTimelineWidth: 10000,
      editorWidth: 10000,
      editorWindowWidth: 900,
      selectedClip: null,
      tracks: this.data,
      cursorPos: new TimelinePosition(1, 1, 0),
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

  onResizeEditor = (width : number) => {
    // this.setState({editorWindowWidth: width})

    // if (this.state.editorWindowWidth > this.state.editorWidth) {
    //   this.setState({editorWidth: this.state.editorWindowWidth})
    // }
  }

  setCursorPos = (pos : TimelinePosition) => {
    this.setState({cursorPos: pos})
  }

  render() {
    const {verticalScale, setVerticalScale, horizontalScale, setHorizontalScale, timelinePosOptions} = this.context!

    const onWheel = (e : React.WheelEvent<HTMLDivElement>) => {
      if (e.ctrlKey) {
        if (e.shiftKey) {
          zoomHorizontally(e.deltaY < 0)
        } else 
          zoomVertically(e.deltaY < 0)
      }
    }

    const handleZoomMouseDown = (horizontal : boolean, value : boolean) => {
      if (horizontal)
        zoomHorizontally(value)
      else
        zoomVertically(value)

      this.timeoutID = setTimeout(() => {
        this.timeoutID = setInterval(() => {
          if (horizontal)
            zoomHorizontally(value)
          else
            zoomVertically(value)
        }, 100);
      }, 500)
    }

    const handleZoomMouseUp = (e : React.MouseEvent<HTMLButtonElement>) => {
      clearInterval(this.timeoutID)
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
        <div 
          style={{
            width: "100%", 
            height: 70, 
            zIndex: 100, 
            backgroundColor: "#fff", 
            boxShadow: "0 1px 10px 1px #0007", 
            flexShrink: 0,
            position: "relative"
          }}
        >
        </div>
        <div style={{flex: 1, height: "calc(100vh - 70px)", display: "flex"}}>
          <ScrollSync>
            <div style={{width: "95%", backgroundColor: "#333", display: "flex"}} onWheel={onWheel}>
              <div style={{width: 200, height: "100%"}}>
                <div style={{height: 45, backgroundColor: "#eee", display: "flex"}}>
                  <div 
                    className="text-center d-flex align-items-center" 
                    style={{flexDirection: "column", margin: 6, marginLeft: 12}}
                  >
                    <div className="d-flex justify-content-center" style={{width: "fit-content"}}>
                      <div className="d-flex align-items-center" style={{marginRight: 8}}>
                        <FontAwesomeIcon icon={faArrowsAltH} style={{margin:0, fontSize: 14}} />
                        <IconButton 
                          className="p-0" 
                          style={{marginLeft: 2}} 
                          onMouseDown={(e) => handleZoomMouseDown(true, true)}
                          onMouseUp={handleZoomMouseUp}
                          onMouseLeave={handleZoomMouseUp}
                        >
                          <Add style={{fontSize: 18, marginLeft: 0}} />
                        </IconButton>
                      </div>
                      <div className="d-flex align-items-center" style={{marginRight: 8}}>
                        <FontAwesomeIcon icon={faArrowsAltH} style={{margin:0, fontSize: 14}} />
                        <IconButton 
                          className="p-0" 
                          style={{marginLeft: 2}} 
                          onMouseDown={(e) => handleZoomMouseDown(true, false)}
                          onMouseUp={handleZoomMouseUp}
                          onMouseLeave={handleZoomMouseUp}
                        >
                          <Remove style={{fontSize: 18, marginLeft: 0}} />
                        </IconButton>
                      </div>
                    </div>
                    <div className="d-flex justify-content-center" style={{width: "fit-content"}}>
                      <div className="d-flex align-items-center" style={{marginRight: 8}}>
                        <FontAwesomeIcon icon={faArrowsAltV} style={{margin:0, fontSize: 14}} />
                        <IconButton 
                          className="p-0" 
                          style={{marginLeft: 0}} 
                          onMouseDown={(e) => handleZoomMouseDown(false, true)}
                          onMouseUp={handleZoomMouseUp} 
                          onMouseLeave={handleZoomMouseUp} 
                        >
                          <Add style={{fontSize: 18, marginLeft: 0}} />
                        </IconButton>
                      </div>
                      <div className="d-flex align-items-center" style={{marginRight: 8}}>
                        <FontAwesomeIcon icon={faArrowsAltV} style={{margin:0, fontSize: 14}} />
                        <IconButton 
                          className="p-0" 
                          style={{marginLeft: 0}} 
                          onMouseDown={(e) => handleZoomMouseDown(false, false)}
                          onMouseUp={handleZoomMouseUp}
                          onMouseLeave={handleZoomMouseUp}
                        >
                          <Remove style={{fontSize: 18, marginLeft: 0}} />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                </div>
                <ScrollSyncPane>
                  <div 
                    className="hide-vertical-scrollbar scrollbar"
                    style={{width: 200, overflow: "scroll", height: "calc(100% - 45px)"}}
                  >
                    {
                      this.state.tracks.map((track, index) => (
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
                      className="hide-scrollbar" 
                      style={{width: "100%", height: 45, overflow: "scroll", backgroundColor: "#eee", position: "relative"}}
                    >
                      <Cursor pos={this.state.cursorPos} top />
                      <ReactResizeDetector handleWidth handleHeight onResize={(w, h) => this.onResizeEditor(w!)}>
                        <TimelineComponent 
                          width={this.state.editorWidth} 
                          numMeasures={50} 
                          setCursorPos={this.setCursorPos} 
                        />
                      </ReactResizeDetector>
                    </div>
                  </ScrollSyncPane>
                  <ScrollSyncPane>
                    <div 
                      ref={this.editorWindowRef}
                      className="scrollbar" 
                      style={{flex: 1, height: "calc(100% - 45px)", overflow: "scroll", position: "relative"}}
                    >
                      <Cursor pos={this.state.cursorPos} top={false} />
                      {
                        this.state.tracks.map((track, idx) => (
                          <div 
                            key={idx}
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
                                  key={index} 
                                  isSelected={this.state.selectedClip === clip}
                                  onSelect={() => this.setState({selectedClip: clip})}
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
          <div style={{width: "5%", backgroundColor: "#fff", zIndex: -100}}>

          </div>
        </div>
      </div>
    )
  }
}