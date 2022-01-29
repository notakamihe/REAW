import React from "react";
import {Slider as MuiSlider, SliderProps} from "@mui/material"
import { Tooltip } from ".";
import { inverseLerp } from "renderer/utils/helpers";

interface IProps {
  label? : string
}

interface IState {
  sliding : boolean,
  width : number,
  height : number
}

export default class Slider extends React.Component<IProps & SliderProps, IState> {
  private ref : React.RefObject<Tooltip>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      sliding: false,
      width: 0,
      height: 0
    }

    this.onChangeCommitted = this.onChangeCommitted.bind(this)
  }

  componentDidUpdate() {
    const el = this.ref.current?.ref.current

    if (el) {
      if (this.state.width !== el.clientWidth || this.state.height !== el.clientHeight) {
        this.setState({width: el.clientWidth, height: el.clientHeight})
      }
    }
  }

  getProgressPercentageWidth() {
    const min = this.props.min ?? 0
    const max = this.props.max ?? 100
    const value = this.props.value as number ?? 0

    return this.state.width * inverseLerp(value, min, max)
  }

  onChangeCommitted(e : Event | React.SyntheticEvent<Element, Event>, v : number | number[]) {
    this.setState({sliding: false})
    this.props.onChangeCommitted && this.props.onChangeCommitted(e, v)
  }

  render() {
    const translateX = this.getProgressPercentageWidth()

    return (
      <Tooltip
        open={this.state.sliding}
        placement={{horizontal: "center", vertical: "top"}}
        ref={this.ref}
        style={{transform: `translate(${translateX}px, 0px)`}}
        title={this.props.label}
      >
        <MuiSlider
          {...this.props}
          onChangeCommitted={this.onChangeCommitted}
          onMouseDown={e => {this.setState({sliding: true}); this.props.onMouseDown && this.props.onMouseDown(e)}}
        />
      </Tooltip>
    )
  }
}