import { SVGIconStyleProps } from "renderer/types/types";

export default function CursorIcon(props : SVGIconStyleProps) {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <?xml version="1.0" encoding="UTF-8" standalone="no"?>
          <!-- Created with Inkscape (http://www.inkscape.org/) -->
          
          <svg
            width="${props.iconStyle?.size}"
            height="${props.iconStyle?.size}"
            viewBox="0 0 297 297"
            version="1.1"
            id="svg1695"
            inkscape:version="1.1.2 (b8e25be8, 2022-02-05)"
            sodipodi:docname="cursor.svg"
            xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
            xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
            xmlns="http://www.w3.org/2000/svg"
            xmlns:svg="http://www.w3.org/2000/svg">
            <sodipodi:namedview
              id="namedview1697"
              pagecolor="#ffffff"
              bordercolor="#666666"
              borderopacity="1.0"
              inkscape:pageshadow="2"
              inkscape:pageopacity="0.0"
              inkscape:pagecheckerboard="0"
              inkscape:document-units="mm"
              showgrid="false"
              width="297mm"
              inkscape:snap-grids="false"
              inkscape:snap-to-guides="false"
              inkscape:snap-others="false"
              inkscape:snap-global="false"
              inkscape:zoom="0.57549102"
              inkscape:cx="878.38034"
              inkscape:cy="523.90044"
              inkscape:window-width="1440"
              inkscape:window-height="778"
              inkscape:window-x="-1"
              inkscape:window-y="25"
              inkscape:window-maximized="0"
              inkscape:current-layer="layer1" />
            <defs
              id="defs1692">
              <inkscape:path-effect
                effect="fillet_chamfer"
                id="path-effect4417"
                is_visible="true"
                lpeversion="1"
                satellites_param="F,0,0,1,0,20.372917,0,9 @ F,0,0,1,0,20.372917,0,9 @ F,0,0,1,0,20.372917,0,9 @ F,0,0,1,0,20.372917,0,9"
                unit="px"
                method="auto"
                mode="F"
                radius="77"
                chamfer_steps="9"
                flexible="false"
                use_knot_distance="true"
                apply_no_radius="true"
                apply_with_radius="true"
                only_selected="false"
                hide_knots="false" />
            </defs>
            <g
              inkscape:label="Layer 1"
              inkscape:groupmode="layer"
              id="layer1">
              <path
                id="rect1950"
                style="fill:${props.iconStyle?.color || "#000"};fill-opacity:1;stroke:none;stroke-width:1.17211"
                d="M 270.16406 6.359375 C 234.54109 6.359375 205.86133 35.039138 205.86133 70.662109 L 205.86133 211.41016 C 205.86133 227.71536 211.8821 242.55398 221.81445 253.86523 A 38.875654 38.875654 0 0 0 223.58984 256.91602 L 354.83594 438.00977 A 150.90056 150.90056 0 0 0 477.02148 500.35742 L 640.99414 500.35742 A 149.66731 149.66731 0 0 0 762.76367 437.71094 L 887.13281 263.67578 A 40.032903 40.032903 0 0 0 892.33594 253.53516 C 902.09704 242.26566 908.00391 227.55782 908.00391 211.41016 L 908.00391 70.662109 C 908.00391 35.039138 879.3261 6.359375 843.70312 6.359375 L 270.16406 6.359375 z "
                transform="scale(0.26458333)" />
              <rect
                style="fill:${props.iconStyle?.color || "#000"};fill-opacity:1;stroke:none;stroke-width:0.327721"
                id="rect3067"
                width="39.078945"
                height="194.01549"
                x="128.50529"
                y="101.83061"
                ry="16.766769" />
              <rect
                style="fill:${props.iconStyle?.color || "#000"};fill-opacity:1;stroke:none;stroke-width:0.264583;stroke-opacity:1"
                id="rect4149"
                width="79.996902"
                height="18.390091"
                x="107.4432"
                y="111.71981"
                ry="9.1950455" />
            </g>
          </svg>    
        `
      }}
      style={{transform: "translateY(-2px)", ...props.style}}
    ></div>
  )
}