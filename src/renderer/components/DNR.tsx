import React from "react";

interface Coords {
  startX : number,
  startY : number,
  endX : number,
  endY : number
}

interface EnableResizing {
  top?: boolean;
  right?: boolean;
  bottom?: boolean;
  left?: boolean;
  topRight?: boolean;
  bottomRight?: boolean;
  bottomLeft?: boolean;
  topLeft?: boolean;
}

export interface DNRData {
  coords : Coords
  width : number
  height : number
  deltaWidth : number
  deltaHeight : number
}

interface ResizeHandleClasses {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  topRight?: string;
  bottomRight?: string;
  bottomLeft?: string;
  topLeft?: string;
}

interface ResizeHandles {
  top?: JSX.Element;
  right?: JSX.Element;
  bottom?: JSX.Element;
  left?: JSX.Element;
  topRight?: JSX.Element;
  bottomRight?: JSX.Element;
  bottomLeft?: JSX.Element;
  topLeft?: JSX.Element;
}

interface ResizeHandleStyles {
  top?: React.CSSProperties;
  right?: React.CSSProperties;
  bottom?: React.CSSProperties;
  left?: React.CSSProperties;
  topRight?: React.CSSProperties;
  bottomRight?: React.CSSProperties;
  bottomLeft?: React.CSSProperties;
  topLeft?: React.CSSProperties;
}

export enum DragAxis {X, Y, Both}
export enum ResizeDirection {None, Top, Bottom, Left, Right, TopLeft, TopRight, BottomLeft, BottomRight}


interface IResizeHandleProps {
  className? : string | undefined;
  dir : ResizeDirection
  handle : JSX.Element | undefined
  onMouseDown : (e : React.MouseEvent, dir: ResizeDirection) => void
  show : boolean
  style? : React.CSSProperties | undefined
}

function ResizeHandle(props : IResizeHandleProps) {
  const isCornerHandle = props.dir === ResizeDirection.TopLeft || props.dir === ResizeDirection.BottomRight || 
    props.dir === ResizeDirection.TopRight || props.dir === ResizeDirection.BottomLeft;

    const getCornerHandleStyle = (horizontal : boolean) : React.CSSProperties => {
      let style : React.CSSProperties
  
      switch(props.dir) {
        case ResizeDirection.TopLeft:
          style =  {inset:"-5px auto auto -5px", minWidth: 10, minHeight: 10, cursor:"nw-resize"}
          return horizontal ? {...style, width: "12%"} : {...style, height: "12%"};
        case ResizeDirection.TopRight:
          style =  {inset:"-5px -5px auto auto", minWidth: 10, minHeight: 10, cursor:"ne-resize"}
          return horizontal ? {...style, width: "12%"} : {...style, height: "12%"};
        case ResizeDirection.BottomLeft:
          style =  {inset:"auto auto -5px -5px", minWidth: 10, minHeight: 10, cursor:"sw-resize"}
          return horizontal ? {...style, width: "12%"} : {...style, height: "12%"};
        case ResizeDirection.BottomRight:
          style =  {inset:"auto -5px -5px auto", minWidth: 10, minHeight: 10, cursor:"se-resize"}
          return horizontal ? {...style, width: "12%"} : {...style, height: "12%"};
        default:
          return {};
      }
    }

  const getHandleStyles = () : React.CSSProperties => {
    switch(props.dir) {
      case ResizeDirection.Top:
        return {inset:"-5px 0 auto 0", height: 10, cursor:"ns-resize"}
      case ResizeDirection.Bottom:
        return {inset:"auto 0 -5px 0", height: 10, cursor:"ns-resize"}
      case ResizeDirection.Left:
        return {inset:"0 auto 0 -5px", width: 10, cursor:"ew-resize"}
      case ResizeDirection.Right:
        return {inset:"0 -5px 0 auto", width: 10, cursor:"ew-resize"}
      default:
        return {}
    }
  }

  function CornerHandle({handle} : {handle? : JSX.Element}) {
    return (
      <React.Fragment>
        <div
          onMouseDown={e => {e.stopPropagation(); props.onMouseDown(e, props.dir)}}
          style={{position: "absolute", ...getCornerHandleStyle(true)}}
        ></div>
        <div
          onMouseDown={e => {e.stopPropagation(); props.onMouseDown(e, props.dir)}}
          style={{position: "absolute", ...getCornerHandleStyle(false)}}
          ></div>
        <div
          className={`disable-highlighting ${props.className}`}
          onMouseDown={e => {e.stopPropagation(); props.onMouseDown(e, props.dir)}}
          style={{position: "absolute", ...getCornerHandleStyle(false), width: 10, height: 10, ...props.style}}
        >
          {handle && React.cloneElement(handle, {onDragStart: (e : React.MouseEvent) => e.preventDefault()})}
        </div>
      </React.Fragment>
    )
  }

  function Handle({handle} : {handle? : JSX.Element}) {
    return (
      <div 
        className={`disable-highlighting ${props.className}`}
        onMouseDown={e => {e.stopPropagation(); props.onMouseDown(e, props.dir)}} 
        style={{position: "absolute", ...getHandleStyles(), ...props.style}}
      >
        {handle && React.cloneElement(handle, {onDragStart: (e : React.MouseEvent) => e.preventDefault()})}
      </div>
    )
  }

  if (props.show) {
    return isCornerHandle ? 
      <CornerHandle handle={props.handle}/> : <Handle handle={props.handle}/>
  }

  return null
}


