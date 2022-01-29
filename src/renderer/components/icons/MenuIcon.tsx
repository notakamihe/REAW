import { ListItemIcon } from "@mui/material";
import React from "react";

export default function MenuIcon(props : {icon : JSX.Element}) {
  return (
    <ListItemIcon className="remove-spacing">
      {React.cloneElement(props.icon, {style: {...props.icon.props.style, marginRight: 8, fontSize: 14}})}
    </ListItemIcon>
  )
}