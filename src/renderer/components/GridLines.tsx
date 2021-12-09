import React from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";

interface IProps {
  editorWidth : number;
  shift? : boolean
}

export default class GridLines extends React.Component<IProps> {
  static contextType = WorkstationContext;
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {snapSize, timelinePosOptions} = this.context!

    const getAdditionalWidth = (idx : number) => {
      if (this.props.shift) {
        if ((idx + 1 + 24) % 32 === 0) {
          return 1
        } else if ((idx + 1) % 32 === 0) {
          return -1
        }
      }
      
      return 0
    }

    const getGridWidth = () => {
      return (timelinePosOptions.beatWidth * timelinePosOptions.horizontalScale) / 4
    }

    const getNumGridLines = () => {
      const numLines = Math.ceil(1500 / 4);
      return numLines || 0
    }

    return (
      <div 
        style={{
          position: "absolute", 
          zIndex: 1000, 
          top: this.props.shift ? -12 : 12, 
          bottom: 0, 
          width: this.props.editorWidth, 
          display: "flex", 
          pointerEvents: "none",
          padding: 0,
          margin: 0,
          height: 300,
          left: this.props.shift ? 1 : 0
        }}
      >
        {
          [...Array(getNumGridLines())].map((l, idx) => {
            return (
              <div 
                key={idx}
                style={{
                  width: getGridWidth() + getAdditionalWidth(idx), 
                  height: "100%",
                  borderRight: "1px solid #f00",
                  flexShrink: 0,
                }}
              ></div>
            )
          })
        }
      </div>
    )
  }
}