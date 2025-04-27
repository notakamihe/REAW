import React, { Component, ContextType, RefObject, createRef } from "react";
import { WorkstationContext } from "src/contexts";
import { Region, TimelinePosition, TimelineSettings } from "src/services/types/types";
import WindowAutoScroll, { WindowAutoScrollProps } from "src/components/WindowAutoScroll";
import { clamp } from "src/services/utils/general";

interface IProps {
  autoScroll?: Partial<WindowAutoScrollProps>;
  children?: React.ReactNode;
  onContextMenu?: (e: MouseEvent) => void;
  onSetRegion: (region : Region | null) => void;
  region: Region | null;
  style?: React.CSSProperties;
}

interface IState {
  isCreatingNewRegion: boolean;
  marginOnStart: number | null;
  region: { start: number, end: number };
  resizeEdge: "start" | "end";
  resizing: boolean;
  temp: { start: number, end: number };
}

export default class RegionComponent extends Component<IProps, IState> {
  static contextType = WorkstationContext;
  context: ContextType<typeof WorkstationContext>;

  prevTimelineSettings?: TimelineSettings;
  ref: RefObject<HTMLDivElement>;

  constructor(props : any) {
    super(props);

    this.ref = createRef();

    this.state = {
      isCreatingNewRegion: false,
      marginOnStart: null,
      region: { start: 0, end: 0 },
      resizeEdge: "end",
      resizing: false,
      temp: { start: 0, end: 0 }
    }

    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleResizeStop = this.handleResizeStop.bind(this);
    this.handleResizeStart = this.handleResizeStart.bind(this);
  }

  componentDidMount() {
    document.addEventListener("contextmenu", this.handleContextMenu, { capture: true });
    document.addEventListener("dblclick", this.handleDoubleClick, { capture: true });
    document.addEventListener("mousedown", this.handleMouseDown, { capture: true });
  }

  componentDidUpdate(prevProps: Readonly<IProps>) {
    if (this.prevTimelineSettings !== this.context!.timelineSettings || (
      prevProps.region?.start !== this.props.region?.start ||
      prevProps.region?.end !== this.props.region?.end
    )) {
      if (this.props.region) {
        const startMargin = this.props.region.start.toMargin();
        const endMargin = this.props.region.end.toMargin();
        this.setState({ region: { start: startMargin, end: endMargin } });
      } else {
        this.setState({ region: { start: 0, end: 0 } });
      }
      
      this.prevTimelineSettings = this.context!.timelineSettings;
    }
  }

  componentWillUnmount() {
    document.body.classList.remove("cursor-resize-h");

    document.removeEventListener("contextmenu", this.handleContextMenu, { capture: true });
    document.removeEventListener("dblclick", this.handleDoubleClick, { capture: true });
    document.removeEventListener("mousedown", this.handleMouseDown, { capture: true });
  }

  handleContextMenu(e: MouseEvent) {
    if (this.ref.current && this.isMousePosInBounds(this.ref.current, e.clientX, e.clientY)) {
      if (this.context!.allowMenuAndShortcuts) {
        e.stopPropagation();
        this.props.onContextMenu?.(e);
      }
    }
  }

  handleDoubleClick(e: MouseEvent) {
    if (this.ref.current && this.isMousePosInBounds(this.ref.current, e.clientX, e.clientY))
      this.props.onSetRegion(null);
  }

  handleMouseDown(e: MouseEvent) {
    const element = this.ref.current;

    if (element && this.isMousePosInBounds(element, e.clientX, e.clientY) && e.button === 2) {
      e.stopPropagation();
    } else if (element?.parentElement && this.isMousePosInBounds(element.parentElement, e.clientX, e.clientY)) {
      if (e.target === this.ref.current?.parentElement && e.button === 0) {
        const x = e.clientX - this.ref.current!.parentElement!.getBoundingClientRect().left;
        const snapWidth = TimelinePosition.fromSpan(this.context!.snapGridSize).toMargin();
        const marginOnStart = snapWidth ? snapWidth * Math.round(x / snapWidth) : x;
        
        document.addEventListener("mousemove", this.handleResize);
        document.addEventListener("mouseup", this.handleResizeStop);
  
        this.setState({ isCreatingNewRegion: true, marginOnStart, resizeEdge: "end" });
      }
    }
  }

