import React, { Component, createRef, CSSProperties, ForwardedRef, forwardRef, ReactNode, RefObject } from "react";
import WindowAutoScroll, { WindowAutoScrollProps } from "./WindowAutoScroll";

export enum ResizeDirection {
  None,
  Top,
  Bottom,
  Left,
  Right,
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight
}

interface IResizeHandleProps {
  className?: string;
  children?: ReactNode;
  dir: ResizeDirection;
  onMouseDown: (e : React.MouseEvent, dir: ResizeDirection) => void;
  show: boolean;
  style?: React.CSSProperties | undefined;
}

const ResizeHandle = ({ className, dir, onMouseDown, show, style, ...rest }: IResizeHandleProps) => {
  const getCornerHandleStyle = (horizontal : boolean) : React.CSSProperties => {
    let style: React.CSSProperties = {minWidth: 10, minHeight: 10};

    switch (dir) {
      case ResizeDirection.TopLeft:
        style = {...style, inset: "-5px auto auto -5px", cursor: "nwse-resize"};
        break;
      case ResizeDirection.TopRight:
        style = {...style, inset: "-5px -5px auto auto", cursor: "nesw-resize"};
        break;
      case ResizeDirection.BottomLeft:
        style = {...style, inset: "auto auto -5px -5px", cursor: "nesw-resize"};
        break;
      case ResizeDirection.BottomRight:
        style = {...style, inset: "auto -5px -5px auto", cursor: "nwse-resize"};
        break;
    }

    if (horizontal)
      return {...style, width: "12%", maxWidth: 30};
    else
      return {...style, height: "12%", maxHeight: 30};
  }

  const getHandleStyles = () : React.CSSProperties => {
    switch (dir) {
      case ResizeDirection.Top:
        return {inset:"-5px 0 auto 0", height: 10, cursor: "ns-resize"}
      case ResizeDirection.Bottom:
        return {inset:"auto 0 -5px 0", height: 10, cursor: "ns-resize"}
      case ResizeDirection.Left:
        return {inset:"0 auto 0 -5px", width: 10, cursor: "ew-resize"}
      case ResizeDirection.Right:
        return {inset:"0 -5px 0 auto", width: 10, cursor: "ew-resize"}
      default:
        return {}
    }
  }

  if (show) {
    return dir > 4 ? (
      <React.Fragment>
        <div
          className="dnr-resize-handle"
          onMouseDown={e => onMouseDown(e, dir)}
          style={{position: "absolute", ...getCornerHandleStyle(true), ...style}}
        />
        <div
          className="dnr-resize-handle"
          onMouseDown={e => onMouseDown(e, dir)}
          style={{position: "absolute", ...getCornerHandleStyle(false), ...style}}
        />
        <div
          {...rest}
          className={`dnr-resize-handle ${className}`}
          onMouseDown={e => onMouseDown(e, dir)}
          style={{position: "absolute", ...getCornerHandleStyle(false), width: 10, height: 10, ...style}}
        />
      </React.Fragment>
    ) : (
      <div
        {...rest}
        className={`dnr-resize-handle ${className}`}
        onMouseDown={e => onMouseDown(e, dir)}
        style={{position: "absolute", ...getHandleStyles(), ...style}}
      />
    )
  }

  return null;
}

export interface Coords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Directions<T> {
  top?: T;
  right?: T;
  bottom?: T;
  left?: T;
  topRight?: T;
  bottomRight?: T;
  bottomLeft?: T;
  topLeft?: T;
}

export interface DNRData {
  coords: Coords;
  width: number;
  height: number;
  delta: { x: number; y: number; width: number; height: number; };
}

