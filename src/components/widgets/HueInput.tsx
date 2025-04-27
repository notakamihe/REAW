interface IProps {
  onChange: (value: number) => void;
  style?: React.CSSProperties;
  value: number;
}

const colorSpectrum = `linear-gradient(
  to right, #f00 0%, #ff0 16.67%, #0f0 33.33%, #0ff 50%, 
  #00f 66.67%, #f0f 83.33%, #f00 100%
)`;

export default function HueInput(props: IProps) {
  return (
    <div
      className="position-relative"
      style={{ width: "100%", height: 22, borderInline: "1px solid #ff000099", ...props.style }}
    >
      <input 
        min={0}
        max={359}
        onChange={e => props.onChange(e.target.valueAsNumber)}
        type="range" 
        style={{ 
          width: "100%", 
          height: "100%", 
          outline: "none", 
          cursor: "pointer",
          background: colorSpectrum,
          borderRadius: 0,
          WebkitAppearance: "none",
          opacity: 0.6
        }} 
        value={props.value}
      />
      <div
        style={{ 
          position: "absolute", 
          top: "50%", 
          left: `calc(${props.value / 359} * calc(100% - 19px))`, 
          width: 19, 
          height: 19, 
          borderRadius: "50%", 
          border: "2px solid var(--bg6)",
          pointerEvents: "none",
          transform: "translateY(-50%)",
          backgroundColor: `hsl(${props.value}, 100%, 50%)`
        }}
      />
    </div>
  )
}