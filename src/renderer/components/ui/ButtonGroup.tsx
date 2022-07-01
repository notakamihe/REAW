import React from "react";

interface IProps {
  buttonStyle?: React.CSSProperties;
  children: (JSX.Element | null)[];
  orientation?: "horizontal" | "vertical";
  style?: React.CSSProperties;
}

const ButtonGroup = (props: IProps) => {
  return (
    <div style={{...props.style, display: "flex", flexDirection: props.orientation === "vertical" ? "column" : "row"}}>
      {
        React.Children.map(props.children.filter(c => c !== null) as JSX.Element[], (child: JSX.Element, i: number) => (
          React.cloneElement(child, {...child.props, style: {
            fontSize: 14,
            border: "1px solid #0009",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transform: props.orientation === "vertical" ? `translateY(${i > 0 ? -i : 0}px)` : `translateX(${i > 0 ? -i : 0}px)`,
            padding: 0,
            ...props.buttonStyle, 
            ...child.props.style
          }})
        ))
      }
    </div>
  )
}

export default ButtonGroup;