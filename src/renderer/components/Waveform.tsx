import React, {useRef, useEffect, createContext, useContext, useMemo} from "react";

export interface WaveformContextType {
  copyFromHost: (el: HTMLCanvasElement) => void;
  registerHost: (el: HTMLCanvasElement | null) => void;
  unregisterHost: () => void;
}

export const WaveformContext = createContext<WaveformContextType | undefined>(undefined);

export const WaveformContainer: React.FC = ({children}) => {
  const hostWaveform = useRef<HTMLCanvasElement | null>(null);

  const copyFromHost = (el: HTMLCanvasElement) => {
    const ctx = el.getContext("2d")!;
    ctx.clearRect(0, 0, el.width, el.height);
    ctx.drawImage(hostWaveform.current!, 0, 0);
  }

  const registerHost = (el: HTMLCanvasElement | null) => {
    if (el) hostWaveform.current = el;
  }

  const unregisterHost = () => {
    hostWaveform.current = null;
  }

  return (
    <WaveformContext.Provider value={{copyFromHost,registerHost, unregisterHost}}>
      {children}
    </WaveformContext.Provider>
  )
}


interface IProps {
  buffer: AudioBuffer | null;
  host?: boolean;
  height: number;
  offset: number;
  width: number;
}

const CHUNK_SIZE = 2500;