  handleResize(e: MouseEvent) {
    this.resize(e.movementX, this.state.resizeEdge);
  }

  handleResizeStart(e: React.MouseEvent, edge: "start" | "end") {
    document.addEventListener("mousemove", this.handleResize);
    document.addEventListener("mouseup", this.handleResizeStop);
    document.body.classList.add("cursor-resize-h");

    this.setState({ resizeEdge: edge, resizing: true, temp: this.state.region });
  }

  handleResizeStop(e: MouseEvent) {
    document.removeEventListener("mousemove", this.handleResize);
    document.removeEventListener("mouseup", this.handleResizeStop);
    document.body.classList.remove("cursor-resize-h");
    
    this.setState({ isCreatingNewRegion: false, marginOnStart: null, resizing: false });

    if (this.state.region.start !== this.state.region.end) {
      const region = {
        start: TimelinePosition.fromMargin(this.state.region.start),
        end: TimelinePosition.fromMargin(this.state.region.end)
      };
      this.props.onSetRegion(region);
    } else {
      this.props.onSetRegion(null);
    }
  }

  isMousePosInBounds(element: HTMLElement, x: number, y: number) {
    const rect = element.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  resize(x: number, edge: "start" | "end") {
    let temp = { ...this.state.temp };
    let region = { ...this.state.region };
    let resizeEdge = edge;

    if (this.state.marginOnStart !== null) {
      temp = { start: this.state.marginOnStart, end: this.state.marginOnStart };
      region = { start: this.state.marginOnStart, end: this.state.marginOnStart };
    }

    if (this.ref.current && this.ref.current.parentElement) {
      const containerRect = this.ref.current.parentElement.getBoundingClientRect();
      const snapWidth = TimelinePosition.fromSpan(this.context!.snapGridSize).toMargin();
      const maxPosMargin = this.context!.maxPos.toMargin();
  
      if (edge === "start") {
        temp.start += x;
        const start = snapWidth ? snapWidth * Math.round(temp.start / snapWidth) : temp.start;
        region.start = clamp(start, 0, Math.min(maxPosMargin, containerRect.width));
      } else {
        temp.end += x;
        const end = snapWidth ? snapWidth * Math.round(temp.end / snapWidth) : temp.end;
        region.end = clamp(end, 0, Math.min(maxPosMargin, containerRect.width));
      }
      
      if (temp.start > temp.end) {
        temp = { start: temp.end, end: temp.start };
        region = { start: region.end, end: region.start };
        resizeEdge = edge === "start" ? "end" : "start";
      }
    }

    this.setState({ marginOnStart: null, region, temp, resizeEdge });
    this.context!.adjustNumMeasures(TimelinePosition.fromMargin(region.end));
  }

  render() {
    const show = this.state.isCreatingNewRegion && this.state.marginOnStart === null || this.props.region;

    return (
      <>
        <WindowAutoScroll
          {...this.props.autoScroll}
          active={this.state.isCreatingNewRegion || this.state.resizing}
          direction="horizontal"
          onScroll={by => this.resize(by, this.state.resizeEdge)}
        />
        <div
          ref={this.ref}
          style={{
            height: "100%",
            cursor: !this.state.isCreatingNewRegion && !this.state.resizing ? "default" : "",
            pointerEvents: "none",
            ...this.props.style, 
            position: "absolute", 
            top: 0, 
            left: this.state.region.start, 
            width: this.state.region.end - this.state.region.start,
            display: show ? "block" : "none"
          }}
        >
          {this.props.region && !this.state.isCreatingNewRegion && (
            <>
              <div
                className="position-absolute h-100"
                onMouseDown={e => this.handleResizeStart(e, "start")}
                style={{ width: 10, left: -5, cursor: "ew-resize", pointerEvents: "auto" }}
              />
              <div
                className="position-absolute h-100"
                onMouseDown={e => this.handleResizeStart(e, "end")}
                style={{ width: 10, right: -5, cursor: "ew-resize", pointerEvents: "auto" }} 
              />
            </>
          )}
          {this.props.children}
        </div>
      </>
    )
  }
}