import React, { useContext } from "react";
import ReactDOM from "react-dom";
import { WorkstationContext } from "renderer/context/WorkstationContext";

interface IProps {
  margin : number;
}

export default function GuideLine(props : IProps) {
  const {trackLanesWindowHeight} = useContext(WorkstationContext)!
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (document.readyState === "complete")
      setLoaded(true)
  }, [document.readyState])

  return (
    <React.Fragment>
      {
        loaded &&
        ReactDOM.createPortal(
          <div 
            style={{
              position: "absolute", 
              top: 0, 
              height: trackLanesWindowHeight, 
              left: props.margin, 
              borderRight: "1px dashed #0004",
              minHeight: "100%",
              zIndex: 25
            }}
          ></div>,
          document.getElementById("timeline-editor")!
        )
      }
    </React.Fragment>
  )
}