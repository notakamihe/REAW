import React, { Component, createRef, CSSProperties, ForwardedRef, forwardRef, ReactNode, RefObject } from "react";
import WindowAutoScroll, { WindowAutoScrollProps } from "./WindowAutoScroll";
import { flushSync } from "react-dom";

export interface Coords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface DNRData {
  coords: Coords;
  width: number;
  height: number;
  delta: { x: number; y: number; };
}

export interface DNRProps {
  allowAnyClick?: boolean;
  autoScroll?: Partial<WindowAutoScrollProps>;
  className?: string;
  children?: React.ReactNode;
  bounds?: { left?: number, top?: number, right?: number, bottom?: number };
  coords: Coords;
  drag?: boolean;
  dragAxis?: "x" | "y" | "both";
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minWidth?: number;
  onClick?: (e: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
  onDrag?: (data: DNRData) => void;
  onDragMouseMove?: (e: MouseEvent, data: DNRData) => void;
  onDragStart?: (e: React.MouseEvent, data: DNRData) => void;
  onDragStop?: (e: MouseEvent, data: DNRData) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onMouseOver?: (e: React.MouseEvent) => void;
  onMouseOut?: (e: React.MouseEvent) => void;
  onResize?: (data: ResizeDNRData) => void;
  onResizeMouseMove?:(e: MouseEvent, data: ResizeDNRData) => void;
  onResizeStart?: (e: React.MouseEvent, data: ResizeDNRData) => void;
  onResizeStop?: (e: MouseEvent, data: ResizeDNRData) => void;
  resize?: boolean | Edges<boolean>;
  resizeHandles?: Edges<{ className?: string, children?: ReactNode, style?: CSSProperties }>;
  restrictToContainerBounds?: { x: boolean, y: boolean };
  snapGridSize?: { x?: number, y?: number };
  style?: React.CSSProperties;
  title?: string;
}

type DNRPropsWithForwardedRef = DNRProps & { outerRef: ForwardedRef<HTMLDivElement>; }

interface DNRState {
  dragging: boolean;
  resizeEdge: ResizeEdge | null;
  startCoords: Coords | null;
  temp: Coords;
}

export interface Edges<T> {
  top?: T;
  right?: T;
  bottom?: T;
  left?: T;
  topRight?: T;
  bottomRight?: T;
  bottomLeft?: T;
  topLeft?: T;
}

export interface ResizeDNRData extends DNRData {
  edge: ResizeEdge;
}

export interface ResizeEdge {
  x: "right" | "none" | "left";
  y: "top" | "none" | "bottom";
}

interface ResizeHandleProps {
  className?: string;
  children?: ReactNode;
  edge: ResizeEdge;
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>, edge: ResizeEdge) => void;
  show: boolean;
  style?: React.CSSProperties | undefined;
}

function getEdgeCursor(edge: ResizeEdge) {
  if (edge.x === "right" && edge.y === "top" || edge.x === "left" && edge.y === "bottom")
    return "nesw-resize";
  else if (edge.x === "left" && edge.y === "top" || edge.x === "right" && edge.y === "bottom")
    return "nwse-resize";
  else if (edge.x === "right" || edge.x === "left")
    return "ew-resize";
  else if (edge.y === "top" || edge.y === "bottom")
    return "ns-resize"
  return "";
}

function ResizeHandle({ edge, onMouseDown, show, ...rest }: ResizeHandleProps) {
  let style: CSSProperties = { display: "flex", justifyContent: "center", alignItems: "center" };

  switch (edge.x) {
    case "right":
      style = { ...style, right: -5, width: 10, height: "100%", top: 0 };
      break;
    case "left":
      style = { ...style, left: -5, width: 10, height: "100%", top: 0 };
      break;
  }

  switch (edge.y) {
    case "top":
      style = { ...style, top: -5, height: 10 };

      if (edge.x === "none")
        style = { ...style, width: "100%", left: 0 };

      break;
    case "bottom":
      style = { ...style, bottom: -5, height: 10, top: undefined };

      if (edge.x === "none")
        style = { ...style, width: "100%", left: 0 };

      break;
  }

  return show ? (
    <div 
      {...rest}
      className={"dnr-resize-handle " + rest.className}
      onMouseDown={e => onMouseDown(e, edge)}
      style={{ ...style, cursor: getEdgeCursor(edge), ...rest.style, position: "absolute" }}
    />
  ) : null;
}

class DNR extends Component<DNRPropsWithForwardedRef, DNRState> { // react-rnd but better
  ref: RefObject<HTMLDivElement | null>;

