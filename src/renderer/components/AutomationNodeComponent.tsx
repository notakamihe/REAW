import { ContentCopy, ContentCut, ContentPaste, Delete, Keyboard, Remove } from "@mui/icons-material";
import { ClickAwayListener, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Popover, Tooltip } from "@mui/material";
import React from "react";
import { DraggableEvent } from "react-draggable";
import { DraggableData, Rnd } from "react-rnd";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { ID } from "renderer/types/types";
import { clamp, inverseLerp, lerp } from "renderer/utils/helpers";
import { GuideLine, MouseDownAwayListener } from ".";
import { AutomationLane } from "./AutomationLaneTrack";
import { MenuIcon } from "./icons";

interface IProps {
  node : AutomationNode
  lane : AutomationLane
  color : string
  onChange? : (node : AutomationNode) => void
  setNode : (node : AutomationNode) => void
  isSelected : boolean
  onSelect : (node : AutomationNode | null) => void
  onClickAway : (node : AutomationNode | null) => void
  onDragEnd? : () => void
}

interface IState {
  pos : TimelinePosition
  value : number
  tempPos : TimelinePosition
  tempValue : number
  prevX : number
  prevY : number
  isDragging : boolean
  isHovering : boolean
  anchorEl : HTMLElement | null
  showInput : boolean
  inputValue : string
  height : number
  verticalScale : number
  guideLineMargin : number
}

export interface AutomationNode {
  id : ID
  pos : TimelinePosition
  value : number
}

const noResizing = {
  left: false, 
  right: false, 
  bottom: false, 
  top: false, 
  topRight: false, 
  topLeft: false, 
  bottomRight: false, 
  bottomLeft: false
}

