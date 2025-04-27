import { CSSProperties, useEffect, useRef, useState } from "react";
import { Add, ArrowDropDown, ArrowDropUp, ArrowLeft, ArrowRight, Remove } from "@mui/icons-material";
import { HoldActionButton } from "..";
import { clamp } from "lodash";

interface NumberInputStyle<T extends string | CSSProperties> {
  container?: T;
  decr?: T;
  decrIcon?: T;
  incr?: T;
  incrIcon?: T;
  input?: T;
  inputContainer?: T;
  verticalContainer?: T;
}

interface IProps {
  buttons?: { show?: boolean; icon?: "arrow" | "plusminus" };
  classes?: NumberInputStyle<string>;
  clickAndDrag?: boolean;
  disabled?: boolean;
  disableTyping?: boolean;
  holdIncrementSpeed?: number;
  integersOnly?: boolean;
  layout?: "alt" | undefined;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  orientation?: "horizontal" | "vertical";
  reverseOrientation?: boolean;
  step?: number;
  value: number;
  style?: NumberInputStyle<CSSProperties>;
}

interface SpinButtonIconProps {
  className?: string;
  decrement?: boolean;
  icon?: "arrow" | "plusminus";
  orientation?: "horizontal" | "vertical";
  style?: CSSProperties;
}

function SpinButtonIcon(props: SpinButtonIconProps) {
  if (props.icon === "plusminus") {
    if (props.decrement)
      return <Remove className={props.className} style={{ fontSize: 16, ...props.style }} />;
    return <Add className={props.className} style={{ fontSize: 16, ...props.style }} />;
  } else {
    if (props.decrement) {
      if (props.orientation === "vertical")
        return <ArrowDropDown className={props.className} style={{ fontSize: 18, ...props.style }} />;
      return <ArrowLeft className={props.className} style={{ fontSize: 18, ...props.style }} />;
    } else {
      if (props.orientation === "vertical")
        return <ArrowDropUp className={props.className} style={{ fontSize: 18, ...props.style }} />;
      return <ArrowRight className={props.className} style={{ fontSize: 18, ...props.style }} />;
    }
  }
}

