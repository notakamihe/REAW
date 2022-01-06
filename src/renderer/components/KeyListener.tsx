import React from "react";
import { ClipboardContext, ClipboardItemType } from "renderer/context/ClipboardContext";
import { WorkstationContext } from "renderer/context/WorkstationContext";

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
          const {selectedClip, tracks, selectedNode, deleteClip, deleteNode, pasteClip, pasteNode} = wc!

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