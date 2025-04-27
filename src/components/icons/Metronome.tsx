import { SVGProps } from "react";

export default function Metronome({ size, style, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg 
      {...rest}
      width={size} 
      height={size} 
      viewBox="0 0 300 297" 
      style={{ transform: "translate(0, -0.5px)", ...style }}
    >
      <g>
        <path
          style={{
            fill: "none", 
            stroke: "currentcolor", 
            strokeWidth: 29.151, 
            strokeLinecap: "butt", 
            strokeLinejoin: "miter", 
            strokeMiterlimit: 4, 
            strokeDasharray: "none",
            strokeOpacity: 1,
            opacity: 1
          }}
          d="M 88.132342,34.404368 H 208.2509 a 9.5583061,9.5583061 38.755705 0 1 9.33215,7.491369 L 265.3,257.33602 a 6.159423,6.159423 128.75571 0 1 -6.01369,7.49137 H 40.877323 a 6.2590498,6.2590498 50.794746 0 1 -6.131441,-7.51648 L 78.917949,41.92085 a 9.4061643,9.4061643 140.79475 0 1 9.214393,-7.516482 z"
        />
        <rect
          width="33.972916"
          height="123.66473"
          x="131.68567"
          y="59.985497"
          ry="16.986458"
          rx="16.986458"
          style={{
            opacity: 1,
            fill: "currentcolor",
            fillOpacity: 1,
            fillRule: "evenodd",
            stroke: "currentcolor",
            strokeWidth: 2.25602,
            strokeLinecap: "round",
            strokeMiterlimit: 4,
            strokeDasharray: "none",
            strokeOpacity: 1
          }}
        />
        <rect
          width="182.3187"
          height="73.183418"
          x="55.117443"
          y="180.1277"
          ry="10.406815"
          style={{
            opacity: 1,
            fill: "currentcolor",
            fillOpacity: 1,
            fillRule: "evenodd",
            stroke: "currentcolor",
            strokeWidth: 27.3132,
            strokeLinecap: "round",
            strokeMiterlimit: 4,
            strokeDasharray: "none",
            strokeOpacity: 1
          }}
        />
        <path
          style={{
            opacity: 1,
            fill: "currentcolor",
            fillOpacity: 1,
            stroke: "currentcolor",
            strokeWidth: 12.734,
            strokeLinecap: "butt",
            strokeLinejoin: "miter",
            strokeMiterlimit: 4,
            strokeDasharray: "none",
            strokeOpacity: 1
          }}
          d="m 258.52301,90.374941 -95.464,114.638969 a 15.610417,15.610417 84.78537 0 0 2.00646,21.9851 12.505126,12.505126 157.81599 0 0 16.37581,-6.67752 l 95.464,-114.63897 a 15.610419,15.610419 84.785373 0 0 -2.00646,-21.985091 12.505125,12.505125 157.81599 0 0 -16.37581,6.677512 z"
        />
      </g>
    </svg>
  )
}