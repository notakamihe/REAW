import { CSSProperties, useContext, useEffect, useMemo, useState } from "react";
import { AutomationLaneEnvelope, Track } from "@/services/types/types";
import { formatVolume, normalizedToVolume, volumeToNormalized } from "@/services/utils/utils";
import Slider from "@/components/widgets/Slider";
import { WorkstationContext } from "@/contexts";
import { TooltipProps } from "@/components/widgets/Tooltip";

interface TrackVolumeSliderProps {
  className?: string;
  labelProps?: Partial<TooltipProps>;
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
  track: Track;
}

const markVolumes = [6, 0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60, -Infinity];

export default function TrackVolumeSlider({ style, track, ...rest }: TrackVolumeSliderProps) {
  const { getTrackCurrentValue, playheadPos, setTrack, timelineSettings } = useContext(WorkstationContext)!;
  
  const [volume, setVolume] = useState(track.volume);

  const { isAutomated, value } = useMemo(() => {
    const lane = track.automationLanes.find(lane => lane.envelope === AutomationLaneEnvelope.Volume);
    return getTrackCurrentValue(track, lane);
  }, [track.automationLanes, playheadPos, track.volume, timelineSettings.timeSignature])

  useEffect(() => setVolume(value!), [value])

  const vertical = rest.orientation === "vertical";
  const thumbBeforeStyle = vertical 
    ? { borderBottom: "1px solid var(--border6)", width: "80%", height: "fit-content", top: 5.5 } 
    : { borderRight: "1px solid var(--border6)", height: "80%", width: "fit-content", right: 5.5 };

  return (
    <div
      style={{ display: "flex", height: vertical ? "100%" : undefined, width: vertical ? undefined : "100%" }}
      title={isAutomated ? `Volume: ${formatVolume(volume)} (automated)` : undefined}  
    >
      <Slider
        {...rest}
        disabled={isAutomated}
        onChange={(_, value) => setVolume(normalizedToVolume((value as number) / 1000)) }
        onChangeCommitted={() => setTrack({ ...track, volume })}
        marks={markVolumes.map(volume => ({ value: volumeToNormalized(volume) * 1000 }))}
        max={1000}
        min={0}
        slotProps={{
          thumb: {
            style: {
              borderRadius: 0,
              boxShadow: "none",
              border: "1px solid var(--border6)",
              backgroundColor: "var(--bg2)",
              width: vertical ? 12 : 14,
              height: vertical ? 14 : 12,
              transitionDuration: "0ms"
            }
          },
          rail: {
            style: {
              backgroundColor: "var(--border6)",
              opacity: 1,
              height: vertical ? "calc(100% + 1px)" : "inherit"
            }
          },
          track: { style: { backgroundColor: "var(--border6)", border: "none" } },
          mark: {
            style: {
              backgroundColor: "var(--border6)",
              width: vertical ? 8 : 1,
              height: vertical ? 1 : 8,
              transform: vertical ? "translate(0, 1px)" : "" 
            }
          }
        }}
        style={{ 
          height: vertical ? "calc(100% + 1px)" : 1, 
          width: vertical ? 1 : "100%", 
          opacity: isAutomated ? 0.5 : 1,
          ...style
        }}
        sx={{ "& .MuiSlider-thumb::before": { ...thumbBeforeStyle, borderRadius: 0, boxShadow: "none" } }}
        value={volumeToNormalized(volume) * 1000}
        valueLabelDisplay="auto"
        valueLabelFormat={value => formatVolume(normalizedToVolume(value / 1000))}
      />
    </div>
  )
}