import React from "react";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";

const KeyListener = (props: {children: React.ReactNode}) => {
  const wc = React.useContext(WorkstationContext)!;
  const cc = React.useContext(ClipboardContext)!;

  const onCopy = () => {
    if (wc.selectedClip) {
      const track = wc.tracks.find(t => t.clips.find(c => c.id === wc.selectedClip?.id))
      cc.copy({item: wc.selectedClip, type: ClipboardItemType.Clip, container: track?.id})
    } else if (wc.selectedNode) {
      const track = wc.tracks.find(t=>t.automationLanes.find(l=> l.nodes.find(n => n.id === wc.selectedNode?.id)))
      const lane = track?.automationLanes.find(l => l.nodes.find(n => n.id === wc.selectedNode?.id))
      cc.copy({item: wc.selectedNode, type: ClipboardItemType.Node, container: lane?.id})
    }
  }

  const onCut = () => {
    if (wc.selectedClip) {
      const track = wc.tracks.find(t => t.clips.find(c => c.id === wc.selectedClip?.id))
      cc.copy({item: wc.selectedClip, type: ClipboardItemType.Clip, container: track?.id})
      wc.deleteClip(wc.selectedClip)
    } else if (wc.selectedNode) {
      const track = wc.tracks.find(t=>t.automationLanes.find(l=>l.nodes.find(n => n.id === wc.selectedNode?.id)))
      const lane = track?.automationLanes.find(l => l.nodes.find(n => n.id === wc.selectedNode?.id))
      cc.copy({item: wc.selectedNode, type: ClipboardItemType.Node, container: lane?.id})
      wc.deleteNode(wc.selectedNode)
    }
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      if (document.activeElement?.nodeName.toLowerCase() !== "input") {
        if (wc.selectedClip) {
          wc.deleteClip(wc.selectedClip)
        } else if (wc.selectedNode) {
          wc.deleteNode(wc.selectedNode)
        }
      }
    } else if (e.key === "Home") {
      wc.setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
    } else if (e.code === "Space") {
      if (document.activeElement?.nodeName.toLowerCase() !== "input") {
        if (wc.isRecording) {
          wc.setIsRecording(false)
          wc.setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
        } else {
          wc.setIsPlaying(!wc.isPlaying)
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.altKey && e.code == "KeyC") {
      if (wc.trackRegion) {
        wc.createClipFromTrackRegion()
      }
    } else if ((e.ctrlKey || e.metaKey) && e.code === "KeyD") {
      if (wc.selectedClip) {
        wc.duplicateClip(wc.selectedClip)
      }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyM") {
      if (wc.selectedClip) {
        wc.toggleMuteClip(wc.selectedClip)
      }
    } else if (e.key === "r") {
      if (document.activeElement?.nodeName.toLowerCase() !== "input") {
        wc.setIsRecording(true)
      }
    } else if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === "KeyS") {
      if (wc.selectedClip) {
        wc.splitClip(wc.selectedClip, wc.cursorPos)
      }
    }
  }

  const onPaste = () => {
    if (cc.clipboardItem) {
      switch(cc.clipboardItem.type) {
        case ClipboardItemType.Clip:
          wc.pasteClip(wc.cursorPos)
          break
        case ClipboardItemType.Node:
          wc.pasteNode(wc.cursorPos)
          break
      }
    }
  }

  React.useEffect(() => {
    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCut);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('paste', onPaste);

    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCut);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('paste', onPaste);
    };
  }, [onCopy, onCut, onKeyDown, onPaste]);

  return <>{props.children}</>;
}

export default KeyListener;