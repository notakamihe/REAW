import { Component, ContextType, createContext, ReactNode, useRef } from "react";
import ReactDOM from "react-dom";

interface ScrollSyncContextType {
  panes: HTMLElement[];
  registerPane: (pane: HTMLElement | null) => void;
  unregisterPane: (pane: HTMLElement | null) => void;
}

const ScrollSyncContext = createContext<ScrollSyncContextType | undefined>(undefined);

export const SyncScroll: React.FC<{children: ReactNode}> = ({children}) => { // react-scroll-sync but better
  const panes = useRef<HTMLElement[]>([])

  const onScrollPane = (e: Event) => {
    const el = e.target as HTMLElement;
    const scrollTopPercentage = el.scrollTop / el.scrollHeight;
    const scrollLeftPercentage = el.scrollLeft / el.scrollWidth;

    for (let i = 0; i < panes.current.length; i++) {
      if (el.scrollWidth > el.clientWidth)
        panes.current[i].scrollLeft = scrollLeftPercentage * panes.current[i].scrollWidth;

      if (el.scrollHeight > el.clientHeight)
        panes.current[i].scrollTop = scrollTopPercentage * panes.current[i].scrollHeight;
    }
  }
  
  const registerPane = (pane: HTMLElement | null) => {
    if (pane) {
      panes.current.push(pane);
      pane.addEventListener("scroll", onScrollPane);
    }
  }

  const unregisterPane = (pane: HTMLElement | null) => {
    if (pane) {
      panes.current.splice(panes.current.indexOf(pane), 1);
      pane.removeEventListener("scroll", onScrollPane);
    }
  }

  return (
    <ScrollSyncContext.Provider value={{panes: panes.current, registerPane, unregisterPane}}>
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