import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { List, ListItem, ListItemButton, ListItemText, Popover, Typography } from "@mui/material";
import React from "react";

export interface SelectSpinBoxOption {
  value : string | number
  label : string
}

interface SelectSpinBoxClasses {
  actionIcon? : string
  buttonsContainer? : string
  container? : string
  icon? : string
  iconContainer? : string
  next? : string
  nextIcon? : string
  prev? : string
  prevIcon? : string
  text? : string
}

interface SelectSpinBoxStyles {
  actionIcon? : React.CSSProperties
  buttonsContainer? : React.CSSProperties
  container? : React.CSSProperties
  icon? : React.CSSProperties
  iconContainer? : React.CSSProperties
  next? : React.CSSProperties
  nextIcon? : React.CSSProperties
  prev? : React.CSSProperties
  prevIcon? : React.CSSProperties
  text? : React.CSSProperties
}

interface IProps {
  actionIcon? : JSX.Element
  classes? : SelectSpinBoxClasses
  defaultText? : string
  enableMenu : boolean
  hoverStyle? : SelectSpinBoxStyles
  icon? : JSX.Element
  label? : string
  leftClickOpen? : boolean
  onChange : (option : SelectSpinBoxOption) => void
  onClick? : () => void
  options : SelectSpinBoxOption[]
  style? : SelectSpinBoxStyles
  value: any
}

interface IState {
  anchorEl : HTMLElement | null
  hovering : boolean
  isHoveringOverIcon : boolean
}

export default class SelectSpinBox extends React.Component<IProps, IState> {
  static defaultProps = {
    enableMenu: true
  }

  constructor(props : IProps) {
    super(props);

    this.state = {
      anchorEl: null,
      hovering: false,
      isHoveringOverIcon: false
    };

    this.handleNext = this.handleNext.bind(this)
    this.handlePrev = this.handlePrev.bind(this)
  }

  getStyle() : SelectSpinBoxStyles {
    const style : SelectSpinBoxStyles = this.props.style ? {...this.props.style} : {}

    if (this.state.hovering && this.props.hoverStyle) {
      style.actionIcon = {...style.actionIcon, ...this.props.hoverStyle.actionIcon}
      style.buttonsContainer = {...style.buttonsContainer, ...this.props.hoverStyle.buttonsContainer}
      style.container = {...style.container, ...this.props.hoverStyle.container}
      style.icon = {...style.icon, ...this.props.hoverStyle.icon}
      style.iconContainer = {...style.iconContainer, ...this.props.hoverStyle.iconContainer}
      style.next = {...style.next, ...this.props.hoverStyle.next}
      style.nextIcon = {...style.nextIcon, ...this.props.hoverStyle.nextIcon}
      style.prev = {...style.prev, ...this.props.hoverStyle.prev}
      style.prevIcon = {...style.prevIcon, ...this.props.hoverStyle.prevIcon}
      style.text = {...style.text, ...this.props.hoverStyle.text}
    }

    return style
  }

  handleNext() {
    const idx = this.props.options.findIndex(o => o.value === this.props.value)

    if (idx < this.props.options.length - 1) {
      this.props.onChange(this.props.options[idx + 1])
    }
  }

  handlePrev() {
    const idx = this.props.options.findIndex(o => o.value === this.props.value)

    if (idx > 0) {
      this.props.onChange(this.props.options[idx - 1])
    }
  }

