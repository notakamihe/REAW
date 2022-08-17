import React, { useEffect, useImperativeHandle, useRef, useState } from "react";

const AutoWidthInput = React.forwardRef<any, React.InputHTMLAttributes<HTMLInputElement>>((props, ref) => {
  const [width, setWidth] = useState(0);
  
  const hiddenRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => inputRef.current);

  useEffect(() => {
    hiddenRef.current!.textContent = inputRef.current!.value;
    setWidth(hiddenRef.current!.offsetWidth);
  }, [props.value]);

  return (
    <div style={{position: "relative", display: "inline-flex"}}>
      <span 
        className="position-absolute overflow-hidden"
        ref={hiddenRef}
        style={{...props.style, top: 0, left: 0, height: 0, whiteSpace: "pre", visibility: "hidden"}}
      ></span>
      <input {...props} ref={inputRef} style={{...props.style, width}} />
    </div>
  )
});

export default AutoWidthInput;