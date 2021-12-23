import { debounce } from "debounce";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { inverseLerp, lerp, normalizeHex } from "renderer/utils";
import { AutomationNodeComponent } from ".";
import { AutomationLane } from "./AutomationLaneTrack";
import { AutomationNode } from "./AutomationNodeComponent";
import { Track } from "./TrackComponent";
import {v4 as uuidv4} from "uuid";

interface IProps {
  lane : AutomationLane
  width : number
  minWidth : number
  color : string
  style? : React.CSSProperties
  track : Track
  setTrack: (track : Track, callback? : () => void | null) => void
}

interface IState {
  height : number
  verticalScale : number
  horizontalScale : number
  show : boolean
  polyPoints : PolyPoint[]
}

interface PolyPoint {
  x : number
  y : number
  node : AutomationNode | null
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
      verticalScale: 0,
      horizontalScale: 0,
      show: false,
      polyPoints: []
    }

    this.onNodeMove = debounce(this.onNodeMove, 10)
  }

  componentDidMount() {
    this.getPolylinePoints()
  }

  componentDidUpdate(prevProps : IProps) {
    if (this.ref.current && this.state.height !== this.ref.current.clientHeight) {
      this.setState({height: (this.ref.current ? this.ref.current.clientHeight : 0)}, () => {
        this.getPolylinePoints()
      })
    }

    if (this.state.verticalScale !== this.context!.verticalScale) {
      this.setState({
        verticalScale: this.context!.verticalScale, 
        height: (this.ref.current ? this.ref.current.clientHeight : 0)
      }, () => {
        this.getPolylinePoints()
      })
    }

    if (this.state.horizontalScale !== this.context!.horizontalScale) {
      this.setState({
        horizontalScale: this.context!.horizontalScale
      }, () => {
        this.getPolylinePoints()
      })
    }

    if (this.state.show !== this.props.lane.show) {
      this.setState({show: this.props.lane.show})
      this.getPolylinePoints()
    }
  }

  getPolylinePoints() {
    const nodes = this.props.lane.nodes
    const points : PolyPoint[] = []

    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i]
      
      const yPercentage = inverseLerp(node.value, this.props.lane.minValue, this.props.lane.maxValue)
      const x = node.pos.toMargin(this.context!.timelinePosOptions)
      const y = (this.state.height - 6) - yPercentage * (this.state.height - 6)

      if (i === 0) {
        points.push({x: 0, y: y + 3, node: null})
      }
      
      points.push({x: x + 3, y: y + 3, node: node})
      
      if (i === nodes.length - 1 && this.ref.current) {
        points.push({x: this.ref.current.clientWidth, y: y + 3, node: null})
      }
    }

    this.setState({polyPoints: points})
  }

  onClick = (e : React.MouseEvent<HTMLDivElement>) => {
    if (e.shiftKey) {
      const x = e.clientX - this.ref.current!.getBoundingClientRect().left
      const y = e.clientY - this.ref.current!.getBoundingClientRect().top

      const {measures, beats, fraction} = TimelinePosition.fromWidth(x, this.context!.timelinePosOptions)
      const pos = new TimelinePosition(measures + 1, beats + 1, fraction)
      const value = lerp(1 - y / this.state.height, this.props.lane.minValue, this.props.lane.maxValue)

      const automationLanes = this.props.track.automationLanes.slice()
      const laneIdx = automationLanes.findIndex(l => l.id === this.props.lane.id)

      automationLanes[laneIdx].nodes.push({id: uuidv4(), pos, value})
      automationLanes[laneIdx].nodes.sort((a, b) => a.pos.compare(b.pos))

      this.props.setTrack({...this.props.track, automationLanes}, () => {
        this.getPolylinePoints()
      })
    }
  }
  
  onNodeMove = (node : AutomationNode) => {
    const points = this.state.polyPoints.slice()
    const pointIdx = points.findIndex(p => p.node?.id === node.id)

    if (pointIdx) {
      const yPercentage = inverseLerp(node.value, this.props.lane.minValue, this.props.lane.maxValue)

      points[pointIdx].x = node.pos.toMargin(this.context!.timelinePosOptions) + 3
      points[pointIdx].y = (this.state.height - 6) - yPercentage * (this.state.height - 6) + 3

      points.sort((a, b) => a.x - b.x)

      points[0].y = points[1].y
      points[points.length - 1].y = points[points.length - 2].y

      this.setState({polyPoints: points})
    }
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
      this.props.setTrack({...this.props.track, automationLanes})
    }
  }

  render() {
    const {verticalScale} = this.context!

    if (this.props.lane.show) {
      return (
        <div
          style={{
            width: this.props.width, 
            minWidth: this.props.minWidth,
            height: this.props.lane.expanded ? 100 * verticalScale : 30,
            backgroundColor: "#fff9",
            borderBottom: `1px solid ${this.props.color}`,
            padding: "3px 0",
            position: "relative",
            ...this.props.style
          }}
        >
          <div 
            ref={this.ref} 
            onClick={this.onClick} 
            style={{width: "100%", height: "100%", position: "relative", marginLeft: -2.5}}
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
                />
              ))
            }
            <svg 
              width="100%" 
              height="100%"
              style={{position: "absolute", top: 0, left: 0, zIndex: 19, pointerEvents: "none"}} 
            >
              <polyline
                points={this.state.polyPoints.map(pp => `${pp.x},${pp.y}`).join(" ")} 
                style={{fill: "none", stroke: this.props.color, strokeWidth: 2}}
              />
            </svg>
          </div>
        </div>
      )
    }

    return null
  }
}