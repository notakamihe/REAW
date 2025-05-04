import { useContext, useLayoutEffect, useRef, useState } from "react";
import { PreferencesContext, WorkstationContext } from "@/contexts";
import { TimelinePosition, SnapGridSizeOption } from "@/services/types/types";
import { formatDuration, measureSeconds } from "@/services/utils/general";
import { BASE_BEAT_WIDTH, GRID_MIN_INTERVAL_WIDTH } from "@/services/utils/utils";

const TIME_MIN_INTERVAL_WIDTH = 68;
const POS_MIN_INTERVAL_WIDTH = 34;
const POS_MIN_SUBBEAT_INTERVAL_WIDTH = 68;

const unitIntervals = [
  { major: 1, minor: 0.5 },
  { major: 2, minor: 1 },
  { major: 4, minor: 2 },
  { major: 10, minor: 2 },
  { major: 15, minor: 5 },
  { major: 30, minor: 10 },
  { major: 60, minor: 15 }
];

const secondIntervals = [ 
  ...unitIntervals, 
  ...unitIntervals.map(unit => ({ major: unit.major * 60, minor: unit.minor * 60 })) 
];

export default function TimelineRulerGrid() {
  const { darkMode } = useContext(PreferencesContext)!;
  const { autoGridSize, showTimeRuler, snapGridSize, snapGridSizeOption, timelineSettings } = useContext(WorkstationContext)!;

  const [devicePixelRatio, setDevicePixelRatio] = useState(window.devicePixelRatio);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });

  const gridRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLCanvasElement>(null);
  const windowRef = useRef<HTMLElement | null>(null);

  const { width, height } = windowSize;

  useLayoutEffect(() => {
    function handleWindowResize() {
      if (windowRef.current)
        setWindowSize({ width: windowRef.current.clientWidth, height: windowRef.current.clientHeight - 33 });
    }

    windowRef.current = document.getElementById("timeline-editor-window")!;

    const resizeObserver = new ResizeObserver(handleWindowResize);
    resizeObserver.observe(windowRef.current);

    return () => resizeObserver.disconnect();
  }, [])

  useLayoutEffect(() => {
    function updateDevicePixelRatio() {
      setDevicePixelRatio(window.devicePixelRatio);
    }

    const query = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    query.addEventListener("change", updateDevicePixelRatio);

    return () => query.removeEventListener("change", updateDevicePixelRatio);
  }, [devicePixelRatio])

  useLayoutEffect(() => {
    let ctx = timelineRef.current?.getContext("2d");

    if (ctx) {
      ctx.resetTransform();
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }

    ctx = gridRef.current?.getContext("2d");

    if (ctx) {
      ctx.resetTransform();
      ctx.scale(devicePixelRatio, devicePixelRatio);
    }
  }, [width, height, devicePixelRatio])

  useLayoutEffect(() => {
    function drawGrid() {
      const majorColor = window.getComputedStyle(document.body).getPropertyValue("--border9");
      const minorColor = window.getComputedStyle(document.body).getPropertyValue("--border10");
  
      const canvas = gridRef.current;
      const ctx = canvas?.getContext("2d");
  
      if (canvas && ctx && windowRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { horizontalScale, timeSignature } = timelineSettings;
        const beatWidth = BASE_BEAT_WIDTH * horizontalScale * (4 / timeSignature.noteValue);
        
        const snapGridSizeInterval = TimelinePosition.fromSpan(snapGridSize).toFraction() / 1000;
        let minorGridInterval = TimelinePosition.fromSpan(autoGridSize).toFraction() / 1000;
        let majorGridInterval;

        if (minorGridInterval < 2 ** -5)
          minorGridInterval = 2 ** -5;

        if (minorGridInterval <= 0.25 || minorGridInterval >= timeSignature.beats) {
          majorGridInterval = minorGridInterval * 4;
        } else {
          majorGridInterval = timeSignature.beats;
          let factor = 0;

          for (let i = 1; i <= timeSignature.beats; i++) {
            if (timeSignature.beats % i === 0 && i % minorGridInterval === 0 && i > minorGridInterval) {
              majorGridInterval = i;
              if (++factor === 2)
                break;
            }
          }
        }

        const intervalWidth = beatWidth * minorGridInterval;
        let interval = Math.floor(windowRef.current.scrollLeft / intervalWidth);

        while (true) {
          const x = interval * intervalWidth - windowRef.current.scrollLeft;
          
          if (x > windowRef.current.clientWidth)
            break;
          
          const major = interval % (majorGridInterval / minorGridInterval) === 0;
          let draw = true;

          if (!major && intervalWidth < GRID_MIN_INTERVAL_WIDTH) {
            draw = false;
          } else if (snapGridSizeOption > SnapGridSizeOption.Auto && snapGridSizeInterval > minorGridInterval) {
            if (interval % (snapGridSizeInterval / minorGridInterval) !== 0)
              draw = false;
          }

          if (draw) {
            ctx.strokeStyle = major ? majorColor : minorColor;
  
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          interval++;
        }
      }
    }
  
    function drawRuler() {
      const textColor1 = window.getComputedStyle(document.body).getPropertyValue("--border7");
      const textColor2 = window.getComputedStyle(document.body).getPropertyValue("--border6");
      const intervalMarkColor = window.getComputedStyle(document.body).getPropertyValue("--border4");
  
      const canvas = timelineRef.current;
      const ctx = canvas?.getContext("2d");
  
      if (canvas && ctx && windowRef.current) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        if (showTimeRuler) {
          const secondWidth = TimelinePosition.fromSpan(TimelinePosition.durationToSpan(1)).toMargin();
          let majorSecondInterval = 2 ** Math.ceil(Math.log2(TIME_MIN_INTERVAL_WIDTH / secondWidth));
          let minorSecondInterval = 2 ** (Math.ceil(Math.log2(TIME_MIN_INTERVAL_WIDTH / secondWidth)) - 1);
          
          if (majorSecondInterval >= 1) {
            for (const interval of secondIntervals) {
              majorSecondInterval = interval.major;
              minorSecondInterval = interval.minor;
  
              if (majorSecondInterval * secondWidth >= TIME_MIN_INTERVAL_WIDTH)
                break;
            }
          }

          const intervalWidth = secondWidth * minorSecondInterval;
          let interval = Math.floor(windowRef.current.scrollLeft / intervalWidth);
          
          while (true) {
            const x = interval * intervalWidth - windowRef.current.scrollLeft;
            
            if (x > windowRef.current.clientWidth)
              break;
            
            const major = interval % (majorSecondInterval / minorSecondInterval) === 0;
            const seconds = interval * minorSecondInterval;
            const isSecond = seconds % 1 === 0;

            ctx.strokeStyle = intervalMarkColor;
            ctx.fillStyle = isSecond ? textColor1 : textColor2;

            ctx.beginPath();
            ctx.moveTo(x, major && isSecond ? 0 : 17);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();

            if (major) {
              const text = formatDuration(measureSeconds(seconds));
              ctx.font = `${isSecond ? 12 : 10.5}px Abel, Roboto, sans-serif`;
              ctx.fillText(text, isSecond ? x + 3 : x - 1, isSecond ? 14.5 : 15);
            }

            interval++;
          }
        } else {
          const { horizontalScale, timeSignature } = timelineSettings;
          const beatWidth = BASE_BEAT_WIDTH * horizontalScale * (4 / timeSignature.noteValue);
          const measureWidth = beatWidth * timeSignature.beats;

          let majorBeatInterval, minorBeatInterval;

          if (measureWidth < POS_MIN_INTERVAL_WIDTH) {
            const measures = 2 ** Math.ceil(Math.log2(POS_MIN_INTERVAL_WIDTH / measureWidth));
            majorBeatInterval = measures * timeSignature.beats;
            minorBeatInterval = (measures / 2) * timeSignature.beats;
          } else if (beatWidth < POS_MIN_SUBBEAT_INTERVAL_WIDTH) {
            majorBeatInterval = timeSignature.beats;
            minorBeatInterval = 2 ** Math.ceil(Math.log2(POS_MIN_INTERVAL_WIDTH / beatWidth));

            if (Math.log2(timeSignature.beats) % 1 !== 0) {
              for (let i = 1; i < timeSignature.beats; i++) {
                if (timeSignature.beats % i === 0) {
                  minorBeatInterval = i;
                  if (beatWidth * minorBeatInterval >= POS_MIN_INTERVAL_WIDTH)
                    break;
                }
              }
            }
          } else {
            majorBeatInterval = 2 ** Math.ceil(Math.log2(POS_MIN_SUBBEAT_INTERVAL_WIDTH / beatWidth));
            minorBeatInterval = 2 ** (Math.ceil(Math.log2(POS_MIN_SUBBEAT_INTERVAL_WIDTH / beatWidth)) - 1);
          }

          const intervalWidth = beatWidth * minorBeatInterval;
          let interval = Math.floor(windowRef.current.scrollLeft / intervalWidth);
          
          while (true) {
            const x = interval * intervalWidth - windowRef.current.scrollLeft;
            
            if (x > windowRef.current.clientWidth)
              break;
            
            const major = interval % (majorBeatInterval / minorBeatInterval) === 0;
            const beats = interval * minorBeatInterval;
            const isMeasure = beats % timeSignature.beats === 0;
            const isBeat = beats % 1 == 0;

            ctx.strokeStyle = intervalMarkColor;
            ctx.fillStyle = isMeasure ? textColor1 : textColor2;

            if (major || intervalWidth > 3) {
              let y = 17;
  
              if (major) {
                if (isMeasure)
                  y = 0;
                else if (isBeat)
                  y = 6;
                else
                  y = 8;
              }
  
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            
            if (major) {
              const pos = TimelinePosition.fromSpan(TimelinePosition.fractionToSpan(beats * 1000));
              const text = (majorBeatInterval < timeSignature.beats ? pos : pos.measure).toString();

              ctx.font = `${isMeasure ? 12 : isBeat ? 11.5 : 10}px Abel, Roboto, sans-serif`;
              ctx.fillText(text, x + 3, isBeat ? 14.5 : 15);
            }

            interval++;
          }
        }
      }
  
      drawGrid();
    }

    if (windowRef.current)
      windowRef.current.addEventListener("scroll", drawRuler);

    drawRuler();
    
    return () => windowRef.current?.removeEventListener("scroll", drawRuler);
  }, [timelineSettings, snapGridSizeOption, snapGridSize, width, height, devicePixelRatio, darkMode, showTimeRuler])

  return (
    <div className="position-absolute pe-none" style={{ top: 12, width: "fit-content" }}>
      <canvas 
        className="position-relative d-block"
        height={20 * devicePixelRatio} 
        ref={timelineRef} 
        style={{ borderBottom: "1px solid var(--border1)", zIndex: 18, width, height: 21 }} 
        width={width * devicePixelRatio}
      />
      <canvas 
        className="d-block position-relative"
        height={height * devicePixelRatio} 
        ref={gridRef} 
        style={{ zIndex: 11, mixBlendMode: "var(--mix-blend-mode)" as any, width, height }} 
        width={width * devicePixelRatio}
      />
    </div>
  )
} 