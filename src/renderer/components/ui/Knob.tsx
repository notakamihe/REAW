import { Popover, Tooltip } from "@mui/material"
import React from "react"
import { clamp, degreeToRad, inverseLerp, lerp } from "renderer/utils/helpers"

interface IProps {
  bidirectional? : boolean
  disabled? : boolean
  discrete? : boolean
  degrees : number
  lineStyle? : React.CSSProperties
  max : number
  meter : boolean
  meterStyle? : MeterStyle
  min : number
  onChange : (value : number) => void
  origin? : number
  offset : number
  size : number
  step : number
  style? : {container?: React.CSSProperties, knob?: React.CSSProperties}
  title? : string
  value : number
}

interface IState {
  isDragging : boolean
  isScrolling : boolean
  value : number
  anchorEl : HTMLElement | null
  inputValue : string
}

interface MeterStyle {
  lineWidth? : number
  bgColor? : string
  guageColor? : string
}

export default class Knob extends React.Component<IProps, IState> {
  public static defaultProps = {
    offset: 0,
    meter: true,
    step: 1
  }

  private ref : React.RefObject<HTMLDivElement>
  private canvasArcRef : React.RefObject<HTMLCanvasElement>

  private timeoutID : any

  constructor(props: IProps) {
    super(props)

    this.canvasArcRef = React.createRef()
    this.ref = React.createRef()

    this.state = {
      isDragging: false,
      isScrolling: false,
      value: props.value,
      anchorEl: null,
      inputValue: ""
    }
  }

  componentDidMount() {
    this.drawMeter()
    this.ref.current?.addEventListener("wheel", this.onWheel, {passive: false})
  }

  componentDidUpdate(prevProps : IProps) {
    this.drawMeter()

    if (prevProps.value !== this.props.value) {
      this.setState({value: this.props.value})
    }
  }

  componentWillUnmount() {
    this.ref.current?.removeEventListener("wheel", this.onWheel)
  }

  addToValue = (amt : number, change : boolean = false) => {
    let newValue = this.state.value
      
    if (this.props.discrete) {
      const step = Math.abs(amt) >= 1 ? this.props.step * (amt/Math.abs(amt)) : 0
      newValue = clamp(this.state.value + step, this.props.min, this.props.max)
    } else {
      const scale = 0.01 * (this.props.max - this.props.min)
      newValue = clamp(this.state.value + amt * scale, this.props.min, this.props.max)
    }

    newValue = parseFloat(newValue.toFixed(2))

    this.setState({value: newValue} , () => {
      if (change)
        this.props.onChange(newValue)
    })
  }

