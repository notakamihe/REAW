import { useEffect, useRef } from "react";

type ClickAwayCallback = (e: MouseEvent | TouchEvent) => void;

interface ClickAwayOptions {
  mouseEvent?: "click" | "mousedown" | "mouseup" | "pointerdown" | "pointerup" | null;
  touchEvent?: "touchend" | "touchstart" | null;
}

export default function useClickAway<T extends HTMLElement>(callback: ClickAwayCallback, options?: ClickAwayOptions) {
  const ref = useRef<T>(null);

  useEffect(() => {
    function handleMouseEvent(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        callback(e);
    }

    function handleTouchEvent(e: TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        callback(e);
    }

    if (options?.mouseEvent !== null)
      document.addEventListener(options?.mouseEvent || "mousedown", handleMouseEvent);
    if (options?.touchEvent !== null)
      document.addEventListener(options?.touchEvent || "touchstart", handleTouchEvent);

    return () => {
      document.removeEventListener(options?.mouseEvent || "mousedown", handleMouseEvent);
      document.removeEventListener(options?.touchEvent || "touchstart", handleTouchEvent);
    };
  }, [callback, options?.mouseEvent, options?.touchEvent])

  return ref;
}