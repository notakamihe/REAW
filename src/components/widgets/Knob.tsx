import React, { CSSProperties } from "react"
import { Popover } from "@mui/material"
import Tooltip, { TooltipProps } from "@/components/widgets/Tooltip"
import { clamp, inverseLerp, lerp } from "@/services/utils/general"

interface MeterStyle {
  bgColor?: string;
  color?: string;
  width?: number;
  sizeRatio?: number;
}

interface IProps {
  bidirectionalMeter?: boolean;
  classes?: { knob?: string; meter?: string };
  degrees: number;
  disabled?: boolean;
  disableTextInput?: boolean;
  max: number;
  min: number;
  onChange?: (value: number) => void;
  onInput?: (value: number) => void;
  origin?: number;
  rotationOffset?: number;
  scale?: {toNormalized: (value: number) => number, toScale: (t: number) => number}
  showMeter: boolean;
  size: number;
  style?: { indicator?: CSSProperties; knob?: CSSProperties; meter?: MeterStyle };
  title?: string; 
  tooltipProps?: Partial<TooltipProps>;
  value: number;
  valueLabelFormat?: string | ((value: number) => string);
}

interface IState {
  active: boolean;
  anchorEl: HTMLElement | null;
  text: string;
  value: number;
  wheel: boolean;
}

export default class Knob extends React.Component<IProps, IState> {
  static defaultProps: Partial<IProps> = { degrees: 270 };

  ref: React.RefObject<HTMLDivElement | null>;
  timeout: ReturnType<typeof setTimeout> | undefined;

  constructor(props: IProps) {
    super(props);

    this.ref = React.createRef();

    this.state = {
      active: false,
      anchorEl: null,
      text: "",
      value: this.props.value,
      wheel: false
    };

    this.onConfirm = this.onConfirm.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onDoubleClick = this.onDoubleClick.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  componentDidMount() {
    this.ref.current?.addEventListener("wheel", this.onWheel, {passive: false});
  }

  componentDidUpdate(prevProps: Readonly<IProps>): void {
    if (prevProps.value !== this.props.value && this.props.value !== this.state.value)
      this.setState({ value: this.props.value });
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.body.style.cursor = "";
    document.body.classList.remove("force-cursor");
    
    this.ref.current?.removeEventListener("wheel", this.onWheel);
  }

  drawArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
    let start = this.polarToCartesian(x, y, radius, endAngle);
    let end = this.polarToCartesian(x, y, radius, startAngle);
    let largeArcFlag;

    if (endAngle >= startAngle)
      largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    else
      largeArcFlag = endAngle + 360 - startAngle <= 180 ? 0 : 1;

    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;   
}

  getMeterPathData(full: boolean) {
    const sizeRatio = this.props.style?.meter?.sizeRatio || 1.15;
    const width = this.props.style?.meter?.width || 2;
    const size = this.props.size * sizeRatio + width * 4;
    const center = size / 2;
    const degrees = Math.max(0, Math.min(360, this.props.degrees));
    
    if (full) return this.drawArc(center, center, (size - (width * 2)) / 2, 0, degrees);

    const t = this.valueToNormalized(this.state.value);
    
    if (this.props.bidirectionalMeter) {
      const percent = inverseLerp(t, t > 0.5 ? 0.5 : 0, t > 0.5 ? 1 : 0.5);
      const mid = this.props.degrees / 2 
      const start = t > 0.5 ? mid : mid * percent;
      const end = t > 0.5 ? mid + mid * percent : mid;

      return this.drawArc(center, center, (size - (width * 2)) / 2, start, end);
    }

    return this.drawArc(center, center, (size - (width * 2)) / 2, 0, t * degrees);
  }

  getLabel() {
    if (this.props.valueLabelFormat) {
      if (typeof this.props.valueLabelFormat === "string")
        return this.props.valueLabelFormat;
      else return this.props.valueLabelFormat(this.state.value);
    } else {
      return (+this.state.value.toFixed(3)).toString();
    }
  }

  normalizedToValue(normalized: number) {
    if (this.props.scale)
      return this.props.scale.toScale(normalized);
    return lerp(normalized, this.props.min, this.props.max);
  }

  onConfirm() {
    this.setState({anchorEl: null});

    if (!Number.isNaN(parseFloat(this.state.text))) {
      const value = clamp(+parseFloat(this.state.text).toFixed(3), this.props.min, this.props.max);
      this.props.onChange?.(value);
    }
  }

  onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
    if (!this.props.disabled) {
      e.stopPropagation();
      this.setState({ anchorEl: e.currentTarget, text: (+this.state.value.toFixed(3)).toString() });
    }
  }

  onDoubleClick(e: React.MouseEvent) {
    if (!this.props.disabled && this.props.origin !== undefined) {
      const origin = clamp(this.props.origin, this.props.min, this.props.max);
      this.props.onChange?.(origin);  
    }
  }

  onMouseDown(e: React.MouseEvent) {
    if (!this.props.disabled && e.button === 0 && !this.state.anchorEl) {
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.classList.add("force-cursor");
  
      this.setState({active: true});
    }
  }

  onMouseMove(e: MouseEvent) {
    const normalized = clamp(this.valueToNormalized(this.state.value) - 0.005 * e.movementY, 0, 1);
    const value = Math.round(+this.normalizedToValue(normalized) * 10) / 10;

    this.props.onInput?.(value);
    this.setState({ value });
  }

  onMouseUp(e: MouseEvent) {
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);
    document.body.style.cursor = "";
    document.body.classList.remove("force-cursor");

    this.setState({active: false});
    this.props.onChange?.(this.state.value);
  }

  onWheel(e: WheelEvent) {
    if (!this.props.disabled) {
      e.stopPropagation();
      e.preventDefault();
      
      if (!this.state.anchorEl) {
        clearTimeout(this.timeout);
    
        this.setState({active: true, wheel: true});
    
        const delta = Math.max(-10, Math.min(e.deltaY, 10));
        const normalized = clamp(this.valueToNormalized(this.state.value) - 0.00125 * delta, 0, 1);
        const value = Math.round(+this.normalizedToValue(normalized) * 10) / 10;
    
        this.props.onInput?.(value);
        this.setState({ value });
    
        this.timeout = setTimeout(() => {
          this.setState({active: false, wheel: false});
          this.props.onChange?.(this.state.value);
        }, 400);
      }
    }
  }

  polarToCartesian(cx: number, cy: number, radius: number, angleInDegrees: number) {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {x: cx + radius * Math.cos(angleInRadians), y: cy + radius * Math.sin(angleInRadians)};
  }

  valueToNormalized(value: number) {
    if (this.props.scale)
      return clamp(this.props.scale.toNormalized(value), 0, 1);
    return inverseLerp(value, this.props.min, this.props.max)
  }

  render() {
    const sizeRatio = this.props.style?.meter?.sizeRatio || 1.15;
    const width = this.props.style?.meter?.width || 2;
    const indicatorRotationDegrees = this.props.degrees * this.valueToNormalized(this.state.value);
    const offsetDegrees = this.props.rotationOffset ?? -this.props.degrees / 2;

    return (
      <>
        <Tooltip open={this.state.active} title={this.getLabel()} {...this.props.tooltipProps}>
          <div
            className={(!this.props.disabled ? "stop-reorder " : "") + this.props.classes?.knob}
            onContextMenu={this.onContextMenu}
            onDoubleClick={this.onDoubleClick}
            onMouseDown={this.onMouseDown}
            ref={this.ref}
            style={{
              width: this.props.size,
              height: this.props.size,
              borderRadius: "50%",
              backgroundColor: "white",
              opacity: this.props.disabled ? 0.5 : 1,
              position: "relative",
              cursor: this.props.disabled ? undefined : this.state.wheel ? "none" : "ns-resize",
              ...this.props.style?.knob
            }}
            title={this.state.wheel ? undefined : this.props.title} 
          >
            <div 
              className="col-12 position-relative h-100"
              style={{ transform: `rotate(${offsetDegrees}deg)` }}
            >
              {this.props.showMeter !== false && (
                <svg 
                  className={"center-absolute pe-none " + this.props.classes?.meter}
                  width={this.props.size * sizeRatio + width * 4}
                  height={this.props.size * sizeRatio + width * 4}
                >
                  <path
                    d={this.getMeterPathData(true)}
                    style={{fill: "#0000", strokeWidth: width, stroke: this.props.style?.meter?.bgColor || "#0000"}}
                  />
                  <path 
                    d={this.getMeterPathData(false)}
                    style={{fill: "#0000", strokeWidth: width, stroke: this.props.style?.meter?.color || "#000"}} 
                  />
                </svg>
              )}
              <div
                className="center-absolute pe-none h-100"
                style={{ transform: `translate(-50%, -50%) rotate(${indicatorRotationDegrees}deg)` }}
              >
                <div
                  style={{
                    position: "absolute",
                    width: this.props.size * 0.25,
                    height: this.props.size * 0.25,
                    top: this.props.size * 0.25,
                    left: 0,
                    backgroundColor: "1px solid #000",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    ...this.props.style?.indicator
                  }}
                />
              </div>
            </div>
          </div>
        </Tooltip>
        <Popover
          anchorEl={this.state.anchorEl}
          anchorOrigin={{horizontal: "right", vertical: "center"}}
          onClose={this.onConfirm}
          onContextMenu={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          open={!!this.state.anchorEl && !this.props.disableTextInput}
          slotProps={{ paper: { style: { borderRadius: 0 } } }}
          transformOrigin={{horizontal: "left", vertical: "center"}}
          transitionDuration={0}
        >
          <form onSubmit={e => { e.preventDefault(); this.onConfirm(); }} style={{ lineHeight: 1 }}>
            <input
              autoFocus
              className="input-2 no-outline px-1"
              onBlur={this.onConfirm}
              onChange={e => this.setState({ text: e.target.value })} 
              onFocus={e => { const el = e.currentTarget; requestAnimationFrame(() => el.select()) }}
              value={this.state.text}
            />
          </form>
        </Popover>
      </>
    )
  }
}