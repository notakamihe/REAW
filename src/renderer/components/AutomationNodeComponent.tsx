import { Check, ContentCopy, ContentCut, Delete, Keyboard } from "@mui/icons-material";
import { ClickAwayListener, ListItemText, Menu, MenuItem, MenuList } from "@mui/material";
import React from "react";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { clamp, inverseLerp, lerp } from "renderer/utils/helpers";
import { DNR, GuideLine } from ".";
import { AutomationLane } from "./AutomationLaneTrack";
import { DNRData } from "./DNR";
import { MenuIcon } from "./icons";
import { ConfirmationInput, Tooltip } from "./ui";

export interface AutomationNode {
  id : string
  pos : TimelinePosition
  value : number
}


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
  showInput : boolean
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
      showInput: false,
      tempNode: null
    }

    this.onDrag = this.onDrag.bind(this)
    this.onDragStart = this.onDragStart.bind(this)
    this.onDragStop = this.onDragStop.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
  }

  componentDidMount() {
    const parentEl = this.ref.current?.ref.current?.parentElement

    if (parentEl) {
      this.setState({height: parentEl.clientHeight - 6})
    }
  }

  componentDidUpdate() {
    const parentEl = this.ref.current?.ref.current?.parentElement

    if (parentEl && this.state.height !== parentEl.clientHeight - 6) {
      this.setState({height: parentEl.clientHeight - 6})
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

  onSubmit(e : React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    
    const inputValue = parseFloat(this.state.inputValue)

    if (!Number.isNaN(inputValue)) {
      const value = Number(clamp(inputValue, this.props.lane.minValue, this.props.lane.maxValue).toFixed(2))
      const newTempNode = {...this.props.node, value}

      this.setState({tempNode: newTempNode})
      this.props.setNode({...this.props.node, value})
      this.props.onMove && this.props.onMove(newTempNode)
    }

    this.setState({showInput: false})
  }

  valueToY() {
    const percentage = inverseLerp(this.props.node.value, this.props.lane.minValue, this.props.lane.maxValue)
    return (this.state.height - this.state.height * percentage)
  }

  render() {
    const {timelinePosOptions, deleteNode} = this.context!
    const posMargin = this.props.node.pos.toMargin(timelinePosOptions)
    const title = this.getTitle()
    const y = this.valueToY()

    return (
      <ClipboardContext.Consumer>
        {clipboard => (
          <React.Fragment>
            <DNR
              coords={{startX: posMargin, startY: y, endX: posMargin + 6, endY: y + 6}}
              disableResizing
              onClickAway={() => this.props.onClickAway(this.props.node)}
              onContextMenu={e => {e?.stopPropagation();this.setState({anchorEl: e!.currentTarget as HTMLElement})}}
              onDrag={this.onDrag}
              onDragStart={this.onDragStart}
              onDragStop={this.onDragStop}
              ref={this.ref}
              style={{
                backgroundColor: this.props.isSelected ? "#fff" : this.props.color, 
                borderRadius: "50%", 
                border: "1px solid #0008", 
                zIndex: this.props.isSelected ? 12 : 11,
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
                  <MenuItem onClick={(e) => this.setState({showInput: true, inputValue: this.props.node.value.toFixed(2)})}>
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
                  <div style={{position: "absolute", top: 0, right: -8, transform: "translate(100%, -50%)"}}>
                    <ConfirmationInput
                      onChange={e => this.setState({inputValue: e.target.value})} 
                      onConfirm={this.onSubmit}
                      value={this.state.inputValue} 
                    />
                  </div>
                </ClickAwayListener>
              }
            </DNR>
            {this.state.isDragging && <GuideLine margin={this.state.guideLineMargin} />}
          </React.Fragment>
        )}
      </ClipboardContext.Consumer>
    )
  }
}

export default React.memo(AutomationNodeComponent)