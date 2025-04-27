import { ClipboardContext, ClipboardItem } from "src/contexts";
import React, { PropsWithChildren, ReactNode } from "react";

export function ClipboardProvider({ children }: PropsWithChildren<ReactNode>) {
  const [clipboardItem, setClipboardItem] = React.useState<ClipboardItem | null>(null);

  const clear = () => {
    setClipboardItem(null);
  }

  const copy = (item: ClipboardItem) => {
    setClipboardItem(item);
    if (document.hasFocus())
      navigator.clipboard.writeText("");
  }
  
  return (
    <ClipboardContext.Provider value={{clipboardItem, copy, clear}}>
      {children}
    </ClipboardContext.Provider>
  )
}