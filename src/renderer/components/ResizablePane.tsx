import React from "react";

interface ResizeData {
  deltaX: number;
  deltaY: number;
  width: number | undefined;
  height: number | undefined;
}

interface IProps {
  children? : React.ReactNode;
  default? : {width? : number | undefined, height? : number | undefined};
  maxHeight? : number;
  maxWidth? : number;
  minHeight : number;
  minWidth : number;
  onResizeStart? : (e : React.MouseEvent<HTMLDivElement>) => void;
  onResize? : (e : MouseEvent, data : ResizeData) => void;
  onResizeStop? : (e : MouseEvent, data : ResizeData) => void;
  resizeDirection : "top" | "bottom" | "left" | "right";
  size? : {width? : number | undefined, height?: number | undefined};
}

interface IState {
  delta : {x : number, y : number};
  size : {width : number | undefined, height : number | undefined};
}

export default class ResizablePane extends React.Component<IProps, IState> {
  static defaultProps = {
    minHeight: 20,
    minWidth: 20,
  }

  constructor(props : IProps) {
    super(props);

    const size = props.size || props.default || {width: undefined, height: undefined};

    this.state = {
      delta: {x: 0, y: 0},
      size: {width: size?.width, height: size?.height}
    }

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  componentDidUpdate(prevProps : IProps) {
    if (this.props.size && (this.props.size.width !== prevProps.size?.width || this.props.size.height !== prevProps.size?.height)) {
      this.setState({size: {width: this.props.size.width, height: this.props.size.height}});
    }
  }

  getResizeHandleStyles() {
    switch (this.props.resizeDirection) {
      case "top":
        return {inset: "0px 0 auto 0", height: 4, cursor: "ns-resize"};
      case "bottom":
        return {inset: "auto 0 0px 0", height: 4, cursor: "ns-resize"};
      case "left":
        return {inset: "0 auto 0 0px", width: 4, cursor: "ew-resize"};
      case "right":
        return {inset: "0 0px 0 auto", width: 4, cursor: "ew-resize"};
    }
  }

  onMouseDown(e : React.MouseEvent<HTMLDivElement>) {
    document.addEventListener("mousemove", this.onMouseMove);
    document.addEventListener("mouseup", this.onMouseUp);
    this.props.onResizeStart?.(e);
  }

  onMouseMove(e : MouseEvent) {
    let {width, height} = {...this.state.size};
    let {x, y} = {...this.state.delta};

    if (height && (this.props.resizeDirection === "top" || this.props.resizeDirection === "bottom")) {
      height = Math.max(this.props.minHeight, Math.min(height - e.movementY, this.props.maxHeight || Infinity));
      y += height - this.state.size.height!;
    } else if (width) {
      width = Math.max(this.props.minWidth, Math.min(width + e.movementX, this.props.maxWidth || Infinity));
      x += width - this.state.size.width!;
    }

    const data : ResizeData = {deltaX: x, deltaY: y, width, height};

    this.setState({size: {width, height}, delta: {x, y}});
    this.props.onResize?.(e, data);
  }

  onMouseUp(e : MouseEvent) {
    document.removeEventListener("mousemove", this.onMouseMove);
    document.removeEventListener("mouseup", this.onMouseUp);

    const data : ResizeData = {
      width: this.state.size.width, 
      height: this.state.size.height, 
      deltaX: this.state.delta.x, 
      deltaY: this.state.delta.y
    };

    this.props.onResizeStop?.(e, data);
    this.setState({delta: {x: 0, y: 0}});

    if (this.props.size) {
      this.setState({size: {width: this.props.size.width, height: this.props.size.height}});
    }
  }

  render() {
    const handleStyles = this.getResizeHandleStyles();

    return (
      <div 
        onDragStart={(e) => e.preventDefault()}
        style={{width: this.state.size.width || "100%", height: this.state.size.height || "100%", position: "relative"}}
      >
        <div onDragStart={e => e.preventDefault()} onMouseDown={this.onMouseDown} style={{position: "absolute", ...handleStyles}}></div>
        {this.props.children}
      </div>
    )
  }
}