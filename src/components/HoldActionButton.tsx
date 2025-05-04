import React, { HTMLProps, useEffect, useRef, useState } from "react";

interface Props extends HTMLProps<HTMLDivElement> {
  delay?: number;
  holdActionOnMouseDown?: boolean;
  interval: number;
  onHoldAction: () => void;
}

export default function HoldActionButton(props: Props) {
  const { delay, holdActionOnMouseDown, interval, onHoldAction, ...rest } = props;

  const [hold, setHold] = useState({ isHolding: false, eventType: "none" });
  const [triggerHoldAction, setTriggerHoldAction] = useState(false);

  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (triggerHoldAction) {
      onHoldAction();
      setTriggerHoldAction(false);
      timeout.current = setTimeout(() => setTriggerHoldAction(true), interval);
    }
  }, [triggerHoldAction, onHoldAction])

  function endHold() {
    clearTimeout(timeout.current);
    setHold({ isHolding: false, eventType: "none" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    rest.onKeyDown?.(e);

    if (document.activeElement === e.target && e.key === "Enter")
      startHold("keydown");
  }

  function handleKeyUp(e: React.KeyboardEvent<HTMLDivElement>) {
    rest.onKeyUp?.(e);

    if (document.activeElement === e.target && e.key === "Enter" && hold.eventType === "keydown")
      endHold();
  }

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 0) {
      rest.onMouseDown?.(e); 
      startHold("mousedown");
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button === 0 && hold.eventType === "mousedown") {
      rest.onMouseUp?.(e); 
      endHold();
    }
  }

  function startHold(holdEventType: "mousedown" | "keydown") {
    if (!hold.isHolding) {
      if (holdActionOnMouseDown !== false)
        onHoldAction();
  
      timeout.current = setTimeout(() => setTriggerHoldAction(true), delay ?? 500);
      setHold({ isHolding: true, eventType: holdEventType });
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      {...rest}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onMouseDown={handleMouseDown}
      onMouseLeave={e => { rest.onMouseLeave?.(e); endHold(); }}
      onMouseUp={handleMouseUp}
      style={{ display: "inline-flex", ...rest.style }}
    />
  )
}