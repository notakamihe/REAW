import { SVGProps } from "react";

export default function Playhead({ size, ...rest }: SVGProps<SVGSVGElement> & { size: number }) {
  return (
    <svg {...rest} width={size} height={size} viewBox="0 0 500 500">
      <path
        d="M -291.06 -197.971 Q -249.297 -253.587 -207.535 -197.971 L -101.229 -56.404 Q -59.466 -0.788 -142.992 -0.788 L -355.603 -0.788 Q -439.129 -0.788 -397.366 -56.404 Z"
        style={{ fill: "currentcolor", paintOrder: "fill", strokeMiterlimit: 1 }}
        transform="matrix(-1, 0, 0, -1, 0, 0)"
      />
      <g transform="matrix(1.32523, 0, 0, 1.05101, -78.748871, -6.043879)">
        <rect x="221.208" y="185.134" width="52.632" height="260.88" style={{ fill: "currentcolor" }} />
        <path
          style={{ fill: "currentcolor" }}
          transform="matrix(0, -0.363845, 0.280297, 0, 139.120071, 593.996948)"
          d="M 407.635 481.995 A 95.184 95.184 0 1 1 407.635 291.627 L 407.635 386.811 Z"
        />
      </g>
    </svg>
  )
}