import React from "react"
import {Accordion, AccordionDetails, AccordionSummary, Divider, IconButton, Menu, MenuItem, MenuList, styled, Typography} from "@mui/material"
import automation from "./../../../assets/svg/automation.svg"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID, ValidatedInput } from "renderer/types/types"
import { Track } from "./TrackComponent"
import { AutomationNode } from "./AutomationNodeComponent"
import { Add, Delete, ExpandMore } from "@mui/icons-material"
import { MouseDownAwayListener } from "."
import { clamp, laneContainsNode, lerp } from "renderer/utils/helpers"
import TimelinePosition from "renderer/types/TimelinePosition"
import { v4 } from "uuid"
import { withStyles } from '@mui/styles';
import { ConfirmationInput, Slider} from "./ui"

export interface AutomationLane {
  id : ID
  label : string
  nodes: AutomationNode[]
  show : boolean
  expanded : boolean
  minValue : number
  maxValue : number
}


const styles = () => ({
  thumb: {
    "&": {width: 12, height: 12},
    "&:after": {width: 0, height: 0}
  }
});

interface IProps {
  automationLane : AutomationLane
  track : Track
  classes? : any
  color : string
}

interface IState {
  anchorEl : HTMLElement | null
  pos : ValidatedInput
  sliderValue : number
  value : ValidatedInput
  valueInputText : string
  prevSelectedNode : AutomationNode | null
}

