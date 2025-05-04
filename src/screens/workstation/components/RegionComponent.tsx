import React, { Component, ContextType, RefObject, createRef } from "react";
import { WorkstationContext } from "@/contexts";
import { Region, TimelinePosition, TimelineSettings } from "@/services/types/types";
import WindowAutoScroll, { WindowAutoScrollProps } from "@/components/WindowAutoScroll";
import { flushSync } from "react-dom";

interface IProps {
  autoScroll?: Partial<WindowAutoScrollProps>;
  children?: React.ReactNode;
  onContextMenu?: (e: MouseEvent) => void;
  onSetRegion: (region: Region | null) => void;
  region: Region | null;
  style?: React.CSSProperties;
}

interface IState {
  isCreatingNewRegion: boolean;
  region: { start: number, end: number };
  resizeEdge: "start" | "end";
  resizing: boolean;
  temp: { start: number, end: number };
}

export default class RegionComponent extends Component<IProps, IState> {
  static contextType = WorkstationContext;
  declare context: ContextType<typeof WorkstationContext>;

  prevTimelineSettings?: TimelineSettings;
  ref: RefObject<HTMLDivElement | null>;

  constructor(props : any) {
    super(props);

    this.ref = createRef();

    this.state = {
      isCreatingNewRegion: false,
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
    if (this.ref.current?.parentElement) {
      this.ref.current.parentElement.addEventListener("contextmenu", this.handleContextMenu, { capture: true });
      this.ref.current.parentElement.addEventListener("dblclick", this.handleDoubleClick, { capture: true });
      this.ref.current.parentElement.addEventListener("mousedown", this.handleMouseDown, { capture: true });
    }

    if (this.props.region) {
      const region = { start: this.props.region.start.toMargin(), end: this.props.region.end.toMargin() };
      this.setState({ temp: region, region });
    }
  }

  componentDidUpdate(prevProps: Readonly<IProps>) {
    const timelineSettings = this.context!.timelineSettings;

    if (this.prevTimelineSettings?.timeSignature !== timelineSettings.timeSignature || (
      prevProps.region?.start !== this.props.region?.start ||
      prevProps.region?.end !== this.props.region?.end
    )) {
      if (this.props.region) {
        const region = { start: this.props.region.start.toMargin(), end: this.props.region.end.toMargin() };
        this.setState({ temp: region, region });
      } else {
        this.setState({ region: { start: 0, end: 0 } });
      }
    }

    if (this.prevTimelineSettings) {
      if (this.prevTimelineSettings.horizontalScale !== timelineSettings.horizontalScale) {
        const percentChange = timelineSettings.horizontalScale / this.prevTimelineSettings.horizontalScale;
        const region = { 
          start: this.state.region.start * percentChange,
          end: this.state.region.end * percentChange
        }
        
        this.setState({ temp: region, region });
      }
    }

    this.prevTimelineSettings = timelineSettings;
  }

  componentWillUnmount() {
    if (this.ref.current?.parentElement) {
      this.ref.current.parentElement.removeEventListener("contextmenu", this.handleContextMenu, { capture: true });
      this.ref.current.parentElement.removeEventListener("dblclick", this.handleDoubleClick, { capture: true });
      this.ref.current.parentElement.removeEventListener("mousedown", this.handleMouseDown, { capture: true });
    }

    document.body.style.cursor = "";
    document.body.classList.remove("force-cursor");
  }

  handleContextMenu(e: MouseEvent) {
    if (e.target === this.ref.current?.parentElement && this.context!.allowMenuAndShortcuts) {
      if (this.ref.current && this.isMousePosInBounds(this.ref.current, e.clientX, e.clientY)) {
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

    if (e.button === 0 && e.target === this.ref.current?.parentElement) {
      if (element?.parentElement && this.isMousePosInBounds(element.parentElement, e.clientX, e.clientY)) {
        let x = e.clientX - this.ref.current!.parentElement!.getBoundingClientRect().left;
        const snapWidth = TimelinePosition.fromSpan(this.context!.snapGridSize).toMargin();
        x = snapWidth ? snapWidth * Math.round(x / snapWidth) : x;
        
        document.addEventListener("mousemove", this.handleResize);
        document.addEventListener("mouseup", this.handleResizeStop);
  
        this.setState({ isCreatingNewRegion: true, resizeEdge: "end", temp: { start: x, end: x } });
      }
    }
  }

  handleResize(e: MouseEvent) {
    this.resize(e.movementX, this.state.resizeEdge);
  }

  handleResizeStart(e: React.MouseEvent, edge: "start" | "end") {
    document.addEventListener("mousemove", this.handleResize);
    document.addEventListener("mouseup", this.handleResizeStop);
    document.body.style.cursor = "ew-resize";
    document.body.classList.add("force-cursor");

    this.setState({ resizeEdge: edge, resizing: true, temp: this.state.region });
  }

  handleResizeStop(e: MouseEvent) {
    document.removeEventListener("mousemove", this.handleResize);
    document.removeEventListener("mouseup", this.handleResizeStop);
    document.body.style.cursor = "";
    document.body.classList.remove("force-cursor");
    
    this.setState({ isCreatingNewRegion: false, resizing: false });

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
    let region: { start: number; end: number };
    let resizeEdge = edge;

    if (this.ref.current && this.ref.current.parentElement) {
      const snapWidth = TimelinePosition.fromSpan(this.context!.snapGridSize).toMargin();
  
      if (edge === "start") {
        temp.start += x;
        region = { ...temp, start: snapWidth ? snapWidth * Math.round(temp.start / snapWidth) : temp.start };

        if (region.start < 0)
          region.start = 0;
        if (region.start > this.ref.current.parentElement.clientWidth)
          region.start = this.ref.current.parentElement.clientWidth;
      } else {
        temp.end += x;
        region = { ...temp, end: snapWidth ? snapWidth * Math.round(temp.end / snapWidth) : temp.end };
        
        if (region.end < 0)
          region.end = 0;
        if (region.end > this.ref.current.parentElement.clientWidth)
          region.end = this.ref.current.parentElement.clientWidth;
      }
      
      if (temp.start > temp.end) {
        temp = { start: temp.end, end: temp.start };
        region = { start: region.end, end: region.start };
        resizeEdge = edge === "start" ? "end" : "start";
      }

      flushSync(() => this.setState({ region, temp, resizeEdge }));
      this.context!.adjustNumMeasures(TimelinePosition.fromMargin(region.end));
    }
  }

  render() {
    const show = this.state.isCreatingNewRegion || this.props.region;

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