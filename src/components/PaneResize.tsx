import { HTMLAttributes, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

export interface InputPane extends HTMLAttributes<HTMLDivElement> {
  fixed?: boolean;
  handle?: HTMLAttributes<HTMLDivElement>;
  key: string;
  max?: number | string;
  min?: number | string;
  size?: number | string;
}

interface Pane extends InputPane {
  auto: boolean;
  size: number;
}

export interface PaneResizeData {
  active: Pane | null;
  activeNext: Pane | null;
  panes: Pane[];
}

interface IProps extends HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical";
  onPaneResize?: (resizeData: PaneResizeData) => void;
  onPaneResizeStop?: (resizeData: PaneResizeData) => void;
  panes: InputPane[];
}

export default function PaneResize(props: IProps) {
  const { direction, onPaneResize, onPaneResizeStop, panes: inputPanes, style, ...rest } = props;

  const [activePaneData, setActivePaneData] = useState({ idx: -1, nextIdx: -1, availableSize: 0 });
  const [entries, setEntries] = useState<ResizeObserverEntry[]>([]);
  const [panes, setPanes] = useState<Pane[]>([]);
  const [prevInputPanes, setPrevInputPanes] = useState<InputPane[]>([]);
  const [tempPanes, setTempPanes] = useState<Pane[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const prevContainerSize = useRef(0);

  useEffect(() => {
    const observer = new ResizeObserver(setEntries);
    observer.observe(containerRef.current!);
    return () => observer.disconnect();
  }, [])

  useEffect(() => {
    const containerEl = containerRef.current!;
    const containerSize = direction === "vertical" ? containerEl.clientHeight : containerEl.clientWidth;
    
    const newPanes: Pane[] = [];
    const canStretch: boolean[] = [];
    
    let oldTotalSize = 0;
    let availableNewAutoSize = containerSize;
    let numNewAutoPanes = 0;

    for (let i = 0; i < inputPanes.length; i++) {
      const existingPane = panes.find(pane => pane.key === inputPanes[i].key);
      const previous = prevInputPanes.find(pane => pane.key === inputPanes[i].key);
      const min = getAbsoluteSize(inputPanes[i].min ?? 10);
      const max = getAbsoluteSize(inputPanes[i].max ?? Infinity);

      let size = existingPane ? existingPane.size : 0;

      if (inputPanes[i].size !== undefined && (!previous || previous.size !== inputPanes[i].size)) {
        size = getAbsoluteSize(inputPanes[i].size!);
        canStretch.push(false);
      } else {
        canStretch.push(!inputPanes[i].fixed);
      }

      if (size < min)
        size = min;
      if (size > max)
        size = max;

      const pane: Pane = {
        ...inputPanes[i],
        auto: inputPanes[i].size === undefined,
        fixed: !!inputPanes[i].fixed,
        key: inputPanes[i].key,
        max: inputPanes[i].max,
        min: inputPanes[i].min,
        size
      }

      if (existingPane || !pane.auto)
        availableNewAutoSize -= size;
      else
        numNewAutoPanes++;
      
      newPanes.push(pane);
    }

    for (let i = 0; i < panes.length; i++)
      oldTotalSize += panes[i].size;

    let availableUnchangedExistingSize = containerSize;
    let totalUnchangedExistingSize = 0;
    let totalSize = 0;

    for (let i = 0; i < newPanes.length; i++) {
      if (panes.find(pane => pane.key === newPanes[i].key)) {
        if (canStretch[i])
          totalUnchangedExistingSize += newPanes[i].size;
        else
          availableUnchangedExistingSize -= newPanes[i].size;
      } else {
        if (newPanes[i].auto) {
          const min = getAbsoluteSize(newPanes[i].min ?? 10);
          const max = getAbsoluteSize(newPanes[i].max ?? Infinity);
  
          if (availableNewAutoSize <= 1)
            newPanes[i].size = containerSize / newPanes.length;
          else
            newPanes[i].size = availableNewAutoSize / numNewAutoPanes;
  
          if (newPanes[i].size < min)
            newPanes[i].size = min;
          if (newPanes[i].size > max)
            newPanes[i].size = max;
        }

        availableUnchangedExistingSize -= newPanes[i].size;
      }
    }
    
    for (let i = 0; i < newPanes.length; i++) {
      if (
        totalUnchangedExistingSize > availableUnchangedExistingSize || 
        (totalUnchangedExistingSize < availableUnchangedExistingSize && oldTotalSize >= containerSize)
      ) {
        if (panes.find(pane => pane.key === newPanes[i].key)) {
          if (canStretch[i]) {
            const min = getAbsoluteSize(newPanes[i].min ?? 10);
            const max = getAbsoluteSize(newPanes[i].max ?? Infinity);
    
            newPanes[i].size *= availableUnchangedExistingSize / totalUnchangedExistingSize;
    
            if (newPanes[i].size < min)
              newPanes[i].size = min;
            if (newPanes[i].size > max)
              newPanes[i].size = max;
          }
        }
      }

      totalSize += newPanes[i].size;
    }

    stretchPanes(newPanes.filter((pane, idx) => {
      if (panes.find(p => p.key === pane.key) && oldTotalSize < containerSize && totalSize < containerSize)
        return false;
      return canStretch[idx];
    }), containerSize - totalSize);

    setPanes(newPanes);
    setPrevInputPanes(inputPanes);
  }, [inputPanes])

  useEffect(() => {
    function handleResize(e: MouseEvent) {
      const { idx, nextIdx, availableSize } = activePaneData;

      if (idx > -1) {
        const newTempPanes = tempPanes.slice();
        const newPanes = panes.slice();

        const min = getAbsoluteSize(newPanes[idx].min ?? 10)!;
        const max = getAbsoluteSize(newPanes[idx].max ?? availableSize)!;
        const movement = direction === "vertical" ? e.movementY : e.movementX;
        let tempNewSize = newTempPanes[idx].size + movement;
        let newSize = Math.min(max, Math.max(min, tempNewSize, 0), availableSize);

        if (nextIdx > -1) {
          if (newPanes[idx].size + newPanes[nextIdx].size + 1 >= availableSize) {
            const nextMin = getAbsoluteSize(newPanes[nextIdx].min ?? 10)!;
            const nextMax = getAbsoluteSize(newPanes[nextIdx].max ?? availableSize)!;

            if (availableSize - newSize < nextMin)
              newSize = availableSize - nextMin;
            else if (availableSize - newSize > nextMax)
              newSize = availableSize - nextMax;
            
            newTempPanes[nextIdx] = { ...newTempPanes[nextIdx], size: availableSize - tempNewSize };
            newPanes[nextIdx] = { ...newPanes[nextIdx], size: availableSize - newSize };
          }
        }
        
        newTempPanes[idx] = { ...newTempPanes[idx], size: tempNewSize };
        newPanes[idx] = { ...newPanes[idx], size: newSize };

        flushSync(() => {
          setTempPanes(newTempPanes);
          setPanes(newPanes);
        });
        onPaneResize?.({ active: newPanes[idx], activeNext: newPanes[nextIdx], panes: newPanes });
      }
    }

    function handleResizeStop(e: MouseEvent) {
      if (e.button === 0) {
        document.body.style.cursor = "";
        document.body.classList.remove("force-cursor");

        onPaneResizeStop?.({ 
          active: panes[activePaneData.idx], 
          activeNext: panes[activePaneData.idx + 1], 
          panes 
        });
        setActivePaneData({ idx: -1, nextIdx: -1, availableSize: 0 });
      }
    }

    if (activePaneData.idx > -1) {
      document.addEventListener("mousemove", handleResize);
      document.addEventListener("mouseup", handleResizeStop);
    }

    return () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeStop);
    }
  }, [activePaneData, panes, tempPanes])

  useEffect(() => {
    if (entries.length > 0) {
      const containerSize = direction === "vertical" 
        ? entries[0].target.clientHeight 
        : entries[0].target.clientWidth;
  
      if (activePaneData.idx === -1 && prevContainerSize.current !== containerSize) {
        if (prevContainerSize.current > 0) {
          const newPanes = panes.slice();
          let totalPaneSize = 0;
    
          for (let i = 0; i < newPanes.length; i++)
            totalPaneSize += newPanes[i].size;
        
          if (!(totalPaneSize < prevContainerSize.current - 1 && totalPaneSize < containerSize)) {
            let panesToStretch = newPanes.filter(pane => {
              if (!pane.fixed) {
                if (containerSize < totalPaneSize) {
                  if (pane.size > getAbsoluteSize(pane.min ?? 10)!)
                    return true;
                } else {
                  if (pane.size < getAbsoluteSize(pane.max ?? Infinity)!)
                    return true;
                }
              }
      
              return false;
            });
  
            stretchPanes(panesToStretch, containerSize - totalPaneSize);
            setPanes(newPanes);
            onPaneResizeStop?.({ active: null, activeNext: null, panes: newPanes });
          }
        }
        
        prevContainerSize.current = containerSize;
      }
    }
  }, [entries])

  function getAbsoluteSize(size: string | number) {
    const containerSize = direction === "vertical" 
      ? containerRef.current!.clientHeight 
      : containerRef.current!.clientWidth;

    if (typeof size === "string") {
      if (/^(\d+(\.\d+)?|100)%$/.test(size))
        return parseFloat(size) / 100 * containerSize;
      return parseFloat(size);
    } else {
      return size;
    }
  }

  function handleResizeStart(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 0) {
      document.body.style.cursor = direction === "vertical" ? "ns-resize" : "ew-resize";
      document.body.classList.add("force-cursor");

      const containerEl = containerRef.current!;
      const containerSize = direction === "vertical" ? containerEl.clientHeight : containerEl.clientWidth;
      const data = { idx: -1, nextIdx: -1, availableSize: containerSize };
  
      for (let i = 0; i < panes.length; i++) {
        if (panes[i].key === e.currentTarget.parentElement!.dataset.key) {
          data.idx = i;
          data.nextIdx = i + 1;
        } else if (i !== data.nextIdx) {
          data.availableSize -= panes[i].size;
        }
      }
      
      setActivePaneData(data);
      setTempPanes(panes);
    }
  }

  function stretchPanes(panes: Pane[], value: number) {
    let remaining = Math.abs(value);

    while (remaining > Number.EPSILON) {
      const numPanesToStretch = panes.filter(pane => {
        if (value > 0)
          return pane.size < getAbsoluteSize(pane.max ?? Infinity);
        else
          return pane.size > getAbsoluteSize(pane.min ?? 10);
      }).length;

      if (numPanesToStretch === 0)
        break;

      const each = remaining / numPanesToStretch;

      for (let i = 0; i < panes.length; i++) {
        if (value > 0) {
          const max = getAbsoluteSize(panes[i].max ?? Infinity);
          
          if (panes[i].size + each > max) {
            remaining -= max - panes[i].size;
            panes[i].size = max;
          } else {
            remaining -= each;
            panes[i].size += each;
          }
        } else {
          const min = getAbsoluteSize(panes[i].min ?? 10);

          if (panes[i].size - each < min) {
            remaining -= panes[i].size - min;
            panes[i].size = min;
          } else {
            remaining -= each;
            panes[i].size -= each;
          }
        }
      }
    }
  }

  return (
    <div 
      {...rest}
      ref={containerRef}
      style={{ 
        width: "100%", 
        height: "100%", 
        display: "flex", 
        flexDirection: direction === "vertical" ? "column" : "row",
        ...style 
      }}
    >
      {panes.map((pane, index) => {
        const { auto, children, fixed, handle, key, min, max, size, ...rest } = pane;
        const style = direction === "vertical" ?
          { width: "100%", ...rest.style, height: size } :
          { height: "100%", ...rest.style, width: size };

        return (
          <div {...rest} data-key={key} key={key} style={{ position: "relative", ...style }}>
            {children}
            {index < panes.length - 1 && (
              <div
                {...handle}
                onMouseDown={e => { handleResizeStart(e); handle?.onMouseDown?.(e) }}
                style={{ 
                  position: "absolute",
                  inset: direction === "vertical" ? "auto auto -5px 0" : "0 -5px auto auto",
                  width: direction === "vertical" ? "100%" : 10, 
                  height: direction === "vertical" ? 10 : "100%", 
                  zIndex: 20,
                  cursor: direction === "vertical" ? "ns-resize" : "ew-resize",
                  ...handle?.style,
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}