export default function NumberInput(props: IProps) {
  const [disableClickAndDrag, setDisableClickAndDrag] = useState(false);
  const [dragStartValue, setDragStartValue] = useState<number | null>(null);
  const [text, setText] = useState(props.value.toString());

  const newCharacters = useRef<string | -1>("");
  const ref = useRef<HTMLInputElement>(null);
  const yDeltaFromStart = useRef(0); 

  useEffect(() => {
    setText(props.value.toString());
  }, [props.value]);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (dragStartValue) {
        const start = props.min ?? 0;
        const step = props.step ?? 1;
        let movementY = e.movementY;
  
        if (movementY === 0 && Math.abs(e.movementX) < 3) {
          if (e.screenY <= 0)
            movementY = -1;
          else if (e.screenY >= window.screen.height - 1)
            movementY = 1;
        }
  
        yDeltaFromStart.current += movementY;
  
        let newValue = dragStartValue - Math.ceil(yDeltaFromStart.current / 3) * step;
  
        if (e.movementY < 0)
          newValue = start + step * Math.floor((newValue - start) / step);
        else
          newValue = start + step * Math.ceil((newValue - start) / step);
  
        props.onChange(clamp(newValue, props.min ?? -Infinity, props.max ?? Infinity));
      }
    }

    function handleMouseUp() {
      setDragStartValue(null);
    }

    if (dragStartValue !== null) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    }
  }, [dragStartValue, text, props.min, props.max, props.integersOnly, props.value, props.step])

  function decrement() {
    if (!props.disabled) {
      const start = props.min ?? 0;
      const step = props.step || 1;
      
      let newValue = ref.current === document.activeElement ? getTextValue() : props.value;
      newValue -= step;
      newValue = start + step * Math.ceil((newValue - start) / step);
  
      props.onChange(clamp(newValue, props.min ?? -Infinity, props.max ?? Infinity));
    }
  }

  function getSpinButtonIconProps(decrement: boolean, icon?: "arrow" | "plusminus") {
    return {
      className: decrement ? props.classes?.decrIcon : props.classes?.incrIcon,
      decrement,
      icon,
      orientation: props.layout !== "alt" ? "vertical" : props.orientation,
      style: decrement ? style?.decrIcon : style?.incrIcon
    }
  }
  
  function getTextValue() {
    const value = props.integersOnly ? Math.round(Number(text)) : Number(text);
    return isNaN(value) ? props.value : value;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (/^-?\d*(\.\d+)?$/.test(e.target.value) || /^-?\d+(\.\d*)?$/.test(e.target.value)) {
      if (newCharacters.current === -1 || !newCharacters.current.includes(".") || !props.integersOnly)
        setText(e.target.value);
    }
  }

  function handleConfirm() {
    let value = clamp(getTextValue(), props.min ?? -Infinity, props.max ?? Infinity);

    setDisableClickAndDrag(false);
    setText(value.toString());
    props.onChange(value);
  }

  function handleDoubleClick() {
    if (props.clickAndDrag && ref.current) {
      ref.current.focus();
      ref.current.select();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key.length === 1)
      newCharacters.current = e.key;
    else if (e.key === "Backspace" || e.key === "Delete")
      newCharacters.current = -1;
    else if (e.key === "ArrowUp")
      increment();
    else if (e.key === "ArrowDown")
      decrement();
  }

  function handleMouseDown(e: React.MouseEvent) {
    if (props.clickAndDrag && !disableClickAndDrag) {
      setDragStartValue(ref.current === document.activeElement ? getTextValue() : props.value);
      yDeltaFromStart.current = 0;
    }
  }
  
  function increment() {
    if (!props.disabled) {
      const start = props.min ?? 0;
      const step = props.step || 1;
  
      let newValue = ref.current === document.activeElement ? getTextValue() : props.value;
      newValue += step;
      newValue = start + step * Math.floor((newValue - start) / step);
      
      props.onChange(clamp(newValue, props.min ?? -Infinity, props.max ?? Infinity));
    }
  }
  
  const style = props.style;

  const layout1SpinButtons = (
    <div
      className={"d-flex flex-column " + props.classes?.verticalContainer}
      style={{ width: 12, height: "100%", ...style?.verticalContainer }}
    >
      <HoldActionButton 
        className={`p-0 center-flex overflow-hidden ${props.classes?.incr}`}
        delay={250} 
        interval={props.holdIncrementSpeed || 200} 
        onHoldAction={increment}
        style={{ height: "50%", width: "100%", ...style?.incr }} 
      >
        <SpinButtonIcon {...getSpinButtonIconProps(false, props.buttons?.icon || "arrow")} />
      </HoldActionButton>
      <HoldActionButton 
        className={`p-0 center-flex overflow-hidden ${props.classes?.decr}`}
        delay={250} 
        interval={props.holdIncrementSpeed || 200} 
        onHoldAction={decrement}
        style={{ height: "50%", width: "100%", ...style?.decr }} 
      >
        <SpinButtonIcon {...getSpinButtonIconProps(true, props.buttons?.icon || "arrow")} />
      </HoldActionButton>
    </div>
  );
  
  const layout2IncreaseButton = (
    <HoldActionButton 
      className={`p-0 center-flex ${props.classes?.incr}`}
      delay={250} 
      interval={props.holdIncrementSpeed || 200} 
      onHoldAction={increment}
      style={{ height: "fit-content", alignSelf: "center", ...style?.incr }}
    >
      <SpinButtonIcon {...getSpinButtonIconProps(false, props.buttons?.icon || "plusminus")} />
    </HoldActionButton>
  );

  const layout2DecreaseButton = (
    <HoldActionButton 
      className={`p-0 center-flex ${props.classes?.decr}`}
      delay={250} 
      interval={props.holdIncrementSpeed || 200} 
      onHoldAction={decrement}
      style={{ height: "fit-content", alignSelf: "center", ...style?.decr }}
    >
      <SpinButtonIcon {...getSpinButtonIconProps(true, props.buttons?.icon || "plusminus")} />
    </HoldActionButton>
  );

  const startButton = props.orientation !== "vertical" ? layout2DecreaseButton : layout2IncreaseButton;
  const endButton = props.orientation !== "vertical" ? layout2IncreaseButton : layout2DecreaseButton;
  const inputDisabled = props.disabled || props.disableTyping;

  return (
    <div 
      className={`d-flex ${props.classes?.container}`} 
      style={{ 
        width: 60, 
        backgroundColor: "#0000", 
        flexDirection: props.orientation !== "vertical" ? "row" : "column", 
        ...style?.container 
      }}
    >
      {props.layout === "alt" && props.buttons?.show !== false && (props.reverseOrientation ? endButton : startButton)}
      {props.layout !== "alt" && props.buttons?.show !== false && props.reverseOrientation && layout1SpinButtons}
      <form 
        className={`d-flex align-items-center ${props.classes?.inputContainer}`} 
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onSubmit={e => { e.preventDefault(); ref.current?.blur(); }}
        style={{ flex: 1, ...style?.inputContainer }}
      >
        <input 
          className={`col-12 no-outline ${inputDisabled ? "hide-selection" : ""} ${props.classes?.input}`}
          onBlur={handleConfirm}
          onChange={handleChange}
          onFocus={() => { if (!inputDisabled) setDisableClickAndDrag(true); }}
          onKeyDown={handleKeyDown}
          onPaste={e => newCharacters.current = e.clipboardData?.getData("text")}
          readOnly={inputDisabled}
          ref={ref}
          style={{ 
            fontSize: 14, 
            border: "none", 
            textAlign: "center", 
            backgroundColor: "#0000", 
            pointerEvents: props.clickAndDrag && !disableClickAndDrag ? "none" : "auto",
            cursor: inputDisabled ? "default" : "text",
            ...style?.input 
          }} 
          value={text} 
        />
      </form>
      {props.layout !== "alt" && props.buttons?.show !== false && !props.reverseOrientation && layout1SpinButtons}
      {props.layout === "alt" && props.buttons?.show !== false && (props.reverseOrientation ? startButton : endButton)}
    </div>
  )
}