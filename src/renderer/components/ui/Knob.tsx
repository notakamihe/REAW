import React from "react"
import { clamp, degreeToRad, inverseLerp, lerp } from "renderer/utils"

interface IProps {
  size : number
  degrees : number
  offset : number
  min : number
  max : number
  value : number
  onChange : (value : number) => void
  meter : boolean
  style? : React.CSSProperties
  meterStyle? : MeterStyle
  lineStyle? : React.CSSProperties
  bidirectional? : boolean
  discrete? : boolean
  step : number
  title? : string
}

interface IState {
  isDragging : boolean
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

  private canvasArcRef : React.RefObject<HTMLCanvasElement>
  private centerRef : React.RefObject<HTMLDivElement>

  constructor(props: IProps) {
    super(props)

    this.canvasArcRef = React.createRef()
    this.centerRef = React.createRef()

    this.state = {
      isDragging: false
    }
  }

  componentDidMount() {
    this.drawMeter()
  }

  componentDidUpdate() {
    this.drawMeter()
  }

  drawMeter = () => {
    if (this.canvasArcRef.current && this.props.meter) {
      const canvas = this.canvasArcRef.current
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

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
      percentage: Math.abs(slope * (this.props.value - mid)),
      direction: this.props.value > mid ? 1 : -1
    }
  }

  getPercentage = () => {
    return inverseLerp(this.props.value, this.props.min, this.props.max)
  }
  
  onMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, amt : number) => {
    if (this.state.isDragging) {
      let newValue = this.props.value
      
      if (this.props.discrete) {
        const step = Math.abs(amt) >= 1 ? this.props.step * (amt/Math.abs(amt)) : 0
        newValue = clamp(this.props.value + step, this.props.min, this.props.max)
      } else {
        const scale = 0.01 * (this.props.max - this.props.min)
        newValue = clamp(this.props.value + amt * scale, this.props.min, this.props.max)
      }

      this.props.onChange(newValue)
    }
  }

  render() {
    return (
      <div style={{cursor: "ns-resize"}}>
        <div
          title={this.props.title}
          onMouseDown={() => this.setState({isDragging: true})}
          onMouseUp={() => this.setState({isDragging: false})}
          onMouseMove={(e => this.onMouseMove(e, this.getMovement(e)))}
          style={{
            width: this.props.size,
            height: this.props.size,
            borderRadius: this.props.size / 2,
            backgroundColor: "white",
            zIndex: 25,
            ...this.props.style
          }}
        >
          <div style={{width: "100%", height: "100%", position: "relative"}}>
            
            <canvas 
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
              ref={this.centerRef}
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
          </div>
          {
            this.state.isDragging &&
            <div style={{position: "absolute", top: 0, bottom: 0, right: 0, left: 0, zIndex: 20}}></div>
          }
        </div>
      </div>
    )
  }
}