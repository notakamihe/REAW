import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import React from "react";
import styled from "styled-components";

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
  select? : string
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
  select? : React.CSSProperties
}


const Select = styled.select`
  ${
    (props : {$showarrrow? : boolean}) => 
    !props.$showarrrow ? "-webkit-appearance: none; -moz-appearance: none; text-indent: 1px; text-overflow: '';" : ""
  }
`

interface IProps {
  actionIcon? : JSX.Element
  children : JSX.Element[]
  classes? : SelectSpinBoxClasses
  defaultText? : string
  enableOptions : boolean
  hoverStyle? : SelectSpinBoxStyles
  icon? : JSX.Element
  onChange : (value : string | number) => void
  showArrow : boolean
  showButtons : boolean
  style? : SelectSpinBoxStyles
  title? : string
  value: string | number
}

interface IState {
  hovering : boolean
  isHoveringOverIcon : boolean
}

export default class SelectSpinBox extends React.Component<IProps, IState> {
  static defaultProps = {
    enableOptions: true,
    showArrow: false,
    showButtons: true
  }

  private ref : React.RefObject<HTMLDivElement>

  constructor(props : IProps) {
    super(props);

    this.ref = React.createRef()

    this.state = {
      hovering: false,
      isHoveringOverIcon: false,
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
      style.select = {...style.select, ...this.props.hoverStyle.select}
    }

    return style
  }

  handleNext() {
    if (this.props.children) {
      const idx = this.props.children.findIndex(o => o.props.value === this.props.value)
  
      if (idx < this.props.children.length - 1) {
        this.props.onChange(this.props.children[idx + 1].props.value)
      }
    }
  }

  handlePrev() {
    if (this.props.children) {
      const idx = this.props.children.findIndex(o => o.props.value === this.props.value)
  
      if (idx > 0) {
        this.props.onChange(this.props.children[idx - 1].props.value)
      }
    }
  }

  render() {
    const isFirst = this.props.children && this.props.children[0]?.props.value === this.props.value
    const isLast = this.props.children && this.props.children[this.props.children.length - 1]?.props.value === this.props.value
    const style = this.getStyle()

    return (
      <React.Fragment>
        <div 
          className={`d-flex align-items-center ${this.props.classes?.container}`}
          onMouseOver={() => this.setState({hovering: true})}
          onMouseLeave={() => this.setState({hovering: false})}
          style={style.container}
          title={this.props.title}
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
          <Select
            className="overflow-hidden no-disabled"
            disabled={!this.props.enableOptions}
            onChange={e => {e.stopPropagation(); this.props.onChange(e.target.value)}}
            $showarrrow={this.props.showArrow}
            style={{
              flex: 1, 
              height: "100%", 
              backgroundColor: "#0000", 
              border: "none", 
              outline: "none", 
              cursor: this.props.enableOptions ? "pointer" : "default", 
              fontSize: 14,
              opacity: 1,
              ...style.select
            }}
            value={this.props.value}
          >
            {this.props.children}
          </Select>
          {
            this.props.children?.length > 1 && this.props.showButtons &&
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
      </React.Fragment>
    )
  }
}