  constructor(props: DNRPropsWithForwardedRef) {
    super(props);

    this.ref = createRef<HTMLDivElement>();

    this.state = {
      startCoords: null,
      dragging: false,
      resizeEdge: null,
      temp: this.props.coords
    }

    this.handleMouseDownDrag = this.handleMouseDownDrag.bind(this);
    this.handleMouseDownResize = this.handleMouseDownResize.bind(this);
    this.handleMouseMoveDrag = this.handleMouseMoveDrag.bind(this);
    this.handleMouseMoveResize = this.handleMouseMoveResize.bind(this);
    this.handleMouseUpDrag = this.handleMouseUpDrag.bind(this);
    this.handleMouseUpResize = this.handleMouseUpResize.bind(this);
    this.handleAutoScroll = this.handleAutoScroll.bind(this);
  }

  componentDidMount() {
    this.setOuterRef();
  }
  
  componentDidUpdate(prevProps: DNRPropsWithForwardedRef) {
    if (
      prevProps.coords?.startX !== this.props.coords.startX ||
      prevProps.coords?.endX !== this.props.coords.endX ||
      prevProps.coords?.startY !== this.props.coords.startY ||
      prevProps.coords?.endY !== this.props.coords.endY
    )
      this.setState({ temp: this.props.coords });

    this.setOuterRef();
  }

  componentWillUnmount() {
    document.removeEventListener("mousemove", this.handleMouseMoveDrag);
    document.removeEventListener("mousemove", this.handleMouseMoveResize);
    document.removeEventListener("mouseup", this.handleMouseUpDrag);
    document.removeEventListener("mouseup", this.handleMouseUpResize);

    document.body.style.cursor = "";
    document.body.classList.remove("force-cursor");
  }

  drag(x: number, y: number, e?: MouseEvent) {
    const coords = { ...this.props.coords };
    const temp = { ...this.state.temp };

    x = this.props.dragAxis !== "y" ? x : 0;
    y = this.props.dragAxis !== "x" ? y : 0;

    temp.startX += x;
    temp.endX += x;
    temp.startY += y;
    temp.endY += y;
    
    const snapGridSizeX = this.props.snapGridSize?.x;
    const snapGridSizeY = this.props.snapGridSize?.y;
    const width = coords.endX - coords.startX;
    const height = coords.endY - coords.startY;

    coords.startX = snapGridSizeX ? snapGridSizeX * Math.round(temp.startX / snapGridSizeX) : temp.startX;
    coords.startY = snapGridSizeY ? snapGridSizeY * Math.round(temp.startY / snapGridSizeY) : temp.startY;
    coords.endX = coords.startX + width;
    coords.endY = coords.startY + height;

    const container = this.ref.current?.offsetParent;

    if (container) {
      if (this.props.restrictToContainerBounds?.x !== false) {
        if (coords.startX < (this.props.bounds?.left ?? 0)) {
          coords.startX = (this.props.bounds?.left ?? 0);
          coords.endX = coords.startX + width;
        }
        if (coords.endX > container.clientWidth - (this.props.bounds?.right ?? 0)) {
          coords.endX = container.clientWidth - (this.props.bounds?.right ?? 0);
          coords.startX = coords.endX - width;
        }
      }

      if (this.props.restrictToContainerBounds?.y !== false) {
        if (coords.startY < (this.props.bounds?.top ?? 0)) {
          coords.startY = (this.props.bounds?.top ?? 0);
          coords.endY = coords.startY + height;
        }
        if (coords.endY > container.clientHeight - (this.props.bounds?.bottom ?? 0)) {
          coords.endY = container.clientHeight - (this.props.bounds?.bottom ?? 0);
          coords.startY = coords.endY - height;
        }
      }
    }
   
    flushSync(() => {
      const data = this.getDNRData(coords);

      this.props.onDrag?.(data);
      if (e) 
        this.props.onDragMouseMove?.(e, data);
  
      this.setState({ temp });
    });
  }

  getDNRData(coords: Coords): DNRData {
    const delta = { x: 0, y: 0 };

    if (this.state.startCoords) {
      if (this.state.resizeEdge && this.state.resizeEdge.x === "right")
        delta.x = coords.endX - this.state.startCoords.endX;
      else
        delta.x = coords.startX - this.state.startCoords.startX;

      if (this.state.resizeEdge && this.state.resizeEdge.y === "bottom")
        delta.y = coords.endY - this.state.startCoords.endY;
      else
        delta.y = coords.startY - this.state.startCoords.startY;
    }

    return { coords, width: coords.endX - coords.startX, height: coords.endY - coords.startY, delta };
  }

