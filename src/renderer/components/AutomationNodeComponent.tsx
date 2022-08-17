import { Popover } from "@mui/material";
import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { AutomationLane, AutomationNode } from "renderer/types/types";
import channels from "renderer/utils/channels";
import { clamp, inverseLerp, lerp } from "renderer/utils/general";
import { ipcRenderer } from "renderer/utils/utils";
import { DNR, GuideLine } from ".";
import { DNRData } from "./DNR";
import { ConfirmationInput, Tooltip } from "./ui";

interface IProps {
  color : string
  isSelected : boolean
  lane : AutomationLane
  node : AutomationNode
  onClickAway : (node : AutomationNode) => void
  onMove? : (node : AutomationNode) => void
  onSelect : (node : AutomationNode) => void
  setNode : (node : AutomationNode) => void
}

interface IState {
  anchorEl : HTMLElement | null
  guideLineMargin : number
  height : number
  inputValue : string
  isDragging : boolean
  isHovering : boolean
  tempNode : AutomationNode | null
}

class AutomationNodeComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private ref : React.RefObject<DNR>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      anchorEl: null,
      guideLineMargin: 0,
      height: 0,
      inputValue: this.props.node.value.toString(),
      isDragging: false,
      isHovering: false,
      tempNode: null
    }

    this.onContextMenu = this.onContextMenu.bind(this)
    this.onDrag = this.onDrag.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragStop = this.onDragStop.bind(this)
    this.confirm = this.confirm.bind(this)
  }

  componentDidMount() {
    const parentEl = this.ref.current?.ref.current?.parentElement

    if (parentEl) {
      this.setState({height: parentEl.clientHeight - 8})
    }
  }

  componentDidUpdate() {
    const parentEl = this.ref.current?.ref.current?.parentElement

    if (parentEl && this.state.height !== parentEl.clientHeight - 8) {
      this.setState({height: parentEl.clientHeight - 8})
    }
  }

  confirm(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const inputValue = parseFloat(this.state.inputValue)

    if (!Number.isNaN(inputValue)) {
      const value = Number(clamp(inputValue, this.props.lane.minValue, this.props.lane.maxValue).toFixed(2))
      const newTempNode = {...this.props.node, value}

      this.setState({anchorEl: null, tempNode: newTempNode})
      this.props.setNode({...this.props.node, value})
      this.props.onMove && this.props.onMove(newTempNode)
    } else {
      this.setState({anchorEl: null})
    }
  }

  getPosAndValueFromXY(x : number, y : number) {
    const {measures, beats, fraction} = TimelinePosition.fromWidth(x, this.context!.timelinePosOptions)
    const pos = new TimelinePosition(measures + 1, beats + 1, fraction)
    const value = lerp(1 - y / this.state.height, this.props.lane.minValue, this.props.lane.maxValue)

    return {pos, value: Number(value.toFixed(2))}
  }

  getTitle() {
    if (this.state.isDragging)
      return `Pos: ${this.state.tempNode?.pos.toString()}, Value: ${this.state.tempNode?.value.toFixed(2)}`

    return `Pos: ${this.props.node.pos.toString()}, Value: ${this.props.node.value.toFixed(2)}`
  }

  onContextMenu(e : React.MouseEvent) {
    e.stopPropagation();
    this.props.onSelect(this.props.node)

    ipcRenderer.send(channels.OPEN_NODE_CONTEXT_MENU);

    ipcRenderer.on(channels.DELETE_NODE, () => {
      this.context!.deleteNode(this.props.node)
    })

    ipcRenderer.on(channels.TYPE_NODE_VALUE, () => {
      this.setState({anchorEl: this.ref.current?.ref.current || null})
    })

    ipcRenderer.on(channels.CLOSE_NODE_CONTEXT_MENU, () => {
      ipcRenderer.removeAllListeners(channels.DELETE_NODE)
      ipcRenderer.removeAllListeners(channels.TYPE_NODE_VALUE)
      ipcRenderer.removeAllListeners(channels.CLOSE_NODE_CONTEXT_MENU)
    })
  }

  onDrag(e : MouseEvent, data : DNRData) {
    e.preventDefault();

    let {pos, value} = this.getPosAndValueFromXY(data.coords.startX, data.coords.startY)

    this.props.onMove && this.props.onMove({id: this.props.node.id, pos, value})

    const titlePos = TimelinePosition.fromPos(pos)
    titlePos.snap(this.context!.timelinePosOptions)

    this.setState({tempNode: {id: this.props.node.id, pos: titlePos, value}, guideLineMargin: data.coords.startX + 1})
  }

  onDragStart(e : React.MouseEvent, data : DNRData) {
    this.props.onSelect(this.props.node)
    this.setState({isDragging: true, tempNode: {...this.props.node}, guideLineMargin: data.coords.startX + 1})
  }

  onDragStop(e : MouseEvent, data : DNRData) {
    this.setState({isDragging: false, tempNode: null})

    if (data.deltaWidth !== 0 || data.deltaHeight !== 0) {
      let {pos, value} = this.getPosAndValueFromXY(data.coords.startX, data.coords.startY)
      pos.snap(this.context!.timelinePosOptions)
      this.props.setNode({...this.props.node, pos, value})
    }
  }

  valueToY() {
    const percentage = inverseLerp(this.props.node.value, this.props.lane.minValue, this.props.lane.maxValue)
    return (this.state.height - this.state.height * percentage)
  }

  render() {
    const {snapGridSize, timelinePosOptions} = this.context!
    const posMargin = this.props.node.pos.toMargin(timelinePosOptions)
    const title = this.getTitle()
    const y = this.valueToY()
    const snapWidth = TimelinePosition.fromInterval(snapGridSize).toMargin(timelinePosOptions)
    const snapHeight = this.state.height / ((this.props.lane.maxValue - this.props.lane.minValue) * 8);

    return (
      <React.Fragment>
        <DNR
          coords={{startX: posMargin, startY: y, endX: posMargin + 8, endY: y + 8}}
          disableResizing
          onClickAway={() => this.props.onClickAway(this.props.node)}
          onContextMenu={this.onContextMenu}
          onDrag={this.onDrag}
          onDragStart={this.onDragStart}
          onDragStop={this.onDragStop}
          ref={this.ref}
          snapGridSize={{horizontal: snapWidth || 0.00001, vertical: snapHeight}}
          style={{
            backgroundColor: this.props.isSelected ? "#fff" : this.props.color, 
            borderRadius: "50%", 
            border: "1px solid var(--border11)", 
            zIndex: this.props.isSelected ? 12 : 11,
            transform: "translate(-2px, 0)"
          }}
        >
          <Tooltip 
            open={this.state.isDragging || this.state.isHovering} 
            placement={{horizontal: "center", vertical: "top"}} 
            title={title}
          >
            <div 
              onMouseOver={() => this.setState({isHovering: true})}
              onMouseOut={() => this.setState({isHovering: false})}
              style={{width: "100%", height: "100%"}}
            ></div>
          </Tooltip>
          <Popover 
            anchorEl={this.state.anchorEl} 
            onClose={() => this.setState({anchorEl: null})} 
            open={Boolean(this.state.anchorEl)}
            PaperProps={{style: {transform: "translate(10px, -50%)", backgroundColor: "var(--bg9)"}}}
            transformOrigin={{horizontal: "left", vertical: "top"}}
          >
            <div style={{padding: 4}}>
              <ConfirmationInput
                onChange={e => this.setState({inputValue: e.target.value})} 
                onConfirm={this.confirm}
                value={this.state.inputValue} 
              />
            </div>
          </Popover>
        </DNR>
        {this.state.isDragging && <GuideLine margin={this.state.guideLineMargin - 1} />}
      </React.Fragment>
    )
  }
}

export default React.memo(AutomationNodeComponent)