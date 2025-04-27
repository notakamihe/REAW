import { SVGProps } from "react";

export default function Sequencer({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg {...rest} width={size} height={size} viewBox="0 0 500 500">
      <rect 
        x="74.903" 
        y="74.946" 
        width="139.411" 
        height="139.411" 
        style={{ stroke: "currentcolor", strokeWidth: 34, fill: "#0000" }}
      />
      <rect x="268.697" y="57.968" width="173.4" height="173.4" style={{ fill: "currentcolor" }} />
      <rect 
        x="285.492" 
        y="285.579" 
        width="139.411" 
        height="139.411" 
        style={{ stroke: "currentcolor", strokeWidth: 34, fill: "#0000"}} 
      />
      <rect x="57.903" y="268.632" width="173.4" height="173.4" style={{ fill: "currentcolor" }} />
    </svg>
  )
}