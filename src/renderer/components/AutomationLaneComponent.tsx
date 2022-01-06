import { debounce } from "debounce";
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
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { getPosFromAnchorEl } from "renderer/utils/utils";

interface IProps {
  lane : AutomationLane
  width : number
  minWidth : number
  color : string
  style? : React.CSSProperties
  track : Track
}

interface IState {
  height : number
  movingNode : AutomationNode | null
  anchorEl : HTMLElement | null
}

export default class AutomationLaneComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private ref : React.RefObject<HTMLDivElement>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      height: 0,
      movingNode: null,
      anchorEl: null
    }

    this.onNodeMove = debounce(this.onNodeMove, 10)
  }

  componentDidUpdate(prevProps : IProps) {
    if (this.ref.current && this.state.height !== this.ref.current.clientHeight) {
      this.setState({height: (this.ref.current ? this.ref.current.clientHeight : 0)})
    }
  }

  getPolylinePoints() {
    const nodes = this.props.lane.nodes
    const points = []

    if (this.state.movingNode) {
      const nodeIdx = nodes.findIndex(n => n.id === this.state.movingNode!.id)

      if (nodeIdx !== -1) {
        nodes[nodeIdx] = this.state.movingNode
        nodes.sort((a, b) => a.pos.compare(b.pos))
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      
      const yPercentage = inverseLerp(node.value, this.props.lane.minValue, this.props.lane.maxValue)
      const x = node.pos.toMargin(this.context!.timelinePosOptions)
      const y = (this.state.height - 6) - yPercentage * (this.state.height - 6)

      if (i === 0)
        points.push(`${0},${y + 3}`)
      
      points.push(`${x + 3},${y + 3}`)
      
      if (i === nodes.length - 1 && this.ref.current) {
        points.push(`${this.ref.current.clientWidth},${y + 3}`)
      }
    }

    return points
  }

  onClick = (e : React.MouseEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      const x = e.clientX - this.ref.current!.getBoundingClientRect().left
      const y = e.clientY - this.ref.current!.getBoundingClientRect().top

      const {measures, beats, fraction} = TimelinePosition.fromWidth(x, this.context!.timelinePosOptions)
      const pos = new TimelinePosition(measures + 1, beats + 1, fraction)
      const value = lerp(1 - y / this.state.height, this.props.lane.minValue, this.props.lane.maxValue)

      this.context!.addNodeToLane(this.props.track, this.props.lane, {id: uuidv4(), pos, value})
    }
  }

  onNodeMove = (node : AutomationNode) => {
    this.setState({movingNode: node})
  }

  setNode = (node : AutomationNode) => {
    const nodes = this.props.lane.nodes.slice()
    const nodeIdx = nodes.findIndex(n => n.id === node.id)

    if (nodeIdx !== -1) {
      nodes[nodeIdx] = node
    }

    const automationLanes = this.props.track.automationLanes
    const laneIdx = automationLanes.findIndex(l => l.id === this.props.lane.id)

    if (laneIdx !== -1) {
      automationLanes[laneIdx].nodes = nodes.sort((a, b) => a.pos.compare(b.pos))
      this.context!.setTrack({...this.props.track, automationLanes})
    }

    if (this.context!.selectedNode?.id === node.id) {
      this.context!.setSelectedNode(node)
    }
  }

  render() {
    const {verticalScale, selectedNode, setSelectedNode, onNodeClickAway, cursorPos, pasteNode, timelinePosOptions} = this.context!
    const polylinePoints = this.getPolylinePoints()

    if (this.props.lane.show) {
      return (
        <React.Fragment>
          <AnywhereClickAnchorEl onRightClickAnywhere={e => this.setState({anchorEl: e})}>
            <div
              style={{
                width: this.props.width, 
                minWidth: this.props.minWidth,
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
                      node={n} 
                      lane={this.props.lane} 
                      onChange={this.onNodeMove}
                      setNode={this.setNode}
                      color={this.props.color}
                      isSelected={selectedNode?.id === n.id}
                      onSelect={setSelectedNode}
                      onClickAway={onNodeClickAway}
                      onDragEnd={() => this.setState({movingNode: null})}
                    />
                  ))
                }
                <svg 
                  width="100%" 
                  height="100%"
                  style={{position: "absolute", top: 0, left: 0, zIndex: 19, pointerEvents: "none"}} 
                >
                  <polyline
                    points={polylinePoints.join(" ")} 
                    style={{fill: "none", stroke: this.props.color, strokeWidth: 2}}
                  />
                </svg>
              </div>
            </div>
          </AnywhereClickAnchorEl>
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