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
  style? : React.CSSProperties
  onChange : (option : SelectSpinBoxOption<any>) => void
  onPrev : () => void
  onNext : () => void
  leftClickOpen? : boolean
}

interface IState {
  idx : number
  anchorEl : HTMLElement | null
}

export default class SelectSpinBox extends React.Component<IProps, IState> {
  constructor(props : IProps) {
    super(props);

    this.state = {
      idx: 0,
      anchorEl: null
    };
  }

  onOptionClick = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, option : SelectSpinBoxOption<any>) => {
    e.stopPropagation()
    this.props.onChange(option)
    this.setState({anchorEl: null})
  }

  openPopover = (e : React.MouseEvent<HTMLDivElement, MouseEvent>, open : boolean) => {
    if (open)
      this.setState({anchorEl: e.currentTarget});
  }

  render() {
    return (
      <div 
        className="d-flex align-items-center"
        style={this.props.style}
      >
        {
          this.props.icon &&
          <div className="p-1 d-flex justify-content-center align-items-center" style={{height: "100%"}}>
            {this.props.icon}
          </div>
        }
        <div 
          onContextMenu={e => this.openPopover(e, true)} 
          onMouseDown={e => this.openPopover(e, Boolean(this.props.leftClickOpen))} 
          style={{flex: 1, height: "100%", paddingLeft: 4}}
        >
          <div
            className="d-flex align-items-center hide-dropdown-arrow remove-dropdown-styles"
            style={{
              width: "100%",
              height: "100%", 
              fontSize: 14,
            }}
          >
            {this.props.options.find(o => o.value === this.props.value)?.label}
          </div>
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
        <div className="d-flex p-0" style={{flexDirection: "column", height: "100%", width: 12}}>
          <button 
            className="d-flex justify-content-center align-items-center p-0 m-0" 
            style={{height: "50%", width: "100%", backgroundColor: "#333", borderTopRightRadius: 5, overflow: "hidden"}}
            onClick={e => this.props.onPrev()}
          >
            <ArrowDropUp style={{color: "#fff"}}/>
          </button>
          <button 
            className="d-flex justify-content-center align-items-center p-0 m-0" 
            style={{height: "50%", width: "100%", backgroundColor: "#333", borderBottomRightRadius: 5, overflow: "hidden"}}
            onClick={e => this.props.onNext()}
          >
            <ArrowDropDown style={{color: "#fff"}}/>
          </button>
        </div>
      </div>
    )
  }
}