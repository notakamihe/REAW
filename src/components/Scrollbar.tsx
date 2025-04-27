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

  const { ref } = useResizeDetector({ onResize: updateThumb });

  const [tempThumbOffset, setTempThumbOffset] = useState(0);
  const [targetSizes, setTargetSizes] = useState({ client: 0, scroll: 0 });
  const [thumb, setThumb] = useState({ offset: 0, size: 0 });

  const attractingThumb = useRef(false);
  const draggingThumb = useRef(false);
  const thumbRef = useRef({ offset: 0, size: 0 });
  const thumbElRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleScroll() {
      if (!draggingThumb.current)
        updateThumb();
    }

    const resizeObserver = new ResizeObserver(checkTargetSizeChange);
    const mutationObserver = new MutationObserver(checkTargetSizeChange);

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
  }, [targetEl])

  useEffect(() => {
    if (!showNativeScrollbar)
      targetEl?.classList.add("hide-scrollbar");

    return () => targetEl?.classList.remove("hide-scrollbar");
  }, [targetEl, showNativeScrollbar])

  useEffect(() => updateThumb(), [targetSizes])

  useEffect(() => { thumbRef.current = thumb; }, [thumb])

  function attractThumb(targetOffset: number) {
    const { offset, size } = thumbRef.current;
    
    if (!(offset <= targetOffset && targetOffset <= offset + size) && attractingThumb.current) {
      const distance = targetOffset < offset ? offset - targetOffset : targetOffset - (offset + size);
      const moveBy = Math.min(20, distance <= 10 ? 10 : Infinity);
      moveThumb(targetOffset < offset ? -moveBy : moveBy);
      requestAnimationFrame(() => attractThumb(targetOffset));
    }
  }

  function checkTargetSizeChange() {
    if (targetEl) {
      setTargetSizes(prev => {
        const clientSize = axis === "x" ? targetEl.clientWidth : targetEl.clientHeight;
        const scrollSize = axis === "x" ? targetEl.scrollWidth : targetEl.scrollHeight;

        if (prev.client !== clientSize || prev.scroll !== scrollSize)
          return { client: clientSize, scroll: scrollSize };

        return prev;
      });
    }
  }

  function getThumbStyle(): CSSProperties {
    const width = axis === "x" ? thumb.size : "100%";
    const height = axis === "x" ? "100%" : thumb.size;
    return axis === "x" ? { height, ...thumbStyle, width } : { width, ...thumbStyle, height };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      
      attractingThumb.current = true;
  
      setTempThumbOffset(thumb.offset);
      attractThumb(axis === "x" ? e.clientX - rect.left : e.clientY - rect.top);
    }
  }

  function handleThumbMouseDown(e: React.MouseEvent) {
    function handleThumbMouseMove(e: MouseEvent) {
      moveThumb(axis === "x" ? e.movementX : e.movementY);
    }
  
    function handleThumbMouseUp() {
      document.removeEventListener("mousemove", handleThumbMouseMove);
      document.removeEventListener("mouseup", handleThumbMouseUp);
      draggingThumb.current = false;
    }

    if (e.button === 0) {
      e.stopPropagation();
  
      document.addEventListener("mousemove", handleThumbMouseMove);
      document.addEventListener("mouseup", handleThumbMouseUp);
  
      draggingThumb.current = true;
      setTempThumbOffset(thumb.offset);
    }
  }

  function moveThumb(by: number) {
    const el = ref.current;

    if (targetEl && el) {
      let offset: number;
      
      setTempThumbOffset(prev => {
        const temp = prev + by;        
        const maxOffset = (axis === "x" ? el.clientWidth : el.clientHeight) - thumb.size;
        offset = Math.min(maxOffset, Math.max(0, temp));
  
        if (axis === "x")
          targetEl.scrollLeft = (offset / maxOffset) * (targetEl.scrollWidth - targetEl.clientWidth);
        else
          targetEl.scrollTop = (offset / maxOffset) * (targetEl.scrollHeight - targetEl.clientHeight);
  
        return temp;
      });
      setThumb(prev => ({ ...prev, offset }));
    }
  }

  function updateThumb() {
    const el = ref.current;
    
    if (el && targetEl) {
      const clientSize = axis === "x" ? targetEl.clientWidth : targetEl.clientHeight;
      const scrollSize = axis === "x" ? targetEl.scrollWidth : targetEl.scrollHeight;
      
      if (scrollSize > clientSize) {
        const scrollPos = axis === "x" ? targetEl.scrollLeft : targetEl.scrollTop;
        const scrollbarSize = axis === "x" ? el.clientWidth : el.clientHeight;
        const maxScrollPos = scrollSize - clientSize;
        
        const thumbSize = Math.max(10, (clientSize / scrollSize) * scrollbarSize);
        const thumbOffset = (scrollPos / maxScrollPos) * (scrollbarSize - thumbSize);

        setThumb({ offset: thumbOffset, size: thumbSize });
      }
    }
  }

  const canScroll = useMemo(() => targetSizes.scroll > targetSizes.client, [targetSizes]);

  const width = axis === "x" ? targetSizes.client : 12;
  const height = axis === "x" ? 12 : targetSizes.client;
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
            ref={thumbElRef}
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