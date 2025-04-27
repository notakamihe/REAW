interface IProps {
  color?: string;
  marks?: {value: number, style?: React.CSSProperties}[];
  percent: number;
  style?: React.CSSProperties;
  vertical?: boolean;
}

function Meter({ color, marks, percent, style, vertical }: IProps) {
  const flexStyle: Partial<React.CSSProperties> = {
    display: "flex", 
    flexDirection: vertical ? "column" : "row", 
    justifyContent: vertical ? "flex-end" : "flex-start"
  }

  return (
    <div style={{width: vertical ? 11 : "100%", height: vertical ? "100%" : 11, ...style}}>
      <div style={{width: "100%", height: "100%", position: "relative", ...flexStyle}}>
        <div 
          style={{
            width: vertical ? "100%" : `${percent}%`, 
            height: vertical ? `${percent}%` : "100%",
            overflow: "hidden",
            ...flexStyle
          }}
        >
          <div 
            style={{
              width: vertical ? "100%" : `${10000 / percent}%`,
              height: vertical ? `${10000 / percent}%` : "100%",
              flexShrink: 0,
              background: color || "#000"
            }}
          />
        </div>
        {marks?.map((mark, index) => (
          <div
            key={index}
            style={{
              position: "absolute",
              backgroundColor: "#000",
              bottom: vertical ? `${mark.value}%` : 0,
              left: vertical ? 0 :`${mark.value}%`,
              width: vertical ? "100%" : 1, 
              height: vertical ? 1 : "100%",
              ...mark.style
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default Meter;