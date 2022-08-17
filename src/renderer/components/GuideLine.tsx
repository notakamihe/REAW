import React, { useRef } from "react";
import ReactDOM from "react-dom";

interface IProps {
  margin : number;
}

export default function GuideLine(props : IProps) {
  const timelineEditorWindowRef = useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    timelineEditorWindowRef.current = document.getElementById("timeline-editor-window");
  }, [])

  return (
    <React.Fragment>
      {
        timelineEditorWindowRef.current &&
        ReactDOM.createPortal(
          <div 
            style={{
              position: "absolute", 
              top: 0, 
              height: "100%", 
              left: props.margin - timelineEditorWindowRef.current.scrollLeft, 
              borderRight: "1px dashed var(--border14)",
              minHeight: "100%",
              zIndex: 25
            }}
          ></div>,
          timelineEditorWindowRef.current
        )
      }
    </React.Fragment>
  )
}