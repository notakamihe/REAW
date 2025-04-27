import { SVGProps } from "react";

export default function Automation({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg {...rest} width={size} height={size} viewBox="0 0 500 500">
      <ellipse 
        style={{ fill: "currentcolor" }} 
        cx="106.917" 
        cy="365.969" 
        rx="60" 
        ry="60" 
        transform="matrix(1, 0, 0, 1, 0.591766, 4.017704)"
      />
      <ellipse style={{ fill: "currentcolor" }} cx="154.267" cy="171.616" rx="60" ry="60" />
      <ellipse style={{ fill: "currentcolor" }} cx="350.985" cy="304.797" rx="60" ry="60" />
      <ellipse style={{ fill: "currentcolor" }} cx="395.894" cy="109.342" rx="60" ry="60" />
      <path 
        style={{ stroke: "currentcolor", paintOrder: "fill", strokeWidth: 33 }} 
        d="M 105.184 373.157 L 161.304 162.902"/>
      <path 
        style={{ stroke: "currentcolor", paintOrder: "fill", strokeWidth: 33 }} 
        d="M 273.558 128.212 L 245.936 354.886" 
        transform="matrix(-0.472779, 0.881181, -0.881181, -0.472779, 595.398315, 126.864197)"
      />
      <path 
        style={{ stroke: "currentcolor", paintOrder: "fill", strokeWidth: 33 }} 
        d="M 340.176 319.439 L 421.164 79.911" 
        transform="matrix(0.996413, -0.084629, 0.084629, 0.996413, -15.532648, 32.932037)"
      />
    </svg>
  )
}