interface IProps {
  allowAnyClick? : boolean
  className? : string
  children? : React.ReactNode
  bounds? : {left?: number|undefined, top?: number|undefined, right?: number|undefined, bottom?: number|undefined}
  coords? : Coords
  constrainToParent : {horizontal : boolean, vertical : boolean}
  default : Coords
  disableDragging : boolean
  disableResizing : boolean
  dragAxis : DragAxis
  enableResizing : EnableResizing
  maxHeight? : number
  maxWidth? : number
  minHeight : number
  minWidth : number
  onClick? : (e : React.MouseEvent) => void
  onClickAway? : (e : MouseEvent) => void
  onContextMenu? : (e : React.MouseEvent) => void
  onDoubleClick? : (e : React.MouseEvent) => void
  onDrag? : (e : MouseEvent, data: DNRData) => void
  onDragStart? : (e : React.MouseEvent, data: DNRData) => void
  onDragStop? : (e : MouseEvent, data: DNRData) => void
  onMouseDown? : (e : React.MouseEvent) => void
  onMouseOver? : (e : React.MouseEvent) => void
  onMouseOut? : (e : React.MouseEvent) => void
  onResize? : (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data: DNRData) => void
  onResizeStart? : (e : React.MouseEvent, dir : ResizeDirection, ref : HTMLElement) => void
  onResizeStop? : (e : MouseEvent, dir : ResizeDirection, ref : HTMLElement, data: DNRData) => void
  resizeHandleClasses? : ResizeHandleClasses
  resizeHandles? : ResizeHandles
  resizeHandleStyles? : ResizeHandleStyles
  snapGridSize?: {horizontal?: number, vertical?: number}
  snapThreshold?: {horizontal?: number, vertical?: number}
  style? : React.CSSProperties
}

interface IState {
  coords : Coords
  delta : {width : number, height : number}
  dir : ResizeDirection
  dragging : boolean
  resizing : boolean
  temp : Coords
}

const enableAll = {
  top: true,
  right: true,
  left: true,
  bottom: true,
  topLeft: true,
  bottomLeft: true,
  topRight: true,
  bottomRight: true
}

//react-rnd but better and not broken

export default class DNR extends React.Component<IProps, IState> {
  static defaultProps = {
    constrainToParent: {horizontal: true, vertical: true},
    default: {startX: 0, startY: 0, endX: 100, endY: 100},
    disableDragging: false,
    disableResizing: false,
    dragAxis: DragAxis.Both,
    enableResizing: {...enableAll},
    minWidth: 10,
    minHeight: 10
  }

  ref : React.RefObject<HTMLDivElement>;

  constructor(props : IProps) {
    super(props);

    this.ref = React.createRef();

    this.state = {
      coords: this.props.coords || this.props.default,
      delta: {width: 0, height: 0},
      dir: ResizeDirection.None,
      dragging: false,
      resizing: false,
      temp: this.props.coords || this.props.default
    }

    this.onMouseDownDrag = this.onMouseDownDrag.bind(this);
    this.onMouseDownResize = this.onMouseDownResize.bind(this);
    this.onMouseMoveDrag = this.onMouseMoveDrag.bind(this);
    this.onMouseMoveResize = this.onMouseMoveResize.bind(this);
    this.onMouseUpDrag = this.onMouseUpDrag.bind(this);
    this.onMouseUpResize = this.onMouseUpResize.bind(this);
    this.onOutsideMouseDown = this.onOutsideMouseDown.bind(this);
  }

  componentDidMount() {
    document.addEventListener("mousedown", this.onOutsideMouseDown)
  }

