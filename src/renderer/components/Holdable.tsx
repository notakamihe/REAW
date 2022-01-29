import React from "react";

interface IProps {  
  children: JSX.Element;
  timeout: number;
  interval: number;
  onHold: () => void;
  onMouseDown: () => void;
}

export default class Holdable extends React.Component<IProps, {}> {
  private timeoutID: any;

  constructor(props: IProps) {
    super(props);
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  onMouseDown() {
    this.props.onMouseDown();
  
    this.timeoutID = setTimeout(() => {
      this.timeoutID = setInterval(() => {
        this.props.onHold();
      }, this.props.interval || 0);
    }, this.props.timeout || 1000);
  }
  
  render() {
    return React.cloneElement(this.props.children, {
      onMouseDown: this.onMouseDown,
      onMouseUp: () => clearTimeout(this.timeoutID),
      onMouseOut: () => clearTimeout(this.timeoutID)
    })
  }
}