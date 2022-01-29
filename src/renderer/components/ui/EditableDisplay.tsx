import React from "react";

interface IProps {
  style?: React.CSSProperties;
  focusedStyle?: React.CSSProperties;
}

interface IState {
  isFocused: boolean;
}

export default class EditableDisplay extends React.Component<IProps & React.HTMLProps<HTMLInputElement>, IState> {
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
          <input 
            {...this.props}
            style={this.getStyle()}
            onFocus={e => {this.setState({isFocused: true}); this.props.onFocus && this.props.onFocus(e)}}
            onBlur={e => {this.setState({isFocused: false}); this.props.onBlur && this.props.onBlur(e)}}
          />
        }
      </React.Fragment>
    )
  }
}