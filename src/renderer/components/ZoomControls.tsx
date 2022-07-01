import { Add, Remove } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import React, { useEffect, useState } from "react";
import { WorkstationContext } from "renderer/context/WorkstationContext";
import Holdable from "./Holdable";
import Slider from "./ui/Slider";

function ZoomButton(props : {vertical: boolean, decrease: boolean, onZoom: () => void}) {
  const getTitle = () => {
    if (props.vertical) {
      return props.decrease ? "Zoom Out Vertically" : "Zoom In Vertically";
    } else {
      return props.decrease ? "Zoom Out Horizontally" : "Zoom In Horizontally";
    }
  }

  const getBorderRadius = () => {
    if (props.vertical) {
      return props.decrease ? "0 0 50% 50%" : "50% 50% 0 0";
    } else {
      return props.decrease ? "50% 0 0 50%" : "0 50% 50% 0";
    }
  }

  return (
    <Holdable interval={100} onHold={props.onZoom}>
      <IconButton 
        style={{backgroundColor: "#aaa", padding: 0, width: 12, height: 12, borderRadius: getBorderRadius(), zIndex: 20}}
        title={getTitle()}
      >
        {
          props.decrease ?
            <Remove style={{fontSize: 14, color: "var(--bg1)"}}/> :
            <Add style={{fontSize: 14, color: "var(--bg1)"}}/>
        }
      </IconButton>
    </Holdable>
  )
}

const ZoomControls = (props: {onZoom?: (vertical: boolean) => void}) => {
  const {horizontalScale, setHorizontalScale, setVerticalScale, verticalScale} = React.useContext(WorkstationContext)!;
  const [hScale, setHScale] = useState(horizontalScale);
  const [vScale, setVScale] = useState(verticalScale);

  useEffect(() => {
    if (horizontalScale !== hScale) {
      setHScale(horizontalScale);
    }

    if (verticalScale !== vScale) {
      setVScale(verticalScale);
    }
  }, [horizontalScale, verticalScale]);

  const zoom = (vertical: boolean, amt: number) => {
    props.onZoom?.(vertical);

    if (vertical) {
      setVerticalScale(Math.min(Math.max(verticalScale + amt, 0.6), 5));
    } else {
      setHorizontalScale(Math.min(Math.max(horizontalScale + amt, 0.013), 25));
    }
  }

  return (
    <div style={{position: "absolute", right: 16, bottom: 16}}>
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", marginBottom: 8}}>
        <ZoomButton decrease={false} onZoom={() => zoom(true, 0.2)} vertical />
        <Slider
          className="no-shadow"
          label={+(vScale).toFixed(1) + "x"}
          labelProps={{placement: {horizontal: "left", vertical: "center"}}}
          min={0.6}
          max={5}
          onChange={(e, v) => setVScale(v as number)}
          onChangeCommitted={() => {props.onZoom?.(true); setVerticalScale(vScale);}}
          orientation="vertical"
          showLabelOnHover
          step={0.2}
          style={{width: 12, height: 35, padding: 0, zIndex: 19}}
          sx={{
            "& .MuiSlider-thumb": {
              backgroundColor: "var(--bg1)",
              width: "8px",
              height: "8px"
            },
            "& .MuiSlider-rail": {
              width: "12px",
              backgroundColor: "#aaa",
              borderRadius: "0",
              opacity: 1
            },
            "& .MuiSlider-track": {
              width: "0",
              visibility: "hidden"
            },
          }}
          value={vScale}
        />
        <ZoomButton decrease={true} onZoom={() => zoom(true, -0.2)} vertical />
      </div>
      <div style={{display: "flex"}}>
        <ZoomButton decrease={true} onZoom={() => zoom(false, -0.1 * horizontalScale)} vertical={false} />
        <Slider
          className="no-shadow"
          label={+(hScale).toFixed(2) + "x"}
          min={0}
          max={100}
          onChange={(e, v) => setHScale(10 ** ((200 * ((v as number) - 50)) / 7151) - 0.027)}
          onChangeCommitted={() => {props.onZoom?.(false); setHorizontalScale(hScale);}}
          showLabelOnHover
          style={{width: 35, height: 12, padding: 0, zIndex: 19}}
          sx={{
            "& .MuiSlider-thumb": {
              backgroundColor: "var(--bg1)",
              width: "8px",
              height: "8px",
            },
            "& .MuiSlider-rail": {
              height: "12px",
              backgroundColor: "#aaa",
              borderRadius: "0",
              opacity: 1
            },
            "& .MuiSlider-track": {
              height: "0",
              visibility: "hidden"
            },
          }}
          value={Math.log10(hScale + 0.027) * 35.755 + 50}
        />
        <ZoomButton decrease={false} onZoom={() => zoom(false, 0.1 * horizontalScale)} vertical={false} />
      </div>
    </div>
  );
}

export default ZoomControls;