import { SVGIconStyleProps } from "renderer/types/types";

export default function StepSequencerIcon(props : SVGIconStyleProps) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <?xml version="1.0" encoding="UTF-8" standalone="no"?>
          <svg
            width=${props.iconStyle?.size}
            height=${props.iconStyle?.size}
            viewBox="0 0 297 297"
            version="1.1"
            id="svg5"
            inkscape:version="1.1.2 (b8e25be8, 2022-02-05)"
            sodipodi:docname="ss.svg"
            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
            xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:svg="http://www.w3.org/2000/svg">
            <sodipodi:namedview
              id="namedview7"
              pagecolor="#ffffff"
              bordercolor="#666666"
              borderopacity="1.0"
              inkscape:pageshadow="2"
              inkscape:pageopacity="0.0"
              inkscape:pagecheckerboard="0"
              inkscape:document-units="mm"
              showgrid="false"
              units="mm"
              height="297mm"
              inkscape:zoom="0.59244758"
              inkscape:cx="568.8267"
              inkscape:cy="546.03987"
              inkscape:window-width="1440"
              inkscape:window-height="900"
              inkscape:window-x="0"
              inkscape:window-y="0"
              inkscape:window-maximized="0"
              inkscape:current-layer="layer1" />
            <defs
              id="defs2" />
            <g
              inkscape:label="Layer 1"
              inkscape:groupmode="layer"
              id="layer1">
              <rect
                style="fill:none;stroke:${props.iconStyle?.color};stroke-width:30;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                id="rect890"
                width="132.68849"
                height="132.68852"
                x="8.417654"
                y="7.441895"
                ry="18.182724" />
              <rect
                style="fill:${props.iconStyle?.color};stroke:${props.iconStyle?.color};stroke-width:10.923;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;fill-opacity:1"
                id="rect890-9"
                width="132.68849"
                height="132.68852"
                x="156.92804"
                y="7.6170001"
                ry="18.182724" />
              <rect
                style="fill:${props.iconStyle?.color};stroke:${props.iconStyle?.color};stroke-width:10.923;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1;fill-opacity:1"
                id="rect890-7"
                width="132.68849"
                height="132.68852"
                x="8.3407097"
                y="156.64508"
                ry="18.182724" />
              <rect
                style="fill:none;stroke:${props.iconStyle?.color};stroke-width:30;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"
                id="rect890-9-8"
                width="132.68849"
                height="132.68852"
                x="156.85164"
                y="156.82021"
                ry="18.182724" />
            </g>
          </svg>                
        `
      }}
      style={{transform: "translateY(-2px)", ...props.style}}
    ></div>
  )
}