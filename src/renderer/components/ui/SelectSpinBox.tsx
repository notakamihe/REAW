import { IconDefinition } from "@fortawesome/fontawesome-common-types";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { List, ListItem, ListItemButton, Popover } from "@mui/material";
import React from "react";

export interface SelectSpinBoxOption<T> {
  value : T
  label : string
}

interface IProps {
  value: any
  options : SelectSpinBoxOption<any>[]
  icon? : React.ReactNode
  actionIcon? : React.ReactNode
  label? : string
  style? : React.CSSProperties
  defaultText? : string
  onChange : (option : SelectSpinBoxOption<any>) => void
  onClick? : () => void
  onPrev : () => void
  onNext : () => void
  leftClickOpen? : boolean
}

interface IState {
  anchorEl : HTMLElement | null
  isHoveringOverIcon : boolean
}

export default class SelectSpinBox extends React.Component<IProps, IState> {
  constructor(props : IProps) {
    super(props);

    this.state = {
      anchorEl: null,
      isHoveringOverIcon: false
    };
  }

  isValueFirst = () => {
    return this.props.options[0].value === this.props.value;
  }

  isValueLast = () => {
    return this.props.options[this.props.options.length - 1].value === this.props.value;
  }

  onClick = (e : React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!this.props.leftClickOpen && this.props.onClick) {
      this.props.onClick();
    }
  }

  onOptionClick = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, option : SelectSpinBoxOption<any>) => {
    e.stopPropagation()
    this.props.onChange(option)
    this.setState({anchorEl: null})
  }

  openPopover = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, open : boolean) => {
    if (open && this.props.options.length)
      this.setState({anchorEl: e.currentTarget});
  }

  render() {
    return (
      <div 
        className="d-flex align-items-center"
        style={this.props.style}
      >
        <div 
          className="p-1 d-flex justify-content-center align-items-center" 
          style={{height: "100%"}}
          onMouseEnter={() => this.setState({isHoveringOverIcon: true})}
          onMouseLeave={() => this.setState({isHoveringOverIcon: false})}
        >
          {this.props.icon && (!this.state.isHoveringOverIcon || !this.props.actionIcon) && this.props.icon}
          {
            (this.props.actionIcon && (this.state.isHoveringOverIcon || !this.props.icon)) && 
            this.props.actionIcon
          }
        </div>
        {
          this.props.label &&
          <div className="p-1">
            {this.props.label}
          </div>
        }
        <div 
          onContextMenu={e => this.openPopover(e, true)} 
          onMouseDown={e => {if (this.props.leftClickOpen) this.openPopover(e, Boolean(this.props.leftClickOpen))}} 
          onClick={this.onClick}
          style={{
            flex: 1, 
            height: "100%",
            paddingLeft: 4, 
            cursor: (this.props.leftClickOpen || this.props.onClick) ? "pointer" : "default",
            overflow: "hidden",
            display: "flex",
            alignItems: "center"
          }}
        >
          <p
            style={{
              width: "100%",
              fontSize: 14,
              verticalAlign: "bottom",
              margin: 0,
              overflow: "hidden",
              height: 18
            }}
          >
            {
              this.props.options.find(o => o.value === this.props.value)?.label || 
              <span style={{opacity: 0.7}}>{this.props.defaultText}</span>
            }
          </p>
          <Popover
            open={Boolean(this.state.anchorEl)}
            anchorEl={this.state.anchorEl}
            onClose={e => this.setState({anchorEl: null})}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left',
            }}
            style={{width: "100%"}}
          >
            <List className="p-0">
              {
                this.props.options.map((option, i) => (
                  <ListItem key={i} className="m-0 p-0" disablePadding>
                    <ListItemButton 
                      className="p-1" 
                      onClick={e => this.onOptionClick(e, option)}
                    >
                      {option.label}
                    </ListItemButton>
                  </ListItem>
                ))
              }
            </List>
          </Popover>
        </div>
        {
          this.props.options.length > 1 &&
          <div className="d-flex p-0" style={{flexDirection: "column", height: "100%", width: 12}}>
            <button 
              className="d-flex justify-content-center align-items-center p-0 m-0" 
              style={{height: "50%", width: "100%", backgroundColor: "#333", borderTopRightRadius: 5, overflow: "hidden", opacity: this.isValueFirst() ? 0.2 : 1}}
              onClick={e => this.props.onPrev()}
              disabled={this.isValueFirst()}
            >
              <ArrowDropUp style={{color: "#fff"}}/>
            </button>
            <button 
              className="d-flex justify-content-center align-items-center p-0 m-0" 
              style={{height: "50%", width: "100%", backgroundColor: "#333", borderBottomRightRadius: 5, overflow: "hidden", opacity: this.isValueLast() ? 0.2 : 1}}
              onClick={e => this.props.onNext()}
              disabled={this.isValueLast()}
            >
              <ArrowDropDown style={{color: "#fff"}}/>
            </button>
          </div>
        }
      </div>
    )
  }
}