class AutomationLaneTrack extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)
    
    this.state = {
      anchorEl : null,
      pos: {value: "", valid: true},
      sliderValue: 0,
      value: {value: "", valid: true},
      valueInputText: "",
      prevSelectedNode : null
    }

    this.onAway = this.onAway.bind(this)
    this.onChangeCommitted = this.onChangeCommitted.bind(this)
    this.onConfirm = this.onConfirm.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.removeLane = this.removeLane.bind(this)
    this.toggleExpand = this.toggleExpand.bind(this)
  }

  componentDidUpdate() {
    if (JSON.stringify(this.state.prevSelectedNode) != JSON.stringify(this.context!.selectedNode)) {
      if (laneContainsNode(this.props.automationLane, this.context!.selectedNode)) {
        this.setState({
          prevSelectedNode: this.context!.selectedNode, 
          sliderValue: this.context!.selectedNode!.value, 
          valueInputText: this.context!.selectedNode!.value.toFixed(2)
        })
      } else if (!this.context!.selectedNode) {
        const mid = lerp(0.5, this.props.automationLane.minValue, this.props.automationLane.maxValue)
        this.setState({prevSelectedNode: null, sliderValue: mid, valueInputText: ""})
      }
    }
  }

  getAvailableLanes() {
    return this.props.track.automationLanes.filter(t => !t.show)
  }

  onAway = () => {
    if (laneContainsNode(this.props.automationLane, this.context!.selectedNode))
      this.context!.setCancelClickAway(false)
  }

  onChangeCommitted = (e : any) => {
    this.setSelectedNodeValue(this.state.sliderValue)
    this.setState({valueInputText: this.state.sliderValue.toFixed(2)})
  }

  onConfirm = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const newValue = Number(Number(this.state.valueInputText).toFixed(2))

    if (this.state.valueInputText != "" && !isNaN(newValue)) {
      const clampedValue = clamp(newValue, this.props.automationLane.minValue, this.props.automationLane.maxValue)

      this.setSelectedNodeValue(clampedValue)
      this.setState({sliderValue: clampedValue})
    }
  }

  onSubmit = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (this.state.pos.valid && this.state.value.valid) {
      let value
      let pos

      if (this.state.pos.value === "") {
        if (this.props.automationLane.nodes.length > 0) {
          let lastNodePos = TimelinePosition.fromPos(this.props.automationLane.nodes[this.props.automationLane.nodes.length - 1].pos)

          lastNodePos.add(0, 1, 0, true, this.context!.timelinePosOptions)
          pos = lastNodePos
        } else {
          pos = TimelinePosition.fromPos(TimelinePosition.start)
        }
      } else {
        pos = TimelinePosition.parseFromString(this.state.pos.value, this.context!.timelinePosOptions)
      }

      if (this.state.value.value === "") {
        value = lerp(0.5, this.props.automationLane.minValue, this.props.automationLane.maxValue)
      } else {
        value = clamp(Number(this.state.value.value), this.props.automationLane.minValue, this.props.automationLane.maxValue)
      }

      this.context!.addNodeToLane(this.props.track, this.props.automationLane, {id: v4(), pos: pos!, value})
      this.setState({pos: {value: "", valid: true}, value: {value: "", valid: true}})
    }
  }
  
  removeLane = () => {
    const automationLanes = this.props.track.automationLanes
    const laneIdx = this.props.track.automationLanes.findIndex(l => l.id === this.props.automationLane.id)

    automationLanes[laneIdx].show = false
    automationLanes[laneIdx].nodes = []

    this.context!.setTrack({...this.props.track, automationLanes})
    this.setState({anchorEl : null})
  }

  setSelectedNodeValue = (value : number) => {
    const automationLanes = this.props.track.automationLanes.slice()
    const laneIndex = automationLanes.findIndex(t => t.id === this.props.automationLane.id)

    if (laneIndex !== -1) {
      const nodeIndex = automationLanes[laneIndex].nodes.findIndex(n => n.id === this.context!.selectedNode?.id)

      if (nodeIndex !== -1) {
        automationLanes[laneIndex].nodes[nodeIndex].value = value
        this.context!.setTrack({...this.props.track, automationLanes})
        this.context!.setSelectedNode(automationLanes[laneIndex].nodes[nodeIndex])
      }
    }
  }

  switchLane = (lane : AutomationLane) => {
    this.setState({anchorEl: null})
    
    const automationLanes = this.props.track.automationLanes.slice()
    const oldLaneIdx = automationLanes.findIndex(t => t.id === this.props.automationLane.id)
    const newLaneIdx = automationLanes.findIndex(t => t.id === lane.id)
    
    if (oldLaneIdx === newLaneIdx)
      return
    
    if (oldLaneIdx > -1) {
      automationLanes[oldLaneIdx].show = false
      automationLanes[oldLaneIdx].nodes = []
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
    const {classes} = this.props
    const {verticalScale, selectedNode, setCancelClickAway, deleteNode} = this.context!
    const disabled = !selectedNode || !laneContainsNode(this.props.automationLane, selectedNode)

    if (this.props.automationLane.show) {
      return (
        <React.Fragment>
          <Accordion 
            expanded={this.props.automationLane.expanded}
            className="remove-spacing" 
            style={{width: "100%"}}
          >
            <AccordionSummary 
              className="remove-spacing px-2"
              style={{backgroundColor: "#eee", height: 30}}
              expandIcon={<ExpandMore onClick={this.toggleExpand} />}
            >
              <div className="d-flex justify-content-center align-items-center">
                <IconButton 
                  title="Change automation" 
                  onClick={e => {this.setState({anchorEl : e.currentTarget}); e.stopPropagation()}}
                  className="p-1" 
                  style={{marginRight: 6, backgroundColor: this.props.color}}
                >
                  <img src={automation} style={{width: 14, margin: 0}} />
                </IconButton>
                <Typography style={{fontSize: 14, fontWeight: "bold"}}>
                  {this.props.automationLane.label}
                </Typography>
              </div>
            </AccordionSummary>
            <MouseDownAwayListener onMouseDown={() => setCancelClickAway(true)} onAway={this.onAway}>
              <AccordionDetails className="p-0" style={{backgroundColor:"#ddd", height:(100 * verticalScale) - 30}}>
                <div 
                  className="py-0 scrollbar2 thin-thumb d-flex" 
                  style={{width: "100%", height: "100%", overflowY: "auto", flexDirection: "column"}}
                >
                  <div className="mt-2" style={{flexGrow: 1}}>
                    <form onSubmit={this.onSubmit} className="d-flex justify-content-center align-items-center">
                      <IconButton 
                        type="submit" 
                        className="p-0" 
                        style={{backgroundColor: "var(--color-primary)", marginRight: 8}}
                      >
                        <Add style={{fontSize: 16, color: "#fff"}} />
                      </IconButton>
                      <input
                        value={this.state.pos.value}
                        onChange={e => this.setState({pos: {
                          value: e.target.value, 
                          valid: e.target.value === "" || TimelinePosition.isStringValid(e.target.value)
                        }})}
                        placeholder="0.0.000"
                        style={{
                          borderRadius: 5, 
                          border: "none", 
                          backgroundColor: this.state.pos.valid ? "#fff9" : "#f002",
                          color: this.state.pos.valid ? "#000" : "#f00",
                          outline: "none",
                          fontSize: 14,
                          width: 60,
                          textAlign: "center",
                          marginRight: 8,
                          boxShadow: "0 1px 2px 1px #0004"
                        }}
                      />
                      <input
                        value={this.state.value.value}
                        onChange={e => this.setState({value: {value: e.target.value, valid: !isNaN(Number(e.target.value))}})}
                        placeholder="Val"
                        style={{
                          borderRadius: 5, 
                          border: "none", 
                          backgroundColor: this.state.value.valid ? "#fff9" : "#f002",
                          color: this.state.value.valid ? "#000" : "#f00",
                          outline: "none",
                          fontSize: 14,
                          width: 35,
                          textAlign: "center",
                          boxShadow: "0 1px 2px 1px #0004"
                        }}
                      />
                    </form>
                  </div>
                  <div 
                    className="d-flex align-items-center px-2 py-0 col-12 mt-2 mb-2"
                    style={{opacity: laneContainsNode(this.props.automationLane, selectedNode) ? 1 : 0.5}}
                  >
                    <IconButton 
                      disabled={disabled}
                      style={{padding: 2, marginRight: 8, backgroundColor: "#0003"}}
                      onClick={() => {if (selectedNode) deleteNode(selectedNode)}}
                    >
                      <Delete style={{fontSize: 14, color: "#0008"}} />
                    </IconButton>
                    <ConfirmationInput
                      disabled={disabled}
                      onChange={e => this.setState({valueInputText: e.target.value})}
                      onConfirm={this.onConfirm}
                      style={{height: 20, marginRight: 8}}
                      value={this.state.valueInputText}
                    />
                    <Slider 
                      classes={{valueLabel: classes.valueLabel, thumb: classes.thumb}}
                      className="remove-spacing"
                      disabled={disabled}
                      label={this.state.sliderValue.toFixed(2)}
                      min={this.props.automationLane.minValue}
                      max={this.props.automationLane.maxValue}
                      onChange={(e, v) => this.setState({sliderValue: v as number})}
                      onChangeCommitted={this.onChangeCommitted}
                      style={{flex: 1}}
                      value={this.state.sliderValue}
                    />
                  </div>
                </div>
              </AccordionDetails>
            </MouseDownAwayListener>
          </Accordion>
          <Menu
            open={Boolean(this.state.anchorEl)}
            anchorEl={this.state.anchorEl}
            onClose={() => this.setState({anchorEl : null})}
            className="p-0"
          >
            <MenuList className="p-0" dense style={{outline: "none"}}>
              <MenuItem key={this.props.automationLane.id} onClick={() => this.setState({anchorEl : null})}>
                {this.props.automationLane.label}
              </MenuItem>
              {
                this.getAvailableLanes().map(l => (
                  <MenuItem key={l.id} onClick={() => this.switchLane(l)}>{l.label}</MenuItem>
                ))
              }
              <Divider />
              <MenuItem onClick={this.removeLane}>
                Remove Lane
              </MenuItem>
            </MenuList>
          </Menu>
        </React.Fragment>
      )
    }

    return null
  }
}

export default withStyles(styles)(AutomationLaneTrack);