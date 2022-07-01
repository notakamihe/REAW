import { Add } from "@mui/icons-material";
import { IconButton, SpeedDialIcon } from "@mui/material";
import React from "react";

interface IProps {
  actionsContainerStyle?: React.CSSProperties;
  children: JSX.Element[] | JSX.Element;
  containerStyle?: React.CSSProperties;
  direction: "up" | "down" | "left" | "right";
  hideActionsOnSelect?: boolean;
  icon?: JSX.Element;
  style?: React.CSSProperties;
}

interface IState {
  showActions: boolean;
}

export default class SpeedDial extends React.Component<IProps, IState> {
  static defaultProps = {
    direction: "up"
  };

  constructor(props: IProps) {
    super(props);

    this.state = {
      showActions: false
    }

    this.onSelect = this.onSelect.bind(this);
  }

  getDirectionStyles = () : React.CSSProperties => {
    switch (this.props.direction) {
      case "up":
        return {top: 0, left: "50%", transform: "translate(calc(-50% + 1px), -100%)", flexDirection: "column-reverse"};
      case "down":
        return {bottom: 0, left: "50%", transform: "translate(calc(-50% + 1px), 100%)", flexDirection: "column"};
      case "left":
        return {left: 0, top: "50%", transform: "translate(-100%, calc(-50% + 1px))", flexDirection: "row-reverse"};
      case "right":
        return {right: 0, top: "50%", transform: "translate(100%, calc(-50% + 1px))", flexDirection: "row"};
    }
  }

  getActionMargin() {
    switch(this.props.direction) {
      case "up":
        return "0 8px 0";
      case "down":
        return "8px 0 0 0";
      case "left":
        return "0 8px 0 0";
      case "right":
        return "0 0 0 8px";
    }
  }

  onSelect = (el : JSX.Element, e : React.MouseEvent) => {
    el.props.onClick?.(e);

    if (this.props.hideActionsOnSelect !== false)
      this.setState({showActions: false});
  }

  render() {
    const directionStyles = this.getDirectionStyles();
    const margin = this.getActionMargin();

    return (
      <div 
        onMouseLeave={() => this.setState({showActions: false})}
        style={{width: "fit-content", height: "fit-content", position: "relative", ...this.props.containerStyle}}
      >
        <IconButton onMouseOver={() => this.setState({showActions: true})} style={{zIndex: 1, ...this.props.style}}>
          {
            this.props.icon ? 
            (
              this.props.icon.type === SpeedDialIcon ? 
                <SpeedDialIcon open={this.state.showActions} {...this.props.icon.props} /> : this.props.icon
            ) :
            <Add style={{fontSize: 18}} />
          }
        </IconButton>
        <div 
          className="position-absolute"
          style={{...directionStyles, ...this.props.actionsContainerStyle, display: this.state.showActions ? "flex" : "none"}}
        >
          {
            React.Children.map(this.props.children, (child: JSX.Element) => {
              return React.cloneElement(
                child, 
                {style: {margin: margin, ...child.props.style}, onClick: (e : React.MouseEvent) => this.onSelect(child, e)}
              );
            })
          }
        </div>
      </div>
    );
  }
}