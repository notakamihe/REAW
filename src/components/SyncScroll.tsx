import { createContext, forwardRef, HTMLAttributes, PropsWithChildren, useContext, useEffect, useImperativeHandle, useMemo, useRef } from "react";

interface ScrollSyncContextType {
  registerPane: (pane: HTMLElement) => void;
  unregisterPane: (pane: HTMLElement) => void;
}

const ScrollSyncContext = createContext<ScrollSyncContextType | undefined>(undefined);

export function SyncScroll({ children }: PropsWithChildren) { // react-scroll-sync but better
  const panes = useRef<HTMLElement[]>([]);

  const observer = useMemo(() => {
    const onResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        const pane = panes.current.find(pane => pane.contains(entry.target));
        if (pane)
          syncScrollPositions(pane);
      }
    }

    return new ResizeObserver(onResize);
  }, [])

  function onScrollPane(e: Event) {
    requestAnimationFrame(() => {
      const pane = panes.current.find(p => p === e.target as HTMLElement);
      if (pane) 
        syncScrollPositions(pane);
    })
  }
  
  function registerPane(pane: HTMLElement) {
    panes.current.push(pane);
    pane.onscroll = onScrollPane;
    observer.observe(pane);

    for (let i = 0; i < pane.children.length; i++)
      observer.observe(pane.children[i]);
  }

  function syncScrollPositions(pane: HTMLElement) {
    const element = pane;
    const otherPanes = panes.current.filter(p => p !== pane);
    
    for (const p of otherPanes)
      p.onscroll = null;

    for (const p of otherPanes) {
      if (element.scrollWidth > element.clientWidth)
        p.scrollLeft = (element.scrollLeft / element.scrollWidth) * p.scrollWidth;
      if (element.scrollHeight > element.clientHeight)
        p.scrollTop = (element.scrollTop / element.scrollHeight) * p.scrollHeight;
    }

    for (const p of otherPanes)
      requestAnimationFrame(() => { p.onscroll = onScrollPane; });
  }

  function unregisterPane(pane: HTMLElement) {
    panes.current = panes.current.filter(p => p !== pane);
    pane.onscroll = null;
    observer.unobserve(pane);

    for (let i = 0; i < pane.children.length; i++)
      observer.unobserve(pane.children[i]);
  }

  return (
    <ScrollSyncContext.Provider value={{ registerPane, unregisterPane }}>
      {children}
    </ScrollSyncContext.Provider>
  )
}

export const SyncScrollPane = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>((props, ref) => {
  const { registerPane, unregisterPane } = useContext(ScrollSyncContext)!;

  const internalRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => internalRef.current!);

  useEffect(() => {
    registerPane(internalRef.current!);
    
    return () => {
      if (internalRef.current)
        unregisterPane(internalRef.current);
    }
  }, [])

  return <div ref={internalRef} {...props} />
});