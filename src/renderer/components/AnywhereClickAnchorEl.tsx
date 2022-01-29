import React, { useRef } from "react";

interface IProps {
  children : JSX.Element,
  onRightClickAnywhere : (e : HTMLElement | null) => void
}

export default function AnywhereClickAnchorEl(props : IProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);

  const onContextMenu = (e : React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()

    setX(e.clientX - e.currentTarget.getBoundingClientRect().left);
    setY(e.clientY - e.currentTarget.getBoundingClientRect().top);
    props.onRightClickAnywhere(ref.current);
  }

  return (
    React.cloneElement(
      props.children,
      {onContextMenu: onContextMenu, style: {...props.children.props.style}},
      ...React.Children.map(props.children.props.children || [], (child : JSX.Element, idx : number) => {
        return child ? React.cloneElement(child, {key: idx}, child.props.children || []) : null;
      }),
      <div ref={ref} style={{position: "absolute", left: x, top: y}}></div>
    )
  )
}