  handleMouseDownDrag(e: React.MouseEvent) {
    this.props.onMouseDown?.(e);
   
    if (!(e.target as HTMLElement).classList.contains("dnr-resize-handle")) {
      if (this.props.drag !== false && (this.props.allowAnyClick || e.button === 0)) {
        document.addEventListener("mousemove", this.handleMouseMoveDrag);
        document.addEventListener("mouseup", this.handleMouseUpDrag);
        document.body.style.cursor = "move";
        document.body.classList.add("force-cursor");
    
        this.setState({ dragging: true, startCoords: this.props.coords, temp: this.props.coords });
        this.props.onDragStart?.(e, this.getDNRData(this.props.coords));
      }
    }
  }

  handleMouseDownResize(e: React.MouseEvent<HTMLDivElement>, edge: ResizeEdge) {
    this.props.onMouseDown?.(e);

    if (this.props.allowAnyClick || e.button === 0) {
      document.addEventListener("mousemove", this.handleMouseMoveResize);
      document.addEventListener("mouseup", this.handleMouseUpResize);
      document.body.style.cursor = e.currentTarget.style.cursor;
      document.body.classList.add("force-cursor");
  
      this.setState({ resizeEdge: edge, startCoords: this.props.coords, temp: this.props.coords });
      this.props.onResizeStart?.(e, { ...this.getDNRData(this.props.coords), edge });
    }
  }

  handleMouseMoveDrag(e: MouseEvent) {
    e.preventDefault();
    this.drag(e.movementX, e.movementY, e);
  }

  handleMouseMoveResize(e: MouseEvent) {
    e.preventDefault();
    this.resize(e.movementX, e.movementY, e);
  }

  handleMouseUpDrag(e: MouseEvent) {
    if (this.props.allowAnyClick || e.button === 0) {
      document.removeEventListener("mousemove", this.handleMouseMoveDrag);
      document.removeEventListener("mouseup", this.handleMouseUpDrag);
      document.body.style.cursor = "";
      document.body.classList.remove("force-cursor");
  
      this.setState({ dragging: false, startCoords: null });
      this.props.onDragStop?.(e, this.getDNRData(this.props.coords));
    }
  }

  handleMouseUpResize(e: MouseEvent) {
    if (this.props.allowAnyClick || e.button === 0) {
      document.removeEventListener("mousemove", this.handleMouseMoveResize);
      document.removeEventListener("mouseup", this.handleMouseUpResize);
      document.body.style.cursor = "";
      document.body.classList.remove("force-cursor");
  
      this.setState({ resizeEdge: null, startCoords: null });
      this.props.onResizeStop?.(e, { ...this.getDNRData(this.props.coords), edge: this.state.resizeEdge! });
    }
  }

  handleAutoScroll(by: number, vertical: boolean) {
    if (this.state.dragging)
      this.drag(vertical ? 0 : by, vertical ? by : 0);
    else if (this.state.resizeEdge)
      this.resize(vertical ? 0 : by, vertical ? by : 0);
  }

