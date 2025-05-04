import { useEffect, useRef, useState } from "react"
import { getScrollParent } from "@/services/utils/general";

type AutoScrollTarget = HTMLElement | null | string;

interface ScrollThresholds {
  fast: number; 
  medium: number; 
  slow: number;
}

export interface WindowAutoScrollProps {
  active: boolean;
  direction?: "horizontal" | "vertical" | "all";
  eventType?: "mouse" | "drag";
  onScroll?: (by: number, vertical: boolean) => void;
  target?: AutoScrollTarget | { horizontal?: AutoScrollTarget, vertical?: AutoScrollTarget };
  thresholds?: { top?: ScrollThresholds; right?: ScrollThresholds; bottom?: ScrollThresholds; left?: ScrollThresholds; };
  withinBounds?: boolean;
}

export default function WindowAutoScroll(props: WindowAutoScrollProps) {
  const { active, direction, eventType, onScroll, target, thresholds, withinBounds } = props;

  const [windows, setWindows] = useState<{ horizontal: HTMLElement | null; vertical: HTMLElement | null; }>({
    horizontal: null,
    vertical: null
  })

  const coords = useRef({ x: 0, y: 0 });
  const hInterval = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ref = useRef<HTMLDivElement>(null);
  const onScrollCallbackRef = useRef(onScroll);
  const vInterval = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearIntervals();
  }, [active, eventType])

  useEffect(() => { onScrollCallbackRef.current = onScroll; }, [onScroll])

  useEffect(() => {
    if (active) {
      let horizontal = ref.current ? getScrollParent(ref.current, "horizontal") : null;
      let vertical = ref.current ? getScrollParent(ref.current, "vertical") : null;

      if (target) {
        if (typeof target === "string") {
          const el = document.querySelector<HTMLElement>(target);
          if (el) {
            horizontal = el;
            vertical = el;
          }
        } else if (target instanceof HTMLElement) {
          horizontal = target;
          vertical = target;
        } else {
          if (typeof target.horizontal === "string") {
            const el = document.querySelector<HTMLElement>(target.horizontal);
            if (el)
              horizontal = el;
          } else if (target.horizontal instanceof HTMLElement) {
            horizontal = target.horizontal;
          }

          if (typeof target.vertical === "string") {
            const el = document.querySelector<HTMLElement>(target.vertical);
            if (el)
              vertical = el;
          } else if (target.vertical instanceof HTMLElement) {
            vertical = target.vertical;
          }
        }
      }

      setWindows({ horizontal, vertical });
    }
  }, [active, target])
  
  useEffect(() => {
    function handleDragOver(e: DragEvent) {
      if (coords.current.x !== e.x || coords.current.y !== e.y) {
        checkCoords(e.x, e.y);
        coords.current = { x: e.x, y: e.y };
      }
    }

    function handleMouseMove(e: MouseEvent) {
      checkCoords(e.x, e.y);
    }  

    if (active) {
      if (eventType === "drag")
        document.addEventListener("dragover", handleDragOver);
      else
        document.addEventListener("mousemove", handleMouseMove);
    }

    return () => {
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("mousemove", handleMouseMove);
    }
  }, [
    active, direction, eventType, withinBounds, windows.horizontal, windows.vertical,
    thresholds?.top?.fast, thresholds?.top?.medium, thresholds?.top?.slow,
    thresholds?.right?.fast, thresholds?.right?.medium, thresholds?.right?.slow,
    thresholds?.bottom?.fast, thresholds?.bottom?.medium, thresholds?.bottom?.slow,
    thresholds?.left?.fast, thresholds?.left?.medium, thresholds?.left?.slow
  ])

  function checkCoords(x: number, y: number) {
    clearIntervals();

    if (windows.horizontal && direction !== "vertical") {
      const rect = windows.horizontal.getBoundingClientRect();
      
      if (!withinBounds || rect.left <= x && x <= rect.right) {
        const leftDiff = x - rect.left;
        const rightDiff = rect.right - x;
        const leftThresholds = thresholds?.left || { fast: 3, medium: 9, slow: 20 };
        const rightThresholds = thresholds?.right || { fast: 3, medium: 9, slow: 20 };

        if (leftDiff <= leftThresholds.slow && windows.horizontal.scrollLeft > 0) {
          const by = leftDiff < leftThresholds.fast ? 30 : leftDiff < leftThresholds.medium ? 15 : 5;
          scroll(windows.horizontal, -by, false);
        } else if (
          rightDiff <= rightThresholds.slow && 
          windows.horizontal.scrollLeft < windows.horizontal.scrollWidth - windows.horizontal.clientWidth
        ) {
          const by = rightDiff < rightThresholds.fast ? 30 : rightDiff < rightThresholds.medium ? 15 : 5;
          scroll(windows.horizontal, by, false);
        }
      }
    }

    if (windows.vertical && direction !== "horizontal") {
      const rect = windows.vertical.getBoundingClientRect();

      if (!withinBounds || rect.top <= y && y <= rect.bottom) {
        const topDiff = y - rect.top;
        const bottomDiff = rect.bottom - y;
        const topThresholds = thresholds?.top || { fast: 3, medium: 9, slow: 20 };
        const bottomThresholds = thresholds?.bottom || { fast: 3, medium: 9, slow: 20 };
        
        if (topDiff <= topThresholds.slow && windows.vertical.scrollTop > 0) {
          const by = topDiff < topThresholds.fast ? 30 : topDiff < topThresholds.medium ? 15 : 5;
          scroll(windows.vertical, -by, true);
        } else if (
          bottomDiff <= bottomThresholds.slow && 
          windows.vertical.scrollTop < windows.vertical.scrollHeight - windows.vertical.clientHeight
        ) {
          const by = bottomDiff < bottomThresholds.fast ? 30 : bottomDiff < bottomThresholds.medium ? 15 : 5;
          scroll(windows.vertical, by, true);
        }
      }
    }
  }

  function clearIntervals() {
    clearInterval(hInterval.current);
    clearInterval(vInterval.current);
  }

  function scroll(el: Element, by: number, vertical: boolean) {
    const callback = () => {
      const scrollMargin = vertical ? el.scrollTop : el.scrollLeft;
      const scrollLength = vertical ? el.scrollHeight : el.scrollWidth;
      const clientLength = vertical ? el.clientHeight : el.clientWidth;

      if (scrollMargin + by <= 0 || scrollMargin + by >= scrollLength - clientLength)
        clearInterval(vertical ? vInterval.current : hInterval.current);
      
      by = Math.max(-scrollMargin, Math.min(by, scrollLength - clientLength - scrollMargin));
      el.scrollBy(vertical ? 0 : by, vertical ? by : 0);
      onScrollCallbackRef.current?.(by, vertical);
    }
  
    if (vertical)
      vInterval.current = setInterval(callback, 25);
    else 
      hInterval.current = setInterval(callback, 25);

    callback();
  }

  return <div ref={ref} style={{ display: "none" }} />;
}