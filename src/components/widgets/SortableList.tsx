import React, { createContext, useContext, useEffect, useRef } from "react";
import WindowAutoScroll, { WindowAutoScrollProps } from "../WindowAutoScroll";

export interface SortableListContextType {
  onMouseDown: (e: React.MouseEvent) => void;
  registerItem: (el: HTMLElement, index: number) => void;
  unregisterItem: (el: HTMLElement) => void;
  updateIndices: (el: HTMLElement, index: number) => void;
}

export const SortableListContext = createContext<SortableListContextType | undefined>(undefined);

export interface SortData {
  destIndex: number;
  edgeIndex: number;
  sourceIndex: number;
}

interface IProps {
  autoScroll?: Partial<WindowAutoScrollProps>;
  cancel?: string;
  children: React.ReactNode;
  direction?: "horizontal" | "vertical";
  onEnd?: (e: MouseEvent, data: SortData) => void;
  onSortUpdate?: (data: SortData) => void;
  onStart?: (e: React.MouseEvent, data: SortData) => void;
  style?: React.CSSProperties;
}

interface IState {
  coord: number;
  destIndex: number;
  edgeIndex: number;
  sourceIndex: number;
}

export class SortableList extends React.Component<IProps, IState> {
  items: HTMLElement[] = [];
  ref: React.RefObject<HTMLDivElement | null>;

  constructor(props: IProps) {
    super(props);

    this.ref = React.createRef();

    this.state = {
      coord: 0,
      destIndex: -1,
      edgeIndex: -1,
      sourceIndex: -1
    }

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.registerItem = this.registerItem.bind(this);
    this.unregisterItem = this.unregisterItem.bind(this);
    this.updateIndices = this.updateIndices.bind(this);
  }

  checkForUpdate(coord: number) {
    const rect = this.getRect(this.ref.current!);
    coord = Math.max(rect.start - 20, Math.min(coord, rect.end + 20));

    for (let i = 0; i < this.items.length; i++) {      
      if (this.items[i]) {
        const r = this.getRect(this.items[i]);
  
        if (
          i === 0 && coord < r.end || 
          i === this.items.length - 1 && coord > r.start || 
          coord > r.start && coord < r.end
        ) {
          const edgeIndex = i + (coord - r.start > r.size / 2 ? 1 : 0);
          const destIndex = edgeIndex > this.state.sourceIndex ? edgeIndex - 1 : edgeIndex;
  
          if (edgeIndex !== this.state.edgeIndex || destIndex !== this.state.destIndex) {
            this.setState({ edgeIndex, destIndex });
            this.props.onSortUpdate?.({ sourceIndex: this.state.sourceIndex, edgeIndex, destIndex });
          }
  
          break;
        }
      }
    }
  }

  getRect(el: HTMLElement) {
    const rect = el.getBoundingClientRect();

    return {
      start: this.props.direction === "horizontal" ? rect.left : rect.top,
      end: this.props.direction === "horizontal" ? rect.right : rect.bottom,
      size: this.props.direction === "horizontal" ? rect.width : rect.height
    }
  }

  onMouseDown(e: React.MouseEvent) {
    if (!this.props.cancel || !(e.target as HTMLElement).closest(this.props.cancel)) {
      document.addEventListener("mousemove", this.onMouseMove);
      document.addEventListener("mouseup", this.onMouseUp);
  
      const el = e.currentTarget as HTMLElement;
      const sourceIndex = this.items.indexOf(el);
      
      this.setState({sourceIndex});
      this.props.onStart?.(e, {sourceIndex, edgeIndex: -1, destIndex: -1});
    }
  }

  onMouseMove(e: MouseEvent) {
    const coord = this.props.direction === "horizontal" ? e.x : e.y;
    this.checkForUpdate(coord);    
    this.setState({ coord });
  }

  onMouseUp(e: MouseEvent) {
    if (e.button === 0) {
      document.removeEventListener("mousemove", this.onMouseMove);
      document.removeEventListener("mouseup", this.onMouseUp);
  
      this.props.onEnd?.(e, {
        sourceIndex: this.state.sourceIndex, 
        edgeIndex: this.state.edgeIndex,
        destIndex: this.state.destIndex
      });
  
      this.setState({sourceIndex: -1, edgeIndex: -1, destIndex: -1});
    }
  }

  onScroll(by: number, vertical: boolean) {
    this.checkForUpdate(this.state.coord); 
    this.props.autoScroll?.onScroll?.(by, vertical);
  }

  registerItem(el: HTMLElement, index: number) {
    if (this.items[index]) 
      this.items.splice(index, 0, el);
    else
      this.items[index] = el;
  }

  unregisterItem(el: HTMLElement) {
    this.items = this.items.filter(item => item !== el);
  }

  updateIndices(el: HTMLElement, index: number) {
    const idx = this.items.findIndex(item => item === el);
    const [removed] = this.items.splice(idx, 1);
    this.items.splice(index, 0, removed);
  }

  render() {
    return (
      <SortableListContext.Provider
        value={{
          onMouseDown: this.onMouseDown,
          registerItem: this.registerItem,
          unregisterItem: this.unregisterItem,
          updateIndices: this.updateIndices
        }}
      >
        <div 
          ref={this.ref} 
          style={{ display: this.props.direction === "horizontal" ? "flex" : "block", ...this.props.style }}
        >
          {this.props.children}
          <WindowAutoScroll 
            onScroll={this.onScroll}
            {...this.props.autoScroll}
            active={this.state.sourceIndex > -1}
            direction={this.props.direction}
          />
        </div>
      </SortableListContext.Provider>
    )
  }
}


interface SortableListItemProps {
  children: React.ReactNode;
  className?: string;
  index: number;
  style?: React.CSSProperties;
}

export const SortableListItem = ({ children, className, index, style }: SortableListItemProps) => {
  const { onMouseDown, registerItem, unregisterItem, updateIndices } = useContext(SortableListContext)!
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current!;
    registerItem(element, index);
    return () => unregisterItem(element);
  }, [])

  useEffect(() => updateIndices(ref.current!, index), [index])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.defaultPrevented || e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLButtonElement || e.target instanceof HTMLTextAreaElement || 
        e.target instanceof HTMLSelectElement || e.target instanceof HTMLOptionElement || 
        e.target instanceof HTMLOptGroupElement || e.target instanceof HTMLVideoElement || 
        e.target instanceof HTMLAudioElement || e.button !== 0) return;

    onMouseDown(e);
  }

  return (
    <div className={className} onMouseDown={handleMouseDown} ref={ref} style={style}>
      {children}
    </div>
  )
}