const Waveform: React.FC<IProps> = ({buffer, host, height, offset, width}) => {
  const {copyFromHost, registerHost, unregisterHost} = useContext(WaveformContext)!;

  const ref = useRef<HTMLCanvasElement>(null);
  const auxiliaryRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const auxiliaryChunkOffset = useRef<number>(0);
  const chunk = useRef<number>(0);
  const isInWindow = useRef<boolean>(false);

  useEffect(() => {
    if (host) registerHost(ref.current);

    return () => {
      if (host) unregisterHost();
    }
  }, [])

  useEffect(() => {
    if (host && width < CHUNK_SIZE && chunk.current !== 0)
      chunk.current = 0;
    
    ref.current!.width = Math.min(CHUNK_SIZE, width - CHUNK_SIZE * chunk.current);
    auxiliaryRef.current!.width = Math.min(CHUNK_SIZE, width - CHUNK_SIZE * (chunk.current + auxiliaryChunkOffset.current))
  }, [width])
  
  useEffect(() => {
    document.addEventListener("on-editor-window-scroll", checkChunks);
    
    const editorWindow = document.getElementById("timeline-editor-window");
    const containerEl = containerRef.current
    
    if (editorWindow && containerEl) {
      const leftDiff = containerEl.getBoundingClientRect().left - editorWindow.getBoundingClientRect().left;

      if (leftDiff < editorWindow.clientWidth && leftDiff > -containerEl.clientWidth) {
        isInWindow.current = true;
        
        checkChunks();

        drawWaveform(ref.current, CHUNK_SIZE * chunk.current);
        drawWaveform(auxiliaryRef.current, CHUNK_SIZE * (chunk.current + 1));
      } else {
        isInWindow.current = false;

        if (host && width < CHUNK_SIZE) {
          drawWaveform(ref.current, 0);
        }
      }
    }

    var observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          drawWaveform(ref.current, CHUNK_SIZE * chunk.current);
          drawWaveform(auxiliaryRef.current, CHUNK_SIZE * (chunk.current + 1));
        }
      });
    });
    
    observer.observe(document.body, {attributes: true});

    return () => {
      document.removeEventListener("on-editor-window-scroll", checkChunks);
      observer.disconnect();
    };
  }, [width, height, buffer]);

  const checkChunks = () => {
    const editorWindow = document.getElementById("timeline-editor-window");
    const containerEl = containerRef.current;
    const canvasEl = ref.current;
    const auxiliaryCanvasEl = auxiliaryRef.current;
    
    if (editorWindow && containerEl && canvasEl && auxiliaryCanvasEl) {
      const leftDiff = containerEl.getBoundingClientRect().left - editorWindow.getBoundingClientRect().left;
      
      if (leftDiff < editorWindow.clientWidth && leftDiff > -containerEl.clientWidth) {
        const offset = parseFloat(canvasEl.parentElement!.style.left);
        const left = -Math.max(Math.min(0, leftDiff + offset), -width);
        let newChunk = Math.floor(left / CHUNK_SIZE);
        let newAxiliaryChunkOffset = 0; 
        
        canvasEl.style.left = `${CHUNK_SIZE * newChunk}px`;
        
        if (width > CHUNK_SIZE) {
          if (Math.floor((left + editorWindow.clientWidth) / CHUNK_SIZE) > newChunk) {
            auxiliaryCanvasEl.style.display = "block";
            auxiliaryCanvasEl.style.left = `${CHUNK_SIZE * (newChunk + 1)}px`;
            newAxiliaryChunkOffset = 1;
          } else if (Math.floor((left - editorWindow.clientWidth) / CHUNK_SIZE) < newChunk) {
            auxiliaryCanvasEl.style.display = "block";
            auxiliaryCanvasEl.style.left = `${CHUNK_SIZE * (newChunk - 1)}px`;
            newAxiliaryChunkOffset = -1;
          } else {
            auxiliaryCanvasEl.style.display = "none";
          }
        } else {
          auxiliaryCanvasEl.style.display = "none";
          newChunk = 0;
        }

        if (chunk.current !== newChunk || auxiliaryChunkOffset.current !== newAxiliaryChunkOffset || !isInWindow.current) {
          chunk.current = newChunk;
          auxiliaryChunkOffset.current = newAxiliaryChunkOffset
          isInWindow.current = true;

          canvasEl.width = Math.min(CHUNK_SIZE, width - CHUNK_SIZE * newChunk);
          auxiliaryCanvasEl.width = Math.min(CHUNK_SIZE, width - CHUNK_SIZE * (newChunk + newAxiliaryChunkOffset));
          
          drawWaveform(ref.current, CHUNK_SIZE * newChunk);
          drawWaveform(auxiliaryRef.current, CHUNK_SIZE * (newChunk + newAxiliaryChunkOffset))
        }
      }
    }
  }
  
  const drawWaveform = (canvas: HTMLCanvasElement | null, offset: number) => {
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx && buffer) {
      if (host || width > CHUNK_SIZE) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = window.getComputedStyle(document.body).getPropertyValue("--bg10");
  
        let amp = height / 2 / buffer.numberOfChannels;
  
        for (let i = 0; i < buffer.numberOfChannels; i++) {
          const data = buffer.getChannelData(i);
          const step = Math.ceil(data.length / width);
  
          for (let j = 0; j < canvas.width; j++) {
            let min = 1;
            let max = -1;
  
            for (let k = 0; k < step; k++) {
              const datum = data[(j + offset) * step + k] ?? 0;
  
              if (datum < min)
                min = datum;
  
              if (datum > max)
                max = datum;
            }
  
            const y = (1 + min) * amp + (height / 2 * i) - (i * 1);
            const h = Math.max(1, (max - min) * amp);
  
            ctx.fillRect(j, y, 1, h);
          }
        }
      } else {
        copyFromHost(canvas);
      }
    }
  }

  const numChannels = useMemo(() => buffer?.numberOfChannels, [buffer])

  return (
    <div ref={containerRef} style={{position: "absolute", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column"}}>
      <div style={{position: "absolute", left: offset, width: width, height}}>
        <canvas height={height} ref={ref} style={{position: "absolute", top: 0}}></canvas>
        <canvas height={height} ref={auxiliaryRef} style={{position: "absolute", top: 0, display: "none"}}></canvas>
      </div>
      {
        buffer &&
        [...Array(numChannels)].map((_, i) => (
          <div key={i} style={{width: "100%", flex: 1, display: "flex"}}>
            <div style={{width: "100%", borderBottom: "1px solid #0002", margin: "auto"}}></div>
          </div>
        ))
      }
    </div>
  )
};

export default React.memo(Waveform);