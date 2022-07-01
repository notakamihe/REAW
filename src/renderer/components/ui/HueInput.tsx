import React from "react"
import { hslToHex } from "renderer/utils/general"
import styled from "styled-components"

interface IProps {
  value : number
  onChange : (value : number) => void
  style?  : React.CSSProperties
}

interface RangeProps {
  $thumbcolor : string
}

const colorSpectrum = `linear-gradient(to right, hsl(0, 100%, 50%) 0%, hsl(60, 100%, 50%) 16.67%,
  hsl(120, 100%, 50%) 33.33%, hsl(180, 100%, 50%) 50%, hsl(240, 100%, 50%) 66.67%, hsl(320, 100%, 50%) 83.33%, 
  hsl(360, 100%, 50%) 100%)`

const Range = styled.input`
  -webkit-appearance: none;
  background: ${colorSpectrum};
  border: none;
  border-radius: 15px;
  opacity: 1;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid var(--bg9);
    background-color: ${(props : RangeProps) => props.$thumbcolor};
    cursor: pointer;
  }
`

export default function HueInput(props : IProps) {
  return (
    <Range 
      type="range" 
      min={0}
      max={360}
      value={props.value}
      onChange={e => props.onChange(e.target.valueAsNumber)}
      style={{width: "100%", height: 12, ...props.style}} 
      $thumbcolor={hslToHex(props.value, 100, 50)}
    />
  )
}