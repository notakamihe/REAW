import { ClipboardContext, ClipboardItem } from "@/contexts";
import React, { PropsWithChildren } from "react";

export function ClipboardProvider({ children }: PropsWithChildren) {
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