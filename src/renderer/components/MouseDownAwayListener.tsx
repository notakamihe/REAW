import React from "react";
import { ClickAwayListener } from "@mui/material";

interface IProps {
  onMouseDown? : () => void
  onAway : () => void
  children: JSX.Element
}

export default function MouseDownAwayListener(props : IProps) {
  const [preventOnAway, setPreventOnAway] = React.useState(false);

  const handleClickAway = (e : MouseEvent | TouchEvent) => {
    if (!preventOnAway) {
      props.onAway()
    } 
  
    setPreventOnAway(false);
  }

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      {React.cloneElement(props.children, {
        onMouseDown: () => {props.onMouseDown && props.onMouseDown(); setPreventOnAway(true)},
        onMouseUp: () => setPreventOnAway(false)
      })}
    </ClickAwayListener>
  )
}