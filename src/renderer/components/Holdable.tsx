import React from "react";

interface IProps {  
  children: JSX.Element;
  delay?: number;
  interval: number;
  onHold: () => void;
  onMouseDown?: () => void;
}

export default class Holdable extends React.Component<IProps, {}> {
  t: any;

  constructor(props: IProps) {
    super(props);

    this.t = undefined;

    this.repeat = this.repeat.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  repeat() {
    this.props.onHold();
    this.t = setTimeout(this.repeat, this.props.interval);
  }

  onMouseDown() {
    this.props.onMouseDown?.();

    if (this.props.delay)
      this.props.onHold();
      
    this.t = setTimeout(this.repeat, this.props.delay || 0);
  }

  render() {
    return React.cloneElement(this.props.children, {
      onMouseDown: this.onMouseDown,
      onMouseUp: () => clearTimeout(this.t),
      onMouseLeave: () => clearTimeout(this.t)
    })
  }
}