class AutomationNodeComponent extends React.Component<IProps, IState> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  private ref : React.RefObject<HTMLDivElement>

  height : number = 0

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      pos: this.props.node.pos,
      value: this.props.node.value,
      tempPos: this.props.node.pos,
      tempValue: this.props.node.value,
      prevX: 0,
      prevY: 0,
      isDragging: false,
      isHovering: false,
      anchorEl: null,
      showInput: false,
      inputValue: this.props.node.value.toString(),
      height: 0,
      verticalScale: 0,
      guideLineMargin: 0
    }

    this.onContextMenu = this.onContextMenu.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentDidMount() {
    this.setState({prevX: this.state.pos.toMargin(this.context!.timelinePosOptions), prevY: this.getY()})
  }

  componentDidUpdate() {
    if (this.state.verticalScale !== this.context!.verticalScale) {
      this.setState({
        verticalScale: this.context!.verticalScale, 
        height: (this.ref.current ? this.ref.current.getBoundingClientRect().height - 6 : 0)
      })
    }

    if (this.context!.nodeExternallyChanged && this.context!.selectedNode?.id === this.props.node.id) {
      this.setState({
        value: this.props.node.value,
        tempValue: this.props.node.value
      })
      this.context!.setNodeExternallyChanged(false)
    }
  }

  getTitleText = () => {
    if (this.state.isDragging)
      return `Pos: ${this.state.tempPos.toString()}, Value: ${this.state.tempValue.toFixed(2)}`
    return `Pos: ${this.state.pos.toString()}, Value: ${this.state.value.toFixed(2)}`
  }

  getY = () => {
    const percentage = inverseLerp(this.state.value, this.props.lane.minValue, this.props.lane.maxValue)
    return (this.state.height - this.state.height * percentage)
  }

  onContextMenu = (e : React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    this.setState({anchorEl: e.currentTarget, inputValue: this.state.value.toString()})
  }

  onSubmit = (e : React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    let newValue

    if (Number.isNaN(parseFloat(this.state.inputValue)))
      newValue = this.state.value
    else
      newValue = clamp(parseFloat(this.state.inputValue), this.props.lane.minValue, this.props.lane.maxValue)

    newValue = parseFloat(newValue.toFixed(2))

    this.setState({value: newValue, tempValue: newValue, showInput: false}, this.setNode)

    if (this.props.onChange)
        this.props.onChange({id: this.props.node.id, pos: this.state.pos, value: newValue})
  }

  setNode = () => {
    this.props.setNode({
      id: this.props.node.id,
      pos: this.state.pos,
      value: this.state.value
    })
  }

  render() {
    const {timelinePosOptions, deleteNode} = this.context!
    const y = this.getY()

    const getPosAndValueFromXY = (x : number, y : number) => {
      let pos = TimelinePosition.fromPos(TimelinePosition.start)
      const {measures, beats, fraction} = TimelinePosition.fromWidth(x, timelinePosOptions)
      pos.add(measures, beats, fraction, true, timelinePosOptions)
      
      const value = lerp(1 - y / this.state.height, this.props.lane.minValue, this.props.lane.maxValue)

      return {pos, value}
    }

    const onDrag = (e : DraggableEvent, data : DraggableData) => {
      let {pos, value} = getPosAndValueFromXY(data.x, data.y)
      this.setState({tempPos: pos, tempValue: value, guideLineMargin: data.x + 1})

      if (this.props.onChange)
        this.props.onChange({id: this.props.node.id, pos, value})
    }

    const onDragStart = (e : DraggableEvent, data : DraggableData) => {
      this.props.onSelect(this.props.node) 
      this.setState({isDragging: true})
    }

    const onDragStop = (e : DraggableEvent, data : DraggableData) => {
      let pos = TimelinePosition.fromPos(this.state.pos)
      let value = this.state.value

      if (this.state.prevX !== data.x || this.state.prevY !== data.y) {
        const newPosAndValue = getPosAndValueFromXY(data.x, data.y)

        pos = newPosAndValue.pos
        value = newPosAndValue.value
      }

      this.setState({pos,value:Number(value.toFixed(2)),prevX:data.x,prevY:data.y,isDragging:false}, this.setNode)
      this.props.onDragEnd && this.props.onDragEnd()
    }

    return (
      <ClipboardContext.Consumer>
        {clipboard => (
          <React.Fragment>
            <MouseDownAwayListener onAway={() => this.props.onClickAway(this.props.node)}>
              <Rnd 
                id={this.props.node.id.toString()}
                bounds="parent"
                position={{x: this.state.pos.toMargin(timelinePosOptions), y: y}}
                onDrag={onDrag}
                onDragStart={onDragStart}
                onDragStop={onDragStop}
                size={{width: 6, height: 6}}
                enableResizing={noResizing}
                style={{
                  backgroundColor: this.props.isSelected ? "#fff" : this.props.color, 
                  borderRadius: "50%", 
                  border: "1px solid #0008", 
                  zIndex: 20
                }}
              >
                {
                  this.state.isDragging &&
                  <GuideLine margin={this.state.guideLineMargin} />
                }
                <Tooltip 
                  placement="top"
                  open={this.state.isDragging || this.state.isHovering} 
                  title={this.getTitleText()} 
                >
                  <div 
                    onMouseOver={() => this.setState({isHovering: true})}
                    onMouseLeave={() => this.setState({isHovering: false})}
                    onContextMenu={this.onContextMenu}
                    style={{width: "100%", height: "100%"}}
                  >
                  </div>
                </Tooltip>
                <Menu
                  className="p-0"
                  anchorEl={this.state.anchorEl}
                  open={Boolean(this.state.anchorEl)}
                  onClose={() => this.setState({anchorEl: null})}
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => this.setState({anchorEl: null})}
                >
                  <MenuList className="p-0" dense style={{outline: "none"}}>
                    <MenuItem onClick={e => {
                      clipboard?.copy({item: this.props.node, type: ClipboardItemType.Node, container: this.props.lane.id})
                      deleteNode(this.props.node)
                    }}>
                      <MenuIcon icon={<ContentCut />} />
                      <ListItemText>Cut</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={e => clipboard?.copy({item: this.props.node, type: ClipboardItemType.Node, container: this.props.lane.id})}>
                      <MenuIcon icon={<ContentCopy />} />
                      <ListItemText>Copy</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={(e) => this.setState({anchorEl: null, showInput: true})}>
                      <MenuIcon icon={<Keyboard />} />
                      <ListItemText>Type Value</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={(e) => deleteNode(this.props.node)}>
                      <MenuIcon icon={<Delete />} />
                      <ListItemText>Delete</ListItemText>
                    </MenuItem>
                  </MenuList>
                </Menu>
                {
                  this.state.showInput &&
                  <ClickAwayListener onClickAway={e => this.setState({showInput: false})}>
                    <form 
                      onSubmit={this.onSubmit} 
                      style={{position: "absolute", top: 0, right: -4, transform: "translate(100%, -50%)"}}
                      onMouseDown={e => e.stopPropagation()}
                    >
                      <input 
                        autoFocus
                        value={this.state.inputValue} 
                        onChange={e => this.setState({inputValue: e.target.value})} 
                        style={{
                          backgroundColor: "#fff",
                          width: 40,
                          border: "none",
                          borderRadius: 3,
                          fontSize: 14,
                          outline: "none"
                        }}
                      />
                    </form>
                  </ClickAwayListener>
                }
              </Rnd>
            </MouseDownAwayListener>
            <div ref={this.ref} style={{height: "100%", position: "absolute"}}></div>
          </React.Fragment>
        )}
      </ClipboardContext.Consumer>
    )
  }
}

export default React.memo(AutomationNodeComponent)