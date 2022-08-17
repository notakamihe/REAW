import React, { useRef } from "react";

interface IProps {
  children: JSX.Element;
  onScroll: (e: React.UIEvent, horizontal: boolean, prevScrollLeft: number) => void;
}

const DirectionalScrollListener: React.FC<IProps> = ({children, onScroll}) => {
  const lastScrollLeft = useRef(0);

  const handleScroll = (e: React.UIEvent) => {
    onScroll(e, lastScrollLeft.current !== e.currentTarget.scrollLeft, lastScrollLeft.current);
    lastScrollLeft.current = e.currentTarget.scrollLeft;
  }

  return React.cloneElement(children, {onScroll: handleScroll});
}

export default DirectionalScrollListener;