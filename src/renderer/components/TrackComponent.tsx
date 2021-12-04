import React from "react"
import { WorkstationContext } from "renderer/context/WorkstationContext"
import { ID } from "renderer/types/types"
import { Clip } from "./ClipComponent"

interface TrackProps {
  track: Track
}

type State = {

}

export interface Track {
  id : ID
  name : string
  color : string
  clips : Clip[]
}

export default class TrackComponent extends React.Component<TrackProps, State> {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  render() {
    const {verticalScale, setVerticalScale} = this.context!

    return (
      <div 
        style={{width: 200, height: 100 * verticalScale, backgroundColor: this.props.track.color}} 
        className="p-2 disable-highlighting"
      >
        <p 
          className="text-center m-0" 
          style={{backgroundColor: "#fff9", borderRadius: 5, fontSize: 12, fontWeight: "bold"}}
        >
          {this.props.track.name}
        </p>
        <div className="mt-2">
          <button style={{marginLeft: 2, marginRight: 2, borderRadius: 5, fontSize: 12}}>M</button>
          <button style={{marginLeft: 2, marginRight: 2, borderRadius: 5, fontSize: 12}}>S</button>
          <button style={{marginLeft: 2, marginRight: 2, borderRadius: 5, fontSize: 12}}>A</button>
        </div>
      </div>
    )
  }
}