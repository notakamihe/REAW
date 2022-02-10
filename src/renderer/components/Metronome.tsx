import React from "react";
import { IconButton } from "@mui/material";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import Timer from "renderer/types/Timer";
import metronomeIcon from "../../../assets/svg/metronome.svg"

export default class Metronome extends React.Component {
  static contextType = WorkstationContext
  context : React.ContextType<typeof WorkstationContext>

  metronome = new Timer(this.tick, 1000, {immediate: true})

  constructor(props : any) {
    super(props)
    
    this.tick = this.tick.bind(this)
  }

  tick() {
  }

  render() {
    const {metronome, setMetronome} = this.context!

    return (
      <IconButton 
        className="p-1" 
        onClick={() => setMetronome(!metronome)} 
        style={{backgroundColor: metronome ? "var(--color-primary)" : "#0004"}}
      >
        <img src={metronomeIcon} style={{height: 14}} />
      </IconButton>
    )
  }
}