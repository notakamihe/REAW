import React from "react"
import {Accordion, AccordionDetails, AccordionSummary, IconButton, Popover} from "@mui/material"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { AutomationLane, AutomationNode, ValidatedInput, Track } from "renderer/types/types"
import { Add, Delete, ExpandMore } from "@mui/icons-material"
import { MouseDownAwayListener } from "."
import { clamp, lerp } from "renderer/utils/general"
import TimelinePosition from "renderer/types/TimelinePosition"
import { v4 } from "uuid"
import { Slider} from "./ui"
import { BASE_MAX_MEASURES, ipcRenderer, laneContainsNode } from "renderer/utils/utils"
import channels from "renderer/utils/channels"

interface IProps {
  automationLane : AutomationLane
  classes? : any
  color : string
  track : Track
}

interface IState {
  anchorEl : HTMLElement | null
  pos : ValidatedInput
  prevSelectedNode : AutomationNode | null
  sliderValue : number
  value : ValidatedInput
}

class AutomationLaneTrack extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)
    
    this.state = {
      anchorEl: null,
      pos: {value: "", valid: true},
      sliderValue: 0,
      value: {value: "", valid: true},
      prevSelectedNode : null
    }

    this.onAway = this.onAway.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.removeLane = this.removeLane.bind(this)
    this.toggleExpand = this.toggleExpand.bind(this)
  }

  componentDidMount() {
    if (!this.context!.selectedNode) {
      const mid = lerp(0.5, this.props.automationLane.minValue, this.props.automationLane.maxValue)
      this.setState({prevSelectedNode: null, sliderValue: mid})
    }
  }

  componentDidUpdate() {
    if (JSON.stringify(this.state.prevSelectedNode) != JSON.stringify(this.context!.selectedNode)) {
      if (laneContainsNode(this.props.automationLane, this.context!.selectedNode)) {
        this.setState({
          prevSelectedNode: this.context!.selectedNode, 
          sliderValue: this.context!.selectedNode!.value
        })
      } else if (!this.context!.selectedNode) {
        const mid = lerp(0.5, this.props.automationLane.minValue, this.props.automationLane.maxValue)
        this.setState({prevSelectedNode: null, sliderValue: mid})
      }
    }
  }

  clearAutomation() {
    const automationLanes = this.props.track.automationLanes.slice()
    const laneIdx = this.props.track.automationLanes.findIndex(l => l.id === this.props.automationLane.id)

    if (laneIdx > -1) {
      automationLanes[laneIdx].nodes = []
      this.context!.setTrack({...this.props.track, automationLanes})
    }
  }

  getAvailableLanes() {
    return this.props.track.automationLanes.filter(t => !t.show)
  }

  onAway = () => {
    if (laneContainsNode(this.props.automationLane, this.context!.selectedNode))
      this.context!.setCancelClickAway(false)
  }

  onContextMenu = (e : React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    
    ipcRenderer.send(channels.OPEN_AUTOMATION_TRACK_CONTEXT_MENU, this.getAvailableLanes())

    ipcRenderer.on(channels.SELECT_AUTOMATION, (lane : AutomationLane) => {
      if (lane.id !== this.props.automationLane.id) {
        this.switchLane(lane)
      }
    })

    ipcRenderer.on(channels.CLEAR_AUTOMATION, () => {
      this.clearAutomation()
    })

    ipcRenderer.on(channels.REMOVE_AUTOMATION, () => {
      this.removeLane()
    })

    ipcRenderer.on(channels.CLOSE_AUTOMATION_TRACK_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.SELECT_AUTOMATION)
      ipcRenderer.removeAllListeners(channels.CLEAR_AUTOMATION)
      ipcRenderer.removeAllListeners(channels.REMOVE_AUTOMATION)
      ipcRenderer.removeAllListeners(channels.CLOSE_AUTOMATION_TRACK_CONTEXT_MENU)
    })
  }

  onSubmit = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (this.state.pos.valid && this.state.value.valid) {
      const maxMeasures = BASE_MAX_MEASURES / (4 / this.context!.timeSignature.noteValue) * (4 / this.context!.timeSignature.beats)
      const maxMeasuresPos = new TimelinePosition(maxMeasures + 1, 1, 0)

      let value : number
      let pos : TimelinePosition

      if (this.state.pos.value === "") {
        if (this.props.automationLane.nodes.length > 0) {
          let lastNodePos = TimelinePosition.fromPos(this.props.automationLane.nodes[this.props.automationLane.nodes.length - 1].pos)
          const snapGridSize = this.context!.snapGridSize
          const snapGridFraction = new TimelinePosition(snapGridSize.measures + 1, snapGridSize.beats + 1, snapGridSize.fraction)
            .toFraction(this.context!.timelinePosOptions)

          if (snapGridFraction <= 1000) {
            pos = lastNodePos.add(0, 1, 0, false, this.context!.timelinePosOptions);
          } else {
            pos = lastNodePos.add(snapGridSize.measures, snapGridSize.beats, snapGridSize.fraction, false, this.context!.timelinePosOptions);
          }
        } else {
          pos = TimelinePosition.fromPos(TimelinePosition.start)
        }
      } else {
        pos = TimelinePosition.parseFromString(this.state.pos.value, this.context!.timelinePosOptions)!
      }

      pos.snap(this.context!.timelinePosOptions)

      if (pos.compare(maxMeasuresPos) > 0) {
        pos = maxMeasuresPos
      }

      if (this.state.value.value === "") {
        value = lerp(0.5, this.props.automationLane.minValue, this.props.automationLane.maxValue)
      } else {
        value = clamp(Number(this.state.value.value), this.props.automationLane.minValue, this.props.automationLane.maxValue)
      }

      this.context!.addNodeToLane(this.props.track, this.props.automationLane, {id: v4(), pos: pos!, value})
      this.setState({pos: {value: "", valid: true}, value: {value: "", valid: true}, anchorEl: null})
    }
  }
  
  removeLane = () => {
    const automationLanes = this.props.track.automationLanes
    const laneIdx = this.props.track.automationLanes.findIndex(l => l.id === this.props.automationLane.id)

    automationLanes[laneIdx].show = false
    automationLanes[laneIdx].nodes = []

    this.context!.setTrack({...this.props.track, automationLanes})
  }

  setSelectedNodeValue = (value : number) => {
    const automationLanes = this.props.track.automationLanes.slice()
    const laneIndex = automationLanes.findIndex(t => t.id === this.props.automationLane.id)

    if (laneIndex !== -1) {
      const nodeIndex = automationLanes[laneIndex].nodes.findIndex(n => n.id === this.context!.selectedNode?.id)

      if (nodeIndex !== -1) {
        let volume = this.props.track.volume
        let pan = this.props.track.pan
        let tempo = this.context!.tempo

        automationLanes[laneIndex].nodes[nodeIndex].value = value

        if (automationLanes[laneIndex].nodes.length === 1) {
          if (automationLanes[laneIndex].isVolume) {
            volume = value
          } else if (automationLanes[laneIndex].isPan) {
            pan = value
          } else if (automationLanes[laneIndex].isTempo) {
            tempo = Math.round(value)
          }
        }

        this.context!.setTrack({...this.props.track, automationLanes, volume, pan})
        this.context!.setSelectedNode(automationLanes[laneIndex].nodes[nodeIndex])
        this.context!.setTempo(tempo)
      }
    }
  }

  switchLane = (lane : AutomationLane) => {
    const automationLanes = this.props.track.automationLanes.slice()
    const oldLaneIdx = automationLanes.findIndex(t => t.id === this.props.automationLane.id)
    const newLaneIdx = automationLanes.findIndex(t => t.id === lane.id)
    
    if (oldLaneIdx === newLaneIdx)
      return
    
    if (oldLaneIdx > -1) {
      automationLanes[oldLaneIdx].show = false
      automationLanes[newLaneIdx].show = true
      
      this.context!.setTrack({...this.props.track, automationLanes})
    }
  }
  
  toggleExpand = () => {
    const automationLanes = this.props.track.automationLanes.slice()
    const idx = automationLanes.findIndex(t => t.id === this.props.automationLane.id)
    
    automationLanes[idx].expanded = !automationLanes[idx].expanded
    this.context!.setTrack({...this.props.track, automationLanes})
  }
  
  render() {
    const {verticalScale, selectedNode, setCancelClickAway, deleteNode} = this.context!
    const disabled = !selectedNode || !laneContainsNode(this.props.automationLane, selectedNode)
    const horizontal = verticalScale < 0.8

    if (this.props.automationLane.show) {
      return (
        <React.Fragment>
          <Accordion 
            className="no-shadow remove-spacing" 
            expanded={this.props.automationLane.expanded}
            onContextMenu={this.onContextMenu}
            style={{width: "100%", backgroundColor: "var(--bg2)", borderRadius: 0}}
          >
            <AccordionSummary 
              className="remove-spacing"
              expandIcon={<ExpandMore onClick={this.toggleExpand} style={{fontSize: 16, color: "var(--fg1)"}} />}
              style={{height: 25, borderBottom: "1px solid var(--border5)", justifyContent: "flex-start"}}
              sx={{
                ".MuiAccordionSummary-content.Mui-expanded": {overflow: "hidden", display: "flex"},
                ".MuiAccordionSummary-expandIconWrapper": {flexShrink: 0, marginRight: "3px"}
              }}
            >
              <span 
                className="mx-2 rounded-circle d-inline-block"
                style={{height: 10, width: 10, border: `1px solid ${this.props.track.isMaster ? "#fff6" : "var(--border6)"}`, backgroundColor: this.props.color, flexShrink: 0, marginTop: 5}}
              ></span>
              <p 
                style={{fontSize: 14, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", color: "var(--fg1)", margin: 0}}
                title={this.props.automationLane.label}
              >
                {this.props.automationLane.label}
              </p>
            </AccordionSummary>
            <MouseDownAwayListener onMouseDown={() => setCancelClickAway(true)} onAway={this.onAway}>
              <AccordionDetails 
                className="p-0" 
                style={{height: (100 * verticalScale) - 25, borderBottom: "1px solid var(--border5)"}}
              >
                <div 
                  className="py-0 scrollbar2 thin-thumb d-flex px-2" 
                  style={{width: "100%", height: "100%", flexDirection: horizontal ? "row" : "column"}}
                >
                  <div 
                    className={`d-flex justify-content-center ${horizontal ? "align-items-center" : "align-items-start"}`}
                    style={{width: horizontal ? 20 : "100%", flex: horizontal ? 0 : 1, marginTop: horizontal ? 0 : verticalScale < 0.9 ? 8 : 16}}
                  >
                    <IconButton 
                      className="p-0" 
                      onClick={e => this.setState({anchorEl: e.currentTarget})} 
                      style={{border: "1px solid var(--border7)"}}
                    >
                      <Add style={{fontSize: 16, color: "var(--border7)"}} />
                    </IconButton>
                    <Popover 
                      anchorEl={this.state.anchorEl} 
                      anchorOrigin={{horizontal: "right", vertical: "center"}}
                      open={Boolean(this.state.anchorEl)}
                      onClose={() => this.setState({anchorEl: null})}
                      PaperProps={{style: {transform: "translate(10px, -50%)", backgroundColor: "var(--bg9)"}}}
                    >
                      <form onSubmit={this.onSubmit} style={{width: 75, padding: 6}}>
                        <div className="text-center my-1">
                          <input
                            autoFocus
                            value={this.state.pos.value}
                            onChange={e => this.setState({pos: {
                              value: e.target.value, 
                              valid: e.target.value === "" || TimelinePosition.isStringValid(e.target.value)
                            }})}
                            placeholder="0.0.000"
                            style={{ 
                              border: `1px solid ${this.state.pos.valid ? "var(--border7)" : "#f00"}`,
                              color: this.state.pos.valid ? "var(--border7)" : "#f00",
                              outline: "none",
                              fontSize: 14,
                              width: "100%",
                              textAlign: "center",
                              backgroundColor: "#0000"
                            }}
                          />
                        </div>
                        <div className="text-center my-1">
                          <input
                            value={this.state.value.value}
                            onChange={e => this.setState({value: {value: e.target.value, valid: !isNaN(Number(e.target.value))}})}
                            placeholder="Val"
                            style={{ 
                              border: `1px solid ${this.state.value.valid ? "var(--border7)" : "#f00"}`,
                              color: this.state.value.valid ? "var(--border7)" : "#f00",
                              outline: "none",
                              fontSize: 14,
                              width: "100%",
                              textAlign: "center",
                              backgroundColor: "#0000"
                            }}
                          />
                        </div>
                        <input 
                          className="px-1 py-1 col-12 no-borders"
                          style={{color: "var(--bg9)", backgroundColor: "var(--color1)", fontSize: 14}} 
                          type="submit" 
                          value="Add" 
                        />
                      </form>
                    </Popover>
                  </div>
                  <div 
                    className={`d-flex align-items-center py-0 col-12 ${horizontal ? "" : "mb-1"}`}
                    style={{
                      opacity: laneContainsNode(this.props.automationLane, selectedNode) ? 1 : 0.5, 
                      flex: horizontal ? 1 : 0,
                      marginLeft: horizontal ? 8 : 0,
                    }}
                  >
                    <IconButton 
                      disabled={disabled}
                      style={{padding: 2, marginRight: 6, border: "1px solid var(--border7)"}}
                      onClick={() => {if (selectedNode) deleteNode(selectedNode)}}
                    >
                      <Delete style={{fontSize: 14, color: "var(--border7)"}} />
                    </IconButton>
                    <Slider 
                      className="remove-spacing"
                      disabled={disabled}
                      label={this.state.sliderValue.toFixed(2)}
                      min={this.props.automationLane.minValue}
                      max={this.props.automationLane.maxValue}
                      onChange={(e, v) => this.setState({sliderValue: v as number})}
                      onChangeCommitted={() => this.setSelectedNodeValue(this.state.sliderValue)}
                      style={{flex: 1, border: "1px solid var(--border8)"}}
                      sx={{color: this.props.color, "& .MuiSlider-thumb": {width: 15, height: 15, border: "1px solid var(--border8)"}}}
                      value={this.state.sliderValue}
                    />
                  </div>
                </div>
              </AccordionDetails>
            </MouseDownAwayListener>
          </Accordion>
        </React.Fragment>
      )
    }

    return null
  }
}

export default AutomationLaneTrack;