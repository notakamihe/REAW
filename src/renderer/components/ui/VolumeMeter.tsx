import { inverseLerp } from "renderer/utils/general"

interface IProps {
  meterBackgroundColor?: string
  style? : React.CSSProperties
  volume : number
}

const VolumeMeter = (props : IProps) => { 
  const height = (1 - inverseLerp(props.volume, -80, 6)) * 100

  const volToMarginPct = (volume : number) => {
    return (1 - inverseLerp(volume, -80, 6)) * 100
  }

  return (
    <div 
      className="d-flex position-relative"
      style={{
        height: "100%", 
        width: "100%", 
        background: "linear-gradient(to top, #0f0 75.5813%, #ff0 93.0232%, #f00)",
        marginRight: 3, 
        border: "1px solid #999",
        ...props.style,
      }}
    >
      <div style={{width: "100%", height: `${height}%`, backgroundColor: props.meterBackgroundColor || "#ddd"}}></div>
      <div style={{width: "100%", borderBottom: `1px solid #999`, position: "absolute", top: `${volToMarginPct(0)}%`}}></div>
    </div>
  )
}

export default VolumeMeter