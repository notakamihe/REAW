import React from "react";

interface IProps {
  value: any;
  onChange: (value: any) => void;
  type?: string;
  style?: React.CSSProperties;
  focusedStyle?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

interface IState {
  isFocused: boolean;
}

export default class EditableDisplay extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      isFocused: false
    }
  }

  private getStyle() {
    const style = this.props.style || {};
    const focusedStyle = this.props.focusedStyle || {};

    if (this.state.isFocused) {
      return {...style, ...focusedStyle};
    } else {
      return style;
    }
  }
    
  render() {
    return (
      <React.Fragment>
        {
          this.props.type === "select" ?
          <select
            value={this.props.value}
            style={this.getStyle()}
            onChange={this.props.onChange}
            onFocus={e => this.setState({isFocused: true})}
            onBlur={e => this.setState({isFocused: false})}
            className={this.props.className}
          >
            {this.props.children}
          </select> :
          <input 
            value={this.props.value}
            style={this.getStyle()}
            type={this.props.type || "text"} 
            onChange={this.props.onChange}
            onFocus={e => this.setState({isFocused: true})}
            onBlur={e => this.setState({isFocused: false})}
            className={this.props.className}
          />
        }
      </React.Fragment>
    )
  }
}