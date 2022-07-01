import React from "react";
import ReactDOM from "react-dom";

export interface TooltipProps {
  children : JSX.Element
  open : boolean
  style? : React.CSSProperties
  placement? : {horizontal : "left" | "right" | "center", vertical : "top" | "bottom" | "center"}
  title : string | null | undefined
}

interface IState {
  top : number
  left : number
  width : number
  height : number
  tooltipWidth : number
  tooltipHeight : number
}

export default class Tooltip extends React.Component<TooltipProps, IState> {
  ref : React.MutableRefObject<HTMLElement>
  private tooltipRef : React.RefObject<HTMLDivElement>

  constructor(props : TooltipProps) {
    super(props)

    this.ref = React.createRef() as React.MutableRefObject<HTMLElement>
    this.tooltipRef = React.createRef()

    this.state = {top: 0, left: 0, width: 0, height: 0, tooltipWidth: 0, tooltipHeight: 0}
  }

  componentDidUpdate() {
    const el = this.ref.current

    if (el) {
      const rect = el.getBoundingClientRect()

      if (rect.top !== this.state.top || rect.left !== this.state.left) {
        this.setState({top: rect.top, left: rect.left, width: el.clientWidth, height: el.clientHeight})
      }
    }

    const tooltipEl = this.tooltipRef.current

    if (tooltipEl) {
      const rect = tooltipEl.getBoundingClientRect()

      if (rect.width !== this.state.tooltipWidth || rect.height !== this.state.tooltipHeight) {
        this.setState({tooltipWidth: rect.width, tooltipHeight: rect.height})
      }
    }
  }

  getLeftMargin() {
    if (this.props.placement?.horizontal === "left") {
      return -this.state.tooltipWidth - 10
    } else if (this.props.placement?.horizontal === "right") {
      return 10
    } else {
      return -this.state.tooltipWidth / 2 + (this.ref.current?.clientWidth ?? 0) / 2
    }
  }

  getTopMargin() {
    if (this.props.placement?.vertical === "top") {
      return -this.state.tooltipHeight - 10
    } else if (this.props.placement?.vertical === "bottom") {
      return 10
    } else {
      return -this.state.tooltipHeight / 2 + (this.ref.current?.clientHeight ?? 0) / 2
    }
  }
  
  render() {
    const topMargin = this.getTopMargin()
    const leftMargin = this.getLeftMargin()

    return (
      <React.Fragment>
        {React.cloneElement(this.props.children, {ref: this.ref})}
        {
          this.props.open && Boolean(this.props.title) &&
          ReactDOM.createPortal(
            <div 
              className="p-1 rounded disable-highlighting"
              ref={this.tooltipRef}
              style={{
                backgroundColor: "#000a", 
                fontSize: 11,
                color: "#fff",
                zIndex: 24,
                ...this.props.style,
                position: "absolute", 
                top: this.state.top + topMargin, 
                left: this.state.left + leftMargin,
              }}
            >
              {this.props.title}
            </div>,
            document.getElementById("root")!
          )
        }
      </React.Fragment>
    )
  }
}