import { useRef, useState, useLayoutEffect } from "react";

export interface WaveformProps {
  data: Float32Array[] | null;
  height: number;
  offscreenDrawing?: boolean;
  offset: number;
  onDraw?: (canvas: HTMLCanvasElement | null, auxiliary: HTMLCanvasElement | null) => void; 
  width: number;
}

export const CHUNK_SIZE = 2500;

export default function Waveform(props: WaveformProps) {
  const { data, height, offset, offscreenDrawing, onDraw, width } = props;
  
  const [chunk, setChunk] = useState(0);
  const [forceDrawCount, setForceDrawCount] = useState(0);
  const [showAuxiliary, setShowAuxiliary] = useState(false);
  
  const auxiliaryCanvasRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  const wasInWindow = useRef(false);

  useLayoutEffect(() => {
    checkChunks(true);
  }, [width, height, data, offset, offscreenDrawing]);

  useLayoutEffect(() => {
    function handleScroll() {
      checkChunks();
    }

    const timelineEditorWindow = document.getElementById("timeline-editor-window")!;
    timelineEditorWindow.addEventListener("scroll", handleScroll);
    
    return () => timelineEditorWindow.removeEventListener("scroll", handleScroll);
  }, [width, offscreenDrawing])

  useLayoutEffect(() => {
    drawWaveform(canvasRef.current, chunk);
    if (showAuxiliary)
      drawWaveform(auxiliaryCanvasRef.current, chunk + 1);

    onDraw?.(canvasRef.current, auxiliaryCanvasRef.current);
  }, [forceDrawCount, chunk, showAuxiliary])

  function checkChunks(alwaysRenderWaveform = false) {
    const timelineEditorWindow = document.getElementById("timeline-editor-window")!;
    
    if (timelineEditorWindow && ref.current) {
      const timelineEditorWindowRect = timelineEditorWindow.getBoundingClientRect();
      const rect = ref.current.getBoundingClientRect();
      let isInWindow = rect.right > timelineEditorWindowRect.left && rect.left < timelineEditorWindowRect.right;

      if ((offscreenDrawing || isInWindow) && ref.current.firstElementChild) {
        const waveformContainerRect = ref.current.firstElementChild.getBoundingClientRect();
        isInWindow = waveformContainerRect.left < timelineEditorWindowRect.right && 
                     waveformContainerRect.right > timelineEditorWindowRect.left;
        
        if ((offscreenDrawing || isInWindow)) {
          let newChunk = 0, newShowAuxiliary = false;

          if (width > CHUNK_SIZE) {
            const numChunks = Math.ceil(width / CHUNK_SIZE);
            const scrollPosDistanceFromStart = timelineEditorWindowRect.left - waveformContainerRect.left;
            
            newChunk = Math.floor(scrollPosDistanceFromStart / CHUNK_SIZE);
  
            if (newChunk < 0)
              newChunk = 0;
            else if (newChunk >= numChunks)
              newChunk = numChunks;
  
            if (scrollPosDistanceFromStart + timelineEditorWindow.clientWidth >= CHUNK_SIZE * (newChunk + 1))
              newShowAuxiliary = newChunk < numChunks - 1;
            else
              newShowAuxiliary = false;
          }
  
          setChunk(newChunk);
          setShowAuxiliary(newShowAuxiliary);
  
          if (alwaysRenderWaveform || isInWindow && !wasInWindow.current)
            setForceDrawCount(prev => prev + 1);
        }
      }

      wasInWindow.current = isInWindow;
    } 
  }

  function drawWaveform(canvas: HTMLCanvasElement | null, chunk: number) {
    if (canvas && data) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
  
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "#000";
  
        const numberOfChannels = data.length;
        const maxAmp = height / 2 / numberOfChannels;
  
        for (let i = 0; i < numberOfChannels; i++) {
          const channelData = data[i];
          const start = Math.floor((CHUNK_SIZE * chunk / width) * channelData.length);
          const end = Math.floor(((CHUNK_SIZE * chunk + canvas.width) / width) * channelData.length);
  
          ctx.beginPath();
  
          for (let j = start; j <= end; j++) {
            const x = ((j - start) / (end - start)) * canvas.width;
            const y = maxAmp - (channelData[j] * maxAmp) + (i * (height / 2));
  
            if (j === start)
              ctx.moveTo(x, y);
            ctx.lineTo(x, y);
          } 
  
          ctx.stroke();
        }
      }
    }
  }

  return (
    <div className="position-absolute col-12 overflow-hidden" ref={ref} style={{ top: 0, left: 0, height }}>
      <div style={{ position: "absolute", left: offset, width, height, opacity: 0.5 }}>
        <canvas 
          height={height} 
          ref={canvasRef} 
          style={{ position: "absolute", top: 0, left: CHUNK_SIZE * chunk }} 
          width={Math.min(CHUNK_SIZE, width - CHUNK_SIZE * chunk)} 
        />
        {width > CHUNK_SIZE && showAuxiliary && (
          <canvas 
            height={height} 
            ref={auxiliaryCanvasRef} 
            style={{ position: "absolute", top: 0, left: CHUNK_SIZE * (chunk + 1) }} 
            width={Math.min(CHUNK_SIZE, width - CHUNK_SIZE * (chunk + 1))}
          />
        )}
      </div>
    </div>
  )
}