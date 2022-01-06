import React from "react";

interface IProps {
  children : JSX.Element,
  onRightClickAnywhere : (e : HTMLElement | null) => void
}

export default function AnywhereClickAnchorEl(props : IProps) {
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);

  const ref = React.useRef<HTMLDivElement>(null);

  const onContextMenu = (e : React.MouseEvent) => {
    e.stopPropagation()

    setX(e.clientX - e.currentTarget.getBoundingClientRect().left);
    setY(e.clientY - e.currentTarget.getBoundingClientRect().top);
    props.onRightClickAnywhere(ref.current);
  }

  return (
    React.cloneElement(
      props.children,
      {
        onContextMenu: onContextMenu,
        style: {...props.children.props.style, position: "relative"},
      }, 
      ...React.Children.map(props.children, (child : JSX.Element, idx : number) => {
        return React.cloneElement(child, {key: idx});
      }),
      <div ref={ref} style={{position: "absolute", left: x, top: y}}></div>
    )
  )
}