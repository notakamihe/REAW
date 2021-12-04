import React from "react";

interface IProps {  
  children: React.ReactNode;
  timeout: number;
  interval: number;
  style? : React.CSSProperties;
  onHold: () => void;
  onMouseDown: () => void;
}

interface IState {
}

export default class Holdable extends React.Component<IProps, IState> {
  private timeoutID: any;

  constructor(props: IProps) {
    super(props);
  }

  onMouseDown = () => {
    this.props.onMouseDown();

    this.timeoutID = setTimeout(() => {
      this.timeoutID = setInterval(() => {
        this.props.onHold();
      }, this.props.interval || 0);
    }, this.props.timeout || 1000);
  }
  
  render() {
    return (
      <div 
        style={this.props.style} 
        onMouseDown={this.onMouseDown} 
        onMouseUp={e => clearTimeout(this.timeoutID)}
        onMouseLeave={e => clearTimeout(this.timeoutID)}
      >
        {this.props.children}
      </div>
    )
  }
}