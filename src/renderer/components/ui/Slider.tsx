import React from "react";
import {Slider as MuiSlider, SliderProps} from "@mui/material"
import { inverseLerp, lerp } from "renderer/utils/general";
import Tooltip, { TooltipProps } from "./Tooltip";

interface IProps {
  label? : string
  labelProps?: Partial<TooltipProps>
  showLabelOnHover? : boolean
}

interface IState {
  hovering : boolean
  sliding : boolean
  thumbRadius : number
}

export default class Slider extends React.Component<IProps & SliderProps, IState> {
  ref : React.RefObject<Tooltip>
  thumbRef : React.MutableRefObject<HTMLElement>

  constructor(props : IProps) {
    super(props)

    this.ref = React.createRef()
    this.thumbRef = React.createRef() as React.MutableRefObject<HTMLElement>

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
        this.thumbRef.current = thumbEl as HTMLElement;
        this.ref.current!.ref.current = thumbEl as HTMLElement

        this.setState({thumbRadius: (this.props.orientation === "vertical" ? thumbEl.clientHeight : thumbEl.clientWidth) / 2})
        this.constrainThumb();
      }
    }
  }

  componentDidUpdate() {
    this.constrainThumb();
  }

  componentWillUnmount() {
    const sliderEl = this.ref.current?.ref.current

    if (sliderEl) {
      const thumbEl = sliderEl.querySelector(".MuiSlider-thumb")
      thumbEl?.removeEventListener("mouseover", () => this.setState({hovering: true}))
      thumbEl?.removeEventListener("mouseout", () => this.setState({hovering: false}))
    } 
  }

  constrainThumb() {
    if (this.thumbRef.current) {
      const thumbOffset = lerp(this.getProgressPercentage(), 0, 100);
      
      if (this.props.orientation === "vertical") {
        this.thumbRef.current.style.transform = `translate(-50%, ${thumbOffset}%)`
      } else {
        this.thumbRef.current.style.transform = `translate(${-thumbOffset}%, -50%)`;
      }
    }
  }

  getProgressPercentage() {
    if (this.props.value !== undefined) {
      return inverseLerp(this.props.value as number, this.props.min ?? 0, this.props.max ?? 100);
    } else {
      if (this.thumbRef.current) {
        return this.props.orientation === "vertical" ? parseInt(this.thumbRef.current.style.bottom) / 100 :
          parseInt(this.thumbRef.current.style.left) / 100;
      }

      return 0;
    }
  }

  onChangeCommitted(e : Event | React.SyntheticEvent<Element, Event>, v : number | number[]) {
    this.setState({sliding: false})
    this.props.onChangeCommitted && this.props.onChangeCommitted(e, v)
  }

  render() {
    const {label, showLabelOnHover, labelProps, ...props} = this.props;

    return (
      <Tooltip
        placement={{horizontal: "center", vertical: "top"}}
        {...labelProps}
        ref={this.ref}
        open={this.state.sliding || (Boolean(showLabelOnHover) && this.state.hovering)}
        title={label}
      >
        <MuiSlider
          {...props}
          onChangeCommitted={this.onChangeCommitted}
          onMouseDown={e => {this.setState({sliding: true}); props.onMouseDown && props.onMouseDown(e)}}
          onChange={(e, v, a) => {props.onChange?.(e, v, a); this.constrainThumb();}}
          sx={{...props.sx, ".MuiSlider-thumb::after": {width: "100%", height: "100%"}}}
        />
      </Tooltip>
    )
  }
}