import React from "react";
import ReactDOM from "react-dom";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";
import { SnapGridSizeOption } from "renderer/types/types";
import { marginToPos } from "renderer/utils/utils";

interface IProps {
  gridHeight? : number
  style? : React.CSSProperties;
  width : number
  window : HTMLElement | null
}

export default class TimelineComponent extends React.Component<IProps> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  timelineRef : React.RefObject<HTMLCanvasElement>
  gridRef : React.RefObject<HTMLCanvasElement>

  constructor(props : any) {
    super(props)

    this.timelineRef = React.createRef();
    this.gridRef = React.createRef();

    this.onClick = this.onClick.bind(this)
  }

  componentDidMount() {
    this.drawTimeline()
  }

  componentDidUpdate() {
    this.drawTimeline()
  }

  drawGrid() {
    const gridColor = window.getComputedStyle(document.body).getPropertyValue("--border12");
    const gridColor2 = window.getComputedStyle(document.body).getPropertyValue("--border13");

    const {timelinePosOptions, snapGridSize, snapGridSizeOption} = this.context!;
    const canvas = this.gridRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx && this.props.window) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      const beats = timelinePosOptions.timeSignature.beats;
      const scale = timelinePosOptions.horizontalScale;
      const beatWidth = timelinePosOptions.beatWidth * scale * (4 / timelinePosOptions.timeSignature.noteValue);
      const subdivisions = 32;
      const subdivisionWidth = beatWidth / subdivisions;
      const measureWidth = beatWidth * beats;

      const {measures} = TimelinePosition.fromWidth(this.props.window.scrollLeft, timelinePosOptions)
      const offset = this.props.window.scrollLeft - measures * measureWidth
      const numMeasures = Math.ceil(this.props.width / measureWidth) + 1
      const numSubdivisions = numMeasures * beats * subdivisions
      const snapGridFrac = snapGridSizeOption < SnapGridSizeOption.EightMeasures ? null :
        new TimelinePosition(snapGridSize.measures + 1, snapGridSize.beats + 1, snapGridSize.fraction).toFraction(timelinePosOptions);

      const power = -Math.floor(Math.log2(beatWidth / 17));
      let gridFrac = Math.max(1000 * 2 ** power, 1000 / subdivisions);
      let gridFrac2 = gridFrac * 4;
      
      if (Math.log2(beats) % 1 !== 0 && gridFrac >= 500) {
        if (measureWidth < 17) {
          gridFrac = Math.max(beats * 1000 * 2 ** -Math.floor(Math.log2(measureWidth / 17)));
          gridFrac2 = gridFrac * 4;
        } else {
          if (gridFrac >= 1000) {
            for (let i = 1; i <= beats; i++) {
              if (i * beatWidth >= 17 && beats % i === 0) {
                gridFrac = i * 1000;
                break;
              }
            }
          }
          
          if (gridFrac === beats * 1000) {
            gridFrac2 = gridFrac * 4;
          } else if ((beats * 1000) % gridFrac2 !== 0) {
            gridFrac2 = beats * 1000;
          }
        }
      }

      for (let i = 1; i < numSubdivisions; i++) {
        const x = i * subdivisionWidth - offset;
        const interval = TimelinePosition.fromFraction(1000 / subdivisions * i, timelinePosOptions);
        const pos = new TimelinePosition(measures + 1, 1, 0).add(interval.measures, interval.beats, interval.fraction, false, timelinePosOptions);
        const frac = pos.toFraction(timelinePosOptions);

        if (frac % gridFrac === 0 && (!snapGridFrac || frac % snapGridFrac === 0)) {
          ctx.strokeStyle = frac % gridFrac2 === 0 ? gridColor : gridColor2;
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas!.height);
          ctx.stroke();
        }
      }
    }
  }

  drawTimeline() {
    const measureColor = window.getComputedStyle(document.body).getPropertyValue("--border10");
    const beatColor = window.getComputedStyle(document.body).getPropertyValue("--border7");
    const subdivisionColor = window.getComputedStyle(document.body).getPropertyValue("--border9");

    const {timelinePosOptions} = this.context!;
    const canvas = this.timelineRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx && this.props.window) {
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);

      const beats = timelinePosOptions.timeSignature.beats;
      const scale = timelinePosOptions.horizontalScale;
      const beatWidth = timelinePosOptions.beatWidth * scale * (4 / timelinePosOptions.timeSignature.noteValue);
      const subdivisions = 32;
      const subdivisionWidth = beatWidth / subdivisions;
      const measureWidth = beatWidth * beats;

      const {measures} = TimelinePosition.fromWidth(this.props.window.scrollLeft, timelinePosOptions)
      const offset = this.props.window.scrollLeft - measures * measureWidth
      const numMeasures = Math.ceil(this.props.width / measureWidth) + 1
      const numSubdivisions = numMeasures * beats * subdivisions

      const measureFrac = 1000 * beats;
      const power = -Math.floor(Math.log2(beatWidth / 34));
      let gridFrac = Math.max(1000 * 2 ** power, 1000 / subdivisions);

      if (Math.log2(beats) % 1 !== 0 && gridFrac >= 1000) {
        if (measureWidth > 34) {
          for (let i = 1; i <= beats; i++) {
            if (i * beatWidth >= 34 && beats % i === 0) {
              gridFrac = i * 1000;
              break;
            }
          }
        } else {
          gridFrac = Math.max(beats * 1000 * 2 ** -Math.floor(Math.log2(measureWidth / 34)));
        }
      }

      for (let i = 0; i < numSubdivisions; i++) {
        const x = i * subdivisionWidth - offset;
        const interval = TimelinePosition.fromFraction(1000 / subdivisions * i, timelinePosOptions);
        const pos = new TimelinePosition(measures + 1, 1, 0).add(interval.measures, interval.beats, interval.fraction, false, timelinePosOptions);
        const frac = pos.toFraction(timelinePosOptions);

        if (frac % measureFrac === 0) {
          ctx.strokeStyle = beatColor;
          ctx.fillStyle = measureColor;

          ctx.beginPath();

          if (frac % gridFrac === 0) {
            ctx.moveTo(x, 2);
            ctx.lineTo(x, 22);
            ctx.font = "bold 15px 'Teko', 'Roboto', sans-serif"
            ctx.fillText(beatWidth >= 60 ? pos.toString() : (pos.measure).toString(), x + 3, 17)
          } else if (frac % (gridFrac / 2) === 0) {
            ctx.moveTo(x, (measureWidth <= 35 && pos.measure >= 1000) ? 19 : 18)
            ctx.lineTo(x, 22)
          }

          ctx.stroke();
        } else if (frac % gridFrac === 0) {
          if (frac % 1000 === 0) {
            ctx.strokeStyle = beatColor;
            ctx.fillStyle = beatColor;
  
            ctx.beginPath();
            ctx.moveTo(x, 18);
            ctx.lineTo(x, 22);
            ctx.stroke();
  
            if (beatWidth >= 60) {
              ctx.font = "15px 'Teko', 'Roboto', sans-serif";
              ctx.fillText(pos.toString(), x + 3, 17);
            }
          } else if (frac % (gridFrac * 2) === 0) {
            ctx.strokeStyle = subdivisionColor
            ctx.fillStyle = subdivisionColor
  
            ctx.beginPath();
            ctx.moveTo(x, 19);
            ctx.lineTo(x, 22);
            ctx.stroke();
  
            ctx.font = "14px 'Teko', 'Roboto', sans-serif";
            ctx.fillText(pos.toString(), x, 17);
          }
        }
      }
    }

    this.drawGrid();
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
          height={this.props.style?.height} 
          ref={this.timelineRef} 
          style={{position: "sticky", left: 0, borderBottom: "1px solid var(--border1)", pointerEvents: "none"}} 
          width={this.props.width}
        ></canvas>
        {
          ReactDOM.createPortal(
            <canvas
              ref={this.gridRef}
              height={this.props.gridHeight}
              style={{position: "fixed", left: 200, top: 77, zIndex: 8, pointerEvents: "none"}} 
              width={this.props.width}
            ></canvas>,
            document.getElementById("timeline-editor") || document.body
          )  
        }
      </div>
    )
  }
} 
