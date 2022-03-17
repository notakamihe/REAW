import { inverseLerp } from "renderer/utils/helpers"

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
        ...props.style,
      }}
    >
      <div style={{width: "100%", height: `${height}%`, backgroundColor: props.meterBackgroundColor || "#ccc"}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(6)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(0)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-6)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-12)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-18)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-24)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-30)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-36)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-42)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-48)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-54)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-60)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-66)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-72)}%`}}></div>
      <div style={{width: "100%", borderBottom: `1px solid ${props.meterBackgroundColor || "#ccc"}`, position: "absolute", top: `${volToMarginPct(-78)}%`}}></div>
    </div>
  )
}

export default VolumeMeter