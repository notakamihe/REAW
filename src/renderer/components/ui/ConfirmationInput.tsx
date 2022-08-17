import React from "react";

interface IProps {
  className?: string;
  inputStyle?: React.CSSProperties;
  onConfirm : (e : React.FormEvent<HTMLFormElement>) => void
  onChange : (e : React.ChangeEvent<HTMLInputElement>) => void
  style? : React.CSSProperties
  value : string
}

export default function ConfirmationInput(props : IProps) {
  return (
    <form 
      className={props.className}
      onKeyDown={e => {if (e.key === "Tab") props.onConfirm(e);}}
      onMouseDown={e => e.stopPropagation()}
      onSubmit={props.onConfirm}
      style={{display: "flex", ...props.style}}
    >
      <input
        autoFocus
        className="br-inherit-l"
        value={props.value} 
        onChange={props.onChange} 
        style={{
          backgroundColor: "#0000", 
          width: 50, 
          border: "1px solid var(--border7)", 
          color: "var(--border7)", 
          fontSize: 13, 
          outline: "none", 
          marginRight: 2,
          ...props.inputStyle
        }}
      />
    </form>
  )
}