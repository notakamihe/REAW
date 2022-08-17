import { createContext, useContext, useEffect, useState } from "react";
import { Track } from "renderer/types/types";
import { WorkstationContext } from "./WorkstationContext";

export interface LanesContextType {
  draggedClipOffset: number;
  lanes: HTMLElement[];
  newTrack: Track | null;
  onClipDragStop: () => void;
  registerLane: (lane: HTMLElement | null) => void;
  setDraggedClipEl: React.Dispatch<React.SetStateAction<HTMLElement | null | undefined>>;
  unregisterLane: (lane: HTMLElement | null) => void;
}

export const LanesContext = createContext<LanesContextType | undefined>(undefined);

export const LanesProvider: React.FC = (props) => {
  const {tracks} = useContext(WorkstationContext)!;
  
  const [draggedClipEl, setDraggedClipEl] = useState<HTMLElement | null>();
  const [draggedClipOffset, setDraggedClipOffset] = useState(0);
  const [lanes, setLanes] = useState<HTMLElement[]>([]);
  const [newTrack, setNewTrack] = useState<Track | null>(null);

  useEffect(() => {
    for (let i = 0; i < lanes.length; i++) {
      lanes[i].addEventListener("mouseenter", onLaneMouseEnter);
      lanes[i].addEventListener("mouseover", onLaneMouseOver);
      lanes[i].addEventListener("mouseleave", onLaneMouseLeave);
    }
    
    return () => {
      for (let i = 0; i < lanes.length; i++) {
        lanes[i].removeEventListener("mouseenter", onLaneMouseEnter);
        lanes[i].removeEventListener("mouseover", onLaneMouseOver);
        lanes[i].removeEventListener("mouseleave", onLaneMouseLeave);
      }
    }
  }, [draggedClipEl, lanes])

  const onClipDragStop = () => {
    for (let i = 0; i < lanes.length; i++) {
      lanes[i].className = "";
    }

    setDraggedClipEl(null);
    setDraggedClipOffset(0);
    setNewTrack(null);
  }

  const onLaneMouseEnter = (e: MouseEvent) => {
    const elFromPoint = document.elementFromPoint(e.x, e.y);
    const oldLane = lanes.find(l => l.contains(draggedClipEl || null));
    const newLane = e.currentTarget as HTMLElement;
  
    if (oldLane && elFromPoint && !oldLane.contains(elFromPoint)) {
      if (oldLane && newLane) {
        const oldRect = oldLane.getBoundingClientRect();
        const oldTrack = tracks.find(t => t.id === oldLane.dataset.track);
        const newRect = newLane.getBoundingClientRect();
        const track = tracks.find(t => t.id === newLane.dataset.track);

        if (track && oldTrack?.type === track.type) {
          newLane.className = "";

          setDraggedClipOffset(newRect.top - oldRect.top);
          setNewTrack(track);
        } else {
          newLane.className = "invalid-track-type";
        }
      }
    } else {
      newLane.className = "";
    }
  }

  const onLaneMouseLeave = (e: MouseEvent) => {
    (e.currentTarget as HTMLElement).className = "";
  }

  const onLaneMouseOver = (e: MouseEvent) => {
    const rect = lanes.find(l => l.contains(draggedClipEl || null))?.getBoundingClientRect();

    if (rect) {
      if (e.y > rect.top && e.y < rect.bottom && draggedClipEl) {
        setDraggedClipOffset(0);
        setNewTrack(null);
      }
    }
  }

  const registerLane = (el: HTMLElement | null) => {
    if (el)
      setLanes(prev => [...prev, el]);
  }
 
  const unregisterLane = (el: HTMLElement | null) => {
    setLanes(lanes.filter(l => l !== el));
  }

  return (
    <LanesContext.Provider 
      value={{
        draggedClipOffset, 
        lanes, 
        newTrack, 
        onClipDragStop, 
        registerLane, 
        setDraggedClipEl, 
        unregisterLane
      }}
    >
      {props.children}
    </LanesContext.Provider>
  )
}