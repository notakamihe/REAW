import { ListItemIcon } from "@mui/material";
import React from "react";

interface IProps {
  icon : JSX.Element;
}

export default function MenuIcon(props : IProps) {
  return (
    <ListItemIcon className="remove-spacing">
      {React.cloneElement(props.icon, {style: {marginRight: 8, fontSize: 14}})}
    </ListItemIcon>
  )
}