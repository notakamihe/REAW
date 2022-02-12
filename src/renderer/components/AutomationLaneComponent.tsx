import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { inverseLerp, lerp } from "renderer/utils/helpers";
import { AnywhereClickAnchorEl, AutomationNodeComponent } from ".";
import { AutomationLane } from "./AutomationLaneTrack";
import { AutomationNode } from "./AutomationNodeComponent";
import { Track } from "./TrackComponent";
import {v4 as uuidv4} from "uuid";
import { ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import { MenuIcon } from "./icons";
import { ContentPaste } from "@mui/icons-material";
import ResizeDetector from "react-resize-detector";
import { getPosFromAnchorEl } from "renderer/utils/utils";

interface IProps {
  lane : AutomationLane
  color : string
  style? : React.CSSProperties
  track : Track
}

interface IState {
  anchorEl : HTMLElement | null
  height : number
  width : number
  movingNode : AutomationNode | null
  prevNodes : AutomationNode[]
}

export default class AutomationLaneComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private ref : React.RefObject<HTMLDivElement>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      anchorEl: null,
      height: 0,
      width: 0,
      movingNode: null,
      prevNodes: []
    }
  }

  componentDidUpdate() {
    if (JSON.stringify(this.state.prevNodes) !== JSON.stringify(this.props.lane.nodes)) {
      this.setState({prevNodes: this.props.lane.nodes.slice()})

      if (this.props.lane.nodes.length === 1) {
        if (this.props.lane.isVolume) {
          this.context!.setTrack({...this.props.track, volume: this.props.lane.nodes[0].value})
        } else if (this.props.lane.isPan) {
          this.context!.setTrack({...this.props.track, pan: this.props.lane.nodes[0].value})
        }
      }
    }
  }

  getPolylinePoints() {
    const nodes = this.props.lane.nodes.slice()
    let points : string[] = []

    if (nodes.length > 0) {
      if (this.state.movingNode) {
        const nodeIdx = nodes.findIndex(n => n.id === this.state.movingNode!.id)
  
        if (nodeIdx !== -1) {
          nodes[nodeIdx] = this.state.movingNode
          nodes.sort((a, b) => a.pos.compare(b.pos))
        }
      }
  
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i]
        
        const x = node.pos.toMargin(this.context!.timelinePosOptions)
        const y = this.getY(node.value)
  
        if (i === 0)
          points.push(`${0},${y + 3}`)
        
        points.push(`${x + 3},${y + 3}`)
        
        if (i === nodes.length - 1) {
          points.push(`${this.state.width},${y + 3}`)
        }
      }
    } else {
      if (this.props.lane.isVolume) {
        const y = this.getY(this.props.track.volume)
        points = [`0,${y + 3}`, `${this.state.width},${y + 3}`]
      } else if (this.props.lane.isPan) {
        const y = this.getY(this.props.track.pan)
        points = [`0,${y + 3}`, `${this.state.width},${y + 3}`]
      }
    }

    return points
  }

  getY(value : number) {
    const percentage = inverseLerp(value, this.props.lane.minValue, this.props.lane.maxValue)
    return (this.state.height - 6) - percentage * (this.state.height - 6)
  }

  onClick = (e : React.MouseEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      const x = e.clientX - this.ref.current!.getBoundingClientRect().left
      const y = e.clientY - this.ref.current!.getBoundingClientRect().top

      const {measures, beats, fraction} = TimelinePosition.fromWidth(x, this.context!.timelinePosOptions)
      const pos = new TimelinePosition(measures + 1, beats + 1, fraction)
      const value = lerp(1 - y / this.state.height, this.props.lane.minValue, this.props.lane.maxValue)

      pos.snap(this.context!.timelinePosOptions)
      this.context!.addNodeToLane(this.props.track, this.props.lane, {id: uuidv4(), pos, value})
    }
  }

  onNodeMove = (node : AutomationNode) => {
    this.setState({movingNode: node})
  }

  setNode = (node : AutomationNode) => {
    const automationLanes = this.props.track.automationLanes
    const laneIndex = automationLanes.findIndex(l => l.id === this.props.lane.id)

    if (laneIndex !== -1) {
      const nodeIndex = automationLanes[laneIndex].nodes.findIndex(n => n.id === node.id)

      if (nodeIndex !== -1) {
        automationLanes[laneIndex].nodes[nodeIndex] = node
        automationLanes[laneIndex].nodes.sort((a, b) => a.pos.compare(b.pos))
        this.context!.setTrack({...this.props.track, automationLanes})
        this.setState({movingNode: null})
      }
    }

    if (this.context!.selectedNode?.id === node.id) {
      this.context!.setSelectedNode(node)
    }
  }

  render() {
    const {verticalScale, selectedNode, setSelectedNode, onNodeClickAway, pasteNode, timelinePosOptions} = this.context!
    const polylinePoints = this.getPolylinePoints()
    const strokeWidth = this.props.lane.nodes.length === 0 && (this.props.lane.isVolume || this.props.lane.isPan) ? 1 : 2

    if (this.props.lane.show) {
      return (
        <React.Fragment>
          <ResizeDetector handleWidth handleHeight onResize={(w, h) => this.setState({width: w||0,height: h||0})}>
            <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
              <div
                style={{
                  width: "100%",
                  height: this.props.lane.expanded ? 100 * verticalScale : 30,
                  backgroundColor: "#fff9",
                  borderBottom: `1px solid #0002`,
                  position: "relative",
                  ...this.props.style
                }}
              >
                <div 
                  ref={this.ref} 
                  onClick={this.onClick} 
                  style={{width: "100%", height: "100%", position: "relative", marginLeft: -2}}
                >
                  {
                    this.props.lane.expanded &&
                    this.props.lane.nodes.map(n => (
                      <AutomationNodeComponent 
                        key={n.id} 
                        color={this.props.color}
                        isSelected={selectedNode?.id === n.id}
                        lane={this.props.lane} 
                        node={n} 
                        onClickAway={onNodeClickAway}
                        onMove={this.onNodeMove}
                        onSelect={setSelectedNode}
                        setNode={this.setNode}
                      />
                    ))
                  }
                  <svg 
                    width="100%" 
                    height="100%"
                    style={{position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 10}} 
                  >
                    <polyline
                      points={polylinePoints.join(" ")} 
                      style={{fill: "none", stroke: this.props.color, strokeWidth}}
                    />
                  </svg>
                </div>
              </div>
            </AnywhereClickAnchorEl>
          </ResizeDetector>
          <Menu
            open={Boolean(this.state.anchorEl)}
            anchorEl={this.state.anchorEl}
            onClose={() => this.setState({anchorEl: null})}
            onClick={e => this.setState({anchorEl: null})}
          >
            <MenuList className="p-0" dense style={{outline: "none"}}>
              <MenuItem onClick={e => pasteNode(true, this.props.lane)}>
                <MenuIcon icon={<ContentPaste />} />
                <ListItemText>Paste at Cursor</ListItemText>
              </MenuItem>
              <MenuItem onClick={e => pasteNode(false, this.props.lane, getPosFromAnchorEl(this.state.anchorEl!, timelinePosOptions))}>
                <MenuIcon icon={<ContentPaste />} />
                <ListItemText>Paste</ListItemText>
              </MenuItem>
            </MenuList>
          </Menu>
        </React.Fragment>
      )
    }

    return null
  }
}