export interface DNRProps {
  allowAnyClick?: boolean;
  autoScroll?: Partial<WindowAutoScrollProps>;
  className?: string;
  children?: React.ReactNode;
  bounds?: {left?: number | undefined, top?: number | undefined, right?: number | undefined, bottom?: number | undefined};
  coords: Coords;
  disableDragging?: boolean;
  disableResizing?: boolean;
  dragAxis?: "x" | "y" | "both";
  enableResizing?: Directions<boolean>;
  maxHeight?: number;
  maxWidth?: number;
  minHeight?: number;
  minWidth?: number;
  onClick?: (e: React.MouseEvent) => void;
  onClickAway?: (e: MouseEvent | TouchEvent) => void;
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
  onResize?: (dir: ResizeDirection, data: DNRData) => void;
  onResizeMouseMove?:(e: MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  onResizeStart?: (e: React.MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  onResizeStop?: (e: MouseEvent, dir: ResizeDirection, data: DNRData) => void;
  resizeHandles?: Directions<{ className?: string, children?: ReactNode, style?: CSSProperties }>;
  restrict?: {horizontal: boolean, vertical: boolean};
  snapGridSize?: {horizontal?: number, vertical?: number};
  style?: React.CSSProperties;
  title?: string;
}

type DNRPropsWithForwardedRef = DNRProps & { innerRef: ForwardedRef<HTMLDivElement>; }

interface IState {
  dir: ResizeDirection;
  dragging: boolean;
  resizing: boolean;
  startCoords: Coords;
  temp: Coords;
}

class DNR extends Component<DNRPropsWithForwardedRef, IState> { //react-rnd but better and not broken
  ref: RefObject<HTMLDivElement>;

  constructor(props: DNRPropsWithForwardedRef) {
    super(props);

    this.ref = createRef<HTMLDivElement>();

    this.state = {
      startCoords: this.props.coords,
      dir: ResizeDirection.None,
      dragging: false,
      resizing: false,
      temp: this.props.coords
    }

    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.onClickAway = this.onClickAway.bind(this);
    this.onMouseDownDrag = this.onMouseDownDrag.bind(this);
    this.onMouseDownResize = this.onMouseDownResize.bind(this);
    this.onMouseMoveDrag = this.onMouseMoveDrag.bind(this);
    this.onMouseMoveResize = this.onMouseMoveResize.bind(this);
    this.onMouseUpDrag = this.onMouseUpDrag.bind(this);
    this.onMouseUpResize = this.onMouseUpResize.bind(this);
    this.onWindowScroll = this.onWindowScroll.bind(this);

    document.addEventListener("mousedown", this.handleMouseDown);
  }

  componentDidMount() {
    this.setInnerRef();
  }
  
  componentDidUpdate(prevProps: DNRPropsWithForwardedRef) {
    const coordsChanged = (
      prevProps.coords?.startX !== this.props.coords.startX ||
      prevProps.coords?.endX !== this.props.coords.endX ||
      prevProps.coords?.startY !== this.props.coords.startY ||
      prevProps.coords?.endY !== this.props.coords.endY
    );

    if (this.props.coords && coordsChanged)
      this.setState({ temp: this.props.coords });

    this.setInnerRef();
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.handleMouseDown);
    document.removeEventListener("mousemove", this.onMouseMoveDrag);
    document.removeEventListener("mousemove", this.onMouseMoveResize);
    document.removeEventListener("mouseup", this.onMouseUpDrag);
    document.removeEventListener("mouseup", this.onMouseUpResize);

    document.documentElement.style.cursor = "";
  }

  getDirCursor(dir: ResizeDirection) {
    switch (dir) {
      case ResizeDirection.Top:
      case ResizeDirection.Bottom:
        return "ns-resize";
      case ResizeDirection.Left:
      case ResizeDirection.Right:
        return "ew-resize";
      case ResizeDirection.TopRight:
      case ResizeDirection.BottomLeft:
        return "nesw-resize";
      case ResizeDirection.TopLeft:
      case ResizeDirection.BottomRight:
        return "nwse-resize";
      default:
        return "";
    }
  }

  getDNRData(coords: Coords, oldCoords: Coords): DNRData {
    const width = coords.endX - coords.startX;
    const height = coords.endY - coords.startY;
    const delta = {
      x: coords.startX - oldCoords.startX,
      y: coords.startY - oldCoords.startY,
      width: width - (oldCoords.endX - oldCoords.startX),
      height: height - (oldCoords.endY - oldCoords.startY)
    };

    return { coords, width, height, delta };
  }

  handleMouseDown(e: MouseEvent) {
    if (this.ref.current && !this.ref.current.contains(e.target as Node))
      this.onClickAway(e);
  }

  move(x: number, y: number, e?: MouseEvent) {
    const coords = { ...this.props.coords };
    const temp = { ...this.state.temp };
    const el = this.ref.current;
    
    if (el) {
      const movementX = this.props.dragAxis !== "y" ? x : 0;
      const movementY = this.props.dragAxis !== "x" ? y : 0;
      const rect = el.getBoundingClientRect();
     
      temp.startX += movementX;
      temp.endX += movementX;
      temp.startY += movementY;
      temp.endY += movementY;
     
      const hSnapGridSize = this.props.snapGridSize?.horizontal;
      const snapX = this.snap(temp.startX, hSnapGridSize);
      const vSnapGridSize = this.props.snapGridSize?.vertical;
      const snapY = this.snap(temp.startY, vSnapGridSize);
     
      if (snapX !== null) {
        coords.startX = snapX;
        coords.endX = coords.startX + rect.width;
      }

      if (snapY !== null) {
        coords.startY = snapY;
        coords.endY = coords.startY + rect.height;
      }

      const parentEl = el.offsetParent;
     
      if (parentEl) {
        if (!this.props.restrict || this.props.restrict.horizontal) {
          if (coords.startX < 0) {
            coords.startX = 0;
            coords.endX = coords.startX + rect.width;
          } else if (coords.startX + rect.width > parentEl.clientWidth) {
            coords.startX = parentEl.clientWidth - rect.width;
            coords.endX = coords.startX + rect.width;
          }
        }

        if (!this.props.restrict || this.props.restrict.vertical) {
          if (coords.startY < 0) {
            coords.startY = 0;
            coords.endY = coords.startY + rect.height;
          } else if (coords.startY + rect.height > parentEl.clientHeight) {
            coords.startY = parentEl.clientHeight - rect.height;
            coords.endY = coords.startY + rect.height;
          }
        }
      }

      if (this.props.bounds) {
        if (this.props.bounds.left && coords.startX < this.props.bounds.left) {
          coords.startX = this.props.bounds.left;
          coords.endX = coords.startX + rect.width;
        }
        if (this.props.bounds.right && coords.startX + rect.width > this.props.bounds.right) {
          coords.startX = this.props.bounds.right - rect.width;
          coords.endX = coords.startX + rect.width;
        }
        if (this.props.bounds.top && coords.startY < this.props.bounds.top) {
          coords.startY = this.props.bounds.top;
          coords.endY = coords.startY + rect.height;
        }
        if (this.props.bounds.bottom && coords.startY + rect.height > this.props.bounds.bottom) {
          coords.startY = this.props.bounds.bottom - rect.height;
          coords.endY = coords.startY + rect.height;
        }
      }
    }
   
    this.props.onDrag?.(this.getDNRData(coords, this.state.startCoords));
    if (e) 
      this.props.onDragMouseMove?.(e, this.getDNRData(coords, this.state.startCoords));

    this.setState({ temp });
  }

  onClickAway(e: MouseEvent | TouchEvent) {
    if (!this.state.dragging && !this.state.resizing) 
      this.props.onClickAway?.(e);
  }

  onMouseDownDrag(e: React.MouseEvent) {
    this.props.onMouseDown?.(e);
   
    if ((e.target as HTMLElement).classList.contains("dnr-resize-handle")) return;
    if (this.props.disableDragging || (!this.props.allowAnyClick && e.button !== 0)) return;

    document.addEventListener("mousemove", this.onMouseMoveDrag);
    document.addEventListener("mouseup", this.onMouseUpDrag);
    document.documentElement.style.cursor = "move";

    this.setState({ dragging: true, startCoords: this.props.coords, temp: this.props.coords });
    this.props.onDragStart?.(e, this.getDNRData(this.props.coords, this.props.coords));
  }

  onMouseDownResize(e: React.MouseEvent, dir: ResizeDirection) {
    this.props.onMouseDown?.(e);

    if (!this.props.allowAnyClick && e.button !== 0) return;

    document.addEventListener("mousemove", this.onMouseMoveResize);
    document.addEventListener("mouseup", this.onMouseUpResize);
    document.documentElement.style.cursor = this.getDirCursor(dir);
   
    this.setState({ resizing: true, dir, startCoords: this.props.coords, temp: this.props.coords });
    this.props.onResizeStart?.(e, dir, this.getDNRData(this.props.coords, this.props.coords));
  }

  onMouseMoveDrag(e: MouseEvent) {
    e.preventDefault();
    this.move(e.movementX, e.movementY, e);
  }

  onMouseMoveResize(e: MouseEvent) {
    e.preventDefault();
    this.resize(e.movementX, e.movementY, e);
  }

  onMouseUpDrag(e: MouseEvent) {
    if (this.props.allowAnyClick || e.button === 0) {
      document.removeEventListener("mousemove", this.onMouseMoveDrag);
      document.removeEventListener("mouseup", this.onMouseUpDrag);
      document.documentElement.style.cursor = "";
  
      this.setState({ dragging: false });
      this.props.onDragStop?.(e, this.getDNRData(this.props.coords, this.state.startCoords));
    }
  }

  onMouseUpResize(e : MouseEvent) {
    if (this.props.allowAnyClick || e.button === 0) {
      document.removeEventListener("mousemove", this.onMouseMoveResize);
      document.removeEventListener("mouseup", this.onMouseUpResize);
      document.documentElement.style.cursor = "";
  
      const dir = this.state.dir;
  
      this.setState({ resizing: false, dir: ResizeDirection.None });
      this.props.onResizeStop?.(e, dir, this.getDNRData(this.props.coords, this.state.startCoords));
    }
  }

  onWindowScroll(by: number, vertical: boolean) {
    if (this.state.dragging)
      this.move(vertical ? 0 : by, vertical ? by : 0);
    else if (this.state.resizing)
      this.resize(vertical ? 0 : by, vertical ? by : 0);
  }

  resize(x: number, y: number, e?: MouseEvent) {
    const coords = { ...this.props.coords };
    const temp = { ...this.state.temp };
    const el = this.ref.current;

    if (el) {
      const resizedFrom = { left: false, right: false, top: false, bottom: false };
     
      switch (this.state.dir) {
        case ResizeDirection.Left:
          resizedFrom.left = true;
          break;
        case ResizeDirection.Right:
          resizedFrom.right = true;
          break;
        case ResizeDirection.Top:
          resizedFrom.top = true;
          break;
        case ResizeDirection.Bottom:
          resizedFrom.bottom = true;
          break;
        case ResizeDirection.TopLeft:
          resizedFrom.left = true;
          resizedFrom.top = true;
          break;
        case ResizeDirection.TopRight:
          resizedFrom.right = true;
          resizedFrom.top = true;
          break;
        case ResizeDirection.BottomLeft:
          resizedFrom.left = true;
          resizedFrom.bottom = true;
          break;
        case ResizeDirection.BottomRight:
          resizedFrom.right = true;
          resizedFrom.bottom = true;
          break;
      }
  
      const hSnapGridSize = this.props.snapGridSize?.horizontal;
      const vSnapGridSize = this.props.snapGridSize?.vertical;
  
      if (resizedFrom.left) {
        temp.startX += x;
        const snapX = this.snap(temp.startX, hSnapGridSize);
        if (snapX !== null)
          coords.startX = snapX;
      } else if (resizedFrom.right) {
        temp.endX += x;
        const snapX = this.snap(temp.endX, hSnapGridSize);
        if (snapX !== null)
          coords.endX = snapX;
      }
  
      if (resizedFrom.top) {
        temp.startY += y;
        const snapY = this.snap(temp.startY, vSnapGridSize);
        if (snapY !== null)
          coords.startY = snapY;
      } else if (resizedFrom.bottom) {
        temp.endY += y;
        const snapY = this.snap(temp.endY, vSnapGridSize);
        if (snapY !== null)
          coords.endY = snapY;
      }
  
      const minWidth = this.props.minWidth === undefined ? 10 : this.props.minWidth;
      const minHeight = this.props.minHeight === undefined ? 10 : this.props.minHeight;
      const maxWidth = this.props.maxWidth === undefined ? Infinity : this.props.maxWidth;
      const maxHeight = this.props.maxHeight === undefined ? Infinity : this.props.maxHeight;
  
      if (coords.endX - coords.startX < minWidth) {
        if (resizedFrom.left)
          coords.startX = coords.endX - minWidth
        else
          coords.endX = coords.startX + minWidth
      } else if (maxWidth && coords.endX - coords.startX > maxWidth) {
        if (resizedFrom.left)
          coords.startX = coords.endX - maxWidth
        else
          coords.endX = coords.startX + maxWidth
      }
  
      if (coords.endY - coords.startY < minHeight) {
        if (resizedFrom.top)
          coords.startY = coords.endY - minHeight
        else
          coords.endY = coords.startY + minHeight
      } else if (coords.endY - coords.startY > maxHeight) {
        if (resizedFrom.top)
          coords.startY = coords.endY - maxHeight
        else
          coords.endY = coords.startY + maxHeight
      }
     
      const parentEl = el.offsetParent;
     
      if (parentEl) {
        if (!this.props.restrict || this.props.restrict.horizontal) {
          if (coords.startX < 0)
            coords.startX = 0;
          else if (coords.endX > parentEl.clientWidth)
            coords.endX = parentEl.clientWidth;
        }
  
        if (!this.props.restrict || this.props.restrict.vertical) {
          if (coords.startY < 0)
            coords.startY = 0;
          else if (coords.endY > parentEl.clientHeight)
            coords.endY = parentEl.clientHeight;
        }
      }
  
      if (this.props.bounds) {
        if (this.props.bounds.left && coords.startX < this.props.bounds.left)
          coords.startX = this.props.bounds.left
        if (this.props.bounds.right && coords.endX > this.props.bounds.right)
          coords.endX = this.props.bounds.right
        if (this.props.bounds.top && coords.startY < this.props.bounds.top)
          coords.startY = this.props.bounds.top
        if (this.props.bounds.bottom && coords.endY > this.props.bounds.bottom)
          coords.endY = this.props.bounds.bottom
      }
    }

    this.props.onResize?.(this.state.dir, this.getDNRData(coords, this.state.startCoords));
    if (e) 
      this.props.onResizeMouseMove?.(e, this.state.dir, this.getDNRData(coords, this.state.startCoords));

    this.setState({ temp });
  }

  setInnerRef() {
    if (this.props.innerRef) {
      if (typeof this.props.innerRef === "function")
        this.props.innerRef(this.ref.current);
      else if (this.props.innerRef.current !== this.ref.current)
        this.props.innerRef.current = this.ref.current;
    }
  }

  snap(val: number, size?: number) {
    if (size !== undefined && size > 0) {
      const snapCandidate = size * Math.round(val / size)
 
      if (Math.abs(val - snapCandidate) <= size / 2)
        return snapCandidate;
      else return null;
    } else {
      return val;
    }
  }

  render() {
    const enableAll = !this.props.enableResizing;
    const dirCursor = this.getDirCursor(this.state.dir);
    const cursorStyle = this.state.resizing ? {cursor: dirCursor} :
      this.state.dragging ? {cursor: undefined} : {};

    return (
      <div
        className={this.props.className}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onDragStart={e => e.preventDefault()}
        onMouseDown={this.onMouseDownDrag}
        onMouseEnter={this.props.onMouseEnter}
        onMouseLeave={this.props.onMouseLeave}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        ref={this.ref}
        style={{
          cursor: this.state.resizing ? dirCursor : this.props.disableDragging ? "default" : "move",
          width: this.props.coords.endX - this.props.coords.startX,
          height: this.props.coords.endY - this.props.coords.startY,
          ...this.props.style,
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
          dir={ResizeDirection.Left}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.left) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.left?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.right}
          dir={ResizeDirection.Right}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.right) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.right?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.top}
          dir={ResizeDirection.Top}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.top) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.top?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottom}
          dir={ResizeDirection.Bottom}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.bottom) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.bottom?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.topLeft}
          dir={ResizeDirection.TopLeft}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.topLeft) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.topLeft?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.topRight}
          dir={ResizeDirection.TopRight}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.topRight) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.topRight?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottomLeft}
          dir={ResizeDirection.BottomLeft}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.bottomLeft) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.bottomLeft?.style, ...cursorStyle }}
        />
        <ResizeHandle
          {...this.props.resizeHandles?.bottomRight}
          dir={ResizeDirection.BottomRight}
          onMouseDown={this.onMouseDownResize}
          show={(enableAll || !!this.props.enableResizing!.bottomRight) && !this.props.disableResizing}
          style={{ ...this.props.resizeHandles?.bottomRight?.style, ...cursorStyle }}
        />
        <WindowAutoScroll
          {...this.props.autoScroll}
          active={this.state.dragging || this.state.resizing}
          onScroll={this.onWindowScroll}
        />
      </div>
    )
  }
}

export default forwardRef<HTMLDivElement, DNRProps>((props, ref) => <DNR {...props} innerRef={ref} />);