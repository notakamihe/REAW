import { Component, ContextType, createContext, ReactNode, useRef } from "react";
import ReactDOM from "react-dom";

interface ScrollSyncContextType {
  registerPane: (pane: HTMLElement | null) => void;
  unregisterPane: (pane: HTMLElement | null) => void;
}

const ScrollSyncContext = createContext<ScrollSyncContextType | undefined>(undefined);

export const SyncScroll: React.FC<{children: ReactNode}> = ({children}) => { // react-scroll-sync but better
  const panes = useRef<{el: HTMLElement, syncing: boolean}[]>([]);

  const onScrollPane = (e: Event) => {
    const pane = panes.current.find(p => p.el === e.target as HTMLElement);

    if (pane) {
      const scrollTopPercentage = pane.el.scrollTop / pane.el.scrollHeight;
      const scrollLeftPercentage = pane.el.scrollLeft / pane.el.scrollWidth;
  
      if (!pane.syncing) {
        if (pane.el.scrollWidth > pane.el.clientWidth || pane.el.scrollHeight > pane.el.clientHeight) {
          for (let i = 0; i < panes.current.length; i++) {
            if (panes.current[i].el !== pane.el) {
              panes.current[i].syncing = true;
              panes.current[i].el.scrollLeft = scrollLeftPercentage * panes.current[i].el.scrollWidth;
              panes.current[i].el.scrollTop = scrollTopPercentage * panes.current[i].el.scrollHeight;
            }
          }
        }
      }

      panes.current[panes.current.findIndex(p => p === pane)].syncing = false;
    }
  }
  
  const registerPane = (pane: HTMLElement | null) => {
    if (pane) {
      panes.current.push({el: pane, syncing: false});
      pane.addEventListener("scroll", onScrollPane);
    }
  }

  const unregisterPane = (pane: HTMLElement | null) => {
    if (pane) {
      panes.current = panes.current.filter(p => p.el !== pane);
      pane.removeEventListener("scroll", onScrollPane);
    }
  }

  return (
    <ScrollSyncContext.Provider value={{registerPane, unregisterPane}}>
      {children}
    </ScrollSyncContext.Provider>
  )
}


export class SyncScrollPane extends Component<{children: JSX.Element}> {
  static contextType = ScrollSyncContext;
  context: ContextType<typeof ScrollSyncContext>;

  node: HTMLElement | null;
  
  constructor(props: {children: JSX.Element}) {
    super(props);
    this.node = null;
  }

  componentDidMount() {
    this.node = ReactDOM.findDOMNode(this) as HTMLElement; 
    this.context!.registerPane(this.node);
  }

  componentWillUnmount() {
    this.context!.unregisterPane(this.node);
  }

  render() {
    return this.props.children;
  }
}