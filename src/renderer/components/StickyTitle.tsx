import {useEffect, useRef} from "react";

const StickyTitle = (props: {children: React.ReactNode, style?: React.CSSProperties}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stickInWindow();
  })
  
  useEffect(() => {
    document.addEventListener("on-editor-window-scroll", onScroll);

    stickInWindow();
    
    return () => {
      document.removeEventListener("on-editor-window-scroll", onScroll);
    }
  }, [])


  const positionToAbsolute = () => {
    const el = ref.current;
    const editorWindow = document.getElementById("timeline-editor-window");
    const targetEl = el?.parentElement;

    if (el && editorWindow && targetEl) {
      const leftDiff = targetEl.getBoundingClientRect().left - editorWindow.getBoundingClientRect().left;
     
      el.style.top = "0";
      el.style.left = `${-Math.min(0, leftDiff)}px`;
      el.style.position = "absolute";
    }
  }

  const stickInWindow = () => {
    const el = ref.current;
    const editorWindow = document.getElementById("timeline-editor-window");
    const targetEl = el?.parentElement;

    if (el && editorWindow && targetEl) {
      const leftDiff = targetEl.getBoundingClientRect().left - editorWindow.getBoundingClientRect().left;
      
      if (leftDiff < editorWindow.clientWidth && leftDiff > -targetEl.clientWidth || el.style.position === "fixed") {
        if (leftDiff < 0 && el.getBoundingClientRect().right <= targetEl.getBoundingClientRect().right) {
          el.style.top = `${targetEl.getBoundingClientRect().top}px`;
          el.style.left = `${editorWindow.getBoundingClientRect().left}px`;
          el.style.position = "fixed";
        } else {
          el.style.top = "0";
          el.style.left = `${-Math.min(0, leftDiff)}px`;
          el.style.position = "absolute";
        }
      }
    }
  }

  const onScroll = (e: Event) =>  {
    if ((e as CustomEvent).detail["horizontal"]) {
      stickInWindow();
    } else {
      positionToAbsolute();
    }
  }

  return (
    <div className="disable-highlighting" ref={ref} style={props.style}>
      {props.children}
    </div>
  )
}

export default StickyTitle;