  drawMeter = () => {
    if (this.canvasArcRef.current) {
      const canvas = this.canvasArcRef.current
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (this.props.meter) {
          if (this.props.bidirectional) {
            ctx.strokeStyle = this.props.meterStyle?.bgColor || '#fff'
            ctx.lineWidth = this.props.meterStyle?.lineWidth || 2
            ctx.beginPath()
            ctx.arc(
              canvas.width / 2, 
              canvas.height / 2, 
              this.props.size * 0.6, 
              3 * Math.PI / 2 - degreeToRad(Math.abs(this.props.degrees) / 2),
              3 * Math.PI / 2 - degreeToRad(Math.abs(this.props.degrees) / 2) + degreeToRad(this.props.degrees)
            )
            ctx.stroke()
  
            const percentageAndDir = this.getPercentageAndDir()
  
            ctx.strokeStyle = this.props.meterStyle?.guageColor || '#5DADE2'
            ctx.lineWidth = this.props.meterStyle?.lineWidth || 2
            ctx.beginPath()
            ctx.arc(
              canvas.width / 2, 
              canvas.height / 2, 
              this.props.size * 0.6, 
              3 * Math.PI / 2,
              3 * Math.PI / 2 + degreeToRad((this.props.degrees / 2) * percentageAndDir.percentage) * percentageAndDir.direction,
              percentageAndDir.direction === -1
            )
            ctx.stroke()
          } else {
            ctx.strokeStyle = this.props.meterStyle?.bgColor || '#fff'
            ctx.lineWidth = this.props.meterStyle?.lineWidth || 2
            ctx.beginPath()
            ctx.arc(
              canvas.width / 2, 
              canvas.height / 2, 
              this.props.size * 0.6, 
              3 * Math.PI / 2 + degreeToRad(this.props.offset), 
              (0.0174533 * this.props.degrees - 1.5708) + degreeToRad(this.props.offset)
            )
            ctx.stroke()
  
            ctx.strokeStyle = this.props.meterStyle?.guageColor || '#5DADE2'
            ctx.lineWidth = this.props.meterStyle?.lineWidth || 2
            ctx.beginPath()
            ctx.arc(
              canvas.width / 2, 
              canvas.height / 2, 
              this.props.size * 0.6, 
              3 * Math.PI / 2 + degreeToRad(this.props.offset),
              (0.0174533 * Math.max(0.001, this.props.degrees * this.getPercentage()) - 1.5708) + degreeToRad(this.props.offset)
            )
            ctx.stroke()
          }
        }
      }
    }
  }

  getMovement = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.discrete) {
      if (Math.abs(e.movementX) > Math.abs(e.movementY))
        return e.movementX
  
      return -e.movementY
    } else {
      return e.movementX - e.movementY
    }
  }
  
  getPercentageAndDir = () => {
    const mid = lerp(0.5, this.props.min, this.props.max)
    const slope = 1 / (this.props.max - mid)

    return {
      percentage: Math.abs(slope * (this.state.value - mid)),
      direction: this.state.value > mid ? 1 : -1
    }
  }

  getPercentage = () => {
    return inverseLerp(this.state.value, this.props.min, this.props.max)
  }

  onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({inputValue: e.target.value})
  }

  onContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    this.setState({anchorEl: this.ref.current, inputValue: this.state.value.toString()})
  }

  onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (this.props.origin !== undefined) {
      const newValue = clamp(this.props.origin, this.props.min, this.props.max)

      this.setState({value: newValue})
      this.props.onChange(newValue)
    }
  }
  
  onMouseMove = (amt : number) => {
    if (this.state.isDragging) {
      this.addToValue(amt)
    }
  }

  onMouseUp = () => {
    this.setState({isDragging: false})
    this.props.onChange(this.state.value)
  }

  onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    let newValue

    if (Number.isNaN(parseFloat(this.state.inputValue)))
      newValue = this.state.value
    else
      newValue = clamp(parseFloat(this.state.inputValue), this.props.min, this.props.max)

    newValue = parseFloat(newValue.toFixed(2))

    this.setState({value: newValue, anchorEl: null})
    this.props.onChange(newValue)
  }

  onWheel = (e : WheelEvent) => {
    const y = e.deltaY > 0 ? -1 : 1
    
    clearInterval(this.timeoutID)
    this.setState({isScrolling: true}, () => {
      this.timeoutID = setTimeout(() => this.setState({isScrolling: false}), 250)
    })
    this.addToValue(y, true)
    
    e.preventDefault()
    e.stopPropagation()
  }

  render() {
    return (
      <div style={this.props.style?.container} title={this.props.title}>
        <div 
          onDragStart={e => e.preventDefault()}
          style={{cursor: "ns-resize", pointerEvents: this.props.disabled ? "none" : "auto"}}
        >
          <div
            ref={this.ref}
            onMouseDown={() => this.setState({isDragging: true})}
            onMouseUp={this.onMouseUp}
            onMouseMove={e => this.onMouseMove(this.getMovement(e))}
            onContextMenu={this.onContextMenu}
            onDoubleClick={this.onDoubleClick}
            style={{
              width: this.props.size,
              height: this.props.size,
              borderRadius: this.props.size / 2,
              backgroundColor: "white",
              opacity: this.props.disabled ? 0.5 : 1,
              ...this.props.style?.knob
            }}
          >
            <Tooltip 
              className="disable-highlighting"
              open={this.state.isDragging || this.state.isScrolling}
              placement="top" 
              title={this.state.value} 
            >
              <div style={{width: "100%", height: "100%", position: "relative"}}>
                <canvas 
                  width={this.props.size * 1.4}
                  height={this.props.size * 1.4}
                  ref={this.canvasArcRef}
                  style={{
                    position: "absolute", 
                    top: "50%", 
                    left: "50%", 
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "none"
                  }}
                ></canvas>
                <div
                  style={{
                    position: "absolute",
                    height: "100%",
                    top: "50%",
                    left: "50%",
                    transform: `translate(-50%, -50%) rotate(${this.props.degrees * this.getPercentage() + 
                      (this.props.bidirectional ? -this.props.degrees / 2 : this.props.offset)}deg)`,
                    pointerEvents: "none"
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      height: 7,
                      top: 8,
                      left: 0,
                      transform: "translate(-50%, -50%)",
                      borderRight: "1px solid #000",
                      ...this.props.lineStyle
                    }}
                  ></div>
                </div>
                {
                  this.state.anchorEl &&
                  <Popover
                    open={Boolean(this.state.anchorEl)}
                    anchorEl={this.state.anchorEl}
                    onClose={e => this.setState({anchorEl: null})}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    style={{marginLeft: 4}}
                  >
                    <form onSubmit={this.onSubmit}>
                      <input 
                        autoFocus
                        value={this.state.inputValue} 
                        onChange={this.onChange} 
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
                  </Popover>
                }
              </div>
            </Tooltip>
            {
              this.state.isDragging &&
              <div style={{position: "fixed", top: 0, bottom: 0, left: 0, right: 0, zIndex: 20}}></div>
            }
          </div>
        </div>
      </div>
    )
  }
}