import { icon } from "@fortawesome/fontawesome-svg-core"
import { ButtonBase } from "@mui/material"
import React from "react"

interface IProps {
  className?: string
  children?: React.ReactNode
  style? : React.CSSProperties
  icon: React.ReactNode
  align: IconAlign
  onClick? : () => void
}

interface IState {

}

export enum IconAlign {Start, End}

export default class ButtonAndIcon extends React.Component<IProps, IState> {
  public static defaultProps = {
    align: IconAlign.Start
  }

  constructor(props: IProps) {
    super(props)
  }

  render() {
    return (
      <ButtonBase
        onClick={this.props.onClick}
        className={this.props.className}
        style={{display: "flex", alignItems: "center", justifyContent: "center", ...this.props.style}}
      >
        {this.props.align === IconAlign.Start && this.props.icon}
        {this.props.children}
        {this.props.align === IconAlign.End && this.props.icon}
      </ButtonBase>
    )
  }
}