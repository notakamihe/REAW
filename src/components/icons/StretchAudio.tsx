import { SVGProps } from "react";

export default function StretchAudio({ size, style, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg 
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 500 500"
      style={{ transform: "translate(0.25px, -0.25px)", ...style}}
    >
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 249.976 434.54 L 250.023 19.396"
      />
      <g transform="matrix(1, 0, 0, 1, -69.999985, -85.49324)" />
      <g transform="matrix(1, 0, 0, 1, -346.587341, 152.597626)" />
      <g transform="matrix(1.105862, 0, 0, 1.105862, 9.99921, 157.848984)">
        <path
          style={{
            strokeLinecap: "round",
            stroke: "currentcolor",
            fill: "none",
            strokeWidth: "35.2666px"
          }}
          d="M 106.932 182.908 L 106.968 295.861"
          transform="matrix(0, -1, 1, 0, -132.434498, 346.334499)"
        />
        <path
          d="M -450.108 -344.446 Q -439.271 -355.337 -428.859 -344.446 L -375.311 -288.433 Q -364.899 -277.542 -386.148 -277.542 L -495.43 -277.542 Q -516.679 -277.542 -505.842 -288.433 Z"
          style={{ stroke: "currentcolor", fill: "currentcolor" }}
          transform="matrix(-0.00006, 1, 1, 0.000042, 340.827178, 679.837403)"
        />
        <path
          style={{
            strokeLinecap: "round",
            stroke: "currentcolor",
            fill: "none",
            strokeWidth: "35.2666px"
          }}
          d="M 327.084 295.861 L 327.12 182.908"
          transform="matrix(0, -1, 1, 0, 87.717506, 566.486504)"
        />
        <path
          d="M -450.108 -344.446 Q -439.271 -355.337 -428.859 -344.446 L -375.311 -288.433 Q -364.899 -277.542 -386.148 -277.542 L -495.43 -277.542 Q -516.679 -277.542 -505.842 -288.433 Z"
          style={{ stroke: "currentcolor", fill: "currentcolor" }}
          transform="matrix(0.00006, 1, -1, 0.000042, 93.22477, 679.837402)"
        />
      </g>
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 329.983 371.58 L 330.018 82.355"
      />
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 171.568 371.58 L 171.601 82.355"
      />
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 402.965 316.595 L 402.984 137.34"
      />
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 94.446 316.597 L 94.465 137.341"
      />
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 480.101 233.037 L 480.103 220.9"
      />
      <path
        style={{
          strokeLinecap: "round",
          stroke: "currentcolor",
          fill: "none",
          strokeWidth: 39
        }}
        d="M 19.896 233.037 L 19.897 220.9"
      />
    </svg>
  )
}