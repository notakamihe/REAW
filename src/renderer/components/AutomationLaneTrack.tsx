import React from "react"
import { Accordion, AccordionDetails, AccordionSummary, Icon, IconButton, List, ListItem, ListItemButton, ListItemText, Menu, MenuItem, MenuList, Popover, Select, SelectChangeEvent, styled, Theme, Typography } from "@mui/material"
import automation from "./../../../assets/svg/automation.svg"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Track } from "./TrackComponent"
import { AutomationNode } from "./AutomationNodeComponent"
import { normalizeHex } from "renderer/utils"
import { ExpandMore } from "@mui/icons-material"

interface IProps {
  automationLane : AutomationLane
  track : Track
  setTrack : (track : Track, callback? : () => void | null) => void
  classes? : any
  color : string
}

export interface AutomationLane {
  id : ID
  label : string
  nodes: AutomationNode[]
  show : boolean
  expanded : boolean
  minValue : number
  maxValue : number
}

interface IState {
  anchorEl : HTMLElement | null
}

class AutomationLaneTrack extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  constructor(props : IProps) {
    super(props)
    
    this.state = {
      anchorEl : null,
    }

    this.toggleExpand = this.toggleExpand.bind(this)
  }

  getAvailableLanes() {
    return this.props.track.automationLanes.filter(t => !t.show)
  }

  toggleExpand = () => {
    const automationLanes = this.props.track.automationLanes.slice()
    const idx = automationLanes.findIndex(t => t.id === this.props.automationLane.id)
    
    automationLanes[idx].expanded = !automationLanes[idx].expanded
    this.props.setTrack({...this.props.track, automationLanes})
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

      this.props.setTrack({...this.props.track, automationLanes})
    }
  }

  removeLane = () => {
    const automationLanes = this.props.track.automationLanes
    const laneIdx = this.props.track.automationLanes.findIndex(l => l.id === this.props.automationLane.id)

    automationLanes[laneIdx].show = false
    automationLanes[laneIdx].nodes = []

    this.props.setTrack({...this.props.track, automationLanes})
    this.setState({anchorEl : null})
  }
  
  render() {
    const {verticalScale} = this.context!

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
            <AccordionDetails 
              style={{
                backgroundColor: "#ddd", 
                height: (100 * verticalScale) - 30
              }}
            >

            </AccordionDetails>
          </Accordion>
          <Menu
            open={Boolean(this.state.anchorEl)}
            anchorEl={this.state.anchorEl}
            onClose={() => this.setState({anchorEl : null})}
            className="p-0"
          >
            <MenuList className="p-0" dense style={{outline: "none"}}>
              <MenuItem 
                key={this.props.automationLane.id}
                onClick={() => this.setState({anchorEl : null})}
              >
                {this.props.automationLane.label}
              </MenuItem>
              {
                this.getAvailableLanes().map(l => (
                  <MenuItem key={l.id} onClick={() => this.switchLane(l)}>{l.label}</MenuItem>
                ))
              }
            </MenuList>
          </Menu>
        </React.Fragment>
      )
    }

    return null
  }
}

export default AutomationLaneTrack