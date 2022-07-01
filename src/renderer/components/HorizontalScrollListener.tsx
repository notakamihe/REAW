import React, { useRef } from "react";

interface IProps {
  children: JSX.Element;
  onScroll: (e: React.UIEvent, prevScrollLeft: number) => void;
}

const HorizontalScrollListener: React.FC<IProps> = ({children, onScroll}) => {
  const lastScrollLeft = useRef(0);

  const handleScroll = (e: React.UIEvent) => {
    if (lastScrollLeft.current !== e.currentTarget.scrollLeft) {
      onScroll(e, lastScrollLeft.current);
    }

    lastScrollLeft.current = e.currentTarget.scrollLeft;
  }

  return React.cloneElement(children, {onScroll: handleScroll});
}

export default HorizontalScrollListener;