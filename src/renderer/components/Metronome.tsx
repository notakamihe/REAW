import React from "react";
import { IconButton } from "@mui/material";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import Timer from "renderer/types/Timer";
import metronomeTick from "./../../../assets/audio/metronome-tick.mp3";
import metronomeTIckAccentuated from "../../../assets/audio/metronome-tick-accentuated.mp3";
import { MetronomeIcon } from "./icons";

const tickAudio = new Audio(metronomeTick);
const tickAccentuatedAudio = new Audio(metronomeTIckAccentuated);

export default function Metronome() {
  const {isPlaying, metronome, setMetronome, tempo, timeSignature} = React.useContext(WorkstationContext)!
  const [timer, setTimer] = React.useState<Timer | null>(null)
  const tickCount = React.useRef<number>(0)

  React.useEffect(() => {
    timer?.stop()
    tickCount.current = 0

    if (metronome && isPlaying) {
      setTimer(new Timer(playTick, 60000 / tempo * (4 / timeSignature.noteValue), {immediate: true}))
    } else {
      setTimer(null)
    }
  }, [metronome, isPlaying, timeSignature, tempo])

  const playTick = () => {
    tickAudio.currentTime = 0
    tickAccentuatedAudio.currentTime = 0

    if (tickCount.current === 0) {
      tickAccentuatedAudio.play()
    } else {
      tickAudio.play()
    }

    tickCount.current++

    if (tickCount.current === timeSignature.beats) {
      tickCount.current = 0
    }
  }

  return (
    <IconButton 
      className={`btn1 mx-1 ${metronome ? "no-borders" : ""}`}
      onClick={() => setMetronome(!metronome)} 
      style={{backgroundColor: metronome ? "var(--color1)" : "#0000", width: 24, height: 24}}
    >
      <MetronomeIcon iconStyle={{size: 14, color: metronome ? "var(--bg9)" : "var(--border7)"}} />
    </IconButton>
  )
}