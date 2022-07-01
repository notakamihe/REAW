import React from "react";
import { AutomationNode, Clip, ID } from "renderer/types/types";

export interface ClipboardContextType {
  clipboardItem : ClipboardItem | null;
  copy : (item : ClipboardItem) => void
  clear : () => void
}

export enum ClipboardItemType {Clip, Node, None}

interface ClipboardItem {
  item : Clip | AutomationNode | null
  type : ClipboardItemType
  container : ID | null | undefined
}

export const ClipboardContext = React.createContext<ClipboardContextType | undefined>(undefined);

export const ClipboardProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [clipboardItem, setClipboardItem] = React.useState<ClipboardItem | null>(null);

  const clear = () => {
    setClipboardItem(null);
  }

  const copy = (item : ClipboardItem) => {
    setClipboardItem(item);
    navigator.clipboard.writeText("");
  }
  
  return (
    <ClipboardContext.Provider value={{clipboardItem, copy, clear}}>
      {children}
    </ClipboardContext.Provider>
  )
}