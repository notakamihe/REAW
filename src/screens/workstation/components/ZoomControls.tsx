import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Add, Remove } from "@mui/icons-material";
import { WorkstationContext } from "@/contexts";
import { clamp, inverseLerp, lerp } from "@/services/utils/general";
import { HoldActionButton } from "@/components";
import { Slider } from "@/components/widgets";

interface IProps {
  onZoom?: (vertical: boolean) => void;
  vertical?: boolean;
}

export default function ZoomControls({ onZoom, vertical }: IProps) {
  const { setVerticalScale, timelineSettings, updateTimelineSettings, verticalScale } = useContext(WorkstationContext)!;

  const [value, setValue] = useState(vertical ? verticalScale : timelineSettings.horizontalScale);
  const [zoomValueChanged, setZoomValueChanged] = useState(false);

  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const newValue = vertical ? verticalScale : timelineSettings.horizontalScale;

    if (value !== newValue) {
      clearTimeout(timeout.current);

      setValue(newValue);
      setZoomValueChanged(true);
      
      timeout.current = setTimeout(() => setZoomValueChanged(false), 1000);
    }
  }, [timelineSettings.horizontalScale, verticalScale, vertical])

  function horizontalScaleToSliderPos(horizontalScale: number) {
    return 0.128144 * Math.log(90.9244 * horizontalScale + 0.946923) - 0.0792586;
  }

  function handleChange(_: Event, value: number | number[]) {
    if (vertical)
      setValue(+lerp((value as number) / 1000, 0.75, 5).toFixed(2));
    else
      setValue(+sliderPosToHorizontalScale((value as number) / 1000).toFixed(2));
  }

  function handleChangeCommitted() {
    onZoom?.(Boolean(vertical));

    if (vertical)
      setVerticalScale(value);
    else
      updateTimelineSettings({ ...timelineSettings, horizontalScale: value });
  }

  function sliderPosToHorizontalScale(sliderPos: number) {
    return (Math.exp((sliderPos + 0.0792586) / 0.128144) - 0.946923) / 90.9244;
  }

  function zoom(amount: number) {
    onZoom?.(Boolean(vertical));

    if (vertical) {
      setVerticalScale(clamp(+(verticalScale + amount).toPrecision(4), 0.75, 5));
    } else {
      const horizontalScale = clamp(timelineSettings.horizontalScale + amount, 0.01, 50);
      updateTimelineSettings({ ...timelineSettings, horizontalScale });
    }
  }

  const sliderValue = useMemo(() => {
    if (vertical)
      return inverseLerp(value, 0.75, 5) * 1000;
    else
      return horizontalScaleToSliderPos(value) * 1000;
  }, [vertical, value])

  const increment = vertical ? 0.25 : 0.1 * value;

  const styles = {
    container: {
      backgroundColor: "var(--bg1)",
      flexDirection: vertical ? "column-reverse" : "row",
      borderWidth: vertical ? "1px 0 0" : "0 1px"
    },
    zoomButton: {
      padding: 0,
      border: "1px solid var(--border1)", 
      borderWidth: vertical ? "1px 0" : "0 1px", 
      borderRadius: 0
    },
    slider: {
      width: vertical ? 11 : 52, 
      height: vertical ? 48 : 11,
      margin: vertical ? "8px 0" : "0 8px",
    }
  } as const;

  return (
    <div className="d-flex align-items-center overflow-hidden" style={styles.container}>
      <HoldActionButton
        interval={175} 
        onHoldAction={() => zoom(-increment)}
        style={styles.zoomButton}
        title={`Zoom Out ${vertical ? "Vertically" : "Horizontally"}`}
      >
        <Remove style={{fontSize: 15, color: "var(--border6)"}} />
      </HoldActionButton>
      <Slider
        className="p-0 no-shadow"
        labelProps={{
          placement: { horizontal: vertical ? "left" : "center", vertical: vertical ? "center" : "top" }
        }}
        max={1000}
        min={0}
        onChange={handleChange}
        onChangeCommitted={handleChangeCommitted}
        orientation={vertical ? "vertical" : "horizontal"}
        slotProps={{
          thumb: { style: { backgroundColor: "var(--border6)", width: 8, height: 8 } },
          rail: { style: { visibility: "hidden" } },
          track: { style: { visibility: "hidden" } }
        }}
        step={vertical ? 1000 / 17 : 1}
        style={styles.slider}
        value={sliderValue}
        valueLabelDisplay={zoomValueChanged ? "on" : "auto"}
        valueLabelFormat={+(value).toFixed(2) + "x"}
      />
      <HoldActionButton
        interval={175} 
        onHoldAction={() => zoom(increment)}
        style={styles.zoomButton}
        title={`Zoom In ${vertical ? "Vertically" : "Horizontally"}`}
      >
        <Add style={{fontSize: 15, color: "var(--border6)"}} />
      </HoldActionButton>
    </div>
  )
}