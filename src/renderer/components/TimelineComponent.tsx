import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapGridSize } from "renderer/types/types";
import { marginToPos } from "renderer/utils/utils";

interface IProps {
  style? : React.CSSProperties;
  width : number
  window : HTMLElement | null
}

export default class TimelineComponent extends React.Component<IProps> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  canvasRef : React.RefObject<HTMLCanvasElement>

  constructor(props : any) {
    super(props)

    this.canvasRef = React.createRef()

    this.onClick = this.onClick.bind(this)
  }

  componentDidMount() {
    this.drawTimeline()
  }

  componentDidUpdate() {
    this.drawTimeline()
  }

  drawTimeline() {
    const canvas = this.canvasRef.current
    
    if (canvas) {
      const ctx = canvas.getContext("2d")

      if (ctx && this.props.window) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "#777"
        ctx.lineWidth = 1
        ctx.strokeStyle = "#777"
        
        const options = this.context!.timelinePosOptions

        const beats = options.timeSignature.beats
        const scale = options.horizontalScale
        const subdivisions = 1 / Math.max(SnapGridSize.ThirtySecondBeat, options.snapSize)
        const beatWidth = options.beatWidth * scale * (4 / options.timeSignature.noteValue)
        const subdivisionWidth = beatWidth / subdivisions
        const measureWidth = beatWidth * beats

        const {measures} = TimelinePosition.fromWidth(this.props.window.scrollLeft, options)
        const offset = this.props.window.scrollLeft - measures * measureWidth

        const numMeasures = Math.ceil(this.props.width / measureWidth) + 1
        const numMeasuresToSkip = Math.floor(45 / measureWidth) 
        const power = Math.ceil(Math.sqrt(beatWidth - 130) * 0.091)

        for (let i = 0; i < numMeasures; i++) {
          const x = i * measureWidth - offset
          const measure = i + measures + 1

          if ((measure - 1) % (numMeasuresToSkip + 1) === 0) {
            ctx.beginPath()
            ctx.moveTo(x, 1)
            ctx.lineTo(x, canvas.height)
            ctx.stroke()
  
            ctx.textAlign = "left"
            ctx.fillText(measureWidth >= 70 ? `${measure}.1.0` : (measure).toString(), x + 4, 13)
  
            if (beatWidth >= 12.5 && numMeasuresToSkip === 0) {
              for (let j = 0; j < beats; j++) {
                const beatX = x + j * beatWidth
    
                if (j > 0) {
                  ctx.beginPath()
                  ctx.moveTo(beatX, 26)
                  ctx.lineTo(beatX, canvas.height)
                  ctx.stroke()
    
                  if (beatWidth > 60) {
                    ctx.textAlign = "center"
                    ctx.fillText(`${measure}.${j + 1}.0`, beatX, 24)
                  }
                }
    
                for (let k = 0; k < subdivisions; k++) {
                  const subdivisionsX = beatX + k * subdivisionWidth
    
                  if (k > 0 && k % (subdivisions / 2 ** power) === 0) {
                    ctx.beginPath()
                    ctx.moveTo(subdivisionsX, 30)
                    ctx.lineTo(subdivisionsX, canvas.height)
                    ctx.stroke()

                    ctx.textAlign = "center"
                    ctx.fillText(`${measure}.${j + 1}.${Math.round(k / subdivisions * 1000)}`, subdivisionsX, 29)
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  onClick(e : React.MouseEvent<HTMLDivElement>) {  
    const x = e.clientX - e.currentTarget.getBoundingClientRect().x
    const newCursorPos = marginToPos(x, this.context!.timelinePosOptions)

    newCursorPos.snap(this.context!.timelinePosOptions)

    this.context!.setCursorPos(newCursorPos)
  }

  render() {
    return (
      <div 
        className="d-flex disable-highlighting" 
        onClick={this.onClick}
        onDragStart={e => e.preventDefault()}
        style={{width: "100%", height: "100%", alignItems: "flex-end", ...this.props.style}}
      >
        <canvas 
          height={33} 
          ref={this.canvasRef} 
          style={{position: "sticky", left: 0, borderBottom: "1px solid #777"}} 
          width={this.props.width}
        ></canvas>
      </div>
    )
  }
} 
