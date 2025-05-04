import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { useResizeDetector } from "react-resize-detector";

interface ScrollbarProps {
  auto?: boolean;
  axis: "x" | "y";
  className?: string;
  showNativeScrollbar?: boolean;
  style?: React.CSSProperties;
  targetEl: HTMLElement | null | undefined;
  thumbClass?: string;
  thumbStyle?: React.CSSProperties;
}

export default function Scrollbar(props: ScrollbarProps) {
  const { auto, axis, className, showNativeScrollbar, style, targetEl, thumbClass, thumbStyle } = props;

  const { ref } = useResizeDetector({ onResize: syncThumbWithTarget });

  const [targetSize, setTargetSize] = useState({ client: 0, scroll: 0 });
  const [thumb, setThumb] = useState({ offset: 0, size: 0 });
  const [thumbDragStartData, setThumbDragStartData] = useState<{ offset: number; mousePos: number; } | null>(null);

  const attractingThumb = useRef(false);
  const mousePos = useRef(0);
  const preventSyncThumb = useRef(false);
  const thumbRef = useRef({ offset: 0, size: 0 });

  useEffect(() => {
    function handleTargetResize() {
      if (targetEl) {
        setTargetSize(prev => {
          const clientSize = axis === "x" ? targetEl.clientWidth : targetEl.clientHeight;
          const scrollSize = axis === "x" ? targetEl.scrollWidth : targetEl.scrollHeight;
  
          if (prev.client !== clientSize || prev.scroll !== scrollSize)
            return { client: clientSize, scroll: scrollSize };
  
          return prev;
        });
      }
    }

    function handleScroll() {
      if (preventSyncThumb.current)
        preventSyncThumb.current = false;
      else
        requestAnimationFrame(syncThumbWithTarget);
    }

    const resizeObserver = new ResizeObserver(handleTargetResize);
    const mutationObserver = new MutationObserver(handleTargetResize);

    if (targetEl) {
      targetEl.addEventListener("scroll", handleScroll);
      resizeObserver.observe(targetEl);
      mutationObserver.observe(targetEl, { childList: true, subtree: true, characterData: true });

      for (let i = 0; i < targetEl.children.length; i++)
        resizeObserver.observe(targetEl.children[i]);
    }

    return () => {
      targetEl?.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    }
  }, [targetEl, thumbDragStartData])

  useEffect(() => {
    function handleThumbMouseMove(e: MouseEvent) {
      if (thumbDragStartData) {
        mousePos.current = axis === "x" ? e.clientX : e.clientY;
        const delta = mousePos.current - thumbDragStartData.mousePos; 
        setThumbOffset(thumbDragStartData.offset + delta);  
      }
    }
  
    function handleThumbMouseUp() {
      setThumbDragStartData(null);
    }

    if (thumbDragStartData) {
      document.addEventListener("mousemove", handleThumbMouseMove);
      document.addEventListener("mouseup", handleThumbMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleThumbMouseMove);
      document.removeEventListener("mouseup", handleThumbMouseUp);
    }
  }, [thumbDragStartData])

  useEffect(() => {
    if (!showNativeScrollbar)
      targetEl?.classList.add("hide-scrollbar");

    return () => targetEl?.classList.remove("hide-scrollbar");
  }, [targetEl, showNativeScrollbar])

  useEffect(() => syncThumbWithTarget(), [targetSize])

  useEffect(() => { thumbRef.current = thumb; }, [thumb])

  function attractThumb(targetOffset: number) {
    let { offset, size } = thumbRef.current;

    if (!(offset <= targetOffset && targetOffset <= offset + size) && attractingThumb.current) {
      const offsetDiff = targetOffset < offset ? offset - targetOffset: targetOffset - (offset + size);
      const moveBy = offsetDiff <= 10 ? 10 : 20;
      setThumbOffset(targetOffset < offset ? offset - moveBy : offset + moveBy);
      requestAnimationFrame(() => attractThumb(targetOffset));
    }
  }

  function getThumbStyle(): CSSProperties {
    const width = axis === "x" ? thumb.size : "100%";
    const height = axis === "x" ? "100%" : thumb.size;
    return axis === "x" ? { height, ...thumbStyle, width } : { width, ...thumbStyle, height };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 0) {
      attractingThumb.current = true;
      const rect = e.currentTarget.getBoundingClientRect();
      attractThumb(axis === "x" ? e.clientX - rect.left : e.clientY - rect.top);
    }
  }

  function handleThumbMouseDown(e: React.MouseEvent) {
    if (e.button === 0) {
      e.stopPropagation();
      mousePos.current = axis === "x" ? e.clientX : e.clientY;
      setThumbDragStartData({ offset: thumb.offset, mousePos: mousePos.current });
    }
  }

  function setThumbOffset(offset: number) {
    const trackEl = ref.current;
    const maxOffset = (axis === "x" ? trackEl.clientWidth : trackEl.clientHeight) - thumb.size;
    
    if (offset < 0)
      offset = 0;
    if (offset > maxOffset)
      offset = maxOffset;

    preventSyncThumb.current = true;

    if (targetEl) {
      if (axis === "x")
        targetEl.scrollLeft = (offset / maxOffset) * (targetEl.scrollWidth - targetEl.clientWidth);
      else
        targetEl.scrollTop = (offset / maxOffset) * (targetEl.scrollHeight - targetEl.clientHeight);        
    }

    setThumb({ ...thumb, offset });
  }

  function syncThumbWithTarget() {
    const el = ref.current;
    
    if (el && targetEl) {
      const clientSize = axis === "x" ? targetEl.clientWidth : targetEl.clientHeight;
      const scrollSize = axis === "x" ? targetEl.scrollWidth : targetEl.scrollHeight;
      
      if (scrollSize > clientSize) {
        const scrollPos = axis === "x" ? targetEl.scrollLeft : targetEl.scrollTop;
        const scrollbarSize = axis === "x" ? el.clientWidth : el.clientHeight;
        const maxScrollPos = scrollSize - clientSize;
        
        const size = Math.max(10, (clientSize / scrollSize) * scrollbarSize);
        const offset = (scrollPos / maxScrollPos) * (scrollbarSize - size);

        setThumb({ offset, size });

        if (thumbDragStartData)
          setThumbDragStartData({ offset: offset, mousePos: mousePos.current });
      }
    }
  }

  const canScroll = useMemo(() => targetSize.scroll > targetSize.client, [targetSize]);

  const width = axis === "x" ? targetSize.client : 12;
  const height = axis === "x" ? 12 : targetSize.client;
  const display = !auto || canScroll ? "block" : "none";

  return (
    <div className={className} style={{ width, height, display, ...style }}>
      <div 
        onMouseDown={handleMouseDown} 
        onMouseLeave={() => attractingThumb.current = false}
        onMouseUp={() => attractingThumb.current = false}
        ref={ref} 
        style={{ position: "relative", width: "100%", height: "100%" }}
      >
        {canScroll && (
          <div
            className={thumbClass}
            onDragStart={e => e.preventDefault()}
            onMouseDown={handleThumbMouseDown}
            style={{
              backgroundColor: "#0007",
              transform: `translate(${axis === "x" ? 0 : "calc(-50%)"}, ${axis === "x" ? "-50%" : 0})`,
              boxSizing: "border-box",
              ...getThumbStyle(),
              position: "absolute",
              left: axis === "x" ? thumb.offset : "50%",
              top: axis === "x" ? "50%" : thumb.offset ,
            }}
          />
        )}
      </div>
    </div>
  );
}