import React from "react";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import TimelinePosition from "renderer/types/TimelinePosition";

interface IProps {
  children : JSX.Element
}

export default class KeyListener extends React.Component<IProps> {
  static contextType = ClipboardContext
  context : React.ContextType<typeof ClipboardContext>

  constructor(props : IProps) {
    super(props)
  }

  render() {
    const {clipboardItem, copy} = this.context!

    return (
      <WorkstationContext.Consumer>
        {wc => {
          const {
            createClipFromTrackRegion,
            deleteClip, 
            deleteNode, 
            duplicateClip, 
            pasteClip, 
            pasteNode, 
            selectedClip, 
            selectedNode, 
            setCursorPos,
            toggleMuteClip,
            trackRegion,
            tracks
          } = wc!

          const onCopy = (e : React.ClipboardEvent<HTMLDivElement>) => {
            if (selectedClip) {
              const track = tracks.find(t => t.clips.find(c => c.id === selectedClip?.id))
              copy({item: selectedClip, type: ClipboardItemType.Clip, container: track?.id})
            } else if (selectedNode) {
              const track = tracks.find(t=>t.automationLanes.find(l=> l.nodes.find(n => n.id === selectedNode?.id)))
              const lane = track?.automationLanes.find(l => l.nodes.find(n => n.id === selectedNode?.id))
              copy({item: selectedNode, type: ClipboardItemType.Node, container: lane?.id})
            }
          }
      
          const onCut = (e : React.ClipboardEvent<HTMLDivElement>) => {
            if (selectedClip) {
              const track = tracks.find(t => t.clips.find(c => c.id === selectedClip?.id))
              copy({item: selectedClip, type: ClipboardItemType.Clip, container: track?.id})
              deleteClip(selectedClip)
            } else if (selectedNode) {
              const track = tracks.find(t=>t.automationLanes.find(l=>l.nodes.find(n => n.id === selectedNode?.id)))
              const lane = track?.automationLanes.find(l => l.nodes.find(n => n.id === selectedNode?.id))
              copy({item: selectedNode, type: ClipboardItemType.Node, container: lane?.id})
              deleteNode(selectedNode)
            }
          }

          const onKeyDown = (e : React.KeyboardEvent<HTMLDivElement>) => {
            if (e.key === "Delete") {
              if (selectedClip) {
                deleteClip(selectedClip)
              } else if (selectedNode) {
                deleteNode(selectedNode)
              }
            } else if (e.key === "Home") {
              setCursorPos(TimelinePosition.fromPos(TimelinePosition.start))
            } else if (e.ctrlKey && e.key === "d") {
              if (selectedClip) {
                duplicateClip(selectedClip)
              }
            } else if (e.ctrlKey && e.key === "m") {
              if (selectedClip) {
                toggleMuteClip(selectedClip)
              }
            } else if (e.ctrlKey && e.key === "n") {
              if (trackRegion) {
                createClipFromTrackRegion()
              }
            }
          }
      
          const onPaste = (e : React.ClipboardEvent<HTMLDivElement>) => {
            if (clipboardItem) {
              switch(clipboardItem.type) {
                case ClipboardItemType.Clip:
                  pasteClip(true)
                  break
                case ClipboardItemType.Node:
                  pasteNode(true)
                  break
              }
            }
          }      

          return React.cloneElement(this.props.children, {tabIndex: 0, onCopy, onCut, onPaste, onKeyDown})
        }}
      </WorkstationContext.Consumer>
    )
  }
}