import { useContext, useEffect, useRef } from "react";
import { IconButton } from "@mui/material";
import { WorkstationContext } from "@/contexts";
import { Metronome as MetronomeIcon } from "@/components/icons";
import metronomeTick from "@/assets/audio/metronome-tick.wav";
import metronomeTickAccentuated from "@/assets/audio/metronome-tick-accentuated.wav";

const accentuatedTickAudio = new Audio(metronomeTickAccentuated);
const tickAudio = new Audio(metronomeTick);

export default function Metronome() {
  const { isPlaying, metronome, setMetronome, timelineSettings } = useContext(WorkstationContext)!;

  const playStartTime = useRef(-1);
  const speed = useRef(-1);
  const tickCount = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    if (metronome && isPlaying) {
      if (playStartTime.current === -1) {
        playStartTime.current = new Date().getTime();
        playTick(0);
      }
    } else if (playStartTime.current > -1) {
      stopTick();
      tickCount.current = 0;
      playStartTime.current = -1;
    }
  }, [metronome, isPlaying])

  useEffect(() => {
    const { timeSignature, tempo } = timelineSettings;
    speed.current = 60 / tempo * (4 / timeSignature.noteValue) * 1000;

    if (metronome && isPlaying) {
      stopTick();
      
      const elapsed = new Date().getTime() - playStartTime.current;
      const nextTickTime = Math.ceil(elapsed / speed.current) * speed.current;

      playTick(nextTickTime - elapsed);
    }
  }, [timelineSettings.timeSignature, timelineSettings.tempo])

  function playTick(delay: number) {
    timeout.current = setTimeout(() => {
      if (tickCount.current++ % timelineSettings.timeSignature.beats === 0) {
        accentuatedTickAudio.currentTime = 0;
        accentuatedTickAudio.play();
      } else {
        tickAudio.currentTime = 0;
        tickAudio.play();
      }

      if (timeout.current !== null)
        playTick(speed.current);
    }, delay);
  }

  function stopTick() {
    if (timeout.current !== null) {
      clearTimeout(timeout.current);
      timeout.current = null;
    }
  }

  return (
    <IconButton 
      className={`p-0 btn-1 mx-1 ${metronome ? "no-borders" : "hover-1"}`}
      onClick={() => setMetronome(!metronome)} 
      style={{ backgroundColor: metronome ? "var(--color1)" : "#0000", width: 24, height: 24 }}
      title="Toggle Metronome [T]"
    >
      <MetronomeIcon size={14} style={{ color: metronome ? "var(--bg6)" : "var(--border6)" }} />
    </IconButton>
  )
}