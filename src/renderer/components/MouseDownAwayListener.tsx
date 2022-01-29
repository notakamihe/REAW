import React from "react";
import { ClickAwayListener } from "@mui/material";

interface IProps {
  onMouseDown? : () => void
  onAway : () => void
  children: JSX.Element
}

export default function MouseDownAwayListener(props : IProps) {
  const preventOnAway= React.useRef(false);

  const handleClickAway = (e : MouseEvent | TouchEvent) => {
    if (!preventOnAway.current) {
      props.onAway()
    } 
  
    preventOnAway.current = false;
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      {React.cloneElement(props.children, {
        onMouseDown: () => {props.onMouseDown && props.onMouseDown(); preventOnAway.current = true},
        onMouseUp: () => preventOnAway.current = false,
      })}
    </ClickAwayListener>
  )
}