  componentDidUpdate(prevProps : IProps, prevState : IState) {
    if (JSON.stringify(prevProps.coords) !== JSON.stringify(this.props.coords) && this.props.coords) {
      this.setState({coords: this.props.coords, temp: this.props.coords})
    }
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.onOutsideMouseDown);
    document.removeEventListener("mousemove", this.onMouseMoveDrag);
    document.removeEventListener("mousemove", this.onMouseMoveResize);
    document.removeEventListener("mouseup", this.onMouseUpDrag);
    document.removeEventListener("mouseup", this.onMouseUpResize);
  }
  
  getBorderWidth(el : Element | null) {
    if (!el) return 0

    const borderWidth = parseInt(window.getComputedStyle(el).getPropertyValue("border-width"));
    return isNaN(borderWidth) ? 0 : borderWidth;
  }

  getDNRData() {
    return {
      coords: {
        startX: this.state.coords.startX, 
        startY: this.state.coords.startY, 
        endX: this.state.coords.endX, 
        endY: this.state.coords.endY
      },
      width: this.getSize().width,
      height: this.getSize().height,
      deltaWidth: this.state.delta.width,
      deltaHeight: this.state.delta.height,
    }
  }

  getSize() {
    return {
      width: this.state.coords.endX - this.state.coords.startX,
      height: this.state.coords.endY - this.state.coords.startY
    }
  }

  onMouseDownDrag = (event: React.MouseEvent) => {
    this.props.onMouseDown?.(event);

    if (this.props.disableDragging || (!this.props.allowAnyClick && event.button !== 0))
      return

    document.addEventListener("mousemove", this.onMouseMoveDrag);
    document.addEventListener("mouseup", this.onMouseUpDrag);

    this.setState({dragging: true, delta: {width: 0, height: 0}}, () => 
      this.props.onDragStart && this.props.onDragStart(event, this.getDNRData()))
  }

  onMouseDownResize = (event: React.MouseEvent, dir : ResizeDirection) => {
    this.props.onMouseDown?.(event);

    if (!this.props.allowAnyClick && event.button !== 0)
      return

    document.addEventListener("mousemove", this.onMouseMoveResize);
    document.addEventListener("mouseup", this.onMouseUpResize);
    
    event.stopPropagation();
    this.setState({resizing: true, dir, delta: {width: 0, height: 0}});
    this.props.onResizeStart && this.props.onResizeStart(event, dir, this.ref.current!);
  }

  onMouseMoveDrag = (e: MouseEvent) => {
    e.preventDefault()

    const coords = {...this.state.coords}
    const delta = {...this.state.delta}
    const temp = {...this.state.temp}
    const el = this.ref.current

    const movementX = this.props.dragAxis === DragAxis.X || this.props.dragAxis === DragAxis.Both ? e.movementX : 0;
    const movementY = this.props.dragAxis === DragAxis.Y || this.props.dragAxis === DragAxis.Both ? e.movementY : 0;
    
    if (el) {
      const parentRect = el.parentElement?.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      const borderWidth = this.getBorderWidth(el.parentElement);

      if (this.props.snapGridSize) {
        temp.startX += movementX
        temp.endX += movementX
        temp.startY += movementY
        temp.endY += movementY
  
        if (this.props.snapGridSize.horizontal) {
          const snapX = this.snap(temp.startX, this.props.snapGridSize.horizontal, this.props.snapThreshold?.horizontal)

          if (snapX != null) {
            coords.startX = snapX;
            coords.endX = coords.startX + rect.width;
          }
        }
  
        if (this.props.snapGridSize.vertical) {
          const snapY = this.snap(temp.startY, this.props.snapGridSize.vertical, this.props.snapThreshold?.vertical)

          if (snapY != null) {
            coords.startY = snapY;
            coords.endY = coords.startY + rect.height;
          }
        }
      } else {
        coords.startX += movementX
        coords.endX += movementX
        coords.startY += movementY
        coords.endY += movementY
      }

      if (parentRect) {
        if (this.props.constrainToParent.horizontal) {
          if (coords.startX < 0) {
            coords.startX = 0;
            coords.endX = coords.startX + rect.width;
          } else if (coords.startX + rect.width > parentRect.width - borderWidth * 2) {
            coords.startX = parentRect.width - rect.width - borderWidth * 2;
            coords.endX = coords.startX + rect.width;
          }
        }

        if (this.props.constrainToParent.vertical) {
          if (coords.startY < 0) {
            coords.startY = 0;
            coords.endY = coords.startY + rect.height;
          } else if (coords.startY + rect.height > parentRect.height - borderWidth * 2) {
            coords.startY = parentRect.height - rect.height - borderWidth * 2;
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

    delta.width = coords.startX - (this.props.coords?.startX ?? this.state.coords.startX)
    delta.height = coords.startY - (this.props.coords?.startY ?? this.state.coords.startY)

    this.setState({coords, delta, temp}, () => this.props.onDrag && this.props.onDrag(e, this.getDNRData()));
  }

  onMouseMoveResize = (e: MouseEvent) => {
    e.preventDefault()
    
    let coords = {...this.state.coords}
    const delta = {...this.state.delta}
    let temp = {...this.state.temp}
    const el = this.ref.current

    if (el) {
      const resizedFrom = {left: false, right: false, top: false, bottom: false};
      let newCoords = this.props.snapGridSize ? {...temp} : {...coords}

      switch (this.state.dir) {
        case ResizeDirection.Left:
          newCoords.startX += e.movementX;
          resizedFrom.left = true;
          break;
        case ResizeDirection.Right:
          newCoords.endX += e.movementX;
          resizedFrom.right = true;
          break;
        case ResizeDirection.Top:
          newCoords.startY += e.movementY;
          resizedFrom.top = true;
          break;
        case ResizeDirection.Bottom:
          newCoords.endY += e.movementY;
          resizedFrom.bottom = true;
          break;
        case ResizeDirection.TopLeft:
          newCoords.startX += e.movementX;
          newCoords.startY += e.movementY;
          resizedFrom.left = true;
          resizedFrom.top = true;
          break;
        case ResizeDirection.TopRight:
          newCoords.endX += e.movementX;
          newCoords.startY += e.movementY;
          resizedFrom.right = true;
          resizedFrom.top = true;
          break;
        case ResizeDirection.BottomLeft:
          newCoords.startX += e.movementX;
          newCoords.endY += e.movementY;
          resizedFrom.left = true;
          resizedFrom.bottom = true;
          break;
        case ResizeDirection.BottomRight:
          newCoords.endX += e.movementX;
          newCoords.endY += e.movementY;
          resizedFrom.right = true;
          resizedFrom.bottom = true;
          break;
      }

      if (this.props.snapGridSize) {
        temp = newCoords

        if (this.props.snapGridSize.horizontal) {
          if (resizedFrom.left) {
            const snapX = this.snap(temp.startX, this.props.snapGridSize.horizontal, this.props.snapThreshold?.horizontal);

            if (snapX != null) 
              coords.startX = snapX;
          } else if (resizedFrom.right) {
            const snapX = this.snap(temp.endX, this.props.snapGridSize.horizontal, this.props.snapThreshold?.horizontal);
  
            if (snapX != null) 
              coords.endX = snapX;
          }
        }

        if (this.props.snapGridSize.vertical) {
          if (resizedFrom.top) {
            const snapY = this.snap(temp.startY, this.props.snapGridSize.vertical, this.props.snapThreshold?.vertical);

            if (snapY != null) 
              coords.startY = snapY;
          } else if (resizedFrom.bottom) {
            const snapY = this.snap(temp.endY, this.props.snapGridSize.vertical, this.props.snapThreshold?.vertical);

            if (snapY != null) 
              coords.endY = snapY;
          }
        }
      } else {
        coords = newCoords
      }

      if (coords.endX - coords.startX < this.props.minWidth) {
        if (resizedFrom.left)
          coords.startX = coords.endX - this.props.minWidth
        else if (resizedFrom.right)
          coords.endX = coords.startX + this.props.minWidth
      } else if (this.props.maxWidth && coords.endX - coords.startX > this.props.maxWidth) {
        if (resizedFrom.left)
          coords.startX = coords.endX - this.props.maxWidth
        else if (resizedFrom.right)
          coords.endX = coords.startX + this.props.maxWidth
      }

      if (coords.endY - coords.startY < this.props.minHeight) {
        if (resizedFrom.top)
          coords.startY = coords.endY - this.props.minHeight
        else if (resizedFrom.bottom)
          coords.endY = coords.startY + this.props.minHeight
      } else if (this.props.maxHeight && coords.endY - coords.startY > this.props.maxHeight) {
        if (resizedFrom.top)
          coords.startY = coords.endY - this.props.maxHeight
        else if (resizedFrom.bottom)
          coords.endY = coords.startY + this.props.maxHeight
      }

      const parentRect = el.parentElement?.getBoundingClientRect();
      const borderWidth = this.getBorderWidth(el.parentElement);

      if (parentRect) {
        if (this.props.constrainToParent.horizontal) {
          if (coords.startX < 0) {
            coords.startX = 0;
          } else if (coords.endX > parentRect.width - borderWidth * 2) {
            coords.endX = parentRect.width - borderWidth * 2;
          }
        }

        if (this.props.constrainToParent.vertical) {
          if (coords.startY < 0) {
            coords.startY = 0;
          } else if (coords.endY > parentRect.height - borderWidth * 2) {
            coords.endY = parentRect.height - borderWidth * 2;
          }
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

      if (resizedFrom.right)
        delta.width = coords.endX - (this.props.coords?.endX ?? this.state.coords.endX)
      else if (resizedFrom.left)
        delta.width = coords.startX - (this.props.coords?.startX ?? this.state.coords.startX)

      if (resizedFrom.bottom)
        delta.height = coords.endY - (this.props.coords?.endY ?? this.state.coords.endY)
      else if (resizedFrom.top)
        delta.height = coords.startY - (this.props.coords?.startY ?? this.state.coords.startY)

      this.setState({coords, delta, temp}, () => 
        this.props.onResize && this.props.onResize(e, this.state.dir, this.ref.current!, this.getDNRData()))
    }
  }

  onMouseUpDrag = (e : MouseEvent) => {
    document.removeEventListener("mousemove", this.onMouseMoveDrag);
    document.removeEventListener("mouseup", this.onMouseUpDrag);

    const data = this.getDNRData()
    const coords = this.props.coords || this.state.coords

    this.setState({dragging: false, coords, temp: coords}, () => this.props.onDragStop && this.props.onDragStop(e, data));
  }

  onMouseUpResize = (e : MouseEvent) => {
    document.removeEventListener("mousemove", this.onMouseMoveResize);
    document.removeEventListener("mouseup", this.onMouseUpResize);

    const data = this.getDNRData()
    const coords = this.props.coords || this.state.coords

    this.setState({resizing: false, coords, temp: coords}, () => {
      this.props.onResizeStop && this.props.onResizeStop(e, this.state.dir, this.ref.current!, data)
    });
  }
  
  onOutsideMouseDown = (e : MouseEvent) => {
    const el = this.ref.current;

    if (el) {
      if (!el.contains(e.target as Node) && !this.state.dragging && !this.state.resizing)
        this.props.onClickAway && this.props.onClickAway(e)
    }
  }

  snap(val: number, size: number, threshold?: number) {
    const snapCandidate = size * Math.round(val / size)

    if (Math.abs(val - snapCandidate) <= (threshold ?? size / 2))
      return snapCandidate
    else return null
  }

  render() {
    return (
      <div 
        className={this.props.className}
        onClick={this.props.onClick}
        onContextMenu={this.props.onContextMenu}
        onDoubleClick={this.props.onDoubleClick}
        onDragStart={e => e.preventDefault()}
        onMouseDown={this.onMouseDownDrag}
        onMouseOver={this.props.onMouseOver}
        onMouseOut={this.props.onMouseOut}
        ref={this.ref} 
        style={{
          ...this.props.style,
          width: this.getSize().width, 
          height: this.getSize().height, 
          position: "absolute",
          left: this.state.coords.startX,
          top: this.state.coords.startY,
          cursor: this.props.disableDragging ? "default" : "move",
        }}
      >
        <ResizeHandle
          className={this.props.resizeHandleClasses?.left}
          dir={ResizeDirection.Left}
          handle={this.props.resizeHandles?.left} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.left) && !this.props.disableResizing} 
          style={this.props.resizeHandleStyles?.left}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.right}
          dir={ResizeDirection.Right}
          handle={this.props.resizeHandles?.right} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.right) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.right}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.top}
          dir={ResizeDirection.Top}
          handle={this.props.resizeHandles?.top} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.top) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.top}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.bottom}
          dir={ResizeDirection.Bottom}
          handle={this.props.resizeHandles?.bottom} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.bottom) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.bottom}
        />
        <ResizeHandle
          className={this.props.resizeHandleClasses?.topLeft}
          dir={ResizeDirection.TopLeft}
          handle={this.props.resizeHandles?.topLeft} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.topLeft) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.topLeft}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.topRight}
          dir={ResizeDirection.TopRight}
          handle={this.props.resizeHandles?.topRight} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.topRight) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.topRight}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.bottomLeft}
          dir={ResizeDirection.BottomLeft}
          handle={this.props.resizeHandles?.bottomLeft} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.bottomLeft) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.bottomLeft}
        />
        <ResizeHandle 
          className={this.props.resizeHandleClasses?.bottomRight}
          dir={ResizeDirection.BottomRight}
          handle={this.props.resizeHandles?.bottomRight} 
          onMouseDown={this.onMouseDownResize} 
          show={Boolean(this.props.enableResizing.bottomRight) && !this.props.disableResizing}
          style={this.props.resizeHandleStyles?.bottomRight}
        />
        {this.props.children}
      </div>
    )
  }
}