  onClick = (e : React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!this.props.leftClickOpen && this.props.onClick) {
      this.props.onClick();
    }
  }

  onOptionClick = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, option : SelectSpinBoxOption) => {
    e.stopPropagation()
    this.props.onChange(option)
    this.setState({anchorEl: null})
  }

  openPopover = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, open : boolean) => {
    if (open && this.props.options.length)
      this.setState({anchorEl: e.currentTarget});
  }

  render() {
    const isFirst = this.props.options[0]?.value === this.props.value
    const isLast = this.props.options[this.props.options.length - 1]?.value === this.props.value
    const style = this.getStyle()

    return (
      <div 
        className={`d-flex align-items-center ${this.props.classes?.container}`}
        onMouseOver={() => this.setState({hovering: true})}
        onMouseLeave={() => this.setState({hovering: false})}
        style={style.container}
      >
        {
          (this.props.icon || this.props.actionIcon) &&
          <div 
            className={`p-1 d-flex justify-content-center align-items-center ${this.props.classes?.iconContainer}`}
            style={{height: "100%", ...style.iconContainer}}
            onMouseOver={() => this.setState({isHoveringOverIcon: true})}
            onMouseOut={() => this.setState({isHoveringOverIcon: false})}
          >
            {
              this.props.icon && (!this.state.isHoveringOverIcon || !this.props.actionIcon) && 
              React.cloneElement(this.props.icon, {
                className: `${this.props.icon.props.className} ${this.props.classes?.icon}`,
                style: {...this.props.icon.props.style, ...style.icon}
              })
            }
            {
              (this.props.actionIcon && (this.state.isHoveringOverIcon || !this.props.icon)) && 
              React.cloneElement(
                this.props.actionIcon, 
                {
                  className: `${this.props.actionIcon.props.className} ${this.props.classes?.actionIcon}`,
                  style: {...this.props.actionIcon.props.style, ...style.actionIcon}
                }
              )
            }
          </div>
        }
        {
          this.props.label &&
          <div className="p-1">
            {this.props.label}
          </div>
        }
        <div 
          onContextMenu={e => {e.stopPropagation(); this.openPopover(e, true)}} 
          onMouseDown={e => {if (this.props.leftClickOpen) this.openPopover(e, Boolean(this.props.leftClickOpen))}} 
          onClick={this.onClick}
          style={{
            flex: 1, 
            height: "100%",
            cursor: (this.props.leftClickOpen || this.props.onClick) ? "pointer" : "default",
            overflow: "hidden",
            display: "flex",
            alignItems: "center"
          }}
        >
          <Typography
            className={`col-12 ${this.props.classes?.text}`}
            style={{fontSize:14, overflow:"hidden", height:18, ...style.text}}
          >
            {
              this.props.options.find(o => o.value === this.props.value)?.label || 
              <span style={{opacity: 0.7}}>{this.props.defaultText}</span>
            }
          </Typography>
          <Popover
            anchorEl={this.state.anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            onClose={e => this.setState({anchorEl: null})}
            open={this.props.enableMenu && Boolean(this.state.anchorEl)}
            style={{width: "100%"}}
            transitionDuration={150}
          >
            <List dense style={{width: "100%"}}>
              {
                this.props.options.map((option, i) => (
                  <ListItemButton key={i} className="p-0 px-2 col-12" onClick={e => this.onOptionClick(e, option)}>
                    <ListItemText>{option.label}</ListItemText>
                  </ListItemButton>
                ))
              }
            </List>
          </Popover>
        </div>
        {
          this.props.options.length > 1 &&
          <div 
            className={`d-flex p-0 ${this.props.classes?.buttonsContainer}`}
            style={{flexDirection: "column", height: "100%", width: 12, ...style.buttonsContainer}}
          >
            <button
              className={`p-0 center-by-flex overflow-hidden ${this.props.classes?.prev}`}
              disabled={isFirst}
              onClick={this.handlePrev}
              style={{height:"50%",width:"100%",backgroundColor:"#333",...style?.prev, opacity: isFirst ? 0.2 : 1}} 
            >
              <ArrowDropUp
                className={this.props.classes?.prevIcon} 
                style={{fontSize: 18, color: "#fff", ...style?.prevIcon}} 
              />
            </button>
            <button
              className={`p-0 center-by-flex overflow-hidden ${this.props.classes?.next}`}
              disabled={isLast}
              onClick={this.handleNext}
              style={{height:"50%",width:"100%",backgroundColor:"#333",...style?.next, opacity: isLast ? 0.2 : 1}} 
            >
              <ArrowDropDown 
                className={this.props.classes?.nextIcon} 
                style={{fontSize: 18, color: "#fff", ...style?.nextIcon}} 
              />
            </button>
          </div>
        }
      </div>
    )
  }
}