  resize(x: number, y: number, e?: MouseEvent) {
    const coords = { ...this.props.coords };
    const temp = { ...this.state.temp };

    const container = this.ref.current?.offsetParent;
    const snapGridSizeX = this.props.snapGridSize?.x;
    const snapGridSizeY = this.props.snapGridSize?.y;

    switch (this.state.resizeEdge?.x) {
      case "left":
        temp.startX += x;
        coords.startX = snapGridSizeX ? snapGridSizeX * Math.round(temp.startX / snapGridSizeX) : temp.startX;

        if (coords.endX - coords.startX < (this.props.minWidth ?? 0))
          coords.startX = coords.endX - (this.props.minWidth ?? 0);
        if (coords.endX - coords.startX > (this.props.maxWidth ?? Infinity))
          coords.startX = coords.endX - (this.props.maxWidth ?? Infinity);
        if (container && this.props.restrictToContainerBounds?.x !== false) {
          if (coords.startX < (this.props.bounds?.left ?? 0))
            coords.startX = (this.props.bounds?.left ?? 0);
        }
        break;
      case "right":
        temp.endX += x;
        coords.endX = snapGridSizeX ? snapGridSizeX * Math.round(temp.endX / snapGridSizeX) : temp.endX;

        if (coords.endX - coords.startX < (this.props.minWidth ?? 0))
          coords.endX = coords.startX + (this.props.minWidth ?? 0);
        if (coords.endX - coords.startX > (this.props.maxWidth ?? Infinity))
          coords.endX = coords.startX + (this.props.maxWidth ?? Infinity);
        if (container && this.props.restrictToContainerBounds?.x !== false) {
          if (coords.endX > container.clientWidth - (this.props.bounds?.right ?? 0))
            coords.endX = container.clientWidth - (this.props.bounds?.right ?? 0);
        }
        break;
    }
    
    switch (this.state.resizeEdge?.y) {
      case "top":
        temp.startY += y;
        coords.startY = snapGridSizeY ? snapGridSizeY * Math.round(temp.startY / snapGridSizeY) : temp.startY;

        if (coords.endY - coords.startY < (this.props.minHeight ?? 0))
          coords.startY = coords.endY - (this.props.minHeight ?? 0);
        if (coords.endY - coords.startY > (this.props.maxHeight ?? Infinity))
          coords.startY = coords.endY - (this.props.maxHeight ?? Infinity);
        if (container && this.props.restrictToContainerBounds?.y !== false) {
          if (coords.startY < (this.props.bounds?.top ?? 0))
            coords.startY = (this.props.bounds?.top ?? 0);
        }
        break;
      case "bottom":
        temp.endY += y;
        coords.endY = snapGridSizeY ? snapGridSizeY * Math.round(temp.endY / snapGridSizeY) : temp.endY;

        if (coords.endY - coords.startY < (this.props.minHeight ?? 0))
          coords.endY = coords.startY + (this.props.minHeight ?? 0);
        if (coords.endY - coords.startY > (this.props.maxHeight ?? Infinity))
          coords.endY = coords.startY + (this.props.maxHeight ?? Infinity);
        if (container && this.props.restrictToContainerBounds?.y !== false) {
          if (coords.endY > container.clientHeight - (this.props.bounds?.bottom ?? 0))
            coords.endY = container.clientHeight - (this.props.bounds?.bottom ?? 0);
        }
        break;
    }
    
    flushSync(() => {
      const data = { ...this.getDNRData(coords), edge: this.state.resizeEdge! }; 

      this.props.onResize?.(data);
      if (e) 
        this.props.onResizeMouseMove?.(e, data);
  
      this.setState({ temp });
    });
  }

  setOuterRef() {
    if (this.props.outerRef) {
      if (typeof this.props.outerRef === "function")
        this.props.outerRef(this.ref.current);
      else if (this.props.outerRef.current !== this.ref.current)
        this.props.outerRef.current = this.ref.current;
    }
  }

  render() {
    const enableAll = this.props.resize === true || this.props.resize === undefined;
    const cursorStyle = this.state.resizeEdge || this.state.dragging ? { cursor: undefined } : {};

    return (
      <div
        className={this.props.className}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onDragStart={e => e.preventDefault()}
        onMouseDown={this.handleMouseDownDrag}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        ref={this.ref}
        style={{
          cursor: this.props.drag === false ? undefined : "move",
          ...this.props.style,
          ...cursorStyle,
          width: this.props.coords.endX - this.props.coords.startX,
          height: this.props.coords.endY - this.props.coords.startY,
          position: "absolute",
          left: this.props.coords.startX,
          top: this.props.coords.startY,
          userSelect: "none"
        }}
        title={this.props.title}
      >
        {this.props.children}
        <ResizeHandle
          {...this.props.resizeHandles?.left}
          edge={{ x: "left", y: "none" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.left)}
          style={{ ...this.props.resizeHandles?.left?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.right}
          edge={{ x: "right", y: "none" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.right)}
          style={{ ...this.props.resizeHandles?.right?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.top}
          edge={{ x: "none", y: "top" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.top)}
          style={{ ...this.props.resizeHandles?.top?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottom}
          edge={{ x: "none", y: "bottom" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.bottom)}
          style={{ ...this.props.resizeHandles?.bottom?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.topLeft}
          edge={{ x: "left", y: "top" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.topLeft)}
          style={{ ...this.props.resizeHandles?.topLeft?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.topRight}
          edge={{ x: "right", y: "top" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.topRight)}
          style={{ ...this.props.resizeHandles?.topRight?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottomLeft}
          edge={{ x: "left", y: "bottom" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.bottomLeft)}
          style={{ ...this.props.resizeHandles?.bottomLeft?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottomRight}
          edge={{ x: "right", y: "bottom" }}
          onMouseDown={this.handleMouseDownResize}
          show={enableAll || (typeof this.props.resize !== "boolean" && !!this.props.resize!.bottomRight)}
          style={{ ...this.props.resizeHandles?.bottomRight?.style, ...cursorStyle }}
        />
        <WindowAutoScroll
          {...this.props.autoScroll}
          active={this.state.dragging || !!this.state.resizeEdge}
          onScroll={this.handleAutoScroll}
        />
      </div>
    )
  }
}

export default forwardRef<HTMLDivElement, DNRProps>((props, ref) => <DNR {...props} outerRef={ref} />);