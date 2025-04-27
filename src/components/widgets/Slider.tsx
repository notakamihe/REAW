import { useCallback, useState } from "react";
import { Slider as MuiSlider, SliderProps as MuiSliderProps } from "@mui/material"
import Tooltip, { TooltipProps } from "./Tooltip";

export interface SliderProps extends Omit<MuiSliderProps, "ref"> {
  labelProps?: Partial<TooltipProps>
  valueLabelFormat?: string | ((value: number) => string);
}

export default function Slider({ labelProps, valueLabelFormat, ...rest }: SliderProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLSpanElement | null>(null);
  const [sliding, setSliding] = useState(false);

  const thumbRef = useCallback((node: HTMLSpanElement | null) => {
    setAnchorEl(node);
  }, [])

  function getLabel() {
    if (rest.value !== undefined && typeof rest.value === "number") {
      if (valueLabelFormat) {
        if (typeof valueLabelFormat === "string")
          return valueLabelFormat;
        return valueLabelFormat(rest.value);
      }
    }

    return rest.value?.toString();
  }

  function handleChangeCommitted(e: Event | React.SyntheticEvent<Element, Event>, v: number | number[]) {
    setSliding(false);
    rest.onChangeCommitted?.(e, v);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLSpanElement>) {
    if (e.button === 0) {
      setSliding(true);
      rest.onMouseDown?.(e);
    }
  }

  return (
    <>
      <Tooltip
        anchorEl={anchorEl}
        placement={{ horizontal: "center", vertical: "top" }}
        {...labelProps}
        open={sliding || rest.valueLabelDisplay === "on"}
        showOnHover={rest.valueLabelDisplay === "auto"}
        title={getLabel()}
      />
      <MuiSlider
        {...rest}
        onChangeCommitted={handleChangeCommitted}
        onMouseDown={handleMouseDown}
        slotProps={{ ...rest.slotProps, thumb: { ...rest.slotProps?.thumb, ref: thumbRef } }}
        sx={{ ...rest.sx, ".MuiSlider-thumb::after": { width: "100%", height: "100%" } }}
        valueLabelDisplay="off"
      />
    </>
  )
}