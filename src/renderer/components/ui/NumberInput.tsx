import { Add, ArrowDropDown, ArrowDropUp, Remove } from "@mui/icons-material";
import { Typography } from "@mui/material";
import React from "react";
import { Holdable } from "..";

interface NumberInputClasses {
  container? : string;
  decr? : string;
  decrIcon? : string;
  incr? : string;
  incrIcon? : string;
  input? : string;
  verticalContainer? : string;
}

interface NumberInputStyles {
  container? : React.CSSProperties;
  decr? : React.CSSProperties;
  decrIcon? : React.CSSProperties;
  incr? : React.CSSProperties;
  incrIcon? : React.CSSProperties;
  input? : React.CSSProperties;
  verticalContainer? : React.CSSProperties;
}

interface IProps {
  classes? : NumberInputClasses
  hoverStyle? : NumberInputStyles
  min? : number
  max? : number
  onChange : (value : number) => void
  reverseDirection? : boolean
  step? : number
  typing? : boolean
  value : number
  vertical? : boolean
  style? : NumberInputStyles
}

export default function NumberInput(props : IProps) {
  const [hovering, setHovering] = React.useState(false);
  const [inputText, setInputText] = React.useState<string>(props.value.toString());

  React.useEffect(() => {
    setInputText(props.value.toString());
  }, [props.value]);

  const getStyle = () : NumberInputStyles => {
    const style = props.style ? {...props.style} : {};

    if (hovering && props.hoverStyle) {
      style.container = {...style.container, ...props.hoverStyle.container};
      style.decr = {...style.decr, ...props.hoverStyle.decr};
      style.decrIcon = {...style.decrIcon, ...props.hoverStyle.decrIcon};
      style.incr = {...style.incr, ...props.hoverStyle.incr};
      style.incrIcon = {...style.incrIcon, ...props.hoverStyle.incrIcon};
      style.input = {...style.input, ...props.hoverStyle.input};
      style.verticalContainer = {...style.verticalContainer, ...props.hoverStyle.verticalContainer};
    }

    return style;
  }

  const handleBlur = () => {
    let value = Number(inputText);

    if (isNaN(value)) {
      setInputText(props.value.toString());
    } else {
      if (props.min && value < props.min)
        value = props.min

      if (props.max && value > props.max)
        value = props.max
      
      props.onChange(value);
    }
  }

  const handleDecrement = () => {
    const step = props.step || 1
    props.onChange(props.min ? Math.max(props.value - step, props.min) : props.value - step);
  }

  const handleIncrement = () => {
    const step = props.step || 1
    props.onChange(props.max ? Math.min(props.value + step, props.max) : props.value + step);
  }

  const style = getStyle()

  return (
    <div 
      className={`d-flex ${props.classes?.container}`} 
      onMouseOver={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        width: 60, 
        height: 20, 
        flexDirection: props.reverseDirection ? "row-reverse" : "row", 
        backgroundColor: "#0003",
        ...style?.container
      }}
    >
      {
        !props.vertical &&
        <Holdable timeout={250} interval={200} onMouseDown={handleDecrement} onHold={handleDecrement}>
          <button 
            className={`p-0 center-by-flex overflow-hidden ${props.classes?.decr}`}
            style={{width: 16, height: "100%", backgroundColor: "#333", ...style?.decr}}
          >
            <Remove className={props.classes?.decrIcon} style={{fontSize:16, color:"#fff", ...style?.decrIcon}} />
          </button>
        </Holdable>
      }
      <div className="d-flex align-items-center" style={{flex: 1}}>
        {
          props.typing ?
          <input 
            className={`col-12 no-outline ${props.classes?.input}`}
            onBlur={handleBlur}
            onChange={e => setInputText(e.target.value)}
            style={{fontSize: 14, textAlign: "center", border: "none", backgroundColor: "#0000", ...style?.input}} 
            value={inputText} 
          /> :
          <Typography 
            className={`col-12 ${props.classes?.input}`}
            style={{fontSize: 14, textAlign: "center", ...style?.input}}
          >
            {props.value}
          </Typography>
        }
      </div>
      {
        props.vertical &&
        <div
          className={props.classes?.verticalContainer}
          style={{display: "flex", flexDirection: "column", width: 10, height: "100%", ...style?.verticalContainer}}
        >
          <Holdable timeout={250} interval={200} onMouseDown={handleIncrement} onHold={handleIncrement}>
            <button
              className={`p-0 center-by-flex overflow-hidden ${props.classes?.incr}`}
              style={{height: "50%", width: "100%", backgroundColor: "#333", ...style?.incr}} 
            >
              <ArrowDropUp 
                className={props.classes?.incrIcon} 
                style={{fontSize: 18, color: "#fff", ...style?.incrIcon}} 
              />
            </button>
          </Holdable>
          <Holdable timeout={250} interval={200} onMouseDown={handleDecrement} onHold={handleDecrement}>
            <button
              className={`p-0 center-by-flex overflow-hidden ${props.classes?.decr}`}
              style={{height: "50%", width: "100%", backgroundColor: "#333", ...style?.decr}} 
            >
              <ArrowDropDown 
                className={props.classes?.decrIcon} 
                style={{fontSize: 18, color: "#fff", ...style?.decrIcon}} 
              />
            </button>
          </Holdable>
        </div>
      }
      {
        !props.vertical &&
        <Holdable timeout={250} interval={200} onMouseDown={handleIncrement} onHold={handleIncrement}>
          <button 
            className={`p-0 center-by-flex overflow-hidden ${props.classes?.incr}`}
            style={{width: 16, height: "100%", backgroundColor: "#333", ...style?.incr}}
          >
            <Add className={props.classes?.incrIcon} style={{fontSize:16, color:"#fff", ...style?.incrIcon}} />
          </button>
        </Holdable>
      }
    </div>
  )
}