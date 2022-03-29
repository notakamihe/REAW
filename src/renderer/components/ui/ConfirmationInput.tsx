import { Check } from "@mui/icons-material";
import React from "react";

interface IProps {
  buttonStyle?: React.CSSProperties;
  disabled?: boolean;
  className?: string;
  icon? : JSX.Element
  inputStyle?: React.CSSProperties;
  onConfirm : (e : React.FormEvent<HTMLFormElement>) => void
  onChange : (e : React.ChangeEvent<HTMLInputElement>) => void
  style? : React.CSSProperties
  value : string
}

export default function ConformationInput(props : IProps) {
  return (
    <form 
      className={props.className}
      onMouseDown={e => e.stopPropagation()}
      onSubmit={props.onConfirm}
      style={{display: "flex", borderRadius: 3, ...props.style}}
    >
      <input
        className="br-inherit-l"
        disabled={props.disabled}
        value={props.value} 
        onChange={props.onChange} 
        style={{backgroundColor:"#fff", width:40, border:"none", fontSize:13, outline:"none", ...props.inputStyle}}
      />
      <button 
        className="br-inherit-r center-by-flex" 
        disabled={props.disabled}
        style={{
          backgroundColor:"var(--color1)", 
          padding: "0 2px", 
          filter: props.disabled ? "grayscale(100%)" : "", 
          ...props.buttonStyle
        }}
        type="submit" 
      >
        {props.icon || <Check style={{fontSize: 14, color: "#fff"}} />}
      </button>
    </form>
  )
}