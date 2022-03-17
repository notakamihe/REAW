import React from "react";
import {Slider as MuiSlider, SliderProps, SxProps} from "@mui/material"
import { Tooltip } from ".";
import { inverseLerp, lerp } from "renderer/utils/helpers";

interface IProps {
  label? : string
  showLabelOnHover? : boolean
}

interface IState {
  hovering : boolean
  sliding : boolean
  thumbRadius : number
}

export default class Slider extends React.Component<IProps & SliderProps, IState> {
  ref : React.RefObject<Tooltip>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()

    this.state = {
      sliding: false,
      hovering: false,
      thumbRadius: 0
    }

    this.onChangeCommitted = this.onChangeCommitted.bind(this)
  }

  componentDidMount() {
    const sliderEl = this.ref.current?.ref.current
    
    if (sliderEl) {
      const thumbEl = sliderEl.querySelector(".MuiSlider-thumb")
      thumbEl?.addEventListener("mouseover", () => this.setState({hovering: true}))
      thumbEl?.addEventListener("mouseout", () => this.setState({hovering: false}))

      if (thumbEl) {
        this.ref.current!.ref.current = thumbEl as HTMLElement
        this.setState({thumbRadius: (this.props.orientation === "vertical" ? thumbEl.clientHeight : thumbEl.clientWidth) / 2})
      }
    }
  }

  componentWillUnmount() {
    const sliderEl = this.ref.current?.ref.current

    if (sliderEl) {
      const thumbEl = sliderEl.querySelector(".MuiSlider-thumb")
      thumbEl?.removeEventListener("mouseover", () => this.setState({hovering: true}))
      thumbEl?.removeEventListener("mouseout", () => this.setState({hovering: false}))
    } 
  }

  getProgressPercentage() {
    return inverseLerp(this.props.value as number ?? 0, this.props.min ?? 0, this.props.max ?? 100)
  }

  onChangeCommitted(e : Event | React.SyntheticEvent<Element, Event>, v : number | number[]) {
    this.setState({sliding: false})
    this.props.onChangeCommitted && this.props.onChangeCommitted(e, v)
  }

  render() {
    const {label, showLabelOnHover, ...props} = this.props
    const thumbOffset = lerp(this.getProgressPercentage(), 0, this.state.thumbRadius * 2) 
    let sx : any = {...props.sx}

    let muiSliderThumb = {...sx[".MuiSlider-thumb"]} || {}
    muiSliderThumb["transform"] = props.orientation === "vertical" ? `translate(-50%, ${thumbOffset}px)` : `translate(${-thumbOffset}px, -50%)`
    sx[".MuiSlider-thumb"] = muiSliderThumb

    let muiSliderThumbAfter = {...sx[".MuiSlider-thumb::after"]} || {}
    muiSliderThumbAfter["width"] = "100%"
    muiSliderThumbAfter["height"] = "100%"
    sx[".MuiSlider-thumb::after"] = muiSliderThumbAfter

    return (
      <Tooltip
        open={this.state.sliding || (Boolean(showLabelOnHover) && this.state.hovering)}
        placement={{horizontal: "center", vertical: "top"}}
        ref={this.ref}
        title={label}
      >
        <MuiSlider
          {...props}
          onChangeCommitted={this.onChangeCommitted}
          onMouseDown={e => {this.setState({sliding: true}); props.onMouseDown && props.onMouseDown(e)}}
          sx={sx as SxProps}
        />
      </Tooltip>
    )
  }
}