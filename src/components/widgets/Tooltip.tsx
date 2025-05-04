import { CSSProperties, JSX, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getScrollParent } from "@/services/utils/general";

type TooltipContainer = string | HTMLElement;

export interface TooltipProps {
  anchorEl?: HTMLElement | null;
  bounds?: { top?: number, bottom?: number, left?: number, right?: number };
  children?: JSX.Element;
  container?: TooltipContainer | { horizontal?: TooltipContainer, vertical?: TooltipContainer };
  open? : boolean;
  showOnHover?: boolean;
  style? : React.CSSProperties;
  placement? : {horizontal : "left" | "right" | "center", vertical : "top" | "bottom" | "center"};
  title : string | null | undefined;
}

export default function Tooltip(props: TooltipProps) {
  const { anchorEl, bounds, children, container, open, placement, showOnHover, style, title } = props;

  const [hovering, setHovering] = useState(false);

  const containerElements = useRef({ horizontal: document.body, vertical: document.body });
  const ref = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const anchor = anchorEl || ref.current;

  useEffect(() => updatePosition());

  useEffect(() => {
    function handleAnchorMouseEnter() {
      setHovering(true);
    }
  
    function handleAnchorMouseLeave() {
      setHovering(false);
    }

    anchor?.addEventListener("mouseenter", handleAnchorMouseEnter);
    anchor?.addEventListener("mouseleave", handleAnchorMouseLeave);

    return () => {
      anchor?.removeEventListener("mouseenter", handleAnchorMouseEnter);
      anchor?.removeEventListener("mouseleave", handleAnchorMouseLeave);
    }
  }, [anchor])

  useEffect(() => {
    if (typeof container === "string") {
      const element = document.querySelector<HTMLElement>(container) || document.body;
      containerElements.current = { horizontal: element, vertical: element };
    } else if (container instanceof HTMLElement) {
      containerElements.current = { horizontal: container, vertical: container };
    } else {
      let horizontal = containerElements.current.horizontal;
      let vertical = containerElements.current.vertical;

      if (typeof container?.horizontal === "string") {
        const element = document.querySelector<HTMLElement>(container.horizontal);
        if (element)
          horizontal = element;
      } else if (container?.horizontal instanceof HTMLElement) {
        horizontal = container.horizontal;
      }

      if (typeof container?.vertical === "string") {
        const element = document.querySelector<HTMLElement>(container.vertical);
        if (element)
          vertical = element;
      } else if (container?.vertical instanceof HTMLElement) {
        vertical = container.vertical;
      }

      containerElements.current = { horizontal, vertical };
    }
  }, [container])

  useEffect(() => {
    function handleScrollParentScroll() {
      updatePosition();
    }

    let hScrollParent: HTMLElement | null = null
    let vScrollParent: HTMLElement | null = null;

    if (anchor && (open || showOnHover && hovering)) {
      hScrollParent = getScrollParent(anchor, "horizontal");
      vScrollParent = getScrollParent(anchor, "vertical");
      hScrollParent?.addEventListener("scroll", handleScrollParentScroll);
      vScrollParent?.addEventListener("scroll", handleScrollParentScroll);
    }
    
    return () => {
      hScrollParent?.removeEventListener("scroll", handleScrollParentScroll);
      vScrollParent?.removeEventListener("scroll", handleScrollParentScroll);
    }
  }, [
    open, showOnHover, hovering, anchor, 
    bounds?.top, bounds?.right, bounds?.left, bounds?.right, 
    placement?.horizontal, placement?.vertical
  ])

  function updatePosition() {
    const tooltipEl = tooltipRef.current;

    if ((open || showOnHover && hovering) && anchor && tooltipEl) {
      const rect = anchor.getBoundingClientRect();

      const hContainerRect = containerElements.current.horizontal.getBoundingClientRect();
      const hPlacement = placement?.horizontal || "center";
      const vContainerRect = containerElements.current.vertical.getBoundingClientRect();
      const vPlacement = placement?.vertical || "top";

      const topBound = vContainerRect.top + (bounds?.top ?? 0);
      const bottomBound = vContainerRect.bottom - (bounds?.bottom ?? 0);
      const leftBound = hContainerRect.left + (bounds?.left ?? 0);
      const rightBound = hContainerRect.right - (bounds?.right ?? 0);

      let top = rect.top - tooltipEl.clientHeight - 7; 
      let left = rect.left - tooltipEl.clientWidth / 2 + rect.width / 2;

      if (vPlacement === "center")
        top = rect.top - tooltipEl.clientHeight / 2 + rect.height / 2;
      else if (vPlacement === "bottom")
        top = rect.top + rect.height + 7;

      if (top - topBound < 7)
        top = (vPlacement === "center" ? topBound : rect.bottom) + 7;
      else if (bottomBound - (top + tooltipEl.clientHeight) < 7)
        top = (vPlacement === "center" ? bottomBound - tooltipEl.clientHeight : 
                rect.top - tooltipEl.clientHeight) - 7;

      if (hPlacement === "left")
        left = rect.left - tooltipEl.clientWidth - 7;
      else if (hPlacement === "right")
        left = rect.left + rect.width + 7;

      if (left - leftBound < 7)
        left = (hPlacement === "center" ? leftBound : rect.right) + 7;
      else if (rightBound - (left + tooltipEl.clientWidth) < 7)
        left = (hPlacement === "center" ? rightBound - tooltipEl.clientWidth : 
                rect.left - tooltipEl.clientWidth) - 7;

      top = Math.min(bottomBound - tooltipEl.clientHeight, Math.max(top, topBound));
      left = Math.min(rightBound - tooltipEl.clientWidth, Math.max(left, leftBound));

      tooltipEl.style.top = top + "px";
      tooltipEl.style.left = left + "px";
    }
  }

  const tooltipStyle: CSSProperties = {
    backgroundColor: "var(--bg8)", 
    fontSize: 13,
    color: "var(--border6)",
    border: "1px solid var(--border6)",
    zIndex: 24,
    ...style,
    position: "absolute"
  }

  return (
    <>
      {children && <div ref={ref}>{children}</div>}
      {(open || showOnHover && hovering) && createPortal(
        <div className="px-1" ref={tooltipRef} style={tooltipStyle}>{title}</div>,
        document.getElementById("root")!
      )}
    </>
  )
}